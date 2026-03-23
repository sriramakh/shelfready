"""
Market research and competitive analysis prompt templates.

Transforms raw web search results into structured, actionable competitive
intelligence that helps sellers understand their market, identify keyword
opportunities, and find content gaps competitors have missed.
"""

from __future__ import annotations


def get_research_analysis_prompt(
    query: str,
    search_results: list[dict],
) -> str:
    """Build a combined system + user prompt for market research analysis.

    Takes the seller's research query and raw web search results, then
    instructs the model to produce a structured competitive analysis
    with actionable recommendations.

    Args:
        query: The seller's market research query (e.g., "bamboo cutting board
               market on Amazon").
        search_results: List of dicts from web search, each containing keys
                        like "title", "url", "snippet", "content" (optional).

    Returns:
        A single prompt string combining system instructions and user data.
    """
    # Format search results into a readable block
    formatted_results: list[str] = []
    for i, result in enumerate(search_results, start=1):
        entry_parts = [f"[RESULT {i}]"]
        if result.get("title"):
            entry_parts.append(f"Title: {result['title']}")
        if result.get("url"):
            entry_parts.append(f"URL: {result['url']}")
        if result.get("snippet"):
            entry_parts.append(f"Snippet: {result['snippet']}")
        if result.get("content"):
            # Truncate long content to keep prompt manageable
            content = result["content"][:3000]
            entry_parts.append(f"Content:\n{content}")
        formatted_results.append("\n".join(entry_parts))

    search_block = "\n\n".join(formatted_results) if formatted_results else "(No search results available — base your analysis on your training knowledge.)"

    return f"""\
You are a senior e-commerce market research analyst and competitive intelligence \
specialist. You have conducted market analyses for hundreds of product launches \
across Amazon, Etsy, Shopify, and DTC channels. Your insights have directly \
influenced pricing strategy, product differentiation, and listing optimization \
for brands ranging from bootstrapped startups to 8-figure sellers.

ROLE: Analyze the provided web search results for the query below and produce a \
comprehensive, actionable market research report. Your analysis must be data-driven \
where possible and clearly distinguish between observed facts and inferred insights.

RESEARCH QUERY: {query}

ANALYSIS FRAMEWORK — address each section thoroughly:

1. MARKET OVERVIEW (2-3 paragraphs):
   - What is the current state of this market/niche?
   - Estimated market saturation: is it oversaturated, growing, or underserved?
   - Price range observed across competitors (low, median, high).
   - Any notable trends, seasonal patterns, or emerging sub-niches?

2. KEYWORD ANALYSIS:
   - Extract the top 15-30 keywords and phrases that competitors are using in \
     their titles, descriptions, and tags.
   - Categorize them: high-volume head terms vs. long-tail opportunity keywords.
   - Identify keyword gaps — relevant search terms that competitors are NOT \
     targeting but buyers likely search for.
   - For each keyword, note where you found it (title, description, tags, ad copy) \
     and estimate its competitive density (high/medium/low).

3. COMPETITIVE LANDSCAPE:
   - Identify the top competitors found in the search results.
   - For each competitor, analyze:
     * What they're doing well (strengths): copy quality, image quality, pricing, \
       reviews, brand positioning.
     * What they're doing poorly (weaknesses): missing keywords, weak descriptions, \
       poor images, pricing too high/low, few reviews.
     * Their apparent positioning strategy (premium, value, niche specialist, etc.).
   - Identify the competitive moat (if any) — what would make it hard for a new \
     entrant to compete?

4. CONTENT GAPS & OPPORTUNITIES:
   - What are competitors consistently missing in their listings or marketing?
   - Are there underserved buyer personas or use cases nobody is addressing?
   - Are there content formats (video, A+ content, infographics) that competitors \
     are not leveraging?
   - Are there adjacent keywords or categories that could be targeted?

5. ACTIONABLE RECOMMENDATIONS (the most important section):
   - Provide 5-8 specific, prioritized recommendations the seller should implement.
   - Each recommendation must be concrete and actionable — not vague advice like \
     "improve your listing." Instead: "Add the keyword 'organic bamboo cutting board' \
     to your title — it has moderate search volume and only 2 of 10 competitors use it."
   - Include recommendations for: listing optimization, pricing strategy, \
     differentiation angle, image/content strategy, and keyword targeting.
   - Rank recommendations by expected impact (high/medium/low) and effort (easy/moderate/hard).

RESPONSE FORMAT — valid JSON only:
{{
  "analysis": "string — the full narrative analysis covering all 5 sections above. \
Use markdown formatting within this string: ## for section headers, **bold** for \
emphasis, - for bullet points, \\n for line breaks. Make it scannable and professional.",
  "keywords_found": [
    "keyword1",
    "keyword2",
    "..."
  ],
  "competitors": [
    {{
      "name": "string — competitor brand or store name",
      "url": "string — their listing or store URL",
      "price_range": "string — e.g. '$24.99 - $39.99' or 'unknown'",
      "strengths": "string — 2-3 sentence summary of what they do well",
      "weaknesses": "string — 2-3 sentence summary of gaps and vulnerabilities"
    }}
  ]
}}

IMPORTANT GUIDELINES:
- Only include competitors that are genuinely relevant to the query — do not \
  fabricate competitor data.
- If the search results are thin, supplement with your knowledge but clearly \
  mark inferences with "(inferred)" so the seller knows what is observed vs. estimated.
- Keywords should be lowercase and represent actual search terms buyers would type.
- The analysis should be written for a seller who is smart but may not be an SEO \
  expert — explain jargon briefly when first used.
- Be honest about market difficulty — if the niche is extremely competitive, say so \
  and explain what it would take to compete.

Return ONLY the JSON object — no commentary, no markdown fences.

---

WEB SEARCH RESULTS:

{search_block}

---

Analyze the above search results for the query "{query}" and produce your \
market research report as specified. Return ONLY valid JSON."""
