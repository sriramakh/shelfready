"""
ShelfReady — Competitive Intelligence Test v2
Uses MiniMax function calling + DuckDuckGo for actual web search.
"""

import json
import os
import re
import time
from datetime import datetime

import anthropic
import httpx

API_KEY = os.environ.get("MINIMAX_API_TOKEN", "")
BASE_URL = "https://api.minimax.io/anthropic"
MODEL = "MiniMax-M2.7-fast"
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "competitive_intel_results.md")

client = anthropic.Anthropic(api_key=API_KEY, base_url=BASE_URL)

SEARCH_TOOL = {
    "name": "web_search",
    "description": "Search the web for current information about products, markets, competitors, and trends. Returns relevant search results.",
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "The search query to find relevant web results",
            }
        },
        "required": ["query"],
    },
}


def duckduckgo_search(query: str, max_results: int = 8) -> list[dict]:
    """Search DuckDuckGo and return results."""
    try:
        # Use DuckDuckGo HTML endpoint
        resp = httpx.get(
            "https://html.duckduckgo.com/html/",
            params={"q": query},
            headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"},
            timeout=15.0,
            follow_redirects=True,
        )

        results = []
        # Parse results from HTML
        from html.parser import HTMLParser

        class DDGParser(HTMLParser):
            def __init__(self):
                super().__init__()
                self.results = []
                self.current = {}
                self.in_title = False
                self.in_snippet = False
                self.capture_text = ""

            def handle_starttag(self, tag, attrs):
                attrs_dict = dict(attrs)
                if tag == "a" and "result__a" in attrs_dict.get("class", ""):
                    self.in_title = True
                    self.current = {"url": attrs_dict.get("href", ""), "title": "", "snippet": ""}
                    self.capture_text = ""
                elif tag == "a" and "result__snippet" in attrs_dict.get("class", ""):
                    self.in_snippet = True
                    self.capture_text = ""

            def handle_endtag(self, tag):
                if tag == "a" and self.in_title:
                    self.current["title"] = self.capture_text.strip()
                    self.in_title = False
                elif tag == "a" and self.in_snippet:
                    self.current["snippet"] = self.capture_text.strip()
                    self.in_snippet = False
                    if self.current.get("title"):
                        self.results.append(self.current)
                    self.current = {}

            def handle_data(self, data):
                if self.in_title or self.in_snippet:
                    self.capture_text += data

        parser = DDGParser()
        parser.feed(resp.text)
        results = parser.results[:max_results]

        if results:
            return results

        # Fallback: try to extract from raw HTML with regex
        titles = re.findall(r'class="result__a"[^>]*>(.*?)</a>', resp.text, re.DOTALL)
        snippets = re.findall(r'class="result__snippet"[^>]*>(.*?)</a>', resp.text, re.DOTALL)

        for i in range(min(len(titles), len(snippets), max_results)):
            title = re.sub(r'<[^>]+>', '', titles[i]).strip()
            snippet = re.sub(r'<[^>]+>', '', snippets[i]).strip()
            if title:
                results.append({"title": title, "snippet": snippet, "url": ""})

        return results if results else [{"title": "Search completed", "snippet": f"Search for '{query}' completed but no structured results could be extracted.", "url": ""}]

    except Exception as e:
        return [{"title": "Search error", "snippet": str(e), "url": ""}]


def run_research_with_tools(scenario: dict) -> dict:
    """Run competitive research using MiniMax tool calling + real web search."""
    print(f"\n{'='*60}")
    print(f"Research #{scenario['id']}: {scenario['name']}")
    print(f"{'='*60}")

    start_time = time.time()
    messages = [{"role": "user", "content": scenario["user_prompt"]}]
    search_count = 0
    all_search_results = []

    # Multi-turn conversation with tool calls
    max_turns = 6
    for turn in range(max_turns):
        try:
            response = client.messages.create(
                model=MODEL,
                max_tokens=4096,
                system=scenario["system_prompt"],
                tools=[SEARCH_TOOL],
                messages=messages,
            )
        except Exception as e:
            print(f"  API Error on turn {turn+1}: {e}")
            break

        # Check if model wants to use tools
        if response.stop_reason == "tool_use":
            # Collect ALL content blocks (thinking + tool_use)
            assistant_content = []
            tool_calls = []

            for block in response.content:
                if block.type == "thinking":
                    assistant_content.append({"type": "thinking", "thinking": block.thinking})
                elif block.type == "tool_use":
                    assistant_content.append({"type": "tool_use", "id": block.id, "name": block.name, "input": block.input})
                    tool_calls.append(block)
                elif block.type == "text":
                    assistant_content.append({"type": "text", "text": block.text})

            # Add assistant message with full content
            messages.append({"role": "assistant", "content": assistant_content})

            # Execute all tool calls and build tool_result message
            tool_results = []
            for tool_call in tool_calls:
                query = tool_call.input.get("query", "")
                search_count += 1
                print(f"  Search #{search_count}: '{query}'")

                results = duckduckgo_search(query)
                all_search_results.extend(results)

                result_text = "\n".join(
                    f"- {r['title']}: {r['snippet']}" for r in results
                )
                print(f"    Found {len(results)} results")

                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_call.id,
                    "content": result_text or "No results found.",
                })

            messages.append({"role": "user", "content": tool_results})
            time.sleep(0.5)

        elif response.stop_reason == "end_turn":
            # Model is done — extract final analysis
            final_text = ""
            for block in response.content:
                if hasattr(block, "text") and block.text:
                    final_text = block.text
                    break

            elapsed = round(time.time() - start_time, 2)

            # Parse JSON
            parsed = parse_json(final_text)
            score = evaluate_research(parsed, final_text)

            print(f"  Searches performed: {search_count}")
            print(f"  Total results: {len(all_search_results)}")
            print(f"  Total time: {elapsed}s")
            print(f"  Quality: {score}/10")

            return {
                "id": scenario["id"],
                "name": scenario["name"],
                "success": parsed is not None,
                "search_count": search_count,
                "total_results": len(all_search_results),
                "total_time": elapsed,
                "parsed_json": parsed,
                "raw_analysis": final_text,
                "score": score,
                "used_live_search": search_count > 0,
            }

        else:
            print(f"  Unexpected stop_reason: {response.stop_reason}")
            break

    # If we exhausted turns without end_turn
    elapsed = round(time.time() - start_time, 2)
    return {
        "id": scenario["id"],
        "name": scenario["name"],
        "success": False,
        "error": "Max turns exceeded",
        "total_time": elapsed,
        "score": 3,
        "used_live_search": search_count > 0,
    }


def parse_json(text: str) -> dict | None:
    """Extract JSON from response text."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1:
        try:
            return json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            pass
    return None


def evaluate_research(parsed: dict | None, raw: str) -> float:
    """Score research quality."""
    if not parsed:
        return 3.0 if len(raw) > 500 else 1.0

    scores = []

    # Competitors
    for k in ["competitors", "top_competitors"]:
        if k in parsed and isinstance(parsed[k], list):
            scores.append(9 if len(parsed[k]) >= 3 else 6)
            break
    else:
        scores.append(2)

    # Keywords
    for k in ["keywords", "seo_keywords", "keyword_opportunities"]:
        if k in parsed and isinstance(parsed[k], list):
            scores.append(9 if len(parsed[k]) >= 10 else 7 if len(parsed[k]) >= 5 else 4)
            break
    else:
        scores.append(3)

    # Market overview
    for k in ["market_overview", "market_landscape"]:
        if k in parsed and len(str(parsed[k])) > 100:
            scores.append(8)
            break
    else:
        scores.append(3)

    # Action steps
    for k in ["launch_steps", "launch_plan", "listing_tips", "launch_recommendations", "recommendations"]:
        if k in parsed and isinstance(parsed[k], list) and len(parsed[k]) >= 3:
            scores.append(8)
            break
    else:
        scores.append(4)

    return round(sum(scores) / len(scores), 1)


SCENARIOS = [
    {
        "id": 1,
        "name": "Amazon Competitor Analysis — Portable Blender Market",
        "system_prompt": """You are an expert e-commerce market research analyst. Your job is to conduct thorough competitive intelligence using web search.

IMPORTANT: You MUST use the web_search tool multiple times to gather real, current data. Search for:
1. Top-selling products and brands
2. Pricing data and market trends
3. Customer complaints and review insights

After searching, synthesize your findings into valid JSON with these keys:
- "market_overview": Detailed market summary (200+ words)
- "competitors": Array of 5+ competitors, each with: name, price_range, star_rating, key_features, strengths, weaknesses
- "keywords": Array of 15+ keyword objects with: keyword, competition (high/medium/low), search_intent
- "pricing_analysis": Pricing strategy recommendation
- "content_gaps": Array of opportunities competitors miss
- "launch_steps": Array of 5+ actionable launch recommendations""",
        "user_prompt": "I'm launching a portable blender on Amazon at $35. Research the current competitive landscape: who are the top sellers, what are their prices, what do customers complain about, and how should I position my product? Use web search to get current data.",
    },
    {
        "id": 2,
        "name": "Etsy Trend Research — Personalized Pet Portraits",
        "system_prompt": """You are an Etsy market research specialist. Use web search to gather real data about current market trends.

IMPORTANT: Search the web multiple times to find:
1. Best-selling pet portrait shops and their pricing
2. Customer demand trends and popular styles
3. SEO and tag strategies that top sellers use

Synthesize into valid JSON with keys:
- "market_overview": Market summary with demand indicators
- "competitors": Array of 5+ top Etsy shops with: shop_name, price_range, reviews_count, style, strengths, weaknesses
- "keywords": Array of 15+ Etsy search keywords
- "pricing_analysis": Optimal pricing recommendation
- "style_gaps": Array of underserved art styles
- "seasonal_insights": Peak seasons and holiday strategies
- "listing_tips": Array of 5+ actionable Etsy listing tips""",
        "user_prompt": "I'm starting an AI-powered personalized pet portrait shop on Etsy, pricing at $25-45. Search the web for current top sellers, their pricing, popular styles, and what customers want. Help me find my niche.",
    },
    {
        "id": 3,
        "name": "Shopify DTC Research — Sustainable Activewear",
        "system_prompt": """You are a DTC e-commerce strategist. Use web search to research the current sustainable activewear market.

IMPORTANT: Search the web to find:
1. Current DTC sustainable activewear brands and their positioning
2. Market size, growth, and consumer trends
3. Marketing strategies that work in this space

Synthesize into valid JSON with keys:
- "market_landscape": Market size, growth rate, consumer sentiment (200+ words)
- "competitors": Array of 5+ brands with: brand, price_range, unique_positioning, marketing_channels, strengths, weaknesses
- "seo_keywords": Array of 15+ organic search keywords
- "marketing_channels": Analysis of acquisition channels
- "positioning_opportunities": Array of market gaps
- "content_strategy": What content drives conversions
- "launch_steps": Array of 5+ launch recommendations""",
        "user_prompt": "I'm launching a sustainable activewear brand on Shopify at $50-80. Search the web for current DTC competitors (like Girlfriend Collective, Outdoor Voices, etc.), market trends, and how to position my brand. I need real, current data.",
    },
]


def save_results(results: list[dict]):
    """Save comprehensive results to markdown."""
    lines = []
    lines.append("# ShelfReady — Competitive Intelligence Test Results")
    lines.append(f"\n**Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append(f"**Model:** {MODEL}")
    lines.append(f"**Pipeline:** MiniMax Function Calling + DuckDuckGo Live Search + AI Analysis")
    lines.append("")

    passed = sum(1 for r in results if r["success"])
    avg_score = round(sum(r["score"] for r in results) / len(results), 1)
    total_searches = sum(r.get("search_count", 0) for r in results)

    lines.append("## Summary")
    lines.append(f"- **Pass Rate:** {passed}/{len(results)}")
    lines.append(f"- **Average Score:** {avg_score}/10")
    lines.append(f"- **Total Web Searches:** {total_searches}")
    lines.append(f"- **Used Live Search:** {'Yes' if any(r.get('used_live_search') for r in results) else 'No (fallback to model knowledge)'}")
    lines.append("")
    lines.append("| # | Research Topic | Score | Searches | Time | Live Data? |")
    lines.append("|---|---------------|-------|----------|------|-----------|")
    for r in results:
        live = "Yes" if r.get("used_live_search") else "No"
        lines.append(
            f"| {r['id']} | {r['name']} | {r['score']}/10 | "
            f"{r.get('search_count', 0)} | {r.get('total_time', '?')}s | {live} |"
        )

    for r in results:
        lines.append(f"\n---\n")
        lines.append(f"## Research #{r['id']}: {r['name']}")
        lines.append(f"**Score:** {r['score']}/10  ")
        lines.append(f"**Web Searches:** {r.get('search_count', 0)}  ")
        lines.append(f"**Results Found:** {r.get('total_results', 0)}  ")
        lines.append(f"**Time:** {r.get('total_time', '?')}s  ")

        if r.get("error"):
            lines.append(f"\n### Error\n```\n{r['error']}\n```")
            continue

        parsed = r.get("parsed_json", {})
        if not parsed:
            raw = r.get("raw_analysis", "")[:3000]
            lines.append(f"\n### Raw Analysis\n{raw}")
            continue

        # Market Overview
        overview = parsed.get("market_overview") or parsed.get("market_landscape", "N/A")
        lines.append(f"\n### Market Overview\n{overview}")

        # Competitors
        comps = parsed.get("competitors") or parsed.get("top_competitors", [])
        if comps:
            lines.append(f"\n### Competitors ({len(comps)})")
            for c in comps:
                if isinstance(c, dict):
                    name = c.get("name") or c.get("brand") or c.get("shop_name", "Unknown")
                    price = c.get("price_range") or c.get("price", "?")
                    lines.append(f"\n**{name}** — {price}")
                    for k in ["star_rating", "reviews_count", "unique_positioning", "style", "key_features", "marketing_channels"]:
                        if k in c:
                            lines.append(f"- {k.replace('_', ' ').title()}: {c[k]}")
                    lines.append(f"- Strengths: {c.get('strengths', '?')}")
                    lines.append(f"- Weaknesses: {c.get('weaknesses', '?')}")

        # Keywords
        kws = parsed.get("keywords") or parsed.get("seo_keywords") or parsed.get("keyword_opportunities", [])
        if kws:
            lines.append(f"\n### Keywords ({len(kws)})")
            for k in kws:
                if isinstance(k, dict):
                    kw = k.get("keyword") or k.get("term", str(k))
                    comp = k.get("competition") or k.get("competition_level", "?")
                    intent = k.get("search_intent", "")
                    extra = f" — {intent}" if intent else ""
                    lines.append(f"- **{kw}** (competition: {comp}){extra}")
                else:
                    lines.append(f"- {k}")

        # Pricing
        pricing = parsed.get("pricing_analysis") or parsed.get("price_positioning", "")
        if pricing:
            lines.append(f"\n### Pricing Analysis\n{pricing}")

        # Gaps
        gaps = parsed.get("content_gaps") or parsed.get("style_gaps") or parsed.get("positioning_opportunities", [])
        if gaps:
            lines.append(f"\n### Gaps & Opportunities")
            for g in gaps:
                lines.append(f"- {g}")

        # Launch Steps
        steps = parsed.get("launch_steps") or parsed.get("listing_tips") or parsed.get("launch_recommendations") or parsed.get("recommendations", [])
        if steps:
            lines.append(f"\n### Action Plan")
            for i, s in enumerate(steps, 1):
                lines.append(f"{i}. {s}")

        # Extras
        for key in ["seasonal_insights", "content_strategy", "marketing_channels"]:
            if key in parsed and parsed[key]:
                lines.append(f"\n### {key.replace('_', ' ').title()}\n{parsed[key]}")

    lines.append(f"\n---\n## Verdict")
    if avg_score >= 7:
        lines.append(f"Competitive intelligence pipeline is **production-ready** ({avg_score}/10).")
    elif avg_score >= 5:
        lines.append(f"Pipeline is **functional but needs refinement** ({avg_score}/10).")
    else:
        lines.append(f"Pipeline **needs significant work** ({avg_score}/10).")

    lines.append(f"\nTotal web searches: {total_searches}")

    content = "\n".join(lines)
    with open(OUTPUT_FILE, "w") as f:
        f.write(content)
    print(f"\nResults saved to: {OUTPUT_FILE}")


def main():
    if not API_KEY:
        print("ERROR: MINIMAX_API_TOKEN not set")
        return

    print("ShelfReady — Competitive Intelligence Pipeline v2")
    print("MiniMax Function Calling + DuckDuckGo Live Search")
    print(f"Testing {len(SCENARIOS)} research scenarios...\n")

    results = []
    for scenario in SCENARIOS:
        result = run_research_with_tools(scenario)
        results.append(result)
        time.sleep(2)

    save_results(results)

    passed = sum(1 for r in results if r["success"])
    avg_score = round(sum(r["score"] for r in results) / len(results), 1)
    total_searches = sum(r.get("search_count", 0) for r in results)
    print(f"\n{'='*60}")
    print(f"FINAL: {passed}/{len(results)} passed | Avg Score: {avg_score}/10")
    print(f"Total live web searches: {total_searches}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
