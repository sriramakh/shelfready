"""One-shot: wipe every generated image (Supabase Storage + images table).

WARNING: Destructive. Deletes ALL objects in the `generated-images` bucket
and truncates the `images` table. Intended for clearing test data before
launch — do NOT run after real users exist.

Usage (from backend/ directory):

    python3 -m scripts.wipe_test_images --confirm

Without --confirm it runs in dry-run mode and prints counts only.
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path


def _load_env() -> None:
    """Load backend/.env if running locally (Railway injects env vars directly)."""
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip())


def main() -> int:
    parser = argparse.ArgumentParser(description="Wipe all generated images.")
    parser.add_argument(
        "--confirm",
        action="store_true",
        help="Actually delete. Without this flag, dry-run only.",
    )
    args = parser.parse_args()

    # Ensure app imports work when run as a module.
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    _load_env()

    from app.db.supabase_client import get_supabase  # noqa: E402

    supabase = get_supabase()
    bucket = "generated-images"

    # 1. List all objects across all user folders.
    print(f"[1/3] Listing objects in storage bucket '{bucket}'...", flush=True)
    all_paths: list[str] = []

    # Top-level "directories" are user UUIDs (one folder per user).
    try:
        folders = supabase.storage.from_(bucket).list("", {"limit": 10000})
    except Exception as exc:
        print(f"  FAILED to list bucket root: {exc}")
        return 1

    user_folders = [f["name"] for f in (folders or []) if f.get("name")]
    print(f"  Found {len(user_folders)} user folders.")

    for folder in user_folders:
        try:
            files = supabase.storage.from_(bucket).list(folder, {"limit": 10000})
        except Exception as exc:
            print(f"  Skipping folder '{folder}' (list failed): {exc}")
            continue
        for f in files or []:
            name = f.get("name")
            if name:
                all_paths.append(f"{folder}/{name}")

    print(f"  Total objects to delete: {len(all_paths)}")

    # 2. Count rows in images table.
    print("[2/3] Counting rows in public.generated_images table...", flush=True)
    try:
        count_resp = supabase.table("generated_images").select("id", count="exact").limit(1).execute()
        row_count = count_resp.count or 0
    except Exception as exc:
        print(f"  FAILED to count images rows: {exc}")
        row_count = -1
    print(f"  generated_images rows: {row_count}")

    if not args.confirm:
        print("\n[DRY RUN] Re-run with --confirm to actually delete.")
        return 0

    # 3. Delete objects in batches of 200 (Supabase remove() accepts a list).
    print(f"\n[3/3] Deleting {len(all_paths)} storage objects...", flush=True)
    BATCH = 200
    deleted = 0
    for i in range(0, len(all_paths), BATCH):
        chunk = all_paths[i : i + BATCH]
        try:
            supabase.storage.from_(bucket).remove(chunk)
            deleted += len(chunk)
            print(f"  deleted {deleted}/{len(all_paths)}", flush=True)
        except Exception as exc:
            print(f"  batch failed at offset {i}: {exc}")

    # 4. Truncate images table. Using delete() with a non-matching UUID trick
    # isn't needed — service role can just delete with a match-anything filter.
    print("\n    Truncating generated_images table...", flush=True)
    try:
        # Supabase client requires some filter, so filter id not null.
        result = supabase.table("generated_images").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print(f"  generated_images cleared (response data length: {len(result.data or [])})")
    except Exception as exc:
        print(f"  FAILED to delete images rows: {exc}")
        return 1

    print(f"\nDone. Deleted {deleted} storage objects and {row_count} DB rows.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
