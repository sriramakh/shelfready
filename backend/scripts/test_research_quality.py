"""Quality test for research_service. Mirrors the production pipeline
(main + review buckets, pricing retry) on 3 products and prints the
outputs so we can grade production readiness. Skips DB persistence."""

import asyncio
import json
import sys
import time
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.models.enums import Platform
from app.services.research_service import (
    _build_search_queries,
    _build_review_queries,
    _build_extraction_prompt,
    _build_review_prompt,
    _build_pricing_prompt,
    _build_strategy_prompt,
    _parse_json,
    _EXTRACTION_PROMPT,
    _REVIEW_EXTRACTION_PROMPT,
    _PRICING_RETRY_PROMPT,
    _STRATEGY_PROMPT,
)
from app.services.search_provider import web_search
from app.services.grok_text import generate_text


PRODUCTS = [
    ("bamboo cutting board", Platform.AMAZON),
    ("handmade leather wallet", Platform.ETSY),
    ("wireless earbuds", Platform.AMAZON),
]


async def run_one(query: str, platform: Platform) -> dict:
    t0 = time.time()
    main_qs = _build_search_queries(query, platform)
    review_qs = _build_review_queries(query, platform)

    async def _search(q: str):
        try:
            return await web_search(q, max_results=10)
        except Exception:
            return []

    main_batches, review_batches = await asyncio.gather(
        asyncio.gather(*[_search(q) for q in main_qs]),
        asyncio.gather(*[_search(q) for q in review_qs]),
    )

    def _dedupe(batches):
        seen, out = set(), []
        for batch in batches:
            for r in batch:
                u = r.get("url", "")
                if u and u not in seen:
                    seen.add(u); out.append(r)
        return out

    main_results = _dedupe(main_batches)
    review_results = _dedupe(review_batches)
    t_search = time.time() - t0
    print(f"  · {len(main_results)} main + {len(review_results)} review results in {t_search:.1f}s",
          flush=True)

    # Parallel extraction
    async def _ext_main():
        raw = await generate_text(
            system_prompt=_EXTRACTION_PROMPT,
            user_message=_build_extraction_prompt(query, main_results[:30], platform),
            max_tokens=4096, temperature=0.3,
        )
        return _parse_json(raw)

    async def _ext_review():
        if not review_results:
            return {"pain_points": [], "unmet_needs": [], "deal_breakers": []}
        raw = await generate_text(
            system_prompt=_REVIEW_EXTRACTION_PROMPT,
            user_message=_build_review_prompt(query, review_results[:25]),
            max_tokens=2048, temperature=0.2,
        )
        return _parse_json(raw)

    t1 = time.time()
    extracted, review_data = await asyncio.gather(_ext_main(), _ext_review())
    t_ext = time.time() - t1

    # Merge pain points — review-first, fallback to merged
    review_pain = (review_data.get("pain_points") or []) + \
                  (review_data.get("deal_breakers") or [])
    main_pain = extracted.get("customer_pain_points") or []
    if len(review_pain) >= 3:
        merged_pain = list(dict.fromkeys(review_pain))
    else:
        merged_pain = list(dict.fromkeys(review_pain + main_pain))
    extracted["customer_pain_points"] = merged_pain
    extracted["unmet_needs"] = review_data.get("unmet_needs") or []
    print(f"  · extraction: {len(extracted.get('competitors', []))} comps, "
          f"{len(extracted.get('keywords_from_results', []))} kw, "
          f"{len(merged_pain)} pain pts in {t_ext:.1f}s", flush=True)

    # Scrub placeholder strings before checking emptiness
    _PLACEHOLDERS = {"", "n/a", "na", "none", "null", "unknown", "not specified",
                     "not available", "no prices found", "no price found",
                     "not found", "tbd", "-"}
    def _real(v):
        if not isinstance(v, str): return bool(v)
        return v.strip().lower() not in _PLACEHOLDERS

    def _scrub(p):
        return {k: (v if _real(v) else "") for k, v in (p or {}).items()}

    pricing = _scrub(extracted.get("pricing_data") or {})
    pricing_empty = not any(pricing.get(k) for k in ("low", "mid", "high", "sweet_spot"))
    pricing_retry_done = False
    if pricing_empty:
        t1b = time.time()
        try:
            raw = await generate_text(
                system_prompt=_PRICING_RETRY_PROMPT,
                user_message=_build_pricing_prompt(query, main_results[:40]),
                max_tokens=1024, temperature=0.2,
            )
            pr = _scrub(_parse_json(raw))
            extracted["pricing_data"] = {
                "low": pr.get("low", ""), "mid": pr.get("mid", ""),
                "high": pr.get("high", ""), "sweet_spot": pr.get("sweet_spot", ""),
            }
            extracted["prices_found"] = pr.get("prices_found", [])
            pricing_retry_done = True
            print(f"  · pricing retry: {len(pr.get('prices_found', []))} prices in {time.time()-t1b:.1f}s",
                  flush=True)
        except Exception as e:
            print(f"  · pricing retry FAILED: {e}", flush=True)
    else:
        extracted["pricing_data"] = pricing

    # Strategy
    t2 = time.time()
    raw_strat = await generate_text(
        system_prompt=_STRATEGY_PROMPT,
        user_message=_build_strategy_prompt(query, extracted, platform),
        max_tokens=8192, temperature=0.4,
    )
    strategy = _parse_json(raw_strat)
    t_strat = time.time() - t2
    print(f"  · strategy synth in {t_strat:.1f}s", flush=True)

    return {
        "query": query, "platform": platform.value,
        "main_results": len(main_results), "review_results": len(review_results),
        "pricing_retry": pricing_retry_done,
        "timings": {"search": t_search, "extract": t_ext, "strategy": t_strat,
                    "total": time.time() - t0},
        "extracted": extracted, "strategy": strategy,
    }


async def main():
    out_dir = Path(__file__).parent / "research_quality_out"
    out_dir.mkdir(exist_ok=True)
    summary = []

    for query, platform in PRODUCTS:
        print(f"\n=== {query} ({platform.value}) ===", flush=True)
        try:
            result = await run_one(query, platform)
        except Exception as e:
            print(f"  FATAL: {e}", flush=True)
            result = {"error": str(e), "query": query}

        slug = query.replace(" ", "_")
        (out_dir / f"{slug}.json").write_text(json.dumps(result, indent=2, default=str))

        if "error" not in result:
            ex = result["extracted"]; st = result["strategy"]
            pricing = ex.get("pricing_data", {})
            summary.append({
                "query": query, "platform": platform.value,
                "main": result["main_results"], "review": result["review_results"],
                "comps": len(ex.get("competitors", [])),
                "keywords": len(ex.get("keywords_from_results", [])),
                "pain_points": len(ex.get("customer_pain_points", [])),
                "unmet_needs": len(ex.get("unmet_needs", [])),
                "pricing_filled": bool(pricing.get("sweet_spot") or pricing.get("low")),
                "pricing_retry_used": result.get("pricing_retry", False),
                "kw_gaps": len(st.get("keyword_strategy", {}).get("keyword_gaps", [])),
                "opportunities": len(st.get("opportunities", [])),
                "total_seconds": round(result["timings"]["total"], 1),
            })
        else:
            summary.append({"query": query, "error": result["error"]})

    print("\n\n=== SUMMARY ===")
    print(json.dumps(summary, indent=2))
    (out_dir / "_summary.json").write_text(json.dumps(summary, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
