"""Production-grade competitive intelligence engine.

Multi-pass pipeline:
  1. Generate targeted search queries across pricing, reviews, keywords, trends
  2. Execute searches in parallel via SearXNG/DDG
  3. Pass 1: Extract structured competitor data with MiniMax
  4. Pass 2: Synthesize strategic insights, keyword gaps, and opportunities
  5. Persist and return rich research report
"""

import asyncio
import json
import logging
import re
from datetime import datetime, timezone
from uuid import UUID

from ..db.repositories import research_repo
from ..models.enums import Platform
from ..models.schemas import ResearchRequest, ResearchResponse
from .search_provider import web_search
from .grok_text import generate_text

logger = logging.getLogger(__name__)


# ── Search query generation ──────────────────────────────────────────────────

def _build_search_queries(query: str, platform: Platform | None) -> list[str]:
    """Generate comprehensive search queries for maximum coverage.

    Excludes review/complaint queries — those go to _build_review_queries
    so review snippets stay routed to the dedicated pain-point extractor.
    """
    marketplace = platform.value.capitalize() if platform else "Amazon"
    base = query.strip()

    queries = [
        # Direct competitor queries
        f"{base} best sellers {marketplace} 2026",
        f"{base} top brands {marketplace}",
        f"{base} competitor analysis",
        # Pricing intelligence
        f"{base} price comparison {marketplace}",
        f"{base} pricing strategy e-commerce",
        f"{base} average price {marketplace}",
        # Keyword / SEO queries
        f"{base} most searched keywords {marketplace}",
        f"{base} SEO keywords product listing",
        # Market trends
        f"{base} market size trends 2026",
        f"{base} growing demand e-commerce trends",
    ]

    return queries


def _build_review_queries(query: str, platform: Platform | None) -> list[str]:
    """Review/complaint-flavored queries. Their snippets get routed to a
    dedicated pain-point extractor so we surface real buyer voice instead
    of generic 'what customers want' fluff."""
    marketplace = platform.value.capitalize() if platform else "Amazon"
    base = query.strip()
    return [
        f"{base} 1 star reviews complaints",
        f"{base} negative reviews disappointing",
        f"{base} reddit problems issues",
        f"{base} return reasons {marketplace}",
        f'"{base}" "I wish" OR "broke" OR "disappointed"',
    ]


# ── Pass 1: Extract structured data from search results ──────────────────────

_EXTRACTION_PROMPT = """You are a competitive intelligence data extractor.
Given web search results about a product category, extract ALL factual data points you can find.

IMPORTANT: Respond ONLY with valid JSON, no markdown or explanation:
{
  "competitors": [
    {
      "name": "Brand or seller name",
      "url": "URL if found",
      "price_range": "Exact prices if found (e.g. $24.99-$39.99)",
      "rating": "Star rating if found (e.g. 4.5/5)",
      "review_count": "Number of reviews if found",
      "key_features": "Notable product features or differentiators",
      "weaknesses": "Customer complaints, negative reviews, missing features"
    }
  ],
  "pricing_data": {
    "low": "Lowest price found",
    "mid": "Average/typical price",
    "high": "Premium price point",
    "sweet_spot": "Most common price range"
  },
  "keywords_from_results": ["keyword1", "keyword2", "...extract 30-50 relevant product keywords"],
  "customer_pain_points": ["pain point 1", "pain point 2", "...from reviews and complaints"],
  "trending_features": ["feature 1", "feature 2", "...what customers are looking for"],
  "market_signals": ["Any data about market size, growth, seasonality, trends"]
}"""


# ── Pass 1b: Review-only extraction (pain points in buyer voice) ──────────────

_REVIEW_EXTRACTION_PROMPT = """You are a customer review analyst. Given web search results pulled from review-flavored queries (1-star reviews, complaints, return reasons, Reddit problems), extract the actual buyer voice.

ONLY include real customer complaints, frustrations, or unmet needs — NOT marketing fluff, NOT generic "people want quality" platitudes. Look for:
- "I wish it had..."
- "broke after..."
- "doesn't fit / doesn't work for..."
- "1 star because..."
- "returned because..."
- "the worst part is..."

If a snippet doesn't contain a real complaint, skip it.

IMPORTANT: Respond ONLY with valid JSON, no markdown:
{
  "pain_points": [
    "Specific customer complaint in their voice (e.g. 'warped after first dishwasher cycle', 'too small for my pocket')",
    "..."
  ],
  "unmet_needs": [
    "Feature or capability customers wish existed",
    "..."
  ],
  "deal_breakers": [
    "Reason customers returned or 1-starred",
    "..."
  ]
}"""


# ── Pass 1c: Pricing retry (only fires if pass 1 returned empty pricing) ──────

_PRICING_RETRY_PROMPT = """You are a pricing data extractor. Extract EVERY dollar amount mentioned in the search snippets — be exhaustive.

Look for: $XX.XX, $XX, "around $X", "starting at $X", "from $X to $Y", "MSRP $X", etc.

After listing every price found, compute low / mid / high / sweet_spot.

IMPORTANT: Respond ONLY with valid JSON, no markdown:
{
  "prices_found": ["$24.99", "$39", "$15.50", "..."],
  "low": "Lowest price as $XX.XX",
  "mid": "Median or typical price as $XX.XX",
  "high": "Highest price as $XX.XX",
  "sweet_spot": "Most common price band (e.g. '$25-$40')"
}"""


def _build_review_prompt(query: str, review_results: list[dict]) -> str:
    parts = [f"Product/Category: {query}", "",
             f"Total review-flavored snippets: {len(review_results)}", "",
             "--- SEARCH RESULTS (review queries) ---"]
    for i, r in enumerate(review_results, 1):
        title = r.get("title", "")
        url = r.get("url", "")
        snippet = r.get("snippet", "")
        parts.append(f"{i}. [{title}]({url})\n   {snippet}\n")
    return "\n".join(parts)


def _build_pricing_prompt(query: str, search_results: list[dict]) -> str:
    parts = [f"Product/Category: {query}", "",
             "--- SEARCH SNIPPETS — extract every $ amount ---"]
    for i, r in enumerate(search_results, 1):
        snippet = r.get("snippet", "")
        if "$" in snippet:
            parts.append(f"{i}. {snippet}\n")
    return "\n".join(parts)


def _build_extraction_prompt(query: str, search_results: list[dict], platform: Platform | None) -> str:
    """Build prompt for data extraction pass."""
    parts = [f"Product/Category: {query}"]
    if platform:
        parts.append(f"Marketplace: {platform.value}")

    parts.append(f"\nTotal search results: {len(search_results)}\n")
    parts.append("--- SEARCH RESULTS ---\n")

    for i, r in enumerate(search_results, 1):
        title = r.get("title", "")
        url = r.get("url", "")
        snippet = r.get("snippet", "")
        engine = r.get("engine", "")
        parts.append(f"{i}. [{title}]({url}) [{engine}]\n   {snippet}\n")

    return "\n".join(parts)


# ── Pass 2: Strategic analysis ───────────────────────────────────────────────

_STRATEGY_PROMPT = """You are a senior e-commerce strategy consultant. Given extracted competitive data, produce a comprehensive strategic analysis.

IMPORTANT: Respond ONLY with valid JSON:
{
  "executive_summary": "2-3 sentence summary of the competitive landscape and key opportunity",

  "market_analysis": "Detailed analysis (400-600 words) covering: market size indicators, growth trends, seasonality patterns, demand signals, price sensitivity, customer segments",

  "competitive_landscape": "Analysis (300-400 words) of competitor positioning, market leaders vs challengers, differentiation strategies, common strengths/weaknesses across competitors",

  "keyword_strategy": {
    "primary_keywords": ["8-12 highest-value, highest-volume keywords"],
    "long_tail_keywords": ["15-20 specific long-tail keywords with buyer intent"],
    "keyword_gaps": ["5-10 keywords competitors are missing or underserving"],
    "trending_keywords": ["5-8 emerging/growing keywords"]
  },

  "pricing_intelligence": {
    "market_range": "Full price range in the market",
    "sweet_spot": "Optimal price point for maximum sales velocity",
    "premium_justification": "What features/positioning justify premium pricing",
    "undercut_opportunity": "Is there room to undercut on price while maintaining margins"
  },

  "opportunities": [
    {
      "opportunity": "Specific actionable opportunity",
      "impact": "high/medium/low",
      "effort": "high/medium/low",
      "details": "How to execute this opportunity"
    }
  ],

  "threats": ["Key risks or competitive threats to be aware of"],

  "recommended_positioning": "Specific recommendation for how to position the product — target audience, unique value prop, price point, key differentiators",

  "action_items": ["5-8 specific, prioritized next steps"]
}"""


def _build_strategy_prompt(query: str, extracted_data: dict, platform: Platform | None) -> str:
    """Build prompt for strategic analysis pass."""
    parts = [
        f"Product/Category: {query}",
        f"Marketplace: {platform.value if platform else 'Multi-platform'}",
        "",
        "--- EXTRACTED COMPETITIVE DATA ---",
        json.dumps(extracted_data, indent=2)[:8000],  # Cap to stay in token limits
    ]
    return "\n".join(parts)


# ── JSON parsing ─────────────────────────────────────────────────────────────

def _parse_json(raw: str) -> dict:
    """Parse LLM JSON response with fallback handling."""
    text = raw.strip()

    try:
        return json.loads(text)
    except (json.JSONDecodeError, ValueError):
        pass

    match = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except (json.JSONDecodeError, ValueError):
            pass

    brace_match = re.search(r"\{.*\}", text, re.DOTALL)
    if brace_match:
        try:
            return json.loads(brace_match.group(0))
        except (json.JSONDecodeError, ValueError):
            pass

    raise ValueError(f"Unable to parse JSON: {text[:300]}")


# ── Main orchestrator ────────────────────────────────────────────────────────

async def conduct_research(
    request: ResearchRequest,
    user_id: str,
) -> ResearchResponse:
    """Run full competitive intelligence pipeline.

    Pipeline:
      1. Generate 11 targeted search queries
      2. Execute all searches in parallel
      3. Pass 1: Extract structured data (competitors, pricing, keywords)
      4. Pass 2: Strategic analysis (positioning, opportunities, action items)
      5. Merge and persist results
    """
    logger.info("Research pipeline started for user %s: %s", user_id, request.query)

    # Step 1: Generate search queries (general + review-flavored buckets)
    main_queries = _build_search_queries(request.query, request.platform)
    review_queries = _build_review_queries(request.query, request.platform)

    # Step 2: Execute searches in parallel — both buckets at once
    async def _search(q: str) -> list[dict]:
        try:
            return await web_search(q, max_results=10)
        except Exception as e:
            logger.warning("Search failed for '%s': %s", q[:50], e)
            return []

    main_batches, review_batches = await asyncio.gather(
        asyncio.gather(*[_search(q) for q in main_queries]),
        asyncio.gather(*[_search(q) for q in review_queries]),
    )

    # Dedupe each bucket independently — review snippets stay routed
    # to the review extractor even if they also appeared in a main query
    def _dedupe(batches: list[list[dict]]) -> list[dict]:
        seen: set[str] = set()
        out: list[dict] = []
        for batch in batches:
            for r in batch:
                url = r.get("url", "")
                if url and url not in seen:
                    seen.add(url)
                    out.append(r)
        return out

    all_results = _dedupe(main_batches)
    review_results = _dedupe(review_batches)

    logger.info(
        "Collected %d main + %d review unique results from %d+%d queries",
        len(all_results), len(review_results), len(main_queries), len(review_queries),
    )

    if not all_results:
        all_results = [{
            "title": "No web results",
            "url": "",
            "snippet": "Provide analysis based on general knowledge of this product category.",
            "engine": "fallback",
        }]

    # Step 3: Pass 1 (main extraction) + Pass 1b (review extraction) in parallel
    async def _run_main_extraction() -> dict:
        raw = await generate_text(
            system_prompt=_EXTRACTION_PROMPT,
            user_message=_build_extraction_prompt(
                request.query, all_results[:30], request.platform
            ),
            max_tokens=4096,
            temperature=0.3,
        )
        return _parse_json(raw)

    async def _run_review_extraction() -> dict:
        if not review_results:
            return {"pain_points": [], "unmet_needs": [], "deal_breakers": []}
        try:
            raw = await generate_text(
                system_prompt=_REVIEW_EXTRACTION_PROMPT,
                user_message=_build_review_prompt(request.query, review_results[:25]),
                max_tokens=2048,
                temperature=0.2,
            )
            return _parse_json(raw)
        except Exception as e:
            logger.warning("Review extraction failed: %s", e)
            return {"pain_points": [], "unmet_needs": [], "deal_breakers": []}

    extracted_data, review_data = await asyncio.gather(
        _run_main_extraction(), _run_review_extraction()
    )

    # Merge pain points. The review extractor returns buyer-voice quotes;
    # the main extractor often returns category-level fluff like "intense
    # price competition". When review extractor produced enough signal
    # (>=3), use ONLY those — otherwise fall back to merging both buckets.
    review_pain = (review_data.get("pain_points") or []) + \
                  (review_data.get("deal_breakers") or [])
    main_pain = extracted_data.get("customer_pain_points") or []
    if len(review_pain) >= 3:
        merged_pain = list(dict.fromkeys(review_pain))
    else:
        merged_pain = list(dict.fromkeys(review_pain + main_pain))
    extracted_data["customer_pain_points"] = merged_pain
    extracted_data["unmet_needs"] = review_data.get("unmet_needs") or []

    # Models sometimes fill pricing fields with sentinel strings like
    # "No prices found" or "N/A" instead of leaving them empty. Treat those
    # as empty so the retry path actually fires.
    _PRICING_PLACEHOLDERS = {
        "", "n/a", "na", "none", "null", "unknown", "not specified",
        "not available", "no prices found", "no price found", "not found",
        "tbd", "-",
    }

    def _is_real_price(v: object) -> bool:
        if not isinstance(v, str):
            return bool(v)
        return v.strip().lower() not in _PRICING_PLACEHOLDERS

    def _scrub_pricing(p: dict) -> dict:
        return {k: (v if _is_real_price(v) else "") for k, v in (p or {}).items()}

    # Step 3.5: Pricing retry — only if main pass left pricing fields empty
    pricing = _scrub_pricing(extracted_data.get("pricing_data") or {})
    pricing_empty = not any(
        pricing.get(k) for k in ("low", "mid", "high", "sweet_spot")
    )
    if pricing_empty:
        try:
            raw_pricing = await generate_text(
                system_prompt=_PRICING_RETRY_PROMPT,
                user_message=_build_pricing_prompt(request.query, all_results[:40]),
                max_tokens=1024,
                temperature=0.2,
            )
            pricing_retry = _scrub_pricing(_parse_json(raw_pricing))
            extracted_data["pricing_data"] = {
                "low": pricing_retry.get("low", ""),
                "mid": pricing_retry.get("mid", ""),
                "high": pricing_retry.get("high", ""),
                "sweet_spot": pricing_retry.get("sweet_spot", ""),
            }
            extracted_data["prices_found"] = pricing_retry.get("prices_found", [])
            logger.info("Pricing retry: %d prices found",
                        len(pricing_retry.get("prices_found", []) or []))
        except Exception as e:
            logger.warning("Pricing retry failed: %s", e)
    else:
        extracted_data["pricing_data"] = pricing

    logger.info("Extraction pass complete: %d competitors, %d keywords, %d pain points",
                len(extracted_data.get("competitors", [])),
                len(extracted_data.get("keywords_from_results", [])),
                len(extracted_data.get("customer_pain_points", [])))

    # Step 4: Pass 2 — Strategic analysis
    strategy_prompt = _build_strategy_prompt(
        request.query, extracted_data, request.platform
    )

    raw_strategy = await generate_text(
        system_prompt=_STRATEGY_PROMPT,
        user_message=strategy_prompt,
        max_tokens=8192,
        temperature=0.4,
    )

    strategy = _parse_json(raw_strategy)

    # Step 5: Merge into final output
    # Build the analysis text from strategy
    analysis_parts = []
    if strategy.get("executive_summary"):
        analysis_parts.append(f"**Executive Summary**\n{strategy['executive_summary']}")
    if strategy.get("market_analysis"):
        analysis_parts.append(f"\n**Market Analysis**\n{strategy['market_analysis']}")
    if strategy.get("competitive_landscape"):
        analysis_parts.append(f"\n**Competitive Landscape**\n{strategy['competitive_landscape']}")
    if strategy.get("pricing_intelligence"):
        pi = strategy["pricing_intelligence"]
        analysis_parts.append(
            f"\n**Pricing Intelligence**\n"
            f"Market range: {pi.get('market_range', 'N/A')}\n"
            f"Sweet spot: {pi.get('sweet_spot', 'N/A')}\n"
            f"Premium justification: {pi.get('premium_justification', 'N/A')}\n"
            f"Undercut opportunity: {pi.get('undercut_opportunity', 'N/A')}"
        )
    if strategy.get("recommended_positioning"):
        analysis_parts.append(f"\n**Recommended Positioning**\n{strategy['recommended_positioning']}")
    if strategy.get("opportunities"):
        opps = strategy["opportunities"]
        opp_lines = [f"- [{o.get('impact','?')} impact / {o.get('effort','?')} effort] {o.get('opportunity','')}: {o.get('details','')}" for o in opps]
        analysis_parts.append(f"\n**Opportunities**\n" + "\n".join(opp_lines))
    if strategy.get("threats"):
        analysis_parts.append(f"\n**Threats**\n" + "\n".join(f"- {t}" for t in strategy["threats"]))
    if strategy.get("action_items"):
        analysis_parts.append(f"\n**Action Items**\n" + "\n".join(f"{i+1}. {a}" for i, a in enumerate(strategy["action_items"])))

    full_analysis = "\n".join(analysis_parts)

    # Merge keywords from both passes
    all_keywords = list(set(
        extracted_data.get("keywords_from_results", []) +
        strategy.get("keyword_strategy", {}).get("primary_keywords", []) +
        strategy.get("keyword_strategy", {}).get("long_tail_keywords", []) +
        strategy.get("keyword_strategy", {}).get("keyword_gaps", []) +
        strategy.get("keyword_strategy", {}).get("trending_keywords", [])
    ))

    # Build competitor list from extraction pass
    competitors = extracted_data.get("competitors", [])

    # Step 6: Persist
    db_record = research_repo.create({
        "user_id": user_id,
        "query": request.query,
        "analysis": full_analysis,
        "keywords_found": all_keywords,
        "competitors": competitors,
    })

    logger.info("Research %s complete: %d keywords, %d competitors, %d search results",
                db_record["id"], len(all_keywords), len(competitors), len(all_results))

    return ResearchResponse(
        id=UUID(db_record["id"]),
        query=db_record["query"],
        analysis=db_record["analysis"],
        keywords_found=db_record["keywords_found"],
        competitors=db_record["competitors"],
        created_at=db_record["created_at"],
    )
