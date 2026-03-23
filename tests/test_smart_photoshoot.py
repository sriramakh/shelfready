"""
Smart Product Photoshoot Pipeline
1. Grok 4 analyzes product → decides model gender + scene suggestions
2. Grok Imagine generates 4 images: 1 with model + 3 product-only
"""

import base64
import json
import os
import re
import time

import httpx

GROK_API_KEY = os.environ.get("GROK_API_KEY", "")
CHAT_URL = "https://api.x.ai/v1/chat/completions"
IMAGE_URL = "https://api.x.ai/v1/images/edits"
INPUT_IMAGE = os.path.join(os.path.dirname(__file__), "photoshoot_output", "input_image.png")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "photoshoot_output", "smart_shoot")
os.makedirs(OUTPUT_DIR, exist_ok=True)

HEADERS = {"Authorization": f"Bearer {GROK_API_KEY}", "Content-Type": "application/json"}


def analyze_product(img_b64: str) -> dict:
    """Use Grok 4 vision to analyze product and decide photoshoot strategy."""
    print("Step 1: Analyzing product with Grok 4 vision...")

    resp = httpx.post(
        CHAT_URL,
        headers=HEADERS,
        json={
            "model": "grok-4-1-fast-non-reasoning",
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_b64}"}},
                    {"type": "text", "text": """Analyze this product image for a professional e-commerce photoshoot. Return ONLY valid JSON:
{
  "product_name": "specific product name",
  "product_category": "category (luggage, clothing, electronics, jewelry, footwear, bags, home decor, etc)",
  "color": "primary color",
  "key_features": "2-3 notable visual features",
  "model_gender": "male or female",
  "model_gender_reasoning": "one sentence explaining why — base this on the product's primary target demographic, color palette, and typical buyer profile",
  "photoshoot_prompts": {
    "model_shot": "Detailed prompt for a photo featuring a [male/female] model naturally using/wearing/carrying this exact product. Describe the model's outfit, pose, setting, lighting, and mood. The product must be clearly visible and recognizable.",
    "scene_1": "Detailed prompt placing this exact product in a setting that matches its use case. Describe background, props, lighting, angle. No humans.",
    "scene_2": "Detailed prompt for a clean studio/e-commerce hero shot of this exact product. Describe angle, backdrop color, lighting setup. No humans.",
    "scene_3": "Detailed prompt placing this exact product in an aspirational lifestyle scene. Describe the environment, time of day, mood, color grading. No humans."
  }
}

IMPORTANT: In every prompt, emphasize preserving the EXACT product appearance — same color, shape, texture, hardware, proportions. The product must be immediately recognizable as the same item."""},
                ],
            }],
            "temperature": 0.3,
        },
        timeout=60.0,
    )

    raw = resp.json()["choices"][0]["message"]["content"]

    # Parse JSON
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', raw, re.DOTALL)
        if match:
            return json.loads(match.group(1))
        start = raw.find('{')
        end = raw.rfind('}')
        return json.loads(raw[start:end + 1])


def generate_image(img_b64: str, prompt: str, name: str) -> dict:
    """Generate one photoshoot image with Grok Imagine."""
    payload = {
        "model": "grok-imagine-image",
        "prompt": prompt,
        "image": {"url": f"data:image/png;base64,{img_b64}", "type": "image_url"},
        "n": 1,
        "response_format": "b64_json",
    }

    start = time.time()
    resp = httpx.post(IMAGE_URL, headers=HEADERS, json=payload, timeout=120.0)
    elapsed = round(time.time() - start, 2)

    if resp.status_code != 200:
        return {"name": name, "success": False, "error": resp.text[:200], "time": elapsed}

    data = resp.json()
    b64 = data["data"][0]["b64_json"]
    img_bytes = base64.b64decode(b64)

    filepath = os.path.join(OUTPUT_DIR, f"{name}.png")
    with open(filepath, "wb") as f:
        f.write(img_bytes)

    return {"name": name, "success": True, "size_kb": round(len(img_bytes) / 1024, 1),
            "time": elapsed, "filepath": filepath}


def main():
    if not GROK_API_KEY:
        print("ERROR: GROK_API_KEY not set")
        return

    # Load input image
    with open(INPUT_IMAGE, "rb") as f:
        img_b64 = base64.b64encode(f.read()).decode()

    # Step 1: Analyze
    analysis = analyze_product(img_b64)

    print(f"\n  Product: {analysis['product_name']}")
    print(f"  Category: {analysis['product_category']}")
    print(f"  Color: {analysis['color']}")
    print(f"  Model: {analysis['model_gender']} — {analysis['model_gender_reasoning']}")

    # Save analysis
    with open(os.path.join(OUTPUT_DIR, "analysis.json"), "w") as f:
        json.dump(analysis, f, indent=2)

    # Step 2: Generate 4 images
    prompts = analysis["photoshoot_prompts"]
    shots = [
        ("1_model_shot", prompts["model_shot"]),
        ("2_scene_lifestyle", prompts["scene_1"]),
        ("3_studio_hero", prompts["scene_2"]),
        ("4_aspirational", prompts["scene_3"]),
    ]

    print(f"\nStep 2: Generating {len(shots)} photoshoot images...\n")

    results = []
    for name, prompt in shots:
        print(f"  {name}:")
        print(f"    Prompt: {prompt[:100]}...")
        result = generate_image(img_b64, prompt, name)
        if result["success"]:
            print(f"    PASS — {result['size_kb']}KB ({result['time']}s)")
        else:
            print(f"    FAIL — {result.get('error', 'Unknown')}")
        results.append(result)
        time.sleep(1)

    passed = sum(1 for r in results if r["success"])
    print(f"\n{'='*50}")
    print(f"Results: {passed}/{len(results)} images generated")
    print(f"Model gender chosen: {analysis['model_gender']}")
    print(f"Output: {OUTPUT_DIR}")
    print(f"{'='*50}")

    # Print all prompts for reference
    print("\n--- Prompts Used (AI-generated based on product analysis) ---")
    for name, prompt in shots:
        print(f"\n{name}:")
        print(f"  {prompt}")


if __name__ == "__main__":
    main()
