"""
Image generation prompt templates.

Constructs detailed, photography-informed prompts that guide image generation
models toward professional e-commerce visuals indistinguishable from real
product photography.
"""

from __future__ import annotations

# ---------------------------------------------------------------------------
# Image-type scene descriptions
# ---------------------------------------------------------------------------

_IMAGE_TYPE_DIRECTIVES: dict[str, str] = {
    "lifestyle": (
        "Lifestyle product photography. Show the product being used or enjoyed "
        "in a realistic, aspirational real-world setting that resonates with the "
        "target buyer. Include one or two people interacting with the product "
        "naturally — never posed or stiff. Environment should feel lived-in yet "
        "curated: a sunlit kitchen counter, a cozy living room, an outdoor "
        "terrace at golden hour. Props should complement the product without "
        "competing for attention. The product must remain the clear focal point "
        "occupying at least 40% of the frame. "
        "Camera angle: eye-level or slightly elevated (15-20 degrees). "
        "Depth of field: shallow (f/2.8-f/4) to separate the product from the "
        "background with beautiful bokeh."
    ),
    "flat_lay": (
        "Top-down flat lay product photography, shot from directly overhead at "
        "90 degrees. The product is placed on a clean, textured surface — "
        "marble, linen, light wood, or matte concrete. Arrange 3-5 small "
        "complementary props around the product in a balanced, editorial layout "
        "(e.g., a sprig of dried eucalyptus, a cup of coffee, a pair of "
        "reading glasses, a small potted plant). Leave breathing room between "
        "items — negative space is essential. Even, diffused overhead lighting "
        "with minimal shadows. The product must be perfectly centered and "
        "occupy roughly 30-40% of the frame. "
        "Camera: mounted on overhead rig, sensor parallel to surface, "
        "f/5.6-f/8 for edge-to-edge sharpness."
    ),
    "in_use": (
        "Action / in-use product photography. Capture a close-up moment of the "
        "product actively being used by a person. Hands and/or the relevant "
        "body part should be visible, providing human context and scale. "
        "Focus tightly on the interaction point — e.g., fingers pressing a "
        "button, hands wrapping a scarf, pouring from a bottle. Convey motion "
        "and utility; freeze the decisive moment. "
        "Camera angle: close-up, slightly off-center for dynamism. "
        "Depth of field: very shallow (f/1.8-f/2.8) with razor-sharp focus on "
        "the product contact point and a smoothly blurred background. "
        "Lighting: natural window light or a single soft-box at 45 degrees to "
        "add dimension."
    ),
    "studio": (
        "Classic studio product photography on a seamless white or light grey "
        "background (infinity curve). The product is the sole subject — no "
        "props, no people. This is the hero shot for the main listing image. "
        "Lighting setup: three-point lighting — key light (large softbox at "
        "45 degrees, camera right), fill light (reflector or secondary softbox "
        "at 45 degrees, camera left, 1 stop lower), and a rim/hair light "
        "from behind to separate the product from the background. "
        "The product casts a subtle, natural shadow to ground it. "
        "Camera: tripod-mounted, 85-105mm equivalent focal length, f/8-f/11 "
        "for maximum product sharpness, shot in RAW. Product fills 60-80% of "
        "the frame. Every texture, stitch, and material must be crisply "
        "rendered."
    ),
}

# ---------------------------------------------------------------------------
# Style modifiers
# ---------------------------------------------------------------------------

_STYLE_MODIFIERS: dict[str, str] = {
    "photorealistic": (
        "Photorealistic professional product photography. Shot on a full-frame "
        "mirrorless camera (Sony A7R V or Canon R5) with a prime lens. "
        "Natural color grading — accurate whites, true-to-life product colors, "
        "no heavy filters. Subtle post-processing: light contrast curve, "
        "gentle clarity boost, precise white balance. Skin tones (if people "
        "are present) must look natural and healthy. The image should be "
        "indistinguishable from a photograph taken by a professional "
        "e-commerce photographer in a real studio or on location."
    ),
    "minimalist": (
        "Minimalist aesthetic. Clean, uncluttered composition with generous "
        "negative space. Muted, desaturated color palette — think whites, "
        "soft greys, pale blush, sage, or warm sand tones. No visual noise. "
        "Typography-friendly layout if text overlay is needed. Inspired by "
        "Scandinavian design principles and premium DTC brand aesthetics "
        "(Aesop, Muji, Everlane). Subtle shadows, soft gradients, calming "
        "and elevated mood."
    ),
    "vibrant": (
        "Bold, vibrant, and energetic visual style. Rich, saturated colors "
        "with high contrast. Dynamic composition — use diagonal lines, "
        "asymmetry, or the rule of thirds aggressively. Lighting is bright "
        "and punchy, with specular highlights adding energy. Mood is "
        "optimistic, youthful, and attention-grabbing — designed to stop the "
        "scroll on social media. Think brand campaigns from Nike, Glossier, "
        "or Apple's colorful product shots."
    ),
}

# ---------------------------------------------------------------------------
# Aspect ratio framing guidance
# ---------------------------------------------------------------------------

_ASPECT_RATIO_GUIDANCE: dict[str, str] = {
    "1:1": "Square 1:1 format — ideal for Instagram feed and most marketplace main images. Center the subject.",
    "4:5": "Portrait 4:5 format — optimized for Instagram feed (takes up more screen real estate). Vertical framing, subject in upper two-thirds.",
    "9:16": "Vertical 9:16 format — for Stories, Reels, TikTok, and Pinterest pins. Full-height framing, product in center-third vertically.",
    "16:9": "Widescreen 16:9 format — for website banners, Facebook cover photos, and YouTube thumbnails. Horizontal framing with product offset to one side using rule of thirds.",
    "3:4": "Portrait 3:4 format — classic portrait framing. Good for Pinterest and product detail pages.",
}

# ---------------------------------------------------------------------------
# Negative prompt (what to avoid)
# ---------------------------------------------------------------------------

_NEGATIVE_PROMPT = (
    "Avoid: distorted or extra fingers, malformed hands, blurry text on "
    "product labels, warped product geometry, unnatural skin textures, "
    "plastic-looking skin, overly airbrushed faces, floating objects, "
    "inconsistent shadows, watermarks, logos, text overlays, split or "
    "duplicated products, unrealistic reflections, chromatic aberration "
    "artifacts, oversharpened halos, deep-fried JPEG compression artifacts, "
    "uncanny valley faces, cross-eyed gaze."
)


def build_image_prompt(
    description: str,
    image_type: str,
    style: str,
    aspect_ratio: str,
) -> str:
    """Construct a comprehensive image-generation prompt.

    Combines the seller's product description with expert photography
    direction, style treatment, framing guidance, and negative-prompt
    guardrails to produce a single prompt string ready for an image
    generation API (DALL-E, Midjourney, Stable Diffusion, Flux, etc.).

    Args:
        description: Free-text description of the product and desired scene
                     from the seller.
        image_type: One of "lifestyle", "flat_lay", "in_use", "studio".
        style: One of "photorealistic", "minimalist", "vibrant".
        aspect_ratio: Aspect ratio string, e.g. "1:1", "4:5", "16:9".

    Returns:
        A fully-formed prompt string.
    """
    type_key = image_type.lower().strip()
    style_key = style.lower().strip()

    scene_directive = _IMAGE_TYPE_DIRECTIVES.get(
        type_key, _IMAGE_TYPE_DIRECTIVES["lifestyle"]
    )
    style_modifier = _STYLE_MODIFIERS.get(
        style_key, _STYLE_MODIFIERS["photorealistic"]
    )
    framing = _ASPECT_RATIO_GUIDANCE.get(
        aspect_ratio, _ASPECT_RATIO_GUIDANCE["1:1"]
    )

    prompt_parts = [
        # What to create
        f"PRODUCT & SCENE: {description.strip()}",
        "",
        # How to compose the shot
        f"SHOT TYPE: {scene_directive}",
        "",
        # Visual style treatment
        f"VISUAL STYLE: {style_modifier}",
        "",
        # Framing / aspect ratio
        f"FRAMING: {framing}",
        "",
        # Universal quality boosters
        (
            "QUALITY: Ultra-high resolution, 8K detail, commercially usable "
            "product photography, magazine-quality, perfectly exposed, color-accurate, "
            "professional retouching. The final image must look like it belongs "
            "on the product's official brand website or an Amazon A+ Content "
            "hero module."
        ),
        "",
        # What to avoid
        f"NEGATIVE: {_NEGATIVE_PROMPT}",
    ]

    return "\n".join(prompt_parts)
