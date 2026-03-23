"""Competitor research orchestrator.

Uses web search to gather competitor data, then feeds results to the
MiniMax text model for structured analysis including keyword extraction
and competitor profiling.
"""

import json
import logging
import re
from datetime import datetime, timezone
from uuid import UUID

from ..db.repositories import research_repo
from ..models.enums import Platform
from ..models.schemas import ResearchRequest, ResearchResponse
from .search_provider import web_search
from .minimax_text import generate_text

logger = logging.getLogger(__name__)


# ── Analysis prompt builders ─────────────────────────────────────────────────

_ANALYSIS_SYSTEM_PROMPT = (
    "You are an expert e-commerce competitive analyst. "
    "You will receive web search results about a product category or competitor. "
    "Analyze them and produce a structured report.\n\n"
    "IMPORTANT: Respond ONLY with a valid JSON object in this exact format, "
    "with no additional text, markdown, or explanation:\n"
    "{\n"
    '  "analysis": "Detailed analysis of the competitive landscape, trends, '
    'pricing patterns, and actionable recommendations (500-1000 words)",\n'
    '  "keywords_found": ["keyword1", "keyword2", "keyword3", '
    '"... (20-50 high-value search keywords)"],\n'
    '  "competitors": [\n'
    "    {\n"
    '      "name": "Competitor name or brand",\n'
    '      "url": "URL if available",\n'
    '      "strengths": "What they do well",\n'
    '      "weaknesses": "Potential gaps or weaknesses",\n'
    '      "price_range": "Price range if found"\n'
    "    }\n"
    "  ]\n"
    "}"
)


def _build_analysis_user_prompt(
    query: str,
    search_results: list[dict],
    platform: Platform | None,
) -> str:
    """Build the user prompt for competitive analysis."""
    parts = [
        f"Research Query: {query}",
    ]

    if platform:
        parts.append(f"Target Marketplace: {platform.value}")

    parts.append("\n--- Web Search Results ---\n")

    for i, result in enumerate(search_results, 1):
        title = result.get("title", "No title")
        url = result.get("url", "")
        snippet = result.get("snippet", "No description")
        parts.append(f"{i}. [{title}]({url})\n   {snippet}\n")

    parts.append(
        "\nAnalyze these results to identify competitors, extract "
        "high-value keywords, and provide actionable insights."
    )

    return "\n".join(parts)


# ── JSON parsing ─────────────────────────────────────────────────────────────

def _parse_research_json(raw: str) -> dict:
    """Parse the LLM analysis response into a structured dict.

    Handles markdown code fences and extraneous text.
    """
    text = raw.strip()

    # Direct parse
    try:
        return json.loads(text)
    except (json.JSONDecodeError, ValueError):
        pass

    # Markdown code block
    code_block_match = re.search(
        r"```(?:json)?\s*\n?(.*?)\n?\s*```",
        text,
        re.DOTALL,
    )
    if code_block_match:
        try:
            return json.loads(code_block_match.group(1).strip())
        except (json.JSONDecodeError, ValueError):
            pass

    # First { ... } block
    brace_match = re.search(r"\{.*\}", text, re.DOTALL)
    if brace_match:
        try:
            return json.loads(brace_match.group(0))
        except (json.JSONDecodeError, ValueError):
            pass

    raise ValueError(
        f"Unable to parse research JSON from LLM response: {text[:500]}"
    )


# ── Search query builders ───────────────────────────────────────────────────

def _build_search_queries(query: str, platform: Platform | None) -> list[str]:
    """Build a set of search queries from the user's research request.

    Generates multiple angles to get comprehensive results.
    """
    queries = [query]

    if platform:
        marketplace = platform.value.capitalize()
        queries.append(f"{query} {marketplace} best sellers")
        queries.append(f"{query} {marketplace} competitor analysis")
    else:
        queries.append(f"{query} top products e-commerce")
        queries.append(f"{query} competitor brands")

    return queries


# ── Main orchestrator ────────────────────────────────────────────────────────

async def conduct_research(
    request: ResearchRequest,
    user_id: str,
) -> ResearchResponse:
    """Conduct competitor research end-to-end.

    1. Build search queries from the request.
    2. Execute web searches to gather competitor data.
    3. Feed combined results to MiniMax for structured analysis.
    4. Parse the analysis into keywords and competitor profiles.
    5. Save to the research_sessions table.
    6. Return a structured response.

    Args:
        request: The research request with query and optional platform.
        user_id: The authenticated user's ID.

    Returns:
        ResearchResponse with analysis, keywords, and competitor data.

    Raises:
        RuntimeError: On search or analysis failure.
        ValueError: If the LLM analysis cannot be parsed.
    """
    logger.info(
        "Conducting research for user %s: %s (platform=%s)",
        user_id,
        request.query,
        request.platform.value if request.platform else "all",
    )

    # Step 1: Execute web searches
    search_queries = _build_search_queries(request.query, request.platform)
    all_results: list[dict] = []
    seen_urls: set[str] = set()

    for sq in search_queries:
        try:
            results = await web_search(sq, max_results=10)
            for r in results:
                url = r.get("url", "")
                if url and url not in seen_urls:
                    seen_urls.add(url)
                    all_results.append(r)
        except Exception as exc:
            logger.warning("Search query '%s' failed: %s", sq, exc)
            continue

    if not all_results:
        logger.warning("No search results found for query: %s", request.query)
        # Proceed with analysis anyway; the model can still provide
        # general knowledge-based insights
        all_results = [
            {
                "title": "No web results found",
                "url": "",
                "snippet": (
                    "Web search returned no results. Provide analysis "
                    "based on your knowledge of this product category."
                ),
            }
        ]

    # Step 2: Analyze results with text generation
    user_prompt = _build_analysis_user_prompt(
        query=request.query,
        search_results=all_results[:20],  # Cap at 20 results to stay within token limits
        platform=request.platform,
    )

    raw_analysis = await generate_text(
        system_prompt=_ANALYSIS_SYSTEM_PROMPT,
        user_message=user_prompt,
        max_tokens=4096,
        temperature=0.4,
    )

    parsed = _parse_research_json(raw_analysis)

    analysis = parsed.get("analysis", "")
    keywords_found = parsed.get("keywords_found", [])
    competitors = parsed.get("competitors", [])

    if not isinstance(keywords_found, list):
        keywords_found = [str(keywords_found)]
    if not isinstance(competitors, list):
        competitors = [competitors] if isinstance(competitors, dict) else []

    # Step 3: Persist to database
    db_record = research_repo.create(
        {
            "user_id": user_id,
            "query": request.query,
            "platform": request.platform.value if request.platform else None,
            "analysis": analysis,
            "keywords_found": keywords_found,
            "competitors": competitors,
            "search_results_count": len(all_results),
        }
    )

    logger.info("Research session %s created for user %s", db_record["id"], user_id)

    return ResearchResponse(
        id=UUID(db_record["id"]),
        query=db_record["query"],
        analysis=db_record["analysis"],
        keywords_found=db_record["keywords_found"],
        competitors=db_record["competitors"],
        created_at=db_record["created_at"],
    )
