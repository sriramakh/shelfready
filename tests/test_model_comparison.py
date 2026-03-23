"""
ShelfReady — Model Comparison Test
Compare MiniMax M2.7-fast vs GPT-4o-mini vs Grok 4-1-fast-reasoning
across all 5 text features with 4 different product queries each.
"""

import json
import os
import re
import time
from datetime import datetime

import anthropic
import httpx

# ── API Keys ──────────────────────────────────────────────────────────
MINIMAX_KEY = os.environ.get("MINIMAX_API_KEY", "")
OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "")
GROK_KEY = os.environ.get("GROK_API_KEY", "")

OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "model_comparison_report.md")

# ── Clients ───────────────────────────────────────────────────────────
minimax_client = anthropic.Anthropic(api_key=MINIMAX_KEY, base_url="https://api.minimax.io/anthropic")

# ── Helpers ───────────────────────────────────────────────────────────
def extract_text_anthropic(response) -> str:
    for block in response.content:
        if hasattr(block, "text") and block.text:
            return block.text
    return ""

def parse_json(text: str) -> dict:
    try: return json.loads(text)
    except: pass
    m = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', text, re.DOTALL)
    if m:
        try: return json.loads(m.group(1))
        except: pass
    s, e = text.find('{'), text.rfind('}')
    if s != -1 and e != -1:
        try: return json.loads(text[s:e+1])
        except: pass
    return {}

def call_minimax(system: str, user: str) -> tuple[str, float, int, int]:
    start = time.time()
    resp = minimax_client.messages.create(
        model="MiniMax-M2.7-fast", max_tokens=4096,
        system=system, messages=[{"role": "user", "content": user}]
    )
    elapsed = round(time.time() - start, 2)
    text = extract_text_anthropic(resp)
    return text, elapsed, resp.usage.input_tokens, resp.usage.output_tokens

def call_openai(system: str, user: str) -> tuple[str, float, int, int]:
    start = time.time()
    resp = httpx.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {OPENAI_KEY}", "Content-Type": "application/json"},
        json={"model": "gpt-4o-mini", "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ], "max_tokens": 4096, "temperature": 0.7},
        timeout=120.0,
    )
    elapsed = round(time.time() - start, 2)
    data = resp.json()
    text = data["choices"][0]["message"]["content"]
    usage = data.get("usage", {})
    return text, elapsed, usage.get("prompt_tokens", 0), usage.get("completion_tokens", 0)

def call_grok(system: str, user: str) -> tuple[str, float, int, int]:
    start = time.time()
    resp = httpx.post(
        "https://api.x.ai/v1/chat/completions",
        headers={"Authorization": f"Bearer {GROK_KEY}", "Content-Type": "application/json"},
        json={"model": "grok-4-1-fast-reasoning", "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ], "max_tokens": 4096, "temperature": 0.7},
        timeout=120.0,
    )
    elapsed = round(time.time() - start, 2)
    data = resp.json()
    text = data["choices"][0]["message"]["content"]
    usage = data.get("usage", {})
    return text, elapsed, usage.get("prompt_tokens", 0), usage.get("completion_tokens", 0)

# ── Cost Calculation ──────────────────────────────────────────────────
# MiniMax: $80/month plan, ~72K requests/day. Per text request ≈ $0.005
# GPT-4o-mini: $0.15/1M input, $0.60/1M output
# Grok 4-1-fast-reasoning: $2/1M input, $8/1M output (reasoning model)

def cost_minimax(inp, out): return 0.005  # flat per-request from plan
def cost_openai(inp, out): return (inp * 0.15 + out * 0.60) / 1_000_000
def cost_grok(inp, out): return (inp * 2.0 + out * 8.0) / 1_000_000

# ── Test Queries (4 products across 5 features) ──────────────────────

PRODUCTS = [
    {
        "name": "Wireless Earbuds",
        "details": "Bluetooth 5.3, ANC, 30hr battery, IPX5 waterproof, touch controls, USB-C charging case. $49.99. Target: commuters, gym-goers, remote workers.",
    },
    {
        "name": "Organic Dog Treats",
        "details": "Grain-free, single ingredient (sweet potato), made in USA, 8oz bag. $12.99. Target: health-conscious pet owners, dogs with allergies.",
    },
    {
        "name": "Yoga Mat",
        "details": "6mm thick, natural rubber + cork surface, alignment lines, eco-friendly, non-slip. $65. Target: yoga practitioners, fitness enthusiasts.",
    },
    {
        "name": "Scented Candle Set",
        "details": "3-pack soy candles (lavender, vanilla, eucalyptus), 25hr burn each, cotton wick, glass jars. $28.99. Target: home decor, gift buyers, self-care.",
    },
]

FEATURES = [
    {
        "id": "listing",
        "name": "Listing Optimizer",
        "system": 'You are an expert Amazon listing copywriter. Return ONLY valid JSON: {"title": "max 200 chars, keyword-rich", "bullets": ["5 bullet points, each starting with CAPS benefit word"], "description": "HTML formatted product description", "keywords": ["backend search terms"]}',
        "user_template": "Generate an optimized Amazon listing for: {name}. Details: {details}",
        "eval_keys": ["title", "bullets", "description", "keywords"],
    },
    {
        "id": "social",
        "name": "Social Content",
        "system": 'You are an Instagram marketing expert. Return ONLY valid JSON: {"caption": "engaging caption with hook in first line", "hashtags": ["20-25 relevant hashtags"], "cta_text": "call to action"}',
        "user_template": "Create an Instagram post for: {name}. Details: {details}",
        "eval_keys": ["caption", "hashtags", "cta_text"],
    },
    {
        "id": "ads",
        "name": "Ad Copy",
        "system": 'You are a Facebook Ads specialist. Generate 3 A/B test variants. Return ONLY valid JSON: {"variants": [{"headline": "max 40 chars", "primary_text": "compelling ad copy", "description": "max 30 chars", "cta": "button text", "variant_label": "A/B/C", "angle": "what angle"}]}',
        "user_template": "Create Facebook ad copy for: {name}. Details: {details}",
        "eval_keys": ["variants"],
    },
    {
        "id": "research",
        "name": "Market Insights",
        "system": 'You are an e-commerce market analyst. Return ONLY valid JSON: {"analysis": "300+ word market overview with data", "keywords_found": ["15+ relevant keywords"], "competitors": [{"name": "", "price_range": "", "strengths": "", "weaknesses": ""}]}',
        "user_template": "Analyze the competitive landscape for: {name} on Amazon. Details: {details}",
        "eval_keys": ["analysis", "keywords_found", "competitors"],
    },
    {
        "id": "multi",
        "name": "Multi-Platform",
        "system": 'You are an e-commerce expert. Generate listings for Amazon, Etsy, and Shopify. Return ONLY valid JSON: {"amazon": {"title": "", "bullets": []}, "etsy": {"title": "", "tags": [], "description": ""}, "shopify": {"title": "", "meta_description": "", "description": ""}}',
        "user_template": "Create platform-optimized listings for: {name}. Details: {details}",
        "eval_keys": ["amazon", "etsy", "shopify"],
    },
]

MODELS = [
    {"id": "minimax", "name": "MiniMax M2.7-fast", "call": call_minimax, "cost_fn": cost_minimax},
    {"id": "gpt4omini", "name": "GPT-4o-mini", "call": call_openai, "cost_fn": cost_openai},
    {"id": "grok", "name": "Grok 4-1-fast-reasoning", "call": call_grok, "cost_fn": cost_grok},
]

# ── Evaluation ────────────────────────────────────────────────────────
def evaluate(feature: dict, parsed: dict, raw: str) -> dict:
    """Score output quality on multiple dimensions."""
    scores = {}

    # JSON validity
    scores["json_valid"] = 10 if parsed else 0

    if not parsed:
        return {**scores, "overall": 0, "notes": "Failed to return valid JSON"}

    notes = []

    # Completeness: are all expected keys present and non-empty?
    missing = []
    for key in feature["eval_keys"]:
        val = parsed.get(key)
        if val is None or val == "" or val == []:
            missing.append(key)
    scores["completeness"] = max(0, 10 - len(missing) * 3)
    if missing:
        notes.append(f"Missing: {', '.join(missing)}")

    # Content quality heuristics per feature
    fid = feature["id"]

    if fid == "listing":
        title = parsed.get("title", "")
        bullets = parsed.get("bullets", [])
        keywords = parsed.get("keywords", [])

        # Title quality
        scores["title_quality"] = min(10, max(3, len(title) // 20))
        if len(title) > 200: notes.append(f"Title too long: {len(title)} chars")

        # Bullet quality
        caps_bullets = sum(1 for b in bullets if b and b[:5] == b[:5].upper())
        scores["bullet_format"] = min(10, caps_bullets * 2) if bullets else 0
        scores["bullet_count"] = 10 if len(bullets) == 5 else max(0, 10 - abs(5 - len(bullets)) * 2)

        # Keyword count
        scores["keyword_depth"] = min(10, len(keywords))

    elif fid == "social":
        caption = parsed.get("caption", "")
        hashtags = parsed.get("hashtags", [])

        scores["caption_quality"] = min(10, len(caption) // 40)
        scores["hashtag_count"] = min(10, len(hashtags) // 2)
        # Check first line hook
        first_line = caption.split("\n")[0] if caption else ""
        scores["hook_strength"] = 8 if len(first_line) > 20 and len(first_line) < 150 else 5

    elif fid == "ads":
        variants = parsed.get("variants", [])
        scores["variant_count"] = 10 if len(variants) >= 3 else len(variants) * 3

        if variants:
            # Check headline lengths
            over_limit = sum(1 for v in variants if len(v.get("headline", "")) > 40)
            scores["headline_compliance"] = 10 - over_limit * 3

            # Check angle diversity
            angles = [v.get("angle", "") for v in variants]
            unique_angles = len(set(a.lower()[:20] for a in angles if a))
            scores["angle_diversity"] = min(10, unique_angles * 3)

    elif fid == "research":
        analysis = parsed.get("analysis", "")
        keywords = parsed.get("keywords_found", [])
        competitors = parsed.get("competitors", [])

        scores["analysis_depth"] = min(10, len(analysis) // 80)
        scores["keyword_count"] = min(10, len(keywords) // 2)
        scores["competitor_count"] = min(10, len(competitors) * 2)

        # Check if analysis has specific data points (numbers, percentages)
        data_points = len(re.findall(r'\$[\d,]+|\d+%|\d+\.\d+', analysis))
        scores["data_specificity"] = min(10, data_points * 2)

    elif fid == "multi":
        platforms_present = sum(1 for p in ["amazon", "etsy", "shopify"] if p in parsed)
        scores["platform_coverage"] = platforms_present * 3 + 1

        # Check platform differentiation
        titles = [str(parsed.get(p, {}).get("title", "")) for p in ["amazon", "etsy", "shopify"]]
        if len(set(titles)) == 3 and all(titles):
            scores["differentiation"] = 9
        elif len(set(titles)) >= 2:
            scores["differentiation"] = 6
        else:
            scores["differentiation"] = 3

    overall = round(sum(scores.values()) / len(scores), 1)
    return {**scores, "overall": overall, "notes": "; ".join(notes) if notes else "Clean"}


# ── Main ──────────────────────────────────────────────────────────────
def main():
    print("ShelfReady — Model Comparison Test")
    print(f"Models: {', '.join(m['name'] for m in MODELS)}")
    print(f"Features: {len(FEATURES)} x {len(PRODUCTS)} products = {len(FEATURES) * len(PRODUCTS)} queries per model")
    print(f"Total API calls: {len(FEATURES) * len(PRODUCTS) * len(MODELS)}")
    print()

    all_results = []  # [{model, feature, product, score, time, cost, tokens_in, tokens_out, parsed}]

    for feature in FEATURES:
        print(f"\n{'='*60}")
        print(f"Feature: {feature['name']}")
        print(f"{'='*60}")

        for product in PRODUCTS:
            user_msg = feature["user_template"].format(**product)

            for model in MODELS:
                label = f"  {model['name']:<28s} | {product['name']:<20s}"
                try:
                    raw, elapsed, tok_in, tok_out = model["call"](feature["system"], user_msg)
                    parsed = parse_json(raw)
                    evaluation = evaluate(feature, parsed, raw)
                    cost = model["cost_fn"](tok_in, tok_out)

                    result = {
                        "model": model["name"],
                        "model_id": model["id"],
                        "feature": feature["name"],
                        "feature_id": feature["id"],
                        "product": product["name"],
                        "score": evaluation["overall"],
                        "time": elapsed,
                        "cost": cost,
                        "tokens_in": tok_in,
                        "tokens_out": tok_out,
                        "notes": evaluation.get("notes", ""),
                        "scores_detail": {k: v for k, v in evaluation.items() if k not in ("overall", "notes")},
                        "raw_length": len(raw),
                        "json_valid": bool(parsed),
                    }
                    all_results.append(result)

                    status = "OK" if parsed else "JSON FAIL"
                    print(f"{label} | {evaluation['overall']:>5.1f}/10 | {elapsed:>6.1f}s | ${cost:.4f} | {status}")

                except Exception as e:
                    all_results.append({
                        "model": model["name"], "model_id": model["id"],
                        "feature": feature["name"], "feature_id": feature["id"],
                        "product": product["name"],
                        "score": 0, "time": 0, "cost": 0,
                        "tokens_in": 0, "tokens_out": 0,
                        "notes": str(e)[:100], "scores_detail": {},
                        "raw_length": 0, "json_valid": False,
                    })
                    print(f"{label} | ERROR: {str(e)[:60]}")

                time.sleep(0.5)

    # ── Generate Report ───────────────────────────────────────────────
    save_report(all_results)


def save_report(results: list[dict]):
    lines = []
    lines.append("# ShelfReady — Model Comparison Report")
    lines.append(f"\n**Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append("**Models tested:** MiniMax M2.7-fast, GPT-4o-mini, Grok 4-1-fast-reasoning")
    lines.append(f"**Total queries:** {len(results)}")

    # ── Overall Summary ───────────────────────────────────────────────
    lines.append("\n## Overall Summary\n")
    lines.append("| Model | Avg Score | Avg Time | Avg Cost/Query | JSON Success | Total Cost (20 queries) |")
    lines.append("|---|---|---|---|---|---|")

    for model_id in ["minimax", "gpt4omini", "grok"]:
        mr = [r for r in results if r["model_id"] == model_id]
        if not mr: continue
        avg_score = round(sum(r["score"] for r in mr) / len(mr), 1)
        avg_time = round(sum(r["time"] for r in mr) / len(mr), 1)
        avg_cost = sum(r["cost"] for r in mr) / len(mr)
        total_cost = sum(r["cost"] for r in mr)
        json_ok = sum(1 for r in mr if r["json_valid"])
        lines.append(
            f"| **{mr[0]['model']}** | **{avg_score}/10** | {avg_time}s | "
            f"${avg_cost:.4f} | {json_ok}/{len(mr)} | ${total_cost:.4f} |"
        )

    # ── Per Feature Breakdown ─────────────────────────────────────────
    lines.append("\n## Per Feature Breakdown\n")

    for feature_id, feature_name in [("listing", "Listing Optimizer"), ("social", "Social Content"),
                                       ("ads", "Ad Copy"), ("research", "Market Insights"),
                                       ("multi", "Multi-Platform")]:
        lines.append(f"\n### {feature_name}\n")
        lines.append("| Model | Avg Score | Avg Time | Avg Cost | Notes |")
        lines.append("|---|---|---|---|---|")

        for model_id in ["minimax", "gpt4omini", "grok"]:
            mr = [r for r in results if r["model_id"] == model_id and r["feature_id"] == feature_id]
            if not mr: continue
            avg_score = round(sum(r["score"] for r in mr) / len(mr), 1)
            avg_time = round(sum(r["time"] for r in mr) / len(mr), 1)
            avg_cost = sum(r["cost"] for r in mr) / len(mr)
            common_notes = "; ".join(set(r["notes"] for r in mr if r["notes"] and r["notes"] != "Clean"))[:100]
            lines.append(
                f"| {mr[0]['model']} | **{avg_score}/10** | {avg_time}s | ${avg_cost:.4f} | {common_notes or 'Clean'} |"
            )

    # ── Per Product x Model Matrix ────────────────────────────────────
    lines.append("\n## Detailed Scores (Product x Model)\n")
    lines.append("| Feature | Product | MiniMax | GPT-4o-mini | Grok 4-1 |")
    lines.append("|---|---|---|---|---|")

    for feature in FEATURES:
        for product in PRODUCTS:
            row = f"| {feature['name']} | {product['name']} "
            for model_id in ["minimax", "gpt4omini", "grok"]:
                mr = [r for r in results if r["model_id"] == model_id
                      and r["feature_id"] == feature["id"] and r["product"] == product["name"]]
                if mr:
                    row += f"| {mr[0]['score']}/10 ({mr[0]['time']}s) "
                else:
                    row += "| N/A "
            row += "|"
            lines.append(row)

    # ── Cost Projection ───────────────────────────────────────────────
    lines.append("\n## Monthly Cost Projection (per 1,000 users)\n")
    lines.append("Assuming average user does 20 text queries/month:\n")
    lines.append("| Model | Cost per Query | Cost per User/Month | 1,000 Users/Month |")
    lines.append("|---|---|---|---|")

    for model_id in ["minimax", "gpt4omini", "grok"]:
        mr = [r for r in results if r["model_id"] == model_id]
        if not mr: continue
        avg_cost = sum(r["cost"] for r in mr) / len(mr)
        per_user = avg_cost * 20
        per_1k = per_user * 1000
        lines.append(f"| {mr[0]['model']} | ${avg_cost:.4f} | ${per_user:.2f} | ${per_1k:.0f} |")

    # ── Recommendation ────────────────────────────────────────────────
    lines.append("\n## Recommendation\n")

    model_scores = {}
    for model_id in ["minimax", "gpt4omini", "grok"]:
        mr = [r for r in results if r["model_id"] == model_id]
        if mr:
            model_scores[model_id] = {
                "name": mr[0]["model"],
                "avg_score": round(sum(r["score"] for r in mr) / len(mr), 1),
                "avg_time": round(sum(r["time"] for r in mr) / len(mr), 1),
                "total_cost": sum(r["cost"] for r in mr),
                "avg_cost": sum(r["cost"] for r in mr) / len(mr),
            }

    best_quality = max(model_scores.values(), key=lambda x: x["avg_score"])
    cheapest = min(model_scores.values(), key=lambda x: x["avg_cost"])
    fastest = min(model_scores.values(), key=lambda x: x["avg_time"])

    lines.append(f"- **Best quality:** {best_quality['name']} ({best_quality['avg_score']}/10)")
    lines.append(f"- **Cheapest:** {cheapest['name']} (${cheapest['avg_cost']:.4f}/query)")
    lines.append(f"- **Fastest:** {fastest['name']} ({fastest['avg_time']}s avg)")

    content = "\n".join(lines)
    with open(OUTPUT_FILE, "w") as f:
        f.write(content)
    print(f"\nReport saved to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
