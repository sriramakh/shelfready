"""
ShelfReady — MiniMax M2.7-fast Capability Test
Tests 10 real e-commerce scenarios and evaluates AI response quality.
"""

import json
import os
import sys
import time
from datetime import datetime

import anthropic

# ── Config ────────────────────────────────────────────────────────────
API_KEY = os.environ.get("MINIMAX_API_TOKEN", "")
BASE_URL = "https://api.minimax.io/anthropic"
MODEL = "MiniMax-M2.7-fast"
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "test_results.md")

client = anthropic.Anthropic(api_key=API_KEY, base_url=BASE_URL)

# ── 10 E-commerce Test Scenarios ──────────────────────────────────────

SCENARIOS = [
    # 1. Amazon Listing Optimization
    {
        "id": 1,
        "name": "Amazon Product Listing — Bamboo Cutting Board",
        "category": "listing",
        "system_prompt": """You are an expert Amazon product listing copywriter who specializes in A9/A10 algorithm optimization.

Generate an optimized Amazon product listing. Return ONLY valid JSON with these keys:
- "title": Product title (max 200 chars, brand first, front-load keywords)
- "bullets": Array of exactly 5 bullet points (each starts with CAPS benefit word, max 500 chars each)
- "description": Product description with basic HTML formatting (max 2000 chars)
- "keywords": Array of backend search terms (no repeats from title/bullets, max 250 bytes total)

Focus on: A9 keyword optimization, benefit-driven copy, emotional triggers, and conversion.""",
        "user_prompt": """Product: Premium Organic Bamboo Cutting Board Set (3-piece)
Details: Set of 3 cutting boards (large 18x12", medium 14x10", small 10x7"). Made from 100% organic moso bamboo. Has deep juice grooves, easy-grip handles, and anti-slip rubber feet. BPA-free, knife-friendly surface. Comes in eco-friendly packaging.
Target Audience: Health-conscious home cooks, eco-friendly consumers, people who love cooking
Price: $34.99
Category: Kitchen & Dining > Cutting Boards""",
    },

    # 2. Etsy Listing — Handmade Jewelry
    {
        "id": 2,
        "name": "Etsy Product Listing — Handmade Resin Earrings",
        "category": "listing",
        "system_prompt": """You are an expert Etsy listing copywriter who understands Etsy's search algorithm deeply.

Generate an optimized Etsy listing. Return ONLY valid JSON with these keys:
- "title": Max 140 chars, keyword-rich, use commas to separate key phrases
- "description": First 160 chars are critical (shown in search). Tell a story about the product. Include DETAILS and SHIPPING sections.
- "tags": Array of EXACTLY 13 tags. All multi-word, long-tail keywords. No single words.
- "keywords": Array of additional SEO keywords

Make it feel authentic, artisanal, and personal — that's what sells on Etsy.""",
        "user_prompt": """Product: Handmade Pressed Flower Resin Earrings
Details: Real dried wildflowers preserved in crystal-clear resin. Hypoallergenic stainless steel hooks. Each pair is unique — no two are alike. Lightweight (under 5g per earring). Available in round (25mm) and teardrop (30mm) shapes. Flowers include daisies, forget-me-nots, and lavender. Made in small batches in my home studio.
Target Audience: Women 25-45 who love nature-inspired jewelry, boho/cottagecore aesthetic, gift buyers
Price: $28.00
Category: Jewelry > Earrings > Dangle Earrings""",
    },

    # 3. Shopify Product Description — Tech Product
    {
        "id": 3,
        "name": "Shopify Product Page — Smart Water Bottle",
        "category": "listing",
        "system_prompt": """You are a DTC (direct-to-consumer) e-commerce copywriter for Shopify stores.

Generate a high-converting Shopify product page. Return ONLY valid JSON with these keys:
- "title": Concise product title for SEO (60-70 chars for Google)
- "meta_description": SEO meta description (150-160 chars)
- "description": Rich HTML product description structured as a mini landing page: hook → benefits → social proof → specs → CTA with risk reversal
- "bullets": 4-6 key feature bullets
- "keywords": Array of SEO keywords

Write for conversion. Use power words, urgency, and social proof.""",
        "user_prompt": """Product: HydroTrack Pro — Smart Water Bottle with LED Temperature Display
Details: 20oz insulated stainless steel bottle. LED touch display shows real-time water temperature. Keeps drinks cold 24hrs/hot 12hrs. Built-in hydration reminder (glows every hour). BPA-free, leak-proof lid. USB-C rechargeable (lasts 30 days per charge). Available in 5 colors.
Target Audience: Fitness enthusiasts, office workers who forget to drink water, tech-savvy health-conscious consumers
Price: $49.99
Category: Health & Fitness > Water Bottles""",
    },

    # 4. Facebook/Instagram Ad Copy
    {
        "id": 4,
        "name": "Facebook Ad Copy — Skincare Product (3 variants)",
        "category": "ad",
        "system_prompt": """You are a Facebook/Instagram Ads specialist with a track record of high-ROAS campaigns.

Generate 3 ad copy variants for A/B testing. Return ONLY valid JSON with key "variants" containing an array of objects, each with:
- "headline": Max 40 chars, benefit-driven
- "primary_text": Hook + benefit + CTA (125 chars optimal, up to 500)
- "description": Max 30 chars, supporting info
- "cta": Call-to-action button text
- "variant_label": "A", "B", or "C"
- "angle": What psychological angle this variant uses

Each variant should test a DIFFERENT angle:
A = Social proof / testimonial-based
B = Problem-solution / pain point
C = Urgency / scarcity""",
        "user_prompt": """Product: GlowSerum — Vitamin C + Hyaluronic Acid Face Serum
Details: 30ml bottle, 20% Vitamin C, plant-based hyaluronic acid, visible results in 14 days. Dermatologist-tested, cruelty-free, vegan. Over 15,000 5-star reviews. Currently 25% off for new customers.
Target Audience: Women 28-45, interested in skincare, anti-aging, clean beauty
Price: $38 (was $52)""",
    },

    # 5. Google Ads Copy
    {
        "id": 5,
        "name": "Google Ads RSA — Online Course",
        "category": "ad",
        "system_prompt": """You are a Google Ads specialist who writes high-CTR responsive search ads.

Generate 3 RSA (Responsive Search Ad) variants. Return ONLY valid JSON with key "variants" containing an array of objects, each with:
- "headline": Exactly 3 headlines, each MAX 30 characters (this is a hard Google limit)
- "primary_text": 2 descriptions, each MAX 90 characters (hard Google limit)
- "description": Brief variant description
- "cta": Implied CTA
- "variant_label": "A", "B", or "C"

CRITICAL: Count characters carefully. Google will REJECT ads that exceed limits.
Each variant should target a different search intent.""",
        "user_prompt": """Product: MasterClass in Data Analytics — Online Course
Details: 12-week self-paced online course. Covers Python, SQL, Tableau, and real-world projects. Certificate on completion. 95% completion rate. Led by ex-Google data lead. Job placement support included. Lifetime access to materials. 30-day money-back guarantee.
Target Audience: Career changers, recent graduates, professionals wanting to upskill
Price: $497 (payment plans available)""",
    },

    # 6. Instagram Social Post
    {
        "id": 6,
        "name": "Instagram Post — Coffee Brand Launch",
        "category": "social",
        "system_prompt": """You are a social media strategist for Instagram who creates viral, engagement-driving content.

Generate an Instagram post. Return ONLY valid JSON with:
- "caption": Hook in first line (before "...more"), storytelling, emotional. Max 2200 chars. Use line breaks for readability.
- "hashtags": Array of 25 hashtags (mix of broad, mid-tier, and niche)
- "cta_text": Engagement CTA
- "post_type_suggestion": What type of visual content to pair with this (carousel, reel, single image)

The hook (first line) is EVERYTHING — it determines if people tap "more".""",
        "user_prompt": """Brand: Rooted Coffee Co.
Product: Single-origin Ethiopian Yirgacheffe coffee beans, small-batch roasted
Details: Direct trade from a women-led cooperative in Gedeo, Ethiopia. Light roast with notes of blueberry, jasmine, and dark chocolate. Freshly roasted and shipped within 48 hours. 12oz bag.
Tone: Warm, storytelling, community-focused
Goal: Drive traffic to website for pre-launch waitlist""",
    },

    # 7. Pinterest Pin Content
    {
        "id": 7,
        "name": "Pinterest Pin — Home Decor Product",
        "category": "social",
        "system_prompt": """You are a Pinterest marketing expert who understands how the platform's algorithm surfaces content.

Generate Pinterest pin content. Return ONLY valid JSON with:
- "caption": Pin description, keyword-rich, 200-500 chars. First sentence most important.
- "hashtags": Array of 3-5 highly relevant hashtags
- "cta_text": Action-oriented CTA
- "board_suggestions": Array of 3 board names this pin should be saved to
- "pin_title": Short, keyword-rich title for the pin (max 100 chars)

Pinterest is a SEARCH engine, not a social network. Optimize accordingly.""",
        "user_prompt": """Product: Handwoven Macrame Wall Hanging — Bohemian Home Decor
Details: 36" x 24" handwoven macrame wall hanging. Made from 100% natural cotton cord. Features intricate geometric diamond pattern. Mounted on a driftwood branch. Each piece takes 15+ hours to create. Works in bedrooms, living rooms, nurseries.
Target Audience: Home decor enthusiasts, boho style lovers, people moving into new apartments
Price: $89""",
    },

    # 8. Lifestyle Image Prompt
    {
        "id": 8,
        "name": "AI Image Prompt — Product Lifestyle Photography",
        "category": "image_prompt",
        "system_prompt": """You are an expert product photographer and AI image prompt engineer.

Generate a detailed, specific image generation prompt for a lifestyle product photo. Return ONLY valid JSON with:
- "main_prompt": The complete image generation prompt (be extremely specific about composition, lighting, setting, mood, camera angle, depth of field)
- "negative_prompt": What to avoid in the image
- "style_notes": Photography style reference
- "suggested_aspect_ratio": Best aspect ratio for this product shot
- "use_case": Where this image would be used (e.g., "Amazon main image", "Instagram post", "Facebook ad")

Think like a creative director briefing a photographer. The more specific, the better the AI image output.""",
        "user_prompt": """Product: Premium Leather Weekender Bag — Travel Duffle
Details: Full-grain vegetable-tanned leather in cognac brown. Brass hardware, cotton canvas lining. Shoe compartment, laptop sleeve, multiple pockets. Fits as carry-on.
Setting: Travel/adventure lifestyle shot
Goal: Hero image for the product page — needs to evoke wanderlust and premium quality""",
    },

    # 9. Competitor Research Analysis
    {
        "id": 9,
        "name": "Competitor Keyword Research — Yoga Mat Market",
        "category": "research",
        "system_prompt": """You are an e-commerce market research analyst with expertise in keyword research and competitive analysis.

Based on your knowledge of the yoga mat market on Amazon, provide a comprehensive analysis. Return ONLY valid JSON with:
- "analysis": Detailed market overview (300-500 words)
- "keywords_found": Array of 20+ relevant keywords with estimated search volume tier (high/medium/low)
- "competitors": Array of top 5 competitors with: name, price_range, strengths, weaknesses, estimated_monthly_revenue_tier
- "content_gaps": Array of opportunities competitors are missing
- "recommendations": Array of 5 specific, actionable recommendations for entering this market

Be data-driven and specific. No generic advice.""",
        "user_prompt": """I'm launching a new yoga mat brand on Amazon. The mat is eco-friendly (natural rubber + cork), 6mm thick, has alignment lines, and costs $65.
I need to understand: Who are the top competitors? What keywords should I target? What are they doing well/poorly? How can I differentiate?
Focus on the US market, $40-$80 price range.""",
    },

    # 10. Multi-Platform Listing (Same Product, 3 Platforms)
    {
        "id": 10,
        "name": "Multi-Platform Listing — Candle Brand (Amazon + Etsy + Shopify)",
        "category": "multi_platform",
        "system_prompt": """You are an e-commerce expert who understands the nuances of selling the SAME product across Amazon, Etsy, and Shopify — each requires different copy, tone, and optimization.

For the given product, generate listings optimized for ALL THREE platforms. Return ONLY valid JSON with:
- "amazon": { "title", "bullets" (5), "description", "keywords" }
- "etsy": { "title", "description", "tags" (13), "keywords" }
- "shopify": { "title", "meta_description", "description", "bullets" }

Each platform version should:
- Amazon: Keyword-dense, algorithm-optimized, professional tone
- Etsy: Story-driven, artisanal feel, long-tail tags
- Shopify: Conversion-focused DTC copy, brand-building, SEO meta

The product is the SAME but the messaging should feel native to each platform.""",
        "user_prompt": """Product: "Golden Hour" Soy Candle — Hand-poured Luxury Scented Candle
Details: 9oz hand-poured soy wax candle in a reusable amber glass jar. Scent: warm vanilla, sandalwood, and amber. Cotton wick for clean burn. 55+ hour burn time. Phthalate-free, paraben-free fragrance oils. Made in Portland, OR.
Target Audience: Women 25-40 who appreciate luxury home goods, self-care, and artisan products
Brand Name: Lumière & Co.
Price: $36""",
    },
]


def run_test(scenario: dict) -> dict:
    """Run a single test scenario against MiniMax M2.7-fast."""
    print(f"\n{'='*60}")
    print(f"Test #{scenario['id']}: {scenario['name']}")
    print(f"{'='*60}")

    start = time.time()
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=4096,
            system=scenario["system_prompt"],
            messages=[{"role": "user", "content": scenario["user_prompt"]}],
        )

        elapsed = round(time.time() - start, 2)
        # MiniMax M2.7-fast returns ThinkingBlock + TextBlock — extract text only
        raw_text = ""
        for block in response.content:
            if hasattr(block, "text"):
                raw_text = block.text
                break
        if not raw_text:
            # Fallback: concatenate all text blocks
            raw_text = " ".join(
                block.text for block in response.content if hasattr(block, "text")
            )
        if not raw_text:
            raise ValueError(f"No text content in response. Block types: {[type(b).__name__ for b in response.content]}")

        # Try to parse JSON
        json_parsed = None
        parse_error = None
        try:
            json_parsed = json.loads(raw_text)
        except json.JSONDecodeError:
            # Try extracting from markdown code block
            import re
            match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', raw_text, re.DOTALL)
            if match:
                try:
                    json_parsed = json.loads(match.group(1))
                except json.JSONDecodeError as e:
                    parse_error = str(e)
            else:
                # Try finding first { to last }
                start_idx = raw_text.find('{')
                end_idx = raw_text.rfind('}')
                if start_idx != -1 and end_idx != -1:
                    try:
                        json_parsed = json.loads(raw_text[start_idx:end_idx + 1])
                    except json.JSONDecodeError as e:
                        parse_error = str(e)
                else:
                    parse_error = "No JSON found in response"

        # Evaluate quality
        evaluation = evaluate_response(scenario, json_parsed, raw_text, parse_error)

        result = {
            "scenario_id": scenario["id"],
            "scenario_name": scenario["name"],
            "category": scenario["category"],
            "success": json_parsed is not None,
            "response_time_seconds": elapsed,
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens,
            "raw_response": raw_text,
            "parsed_json": json_parsed,
            "parse_error": parse_error,
            "evaluation": evaluation,
        }

        status = "PASS" if result["success"] else "FAIL"
        print(f"  Status: {status} | Time: {elapsed}s | Tokens: {response.usage.input_tokens}+{response.usage.output_tokens}")
        if parse_error:
            print(f"  Parse Error: {parse_error}")
        print(f"  Quality: {evaluation['overall_score']}/10 — {evaluation['summary']}")

        return result

    except Exception as e:
        elapsed = round(time.time() - start, 2)
        print(f"  ERROR: {e}")
        return {
            "scenario_id": scenario["id"],
            "scenario_name": scenario["name"],
            "category": scenario["category"],
            "success": False,
            "response_time_seconds": elapsed,
            "error": str(e),
            "evaluation": {"overall_score": 0, "summary": f"API Error: {e}", "details": {}},
        }


def evaluate_response(scenario: dict, parsed: dict | None, raw: str, parse_error: str | None) -> dict:
    """Evaluate the quality of an AI response."""
    if parsed is None:
        return {
            "overall_score": 1,
            "summary": f"Failed to return valid JSON. {parse_error}",
            "details": {"json_valid": False},
        }

    details = {"json_valid": True}
    scores = []
    issues = []

    cat = scenario["category"]

    if cat == "listing":
        # Check required fields
        for field in ["title", "description"]:
            if field in parsed and len(parsed[field]) > 10:
                scores.append(8)
            else:
                scores.append(2)
                issues.append(f"Missing or short '{field}'")

        if "bullets" in parsed and isinstance(parsed["bullets"], list):
            if len(parsed["bullets"]) >= 3:
                scores.append(8)
                # Check bullet quality
                caps_count = sum(1 for b in parsed["bullets"] if b and b[0:5] == b[0:5].upper())
                if caps_count >= 3:
                    scores.append(9)
                    details["bullets_caps_format"] = True
            else:
                scores.append(4)
                issues.append(f"Only {len(parsed['bullets'])} bullets (expected 5)")
        else:
            scores.append(1)
            issues.append("Missing bullets array")

        if "keywords" in parsed and isinstance(parsed["keywords"], list) and len(parsed["keywords"]) >= 3:
            scores.append(8)
        else:
            scores.append(3)
            issues.append("Weak or missing keywords")

        # Title length check
        if "title" in parsed:
            tlen = len(parsed["title"])
            details["title_length"] = tlen
            if 50 <= tlen <= 200:
                scores.append(9)
            elif tlen > 200:
                scores.append(5)
                issues.append(f"Title too long ({tlen} chars)")

    elif cat == "ad":
        if "variants" in parsed and isinstance(parsed["variants"], list):
            num = len(parsed["variants"])
            if num >= 3:
                scores.append(9)
            else:
                scores.append(5)
                issues.append(f"Only {num} variants (expected 3)")

            for v in parsed["variants"]:
                if "headline" in v and "primary_text" in v:
                    scores.append(8)
                    if len(v.get("headline", "")) <= 40:
                        scores.append(9)
                    else:
                        scores.append(5)
                        issues.append(f"Headline too long: {len(v['headline'])} chars")
        else:
            scores.append(1)
            issues.append("Missing variants array")

    elif cat == "social":
        if "caption" in parsed and len(parsed["caption"]) > 50:
            scores.append(8)
        else:
            scores.append(3)
            issues.append("Missing or short caption")

        if "hashtags" in parsed and isinstance(parsed["hashtags"], list):
            hcount = len(parsed["hashtags"])
            if hcount >= 10:
                scores.append(9)
            elif hcount >= 3:
                scores.append(7)
            else:
                scores.append(4)
            details["hashtag_count"] = hcount
        else:
            scores.append(2)
            issues.append("Missing hashtags")

    elif cat == "image_prompt":
        if "main_prompt" in parsed and len(parsed["main_prompt"]) > 100:
            scores.append(9)
            details["prompt_length"] = len(parsed["main_prompt"])
        else:
            scores.append(3)
            issues.append("Image prompt too short or missing")

        if "negative_prompt" in parsed:
            scores.append(8)

    elif cat == "research":
        if "analysis" in parsed and len(parsed["analysis"]) > 200:
            scores.append(8)
        else:
            scores.append(3)
            issues.append("Analysis too short")

        if "keywords_found" in parsed and isinstance(parsed["keywords_found"], list):
            kcount = len(parsed["keywords_found"])
            if kcount >= 15:
                scores.append(9)
            elif kcount >= 5:
                scores.append(6)
            else:
                scores.append(3)
            details["keywords_count"] = kcount

        if "competitors" in parsed and isinstance(parsed["competitors"], list):
            if len(parsed["competitors"]) >= 3:
                scores.append(8)
            else:
                scores.append(5)

        if "recommendations" in parsed and isinstance(parsed["recommendations"], list):
            if len(parsed["recommendations"]) >= 3:
                scores.append(8)
            else:
                scores.append(5)

    elif cat == "multi_platform":
        for platform in ["amazon", "etsy", "shopify"]:
            if platform in parsed and isinstance(parsed[platform], dict):
                p = parsed[platform]
                if "title" in p and len(p["title"]) > 10:
                    scores.append(8)
                else:
                    scores.append(3)
                    issues.append(f"{platform}: missing/short title")

                if "description" in p and len(p["description"]) > 50:
                    scores.append(8)
                else:
                    scores.append(4)
                    issues.append(f"{platform}: missing/short description")
            else:
                scores.append(1)
                issues.append(f"Missing '{platform}' section entirely")

    # Calculate overall
    overall = round(sum(scores) / len(scores), 1) if scores else 0
    details["issues"] = issues

    summary = "Excellent" if overall >= 8 else "Good" if overall >= 6 else "Needs improvement" if overall >= 4 else "Poor"
    if issues:
        summary += f" ({len(issues)} issue{'s' if len(issues) > 1 else ''})"

    return {"overall_score": overall, "summary": summary, "details": details}


def save_results(results: list[dict]):
    """Save all results to a Markdown file for review."""
    lines = []
    lines.append("# ShelfReady — MiniMax M2.7-fast Capability Test Results")
    lines.append(f"\n**Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append(f"**Model:** {MODEL}")
    lines.append(f"**Tests:** {len(results)}")

    # Summary table
    passed = sum(1 for r in results if r["success"])
    avg_score = round(sum(r["evaluation"]["overall_score"] for r in results) / len(results), 1)
    avg_time = round(sum(r["response_time_seconds"] for r in results) / len(results), 2)

    lines.append(f"\n## Summary")
    lines.append(f"- **Pass Rate:** {passed}/{len(results)}")
    lines.append(f"- **Average Quality Score:** {avg_score}/10")
    lines.append(f"- **Average Response Time:** {avg_time}s")
    lines.append("")
    lines.append("| # | Test | Category | Score | Time | Status |")
    lines.append("|---|------|----------|-------|------|--------|")
    for r in results:
        status = "PASS" if r["success"] else "FAIL"
        lines.append(
            f"| {r['scenario_id']} | {r['scenario_name']} | {r['category']} | "
            f"{r['evaluation']['overall_score']}/10 | {r['response_time_seconds']}s | {status} |"
        )

    # Detailed results
    for r in results:
        lines.append(f"\n---\n")
        lines.append(f"## Test #{r['scenario_id']}: {r['scenario_name']}")
        lines.append(f"**Category:** {r['category']}  ")
        lines.append(f"**Status:** {'PASS' if r['success'] else 'FAIL'}  ")
        lines.append(f"**Quality Score:** {r['evaluation']['overall_score']}/10 — {r['evaluation']['summary']}  ")
        lines.append(f"**Response Time:** {r['response_time_seconds']}s  ")

        if "input_tokens" in r:
            lines.append(f"**Tokens:** {r['input_tokens']} input + {r['output_tokens']} output  ")

        if r.get("error"):
            lines.append(f"\n### Error\n```\n{r['error']}\n```")
            continue

        # Evaluation details
        details = r["evaluation"].get("details", {})
        if details.get("issues"):
            lines.append(f"\n### Issues Found")
            for issue in details["issues"]:
                lines.append(f"- {issue}")

        # Parsed JSON output
        if r.get("parsed_json"):
            lines.append(f"\n### Generated Output")
            parsed = r["parsed_json"]

            if r["category"] == "listing":
                lines.append(f"\n**Title:**\n> {parsed.get('title', 'N/A')}")
                lines.append(f"\n**Bullets:**")
                for i, b in enumerate(parsed.get("bullets", []), 1):
                    lines.append(f"{i}. {b}")
                desc = parsed.get("description", "N/A")
                # Truncate long descriptions for readability
                if len(desc) > 1000:
                    desc = desc[:1000] + "... [truncated]"
                lines.append(f"\n**Description:**\n{desc}")
                lines.append(f"\n**Keywords:** {', '.join(parsed.get('keywords', []))}")

            elif r["category"] == "ad":
                for v in parsed.get("variants", []):
                    lines.append(f"\n#### Variant {v.get('variant_label', '?')}")
                    lines.append(f"- **Headline:** {v.get('headline', 'N/A')}")
                    lines.append(f"- **Primary Text:** {v.get('primary_text', 'N/A')}")
                    lines.append(f"- **Description:** {v.get('description', 'N/A')}")
                    lines.append(f"- **CTA:** {v.get('cta', 'N/A')}")
                    if "angle" in v:
                        lines.append(f"- **Angle:** {v['angle']}")

            elif r["category"] == "social":
                lines.append(f"\n**Caption:**\n> {parsed.get('caption', 'N/A')}")
                hashtags = parsed.get("hashtags", [])
                lines.append(f"\n**Hashtags ({len(hashtags)}):** {' '.join(h if h.startswith('#') else '#'+h for h in hashtags)}")
                lines.append(f"\n**CTA:** {parsed.get('cta_text', 'N/A')}")
                if "board_suggestions" in parsed:
                    lines.append(f"**Board Suggestions:** {', '.join(parsed['board_suggestions'])}")
                if "post_type_suggestion" in parsed:
                    lines.append(f"**Post Type:** {parsed['post_type_suggestion']}")

            elif r["category"] == "image_prompt":
                lines.append(f"\n**Image Prompt:**\n> {parsed.get('main_prompt', 'N/A')}")
                lines.append(f"\n**Negative Prompt:** {parsed.get('negative_prompt', 'N/A')}")
                lines.append(f"**Style:** {parsed.get('style_notes', 'N/A')}")
                lines.append(f"**Aspect Ratio:** {parsed.get('suggested_aspect_ratio', 'N/A')}")
                lines.append(f"**Use Case:** {parsed.get('use_case', 'N/A')}")

            elif r["category"] == "research":
                lines.append(f"\n**Market Analysis:**\n{parsed.get('analysis', 'N/A')}")
                kw = parsed.get("keywords_found", [])
                lines.append(f"\n**Keywords ({len(kw)}):**")
                for k in kw[:20]:
                    if isinstance(k, dict):
                        lines.append(f"- {k.get('keyword', k)} (volume: {k.get('volume', k.get('search_volume_tier', '?'))})")
                    else:
                        lines.append(f"- {k}")
                comps = parsed.get("competitors", [])
                lines.append(f"\n**Competitors ({len(comps)}):**")
                for c in comps:
                    if isinstance(c, dict):
                        lines.append(f"- **{c.get('name', '?')}** — {c.get('price_range', '?')} — Strengths: {c.get('strengths', '?')} | Weaknesses: {c.get('weaknesses', '?')}")
                    else:
                        lines.append(f"- {c}")
                recs = parsed.get("recommendations", [])
                lines.append(f"\n**Recommendations ({len(recs)}):**")
                for i, rec in enumerate(recs, 1):
                    if isinstance(rec, dict):
                        lines.append(f"{i}. {rec.get('recommendation', rec.get('title', rec))}")
                    else:
                        lines.append(f"{i}. {rec}")

            elif r["category"] == "multi_platform":
                for platform in ["amazon", "etsy", "shopify"]:
                    p = parsed.get(platform, {})
                    lines.append(f"\n#### {platform.upper()}")
                    lines.append(f"**Title:** {p.get('title', 'N/A')}")
                    if "bullets" in p:
                        lines.append(f"**Bullets:**")
                        for b in p.get("bullets", []):
                            lines.append(f"- {b}")
                    if "tags" in p:
                        lines.append(f"**Tags:** {', '.join(p.get('tags', []))}")
                    desc = p.get("description", "N/A")
                    if len(str(desc)) > 500:
                        desc = str(desc)[:500] + "... [truncated]"
                    lines.append(f"**Description:** {desc}")

        elif r.get("parse_error"):
            lines.append(f"\n### Raw Response (JSON parse failed)")
            raw = r.get("raw_response", "")
            if len(raw) > 2000:
                raw = raw[:2000] + "\n... [truncated]"
            lines.append(f"```\n{raw}\n```")

    # Final verdict
    lines.append(f"\n---\n")
    lines.append(f"## Final Verdict")
    if avg_score >= 7.5:
        lines.append(f"MiniMax M2.7-fast is **production-ready** for ShelfReady. Average quality score of {avg_score}/10 across all test categories.")
    elif avg_score >= 5.5:
        lines.append(f"MiniMax M2.7-fast is **usable with improvements needed**. Average score {avg_score}/10. Some prompt engineering adjustments required.")
    else:
        lines.append(f"MiniMax M2.7-fast **needs significant work** before production use. Average score {avg_score}/10.")

    lines.append(f"\nPass rate: {passed}/{len(results)} tests")
    lines.append(f"Average response time: {avg_time}s")

    content = "\n".join(lines)

    with open(OUTPUT_FILE, "w") as f:
        f.write(content)

    print(f"\nResults saved to: {OUTPUT_FILE}")
    return content


def main():
    if not API_KEY:
        print("ERROR: MINIMAX_API_TOKEN not set. Set it in the environment or .env file.")
        sys.exit(1)

    print(f"ShelfReady — MiniMax M2.7-fast Capability Test")
    print(f"Running {len(SCENARIOS)} e-commerce scenarios...")
    print(f"Model: {MODEL}")
    print(f"Endpoint: {BASE_URL}")

    results = []
    for scenario in SCENARIOS:
        result = run_test(scenario)
        results.append(result)
        # Small delay between requests
        time.sleep(1)

    save_results(results)

    # Print final summary
    passed = sum(1 for r in results if r["success"])
    avg_score = round(sum(r["evaluation"]["overall_score"] for r in results) / len(results), 1)
    print(f"\n{'='*60}")
    print(f"FINAL: {passed}/{len(results)} passed | Avg Score: {avg_score}/10")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
