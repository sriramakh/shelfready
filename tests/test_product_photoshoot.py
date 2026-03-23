"""
Test MiniMax subject_reference for product photoshoot generation.
Upload a product image → Get professional photoshoot-style output.
"""

import base64
import json
import os
import time

import httpx

API_KEY = os.environ.get("MINIMAX_API_TOKEN", "")
IMAGE_URL = "https://api.minimax.io/v1/image_generation"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "photoshoot_output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Test with a public product image (leather travel bag)
PRODUCT_IMAGE_URL = "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800"

PHOTOSHOOT_TESTS = [
    {
        "id": 1,
        "name": "Lifestyle Travel Shot",
        "type": "character",  # Testing if 'character' type works for products
        "prompt": (
            "Professional product photography of this leather travel bag in a luxury hotel lobby. "
            "The bag sits on a marble floor near a check-in desk. Warm ambient lighting. "
            "Travel accessories nearby — passport, sunglasses. Editorial style, 85mm lens, f/2.8."
        ),
        "aspect_ratio": "16:9",
    },
    {
        "id": 2,
        "name": "Studio White Background",
        "type": "character",
        "prompt": (
            "Clean studio product photography of this leather bag on pure white background. "
            "Professional lighting setup with soft fill light. The bag is centered, slightly angled. "
            "E-commerce product photo style, crisp details, no shadows. Perfect for Amazon listing."
        ),
        "aspect_ratio": "1:1",
    },
    {
        "id": 3,
        "name": "Outdoor Adventure Scene",
        "type": "character",
        "prompt": (
            "This leather travel bag on a wooden dock at a mountain lake during golden hour. "
            "Misty mountains in the background. Adventure travel mood. "
            "Cinematic photography, warm color grading, shallow depth of field."
        ),
        "aspect_ratio": "16:9",
    },
]


def test_photoshoot(test: dict) -> dict:
    """Test subject_reference with a product image."""
    print(f"\nTest #{test['id']}: {test['name']}")
    print(f"  Reference type: {test['type']}")

    payload = {
        "model": "image-01",
        "prompt": test["prompt"],
        "aspect_ratio": test["aspect_ratio"],
        "response_format": "base64",
        "subject_reference": [
            {
                "type": test["type"],
                "image_file": PRODUCT_IMAGE_URL,
            }
        ],
    }

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    start = time.time()
    try:
        with httpx.Client(timeout=120.0) as client:
            resp = client.post(IMAGE_URL, headers=headers, json=payload)

        elapsed = round(time.time() - start, 2)

        if resp.status_code != 200:
            error_text = resp.text[:500]
            print(f"  FAIL — HTTP {resp.status_code}: {error_text}")

            # If 'character' type fails, try without type or with 'object'
            if "type" in error_text.lower() or resp.status_code == 400:
                print(f"  Retrying with type='object'...")
                payload["subject_reference"][0]["type"] = "object"
                resp = httpx.Client(timeout=120.0).post(IMAGE_URL, headers=headers, json=payload)
                if resp.status_code != 200:
                    print(f"  Still failing: {resp.text[:300]}")
                    return {"id": test["id"], "name": test["name"], "success": False,
                            "error": resp.text[:300], "time": elapsed}

        data = resp.json()

        # Check for errors in response body
        base_resp = data.get("base_resp", {})
        if base_resp.get("status_code", 0) != 0:
            print(f"  API Error: {base_resp.get('status_msg', 'Unknown')}")
            return {"id": test["id"], "name": test["name"], "success": False,
                    "error": base_resp.get("status_msg", "Unknown"), "time": elapsed}

        # Extract image
        img_data = data.get("data", {}).get("image_base64", [])
        if isinstance(img_data, list) and img_data:
            b64 = img_data[0]
        elif isinstance(img_data, str):
            b64 = img_data
        else:
            print(f"  No image data. Response keys: {list(data.keys())}")
            print(f"  Full response: {json.dumps(data, indent=2)[:500]}")
            return {"id": test["id"], "name": test["name"], "success": False,
                    "error": "No image data", "time": elapsed}

        img_bytes = base64.b64decode(b64)
        filename = f"photoshoot_{test['id']}_{test['name'].lower().replace(' ', '_')}.jpg"
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
    if not API_KEY:
        print("ERROR: MINIMAX_API_TOKEN not set")
        return

    print("ShelfReady — Product Photoshoot Test")
    print(f"Reference image: {PRODUCT_IMAGE_URL}")
    print(f"Running {len(PHOTOSHOOT_TESTS)} photoshoot scenarios...\n")

    results = []
    for test in PHOTOSHOOT_TESTS:
        result = test_photoshoot(test)
        results.append(result)
        time.sleep(2)

    passed = sum(1 for r in results if r["success"])
    print(f"\n{'='*50}")
    print(f"Results: {passed}/{len(results)} photoshoots generated")
    if passed > 0:
        print(f"Output: {OUTPUT_DIR}")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
