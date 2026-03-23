"""
ShelfReady — Competitive Intelligence Test
Tests MiniMax's web search + analysis pipeline for real-time market research.
"""

import json
import os
import re
import time
from datetime import datetime

import anthropic

API_KEY = os.environ.get("MINIMAX_API_TOKEN", "")
BASE_URL = "https://api.minimax.io/anthropic"
MODEL = "MiniMax-M2.7-fast"
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "competitive_intel_results.md")

client = anthropic.Anthropic(api_key=API_KEY, base_url=BASE_URL)


RESEARCH_SCENARIOS = [
    {
        "id": 1,
        "name": "Amazon Competitor Analysis — Portable Blender Market",
        "search_queries": [
            "best portable blender Amazon 2024 2025",
            "portable blender market size trends",
            "top selling portable blender brands reviews",
        ],
        "analysis_prompt": """You are an e-commerce market research analyst. Based on the web search results below, provide a comprehensive competitive analysis for someone launching a new portable blender on Amazon at $35.

Analyze:
1. **Market Overview**: Market size, growth trends, saturation level
2. **Top 5 Competitors**: Name, price, star rating, key features, strengths, weaknesses
3. **Keyword Opportunities**: 15+ keywords to target (with estimated competition level: high/medium/low)
4. **Pricing Strategy**: Where to position based on competitor pricing
5. **Content Gaps**: What are competitors doing poorly in their listings?
6. **Differentiation Opportunities**: How to stand out
7. **Actionable Launch Plan**: 5 specific steps

Return valid JSON with keys: market_overview, competitors (array), keywords (array of objects with keyword + competition), pricing_analysis, content_gaps (array), differentiation (array), launch_steps (array)""",
    },
    {
        "id": 2,
        "name": "Etsy Trend Research — Personalized Pet Portraits",
        "search_queries": [
            "personalized pet portrait Etsy best sellers 2024 2025",
            "custom pet portrait market trends demand",
            "pet portrait business pricing competition",
        ],
        "analysis_prompt": """You are an Etsy market research specialist. Based on the web search results below, analyze the personalized pet portrait market for someone starting an AI-powered pet portrait shop on Etsy at $25-45.

Analyze:
1. **Market Overview**: Demand level, seasonality, growth trajectory
2. **Top 5 Competitors**: Shop name, price range, reviews count, style, what makes them successful
3. **Keyword/Tag Strategy**: 15+ Etsy search terms to target
4. **Price Positioning**: Optimal price point based on market data
5. **Style Gaps**: What art styles are underserved?
6. **Seasonal Opportunities**: Peak buying seasons, holiday strategies
7. **Listing Optimization**: 5 specific tips based on what top sellers do

Return valid JSON with keys: market_overview, competitors (array), keywords (array), pricing_analysis, style_gaps (array), seasonal_insights, listing_tips (array)""",
    },
    {
        "id": 3,
        "name": "DTC Shopify Research — Sustainable Activewear",
        "search_queries": [
            "sustainable activewear brands DTC 2024 2025",
            "eco-friendly activewear market size growth",
            "sustainable athleisure consumer trends",
        ],
        "analysis_prompt": """You are a DTC e-commerce strategist. Based on the web search results below, analyze the sustainable activewear market for a new Shopify brand launching at $50-80 price point.

Analyze:
1. **Market Landscape**: Market size, growth rate, consumer sentiment
2. **Top 5 DTC Competitors**: Brand, price range, unique positioning, marketing channels, strengths/weaknesses
3. **SEO Keywords**: 15+ keywords for organic search
4. **Marketing Channel Analysis**: Where competitors acquire customers (social, influencer, SEO, paid)
5. **Brand Positioning Opportunities**: Gaps in the market
6. **Content Strategy**: What types of content drive conversions in this space
7. **Launch Recommendations**: 5 actionable steps

Return valid JSON with keys: market_landscape, competitors (array), seo_keywords (array), marketing_channels, positioning_opportunities (array), content_strategy, launch_steps (array)""",
    },
]


def run_web_search(query: str) -> list[dict]:
    """Use MiniMax's web search tool to get live results."""
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=2048,
            system="You are a research assistant. Use the web search tool to find current, relevant information. Return the search results.",
            messages=[{"role": "user", "content": f"Search the web for: {query}"}],
            tools=[{
                "type": "web_search_20250305",
                "name": "web_search",
                "max_uses": 3,
            }],
        )

        results = []
        for block in response.content:
            if hasattr(block, "text") and block.text:
                results.append({"type": "text_summary", "content": block.text})
            elif hasattr(block, "type") and block.type == "tool_use":
                results.append({"type": "tool_call", "name": block.name, "input": block.input})

        return results, response

    except Exception as e:
        return [{"type": "error", "content": str(e)}], None


def run_research(scenario: dict) -> dict:
    """Run a full competitive intelligence scenario."""
    print(f"\n{'='*60}")
    print(f"Research #{scenario['id']}: {scenario['name']}")
    print(f"{'='*60}")

    # Step 1: Run web searches
    all_search_results = []
    search_summaries = []
    total_search_time = 0

    for i, query in enumerate(scenario["search_queries"], 1):
        print(f"  Search {i}/3: '{query}'...")
        start = time.time()
        results, raw_response = run_web_search(query)
        elapsed = round(time.time() - start, 2)
        total_search_time += elapsed

        # Collect text results
        for r in results:
            if r["type"] == "text_summary" and r.get("content"):
                search_summaries.append(f"Query: {query}\nResults:\n{r['content']}")
            elif r["type"] == "error":
                print(f"    Search error: {r['content']}")

        all_search_results.extend(results)
        print(f"    Done ({elapsed}s)")
        time.sleep(1)

    if not search_summaries:
        # Fallback: if web search tool isn't available, use model knowledge
        print("  Web search returned no summaries. Trying direct knowledge approach...")
        combined_query = " | ".join(scenario["search_queries"])
        try:
            response = client.messages.create(
                model=MODEL,
                max_tokens=4096,
                system=scenario["analysis_prompt"],
                messages=[{"role": "user", "content": f"Research these topics using your knowledge:\n{combined_query}"}],
            )
            for block in response.content:
                if hasattr(block, "text") and block.text:
                    search_summaries.append(block.text)
        except Exception as e:
            print(f"  Fallback also failed: {e}")

    # Step 2: Analyze with AI
    print(f"  Analyzing results...")
    analysis_start = time.time()

    combined_search = "\n\n---\n\n".join(search_summaries[:10])  # Cap at 10 summaries

    try:
        analysis_response = client.messages.create(
            model=MODEL,
            max_tokens=4096,
            system=scenario["analysis_prompt"],
            messages=[{"role": "user", "content": f"Here are the web search results to analyze:\n\n{combined_search}"}],
        )

        analysis_text = ""
        for block in analysis_response.content:
            if hasattr(block, "text") and block.text:
                analysis_text = block.text
                break

        analysis_time = round(time.time() - analysis_start, 2)

        # Try to parse JSON
        parsed = None
        try:
            parsed = json.loads(analysis_text)
        except json.JSONDecodeError:
            match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', analysis_text, re.DOTALL)
            if match:
                try:
                    parsed = json.loads(match.group(1))
                except json.JSONDecodeError:
                    pass
            if not parsed:
                start_idx = analysis_text.find('{')
                end_idx = analysis_text.rfind('}')
                if start_idx != -1 and end_idx != -1:
                    try:
                        parsed = json.loads(analysis_text[start_idx:end_idx + 1])
                    except json.JSONDecodeError:
                        pass

        # Evaluate
        score = evaluate_research(parsed, analysis_text)

        print(f"  Analysis complete ({analysis_time}s)")
        print(f"  Total time: {round(total_search_time + analysis_time, 2)}s")
        print(f"  Quality: {score}/10")

        return {
            "id": scenario["id"],
            "name": scenario["name"],
            "success": parsed is not None,
            "search_time": total_search_time,
            "analysis_time": analysis_time,
            "total_time": round(total_search_time + analysis_time, 2),
            "search_results_count": len(search_summaries),
            "parsed_json": parsed,
            "raw_analysis": analysis_text,
            "score": score,
        }

    except Exception as e:
        print(f"  Analysis failed: {e}")
        return {
            "id": scenario["id"],
            "name": scenario["name"],
            "success": False,
            "error": str(e),
            "search_time": total_search_time,
            "score": 0,
        }


def evaluate_research(parsed: dict | None, raw: str) -> float:
    """Score the research quality."""
    if not parsed:
        return 3.0 if len(raw) > 500 else 1.0

    scores = []

    # Check for competitors
    comp_keys = ["competitors", "top_competitors"]
    comps = None
    for k in comp_keys:
        if k in parsed:
            comps = parsed[k]
            break
    if comps and isinstance(comps, list) and len(comps) >= 3:
        scores.append(9)
    elif comps and len(comps) >= 1:
        scores.append(6)
    else:
        scores.append(2)

    # Check for keywords
    kw_keys = ["keywords", "seo_keywords", "keyword_opportunities"]
    kws = None
    for k in kw_keys:
        if k in parsed:
            kws = parsed[k]
            break
    if kws and isinstance(kws, list) and len(kws) >= 10:
        scores.append(9)
    elif kws and len(kws) >= 5:
        scores.append(7)
    else:
        scores.append(3)

    # Check for market overview
    overview_keys = ["market_overview", "market_landscape"]
    overview = None
    for k in overview_keys:
        if k in parsed:
            overview = parsed[k]
            break
    if overview and len(str(overview)) > 100:
        scores.append(8)
    elif overview:
        scores.append(5)
    else:
        scores.append(2)

    # Check for actionable steps
    steps_keys = ["launch_steps", "launch_plan", "actionable_launch_plan", "listing_tips"]
    steps = None
    for k in steps_keys:
        if k in parsed:
            steps = parsed[k]
            break
    if steps and isinstance(steps, list) and len(steps) >= 3:
        scores.append(8)
    else:
        scores.append(4)

    return round(sum(scores) / len(scores), 1)


def save_results(results: list[dict]):
    """Save comprehensive results to markdown."""
    lines = []
    lines.append("# ShelfReady — Competitive Intelligence Test Results")
    lines.append(f"\n**Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append(f"**Model:** {MODEL}")
    lines.append(f"**Feature tested:** Web Search + AI Analysis Pipeline")
    lines.append("")

    passed = sum(1 for r in results if r["success"])
    avg_score = round(sum(r["score"] for r in results) / len(results), 1)

    lines.append("## Summary")
    lines.append(f"- **Pass Rate:** {passed}/{len(results)}")
    lines.append(f"- **Average Score:** {avg_score}/10")
    lines.append("")
    lines.append("| # | Research Topic | Score | Search Time | Analysis Time | Status |")
    lines.append("|---|---------------|-------|-------------|---------------|--------|")
    for r in results:
        status = "PASS" if r["success"] else "FAIL"
        lines.append(
            f"| {r['id']} | {r['name']} | {r['score']}/10 | "
            f"{r.get('search_time', 0)}s | {r.get('analysis_time', 0)}s | {status} |"
        )

    for r in results:
        lines.append(f"\n---\n")
        lines.append(f"## Research #{r['id']}: {r['name']}")
        lines.append(f"**Score:** {r['score']}/10  ")
        lines.append(f"**Status:** {'PASS' if r['success'] else 'FAIL'}  ")
        lines.append(f"**Total Time:** {r.get('total_time', 'N/A')}s  ")

        if r.get("error"):
            lines.append(f"\n### Error\n```\n{r['error']}\n```")
            continue

        parsed = r.get("parsed_json", {})
        if not parsed:
            lines.append("\n### Raw Analysis (JSON parse failed)")
            raw = r.get("raw_analysis", "")[:3000]
            lines.append(f"\n{raw}")
            continue

        # Market Overview
        overview = parsed.get("market_overview") or parsed.get("market_landscape", "N/A")
        lines.append(f"\n### Market Overview")
        lines.append(str(overview))

        # Competitors
        comps = parsed.get("competitors") or parsed.get("top_competitors", [])
        if comps:
            lines.append(f"\n### Competitors ({len(comps)})")
            for c in comps:
                if isinstance(c, dict):
                    name = c.get("name") or c.get("brand") or c.get("shop_name", "Unknown")
                    price = c.get("price") or c.get("price_range", "?")
                    strengths = c.get("strengths", "?")
                    weaknesses = c.get("weaknesses", "?")
                    lines.append(f"\n**{name}** — {price}")
                    lines.append(f"- Strengths: {strengths}")
                    lines.append(f"- Weaknesses: {weaknesses}")
                    for extra_key in ["star_rating", "reviews_count", "unique_positioning", "style", "key_features", "marketing_channels"]:
                        if extra_key in c:
                            lines.append(f"- {extra_key.replace('_', ' ').title()}: {c[extra_key]}")
                else:
                    lines.append(f"- {c}")

        # Keywords
        kws = parsed.get("keywords") or parsed.get("seo_keywords") or parsed.get("keyword_opportunities", [])
        if kws:
            lines.append(f"\n### Keywords ({len(kws)})")
            for k in kws:
                if isinstance(k, dict):
                    keyword = k.get("keyword") or k.get("term", str(k))
                    comp = k.get("competition") or k.get("competition_level") or k.get("difficulty", "?")
                    lines.append(f"- **{keyword}** (competition: {comp})")
                else:
                    lines.append(f"- {k}")

        # Pricing
        pricing = parsed.get("pricing_analysis") or parsed.get("price_positioning", "")
        if pricing:
            lines.append(f"\n### Pricing Analysis")
            lines.append(str(pricing))

        # Gaps / Opportunities
        gaps = parsed.get("content_gaps") or parsed.get("style_gaps") or parsed.get("positioning_opportunities", [])
        if gaps:
            lines.append(f"\n### Gaps & Opportunities")
            for g in gaps:
                lines.append(f"- {g}")

        # Differentiation
        diff = parsed.get("differentiation", [])
        if diff:
            lines.append(f"\n### Differentiation Strategy")
            for d in diff:
                lines.append(f"- {d}")

        # Launch steps
        steps = parsed.get("launch_steps") or parsed.get("launch_plan") or parsed.get("listing_tips") or parsed.get("launch_recommendations", [])
        if steps:
            lines.append(f"\n### Action Plan")
            for i, s in enumerate(steps, 1):
                lines.append(f"{i}. {s}")

        # Seasonal / Content
        for key in ["seasonal_insights", "content_strategy", "marketing_channels"]:
            if key in parsed and parsed[key]:
                lines.append(f"\n### {key.replace('_', ' ').title()}")
                lines.append(str(parsed[key]))

    lines.append(f"\n---\n## Verdict")
    if avg_score >= 7:
        lines.append(f"Competitive intelligence pipeline is **production-ready** ({avg_score}/10).")
    elif avg_score >= 5:
        lines.append(f"Competitive intelligence is **functional but needs refinement** ({avg_score}/10).")
    else:
        lines.append(f"Competitive intelligence **needs significant work** ({avg_score}/10).")

    content = "\n".join(lines)
    with open(OUTPUT_FILE, "w") as f:
        f.write(content)
    print(f"\nResults saved to: {OUTPUT_FILE}")


def main():
    if not API_KEY:
        print("ERROR: MINIMAX_API_TOKEN not set")
        return

    print("ShelfReady — Competitive Intelligence Pipeline Test")
    print(f"Testing {len(RESEARCH_SCENARIOS)} research scenarios with live web search...")

    results = []
    for scenario in RESEARCH_SCENARIOS:
        result = run_research(scenario)
        results.append(result)
        time.sleep(2)

    save_results(results)

    passed = sum(1 for r in results if r["success"])
    avg_score = round(sum(r["score"] for r in results) / len(results), 1)
    print(f"\n{'='*60}")
    print(f"FINAL: {passed}/{len(results)} passed | Avg Score: {avg_score}/10")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
