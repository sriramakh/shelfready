# ShelfReady — Model Comparison Report

**Date:** 2026-03-22 17:17:56
**Models tested:** MiniMax M2.7-fast, GPT-4o-mini, Grok 4-1-fast-reasoning
**Total queries:** 60

## Overall Summary

| Model | Avg Score | Avg Time | Avg Cost/Query | JSON Success | Total Cost (20 queries) |
|---|---|---|---|---|---|
| **MiniMax M2.7-fast** | **9.2/10** | 28.9s | $0.0050 | 19/20 | $0.1000 |
| **GPT-4o-mini** | **9.1/10** | 8.5s | $0.0003 | 20/20 | $0.0051 |
| **Grok 4-1-fast-reasoning** | **8.1/10** | 11.7s | $0.0049 | 17/20 | $0.0981 |

## Per Feature Breakdown


### Listing Optimizer

| Model | Avg Score | Avg Time | Avg Cost | Notes |
|---|---|---|---|---|
| MiniMax M2.7-fast | **9.4/10** | 30.1s | $0.0050 | Clean |
| GPT-4o-mini | **8.7/10** | 8.1s | $0.0003 | Clean |
| Grok 4-1-fast-reasoning | **9.3/10** | 11.6s | $0.0046 | Clean |

### Social Content

| Model | Avg Score | Avg Time | Avg Cost | Notes |
|---|---|---|---|---|
| MiniMax M2.7-fast | **9.6/10** | 16.1s | $0.0050 | Clean |
| GPT-4o-mini | **8.4/10** | 5.0s | $0.0002 | Clean |
| Grok 4-1-fast-reasoning | **9.2/10** | 7.5s | $0.0024 | Clean |

### Ad Copy

| Model | Avg Score | Avg Time | Avg Cost | Notes |
|---|---|---|---|---|
| MiniMax M2.7-fast | **9.7/10** | 23.8s | $0.0050 | Clean |
| GPT-4o-mini | **9.8/10** | 5.8s | $0.0002 | Clean |
| Grok 4-1-fast-reasoning | **9.8/10** | 6.8s | $0.0024 | Clean |

### Market Insights

| Model | Avg Score | Avg Time | Avg Cost | Notes |
|---|---|---|---|---|
| MiniMax M2.7-fast | **7.4/10** | 37.8s | $0.0050 | Failed to return valid JSON |
| GPT-4o-mini | **9.0/10** | 11.5s | $0.0004 | Clean |
| Grok 4-1-fast-reasoning | **2.5/10** | 20.2s | $0.0084 | Failed to return valid JSON |

### Multi-Platform

| Model | Avg Score | Avg Time | Avg Cost | Notes |
|---|---|---|---|---|
| MiniMax M2.7-fast | **9.8/10** | 36.6s | $0.0050 | Clean |
| GPT-4o-mini | **9.8/10** | 12.0s | $0.0003 | Clean |
| Grok 4-1-fast-reasoning | **9.8/10** | 12.4s | $0.0067 | Clean |

## Detailed Scores (Product x Model)

| Feature | Product | MiniMax | GPT-4o-mini | Grok 4-1 |
|---|---|---|---|---|
| Listing Optimizer | Wireless Earbuds | 9.3/10 (36.59s) | 8.7/10 (9.03s) | 9.3/10 (9.54s) |
| Listing Optimizer | Organic Dog Treats | 9.2/10 (30.34s) | 8.3/10 (7.96s) | 9.3/10 (10.91s) |
| Listing Optimizer | Yoga Mat | 9.7/10 (24.57s) | 8.3/10 (7.73s) | 9.2/10 (12.62s) |
| Listing Optimizer | Scented Candle Set | 9.5/10 (28.9s) | 9.5/10 (7.85s) | 9.5/10 (13.19s) |
| Social Content | Wireless Earbuds | 9.6/10 (13.75s) | 9.0/10 (5.7s) | 9.4/10 (8.15s) |
| Social Content | Organic Dog Treats | 9.6/10 (17.17s) | 8.2/10 (4.65s) | 9.2/10 (8.3s) |
| Social Content | Yoga Mat | 9.6/10 (16.74s) | 8.0/10 (4.57s) | 9.0/10 (6.52s) |
| Social Content | Scented Candle Set | 9.6/10 (16.8s) | 8.4/10 (5.14s) | 9.2/10 (7.19s) |
| Ad Copy | Wireless Earbuds | 9.8/10 (14.6s) | 9.8/10 (6.12s) | 9.8/10 (7.04s) |
| Ad Copy | Organic Dog Treats | 9.8/10 (22.28s) | 9.8/10 (4.78s) | 9.8/10 (7.66s) |
| Ad Copy | Yoga Mat | 9.2/10 (25.43s) | 9.8/10 (5.66s) | 9.8/10 (5.22s) |
| Ad Copy | Scented Candle Set | 9.8/10 (32.86s) | 9.8/10 (6.54s) | 9.8/10 (7.4s) |
| Market Insights | Wireless Earbuds | 9.7/10 (43.24s) | 9.0/10 (11.03s) | 0/10 (18.07s) |
| Market Insights | Organic Dog Treats | 9.8/10 (42.35s) | 8.5/10 (12.79s) | 10.0/10 (27.52s) |
| Market Insights | Yoga Mat | 0/10 (30.85s) | 9.2/10 (8.97s) | 0/10 (17.39s) |
| Market Insights | Scented Candle Set | 10.0/10 (34.58s) | 9.2/10 (13.36s) | 0/10 (18.01s) |
| Multi-Platform | Wireless Earbuds | 9.8/10 (35.85s) | 9.8/10 (14.38s) | 9.8/10 (10.45s) |
| Multi-Platform | Organic Dog Treats | 9.8/10 (30.94s) | 9.8/10 (9.81s) | 9.8/10 (14.87s) |
| Multi-Platform | Yoga Mat | 9.8/10 (41.84s) | 9.8/10 (9.65s) | 9.8/10 (11.24s) |
| Multi-Platform | Scented Candle Set | 9.8/10 (37.84s) | 9.8/10 (14.3s) | 9.8/10 (13.11s) |

## Monthly Cost Projection (per 1,000 users)

Assuming average user does 20 text queries/month:

| Model | Cost per Query | Cost per User/Month | 1,000 Users/Month |
|---|---|---|---|
| MiniMax M2.7-fast | $0.0050 | $0.10 | $100 |
| GPT-4o-mini | $0.0003 | $0.01 | $5 |
| Grok 4-1-fast-reasoning | $0.0049 | $0.10 | $98 |

## Recommendation

- **Best quality:** MiniMax M2.7-fast (9.2/10)
- **Cheapest:** GPT-4o-mini ($0.0003/query)
- **Fastest:** GPT-4o-mini (8.5s avg)