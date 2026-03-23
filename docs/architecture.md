# ShelfReady — Architecture

## System Overview

```
┌─────────────────────────────┐
│     shelfready.app          │
│     (Vercel / Next.js)      │
│                             │
│  Landing · Dashboard · Auth │
│  Listings · Images · Ads    │
│  Social · Research · Pricing│
└─────────────┬───────────────┘
              │ HTTPS
              ▼
┌─────────────────────────────┐      ┌──────────────┐
│  api.shelfready.app         │─────▶│  Supabase    │
│  (Railway / FastAPI)        │      │  PostgreSQL  │
│                             │      │  Auth + RLS  │
│  /listings · /images        │      │  Storage     │
│  /social · /ads · /research │      └──────────────┘
│  /photoshoot · /ads/creative│
└──────┬──────┬──────┬────────┘
       │      │      │
       ▼      ▼      ▼
   MiniMax  Grok   GPT-4o
   (text)  (image) (research)
```

## AI Routing Strategy

| Feature | Primary Engine | Why |
|---|---|---|
| Listing Optimizer | MiniMax M2.7-fast | Best quality (9.4/10), flat $80/mo plan |
| Social Content | MiniMax M2.7-fast | Best quality (9.3/10) |
| Ad Copy (text) | MiniMax M2.7-fast | Strong (9.0/10) |
| Ad Creatives (visual) | Grok Imagine | Product fidelity (9.5/10), $0.02/image |
| Product Photoshoot | Grok Imagine + Grok 4 Vision | Dual-image template system |
| Market Insights | GPT-4o-mini | Best at research (9.0/10), fastest (8.5s) |
| Multi-Platform Export | MiniMax M2.7-fast | Best quality (9.8/10) |
| Product Analysis | Grok 4-1-fast | Vision capability for product detection |

## Database Schema (Supabase)

8 tables with Row-Level Security:

| Table | Purpose |
|---|---|
| `profiles` | User profiles (extends auth.users) |
| `subscriptions` | Stripe subscription state |
| `listings` | Generated product listings |
| `generated_images` | AI-generated images (Supabase Storage) |
| `social_posts` | Social media content |
| `ad_copies` | Ad copy variants |
| `usage_logs` | Quota tracking (sliding 5-hour window) |
| `research_sessions` | Competitor research results |

## Quota System

- **Sliding window**: 5-hour rolling window per user
- **Per-plan limits**: Free (100 req) → Starter (2,000) → Pro (5,000) → Business (15,000)
- **Global budget guard**: Prevents total usage from exceeding MiniMax plan limits
- **Rate limiter**: Token bucket for MiniMax (500 RPM text, 10 RPM image)

## Ad Creative Template System

```
User uploads product → Grok 4 Vision analyzes it
                           ↓
        User selects template (70+ available)
                           ↓
     Grok Imagine receives TWO images:
       1. Template image (style reference)
       2. Product image (subject)
                           ↓
     Output: Product in template's visual style
     with customized messaging (brand, price, offer)
```

Template categories: Sale & Promo (20), Product Launch (6), Lifestyle (10), Premium (5), Social Media (8), Industry (11), Campaigns (6), Tech (5)

## Search Pipeline

```
User query
    ↓
DuckDuckGo HTML search (free, no API key)
    ↓ (fallback if SearXNG unavailable)
SearXNG (self-hosted, 100 rotating proxies)
    ↓ (aggregates Google, Bing, Brave, DDG, Startpage)
GPT-4o-mini analyzes results
    ↓
Structured JSON: analysis, keywords, competitors
```

## Cost Structure

| Component | Cost | Notes |
|---|---|---|
| MiniMax M2.7-fast | $80/mo flat | Unlimited text at ~$0.00004/query |
| Grok Imagine | $0.02/image | Pay-per-use |
| Grok 4 Vision | ~$0.0001/call | Product analysis |
| GPT-4o-mini | ~$0.0003/query | Research only |
| DuckDuckGo | Free | Web search |
| Supabase | Free tier | Up to 500MB DB, 1GB storage |
| Vercel | Free tier | Frontend hosting |
| Railway | $5/mo (free trial) | Backend hosting |

**Per-user cost**: $0.50-$10/month depending on usage tier.

## Security

- API keys: Backend only, never exposed to frontend
- Auth: Supabase JWT verification on all protected endpoints
- RLS: Row-level security on all database tables
- CORS: Restricted to production domains
- Input sanitization: HTML output sanitized before rendering
- Error boundaries: Global + dashboard-level React error boundaries

## Deployment

- **Frontend**: Vercel (auto-deploy on git push to main)
- **Backend**: Railway (auto-deploy on git push to main)
- **Database**: Supabase (managed PostgreSQL)
- **Domain**: shelfready.app (Vercel) + api.shelfready.app (Railway)
- **SSL**: Automatic via Vercel and Railway
