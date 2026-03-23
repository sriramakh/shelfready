# ShelfReady

AI-powered product listing, photoshoot, and marketing content platform for e-commerce sellers.

**Live:** [shelfready.app](https://shelfready.app)

## What it does

ShelfReady generates everything an e-commerce seller needs to launch and market products — from a single product description or photo.

- **AI Listing Optimizer** — SEO-optimized titles, bullets, descriptions for Amazon, Etsy, Shopify
- **Product Photoshoot** — Upload a product photo, get 5 professional images (studio, outdoor, with model, in-context)
- **Ad Copy + Visual Creatives** — Text ad variants + template-based visual ad creatives (70+ templates)
- **Social Content Engine** — Platform-native posts for Instagram, Facebook, Pinterest with hashtags and CTAs
- **Competitor Intelligence + Market Insights** — Live web search competitive analysis with keyword gaps
- **Multi-Platform Export** — Same product, optimized differently for each marketplace

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, Tailwind CSS, TypeScript |
| Backend | Python FastAPI |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| AI (Text) | MiniMax M2.7-fast (listings, social, ads, multi-platform) |
| AI (Research) | GPT-4o-mini (market insights) |
| AI (Images) | Grok Imagine (photoshoots, ad creatives) |
| AI (Vision) | Grok 4 (product analysis) |
| Search | DuckDuckGo + SearXNG (competitor research) |
| Payments | Stripe |
| Hosting | Vercel (frontend) + Railway (backend) |

## Project Structure

```
shelfready/
├── frontend/          # Next.js 15 app
│   ├── src/app/       # Pages (App Router)
│   ├── src/components/# UI components
│   ├── src/lib/       # Utilities, API client, constants
│   └── public/        # Static assets, templates
├── backend/           # FastAPI server
│   └── app/
│       ├── api/v1/    # API routes (demo + production)
│       ├── core/      # Auth, quota, rate limiting
│       ├── services/  # AI service integrations
│       ├── prompts/   # Prompt templates per feature
│       ├── models/    # Pydantic schemas, enums
│       └── db/        # Supabase client, repositories
├── supabase/          # Database migrations
└── searxng/           # SearXNG search config
```

## Pricing

| Plan | Price | Listings | AI Images | Photoshoots |
|---|---|---|---|---|
| Free | $0 | 3/mo | 5/mo | — |
| Starter | $29/mo | 50/mo | 100/mo | 10/mo |
| Pro | $39/mo | 300/mo | 300/mo | 30/mo |
| Business | $99/mo | Unlimited | 1,000/mo | 100/mo |

## Local Development

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Copy `.env.example` files and fill in API keys.

## Environment Variables

### Frontend (.env.local)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_DEMO_MODE` (set to "true" for demo)

### Backend (.env)
- `MINIMAX_API_KEY`, `GROK_API_KEY`, `OPENAI_API_KEY`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `CORS_ORIGINS`, `ENVIRONMENT`
