"""Safe-to-run-anytime cleanup: orphan storage files + old usage_logs.

Two jobs in one script so a single scheduled cron covers both:

  1. Delete storage objects in `generated-images` that have NO matching row
     in the `generated_images` table. Orphans happen when a DB insert fails
     after the upload, or when a user's record is deleted but the storage
     object isn't cascaded.

  2. Prune `usage_logs` rows older than --days (default 90). These are only
     used for monthly quota counts, so anything older is dead weight.

Usage:

    python3 -m scripts.cleanup_orphans              # dry-run, shows counts
    python3 -m scripts.cleanup_orphans --apply      # actually delete
    python3 -m scripts.cleanup_orphans --apply --days 30  # prune logs >30d

Railway scheduled job (recommended weekly):
  - Command: `python3 -m scripts.cleanup_orphans --apply`
  - Cron: `0 4 * * 0`  (Sundays at 04:00 UTC)
  - Same env vars as the main backend (SUPABASE_*).
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path


def _load_env() -> None:
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip())


def _list_all_storage_paths(supabase, bucket: str) -> list[str]:
    """Return every object path in the bucket as `<user_uuid>/<filename>`."""
    paths: list[str] = []
    try:
        folders = supabase.storage.from_(bucket).list("", {"limit": 10000})
    except Exception as exc:
        print(f"  ERROR listing bucket root: {exc}")
        return paths

    for folder in folders or []:
        name = folder.get("name")
        if not name:
            continue
        try:
            files = supabase.storage.from_(bucket).list(name, {"limit": 10000})
        except Exception as exc:
            print(f"  WARN skipping folder '{name}': {exc}")
            continue
        for f in files or []:
            fname = f.get("name")
            if fname:
                paths.append(f"{name}/{fname}")
    return paths


def _list_db_storage_paths(supabase) -> set[str]:
    """Return every storage_path tracked in the generated_images DB table."""
    paths: set[str] = set()
    page_size = 1000
    offset = 0
    while True:
        try:
            resp = (
                supabase.table("generated_images")
                .select("storage_path")
                .range(offset, offset + page_size - 1)
                .execute()
            )
        except Exception as exc:
            print(f"  ERROR querying generated_images at offset {offset}: {exc}")
            break
        rows = resp.data or []
        for row in rows:
            p = row.get("storage_path")
            if p:
                paths.add(p)
        if len(rows) < page_size:
            break
        offset += page_size
    return paths


def orphan_sweep(supabase, bucket: str, apply: bool) -> int:
    print(f"\n[1/2] Orphan sweep in bucket '{bucket}'")
    storage_paths = _list_all_storage_paths(supabase, bucket)
    db_paths = _list_db_storage_paths(supabase)

    orphans = [p for p in storage_paths if p not in db_paths]
    print(f"  storage objects: {len(storage_paths)}")
    print(f"  db rows:         {len(db_paths)}")
    print(f"  orphans:         {len(orphans)}")

    if not orphans:
        return 0
    if not apply:
        sample = orphans[:5]
        print(f"  sample: {sample}")
        return len(orphans)

    BATCH = 200
    deleted = 0
    for i in range(0, len(orphans), BATCH):
        chunk = orphans[i : i + BATCH]
        try:
            supabase.storage.from_(bucket).remove(chunk)
            deleted += len(chunk)
        except Exception as exc:
            print(f"  batch failed at offset {i}: {exc}")
    print(f"  deleted {deleted}/{len(orphans)} orphan objects")
    return deleted


def prune_usage_logs(supabase, days: int, apply: bool) -> int:
    print(f"\n[2/2] Prune usage_logs older than {days} days")
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    cutoff_iso = cutoff.isoformat()

    try:
        count_resp = (
            supabase.table("usage_logs")
            .select("id", count="exact")
            .lt("created_at", cutoff_iso)
            .limit(1)
            .execute()
        )
        rowcount = count_resp.count or 0
    except Exception as exc:
        print(f"  ERROR counting old rows: {exc}")
        return 0

    print(f"  rows older than {cutoff.date()}: {rowcount}")
    if rowcount == 0 or not apply:
        return rowcount

    try:
        supabase.table("usage_logs").delete().lt("created_at", cutoff_iso).execute()
        print(f"  deleted {rowcount} rows")
    except Exception as exc:
        print(f"  ERROR deleting old rows: {exc}")
        return 0
    return rowcount


def main() -> int:
    parser = argparse.ArgumentParser(description="Cleanup orphan storage + old usage_logs.")
    parser.add_argument("--apply", action="store_true", help="Actually delete. Without this, dry-run.")
    parser.add_argument("--days", type=int, default=90, help="Prune usage_logs older than N days (default 90).")
    parser.add_argument("--bucket", default="generated-images")
    args = parser.parse_args()

    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    _load_env()

    from app.db.supabase_client import get_supabase  # noqa: E402
    supabase = get_supabase()

    o = orphan_sweep(supabase, args.bucket, args.apply)
    p = prune_usage_logs(supabase, args.days, args.apply)

    if not args.apply:
        print("\n[DRY RUN] Re-run with --apply to execute.")
    else:
        print(f"\nDone. {o} orphans removed, {p} usage_log rows pruned.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
