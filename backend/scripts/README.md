# Backend maintenance scripts

One-off and scheduled cleanups for Supabase data.

## cleanup_orphans.py (recurring)

Deletes storage objects with no matching `generated_images` row and prunes
`usage_logs` older than `--days` (default 90).

```bash
# dry-run, show counts
python3 -m scripts.cleanup_orphans

# actually delete
python3 -m scripts.cleanup_orphans --apply

# prune usage_logs older than 30 days instead of 90
python3 -m scripts.cleanup_orphans --apply --days 30
```

### Running on Railway (scheduled)

1. In the Railway dashboard, open the backend service → **Settings → Cron
   Schedule** (or create a new service with the same repo/env vars, type
   "Cron Job").
2. Set:
   - **Schedule**: `0 4 * * 0`  (Sundays 04:00 UTC, weekly)
   - **Start command**: `python3 -m scripts.cleanup_orphans --apply`
3. Env vars needed: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (same as the
   main service — Railway will share them if the cron is in the same
   project).

Logs appear under the cron service's **Deployments → Logs** tab.

### Alternative: GitHub Actions

If you don't want to pay for a Railway cron seat, you can run the same
script from a scheduled GitHub Action. Add a secret `SUPABASE_SERVICE_ROLE_KEY`
and `SUPABASE_URL`, then a workflow like:

```yaml
name: cleanup-orphans
on:
  schedule:
    - cron: "0 4 * * 0"
  workflow_dispatch:
jobs:
  cleanup:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: backend } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install -r requirements.txt
      - run: python3 -m scripts.cleanup_orphans --apply
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

## wipe_test_images.py (one-off)

**Destructive.** Wipes every object in the `generated-images` bucket and
truncates the `generated_images` table. Intended for clearing test data
before launch. Do not run in production with real users.

```bash
# dry-run
python3 -m scripts.wipe_test_images

# actually wipe
python3 -m scripts.wipe_test_images --confirm
```

## Cloudflare caching in front of Supabase Storage (manual, recommended)

Every view of a generated image currently hits Supabase egress. Putting
Cloudflare's free CDN in front caches images at the edge and can cut your
egress bill by 80-95% once you have real traffic.

High-level steps:

1. Buy a domain (or use an existing one) and add it to Cloudflare (free
   plan). Make sure Cloudflare is the authoritative DNS.
2. In Cloudflare DNS, add a CNAME `img` → your Supabase project's storage
   hostname: `<project-ref>.supabase.co`. Enable the orange cloud (proxy).
3. Create a Cloudflare Worker or Page Rule so that `img.yourdomain.com/*`
   strips `/img/` and forwards to
   `https://<project-ref>.supabase.co/storage/v1/object/public/generated-images/*`.
   - A Worker is the cleanest approach; the pattern is ~15 lines.
4. Update `storage_service.upload_image()` to construct the public URL
   from `img.yourdomain.com/<path>` instead of Supabase's raw public URL,
   and set a long cache-control header on uploads:
   ```python
   "file_options": {
       "content-type": content_type,
       "upsert": "false",
       "cache-control": "public, max-age=31536000, immutable",
   }
   ```

Drop the snippets in when you're ready; flag it and I'll wire the backend
URL change and give you the Worker code.
