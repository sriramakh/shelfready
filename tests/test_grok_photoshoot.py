"""
Test Grok Imagine for product photoshoot generation.
Input: Pink rolling suitcase → Output: Professional photoshoot scenes.
"""

import base64
import json
import os
import time

import httpx

GROK_API_KEY = os.environ.get("GROK_API_KEY", "")
GROK_URL = "https://api.x.ai/v1/images/edits"
INPUT_IMAGE = os.path.join(os.path.dirname(__file__), "photoshoot_output", "input_image.png")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "photoshoot_output")

PROMPTS = [
    {
        "id": 1,
        "name": "Airport Lifestyle",
        "prompt": (
            "Place this exact suitcase in a bright, modern airport terminal. "
            "The suitcase stands upright on a polished marble floor near a large window "
            "with planes visible outside. Soft natural daylight streaming in. "
            "A boarding pass and passport are casually placed on top. "
            "Professional product photography, editorial travel magazine style, "
            "shallow depth of field, warm tones. The suitcase must look exactly "
            "like the input — same pink color, same handle, same wheels, same proportions."
        ),
    },
    {
        "id": 2,
        "name": "Hotel Room Flat Lay",
        "prompt": (
            "This exact pink suitcase open on a luxury hotel bed with crisp white sheets. "
            "Neatly folded clothes, a sun hat, sunglasses, and a travel book arranged "
            "inside and around it. Top-down flat lay perspective. Soft warm lighting. "
            "Clean, aspirational, Instagram-worthy travel aesthetic. "
            "The suitcase must be identical to the input — same pink color, same design, "
            "same hardware, same shell texture."
        ),
    },
]


def generate(test: dict) -> dict:
    print(f"\nSample #{test['id']}: {test['name']}")
    print(f"  Prompt: {test['prompt'][:100]}...")

    # Load input image as base64
    with open(INPUT_IMAGE, "rb") as f:
        img_b64 = base64.b64encode(f.read()).decode("utf-8")

    payload = {
        "model": "grok-imagine-image",
        "prompt": test["prompt"],
        "image": {
            "url": f"data:image/png;base64,{img_b64}",
            "type": "image_url",
        },
        "n": 1,
        "response_format": "b64_json",
    }

    headers = {
        "Authorization": f"Bearer {GROK_API_KEY}",
        "Content-Type": "application/json",
    }

    start = time.time()
    try:
        resp = httpx.post(GROK_URL, headers=headers, json=payload, timeout=120.0)
        elapsed = round(time.time() - start, 2)

        if resp.status_code != 200:
            print(f"  FAIL — HTTP {resp.status_code}: {resp.text[:300]}")
            return {"id": test["id"], "name": test["name"], "success": False,
                    "error": resp.text[:300], "time": elapsed}

        data = resp.json()

        # Extract base64 image
        b64_data = None
        if "data" in data and isinstance(data["data"], list) and data["data"]:
            b64_data = data["data"][0].get("b64_json")
        if not b64_data:
            # Try URL format
            url = None
            if "data" in data and isinstance(data["data"], list) and data["data"]:
                url = data["data"][0].get("url")
            if url:
                # Download from URL
                img_resp = httpx.get(url, timeout=30.0)
                img_bytes = img_resp.content
            else:
                print(f"  No image in response: {json.dumps(data)[:300]}")
                return {"id": test["id"], "name": test["name"], "success": False,
                        "error": "No image data", "time": elapsed}
        else:
            img_bytes = base64.b64decode(b64_data)

        filename = f"grok_{test['id']}_{test['name'].lower().replace(' ', '_')}.png"
        filepath = os.path.join(OUTPUT_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(img_bytes)

        size_kb = round(len(img_bytes) / 1024, 1)
        print(f"  PASS — {size_kb}KB saved ({elapsed}s)")
        return {"id": test["id"], "name": test["name"], "success": True,
                "filepath": filepath, "size_kb": size_kb, "time": elapsed}

    except Exception as e:
        elapsed = round(time.time() - start, 2)
        print(f"  ERROR — {e}")
        return {"id": test["id"], "name": test["name"], "success": False,
                "error": str(e), "time": elapsed}


def main():
    if not GROK_API_KEY:
        print("ERROR: GROK_API_KEY not set")
        return

    print("Grok Imagine — Product Photoshoot Test")
    print(f"Input: {INPUT_IMAGE}")
    print(f"Model: grok-imagine-image")

    results = []
    for test in PROMPTS:
        result = generate(test)
        results.append(result)
        time.sleep(2)

    passed = sum(1 for r in results if r["success"])
    print(f"\n{'='*50}")
    print(f"Results: {passed}/{len(results)}")
    print(f"{'='*50}")

    # Print prompts used
    print("\n--- Prompts Used ---")
    for p in PROMPTS:
        print(f"\nSample #{p['id']} ({p['name']}):")
        print(p["prompt"])


if __name__ == "__main__":
    main()
