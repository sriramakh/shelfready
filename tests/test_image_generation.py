"""
ShelfReady — MiniMax Image Generation API Test
Generates actual product images and saves them to disk for review.
"""

import base64
import json
import os
import time

import httpx

API_KEY = os.environ.get("MINIMAX_API_TOKEN", "")
IMAGE_URL = "https://api.minimax.io/v1/image_generation"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "generated_images")
os.makedirs(OUTPUT_DIR, exist_ok=True)

IMAGE_TESTS = [
    {
        "id": 1,
        "name": "Bamboo Cutting Board — Lifestyle Kitchen Shot",
        "prompt": (
            "Professional product photography of a premium bamboo cutting board set "
            "(3 pieces, different sizes) on a marble kitchen countertop. Fresh vegetables "
            "(tomatoes, herbs, bell peppers) artfully arranged on the largest board. "
            "Warm natural morning light streaming from a window on the left. Modern kitchen "
            "background softly blurred. Shot on DSLR, 85mm lens, f/2.8, shallow depth of field. "
            "Clean, appetizing, lifestyle editorial style."
        ),
        "aspect_ratio": "16:9",
    },
    {
        "id": 2,
        "name": "Resin Flower Earrings — Flat Lay",
        "prompt": (
            "Elegant flat lay product photography of handmade pressed flower resin earrings. "
            "Two pairs of earrings (round and teardrop shapes) displayed on a soft linen fabric. "
            "Real dried wildflowers (daisies, lavender) scattered around. Delicate gold jewelry tray. "
            "Soft diffused natural light from above. Minimalist, feminine, boho aesthetic. "
            "Shot from directly above, clean white/cream tones, editorial jewelry photography."
        ),
        "aspect_ratio": "1:1",
    },
    {
        "id": 3,
        "name": "Smart Water Bottle — Studio Product Shot",
        "prompt": (
            "Clean studio product photography of a sleek smart water bottle with LED temperature "
            "display glowing blue. Matte black stainless steel body. The LED display shows '42°F'. "
            "Gradient background transitioning from deep navy to black. Subtle reflection on glossy "
            "surface below. Professional product photography lighting with rim light highlighting "
            "the bottle's curves. Minimalist, tech-forward, premium feel."
        ),
        "aspect_ratio": "4:5",
    },
    {
        "id": 4,
        "name": "Skincare Serum — Instagram Ad Creative",
        "prompt": (
            "Luxurious product photography of a glass dropper serum bottle with golden liquid. "
            "The bottle sits on a bed of fresh orange slices and white flowers. Dewy water droplets "
            "on the glass surface. Warm golden hour lighting creating a glowing, radiant atmosphere. "
            "Soft peach and cream background. Beauty editorial style, high-end skincare aesthetic. "
            "Clean, aspirational, magazine-quality photography."
        ),
        "aspect_ratio": "1:1",
    },
    {
        "id": 5,
        "name": "Leather Weekender Bag — Travel Lifestyle",
        "prompt": (
            "Cinematic lifestyle photography of a cognac brown full-grain leather weekender bag "
            "on a vintage wooden bench at a sunlit train station platform. Morning golden hour light. "
            "A passport and vintage sunglasses placed beside the bag. Blurred train tracks and "
            "platform architecture in the background. Warm color grading, wanderlust mood. "
            "Shot on medium format camera, 50mm lens, f/2.0. Travel editorial style."
        ),
        "aspect_ratio": "16:9",
    },
]


def generate_image(test: dict) -> dict:
    """Call MiniMax image API and save result."""
    print(f"\nTest #{test['id']}: {test['name']}")

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "image-01",
        "prompt": test["prompt"],
        "aspect_ratio": test["aspect_ratio"],
        "response_format": "base64",
    }

    start = time.time()
    try:
        with httpx.Client(timeout=120.0) as client:
            response = client.post(IMAGE_URL, headers=headers, json=payload)

        elapsed = round(time.time() - start, 2)

        if response.status_code != 200:
            print(f"  FAIL — HTTP {response.status_code}: {response.text[:300]}")
            return {
                "id": test["id"],
                "name": test["name"],
                "success": False,
                "error": f"HTTP {response.status_code}: {response.text[:300]}",
                "time": elapsed,
            }

        data = response.json()

        # Extract base64 image data
        b64_data = None
        if isinstance(data, dict):
            if "data" in data and isinstance(data["data"], dict):
                b64_data = data["data"].get("image_base64")
            if b64_data is None and "data" in data and isinstance(data["data"], list):
                for item in data["data"]:
                    if isinstance(item, dict):
                        b64_data = item.get("b64_json") or item.get("image_base64")
                        if b64_data:
                            break
            if b64_data is None:
                b64_data = data.get("image_base64")

        if not b64_data:
            # If it's a list of base64 strings
            if isinstance(data.get("data", {}).get("image_base64"), list):
                b64_data = data["data"]["image_base64"][0]

        if not b64_data:
            print(f"  FAIL — No image data in response. Keys: {list(data.keys()) if isinstance(data, dict) else type(data)}")
            # Log the structure for debugging
            print(f"  Response structure: {json.dumps(data, indent=2)[:500]}")
            return {
                "id": test["id"],
                "name": test["name"],
                "success": False,
                "error": f"No image data found. Response: {json.dumps(data)[:500]}",
                "time": elapsed,
            }

        # Handle if b64_data is a list
        if isinstance(b64_data, list):
            b64_data = b64_data[0]

        # Decode and save
        img_bytes = base64.b64decode(b64_data)
        filename = f"test_{test['id']}_{test['name'].lower().replace(' ', '_').replace('—', '').replace('/', '_')[:50]}.jpg"
        filepath = os.path.join(OUTPUT_DIR, filename)

        with open(filepath, "wb") as f:
            f.write(img_bytes)

        size_kb = round(len(img_bytes) / 1024, 1)
        print(f"  PASS — {size_kb}KB saved to {filename} ({elapsed}s)")

        return {
            "id": test["id"],
            "name": test["name"],
            "success": True,
            "filepath": filepath,
            "filename": filename,
            "size_kb": size_kb,
            "time": elapsed,
        }

    except Exception as e:
        elapsed = round(time.time() - start, 2)
        print(f"  ERROR — {e}")
        return {
            "id": test["id"],
            "name": test["name"],
            "success": False,
            "error": str(e),
            "time": elapsed,
        }


def main():
    if not API_KEY:
        print("ERROR: MINIMAX_API_TOKEN not set")
        return

    print("ShelfReady — MiniMax Image Generation Test")
    print(f"Generating {len(IMAGE_TESTS)} product images...")
    print(f"Output: {OUTPUT_DIR}")

    results = []
    for test in IMAGE_TESTS:
        result = generate_image(test)
        results.append(result)
        time.sleep(2)  # Respect rate limits

    # Summary
    passed = sum(1 for r in results if r["success"])
    print(f"\n{'='*50}")
    print(f"Results: {passed}/{len(results)} images generated")
    if passed > 0:
        print(f"Images saved to: {OUTPUT_DIR}")
    print(f"{'='*50}")

    # Save summary
    summary_path = os.path.join(OUTPUT_DIR, "README.md")
    with open(summary_path, "w") as f:
        f.write("# Generated Test Images\n\n")
        for r in results:
            status = "PASS" if r["success"] else "FAIL"
            f.write(f"## {r['id']}. {r['name']} — {status}\n")
            if r["success"]:
                f.write(f"- File: `{r['filename']}`\n")
                f.write(f"- Size: {r['size_kb']}KB\n")
                f.write(f"- Time: {r['time']}s\n")
            else:
                f.write(f"- Error: {r.get('error', 'Unknown')}\n")
            f.write("\n")


if __name__ == "__main__":
    main()
