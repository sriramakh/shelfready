"""Multi-provider web search: SearXNG (primary) + DuckDuckGo (fallback).

SearXNG runs with 100 rotating proxies for reliability.
DuckDuckGo HTML scraping as zero-config fallback.
"""

import json
import logging
import random
import re
from html.parser import HTMLParser

import httpx

from ..config import settings

logger = logging.getLogger(__name__)

# ── SearXNG Configuration ────────────────────────────────────────────
# SearXNG handles proxy rotation internally via settings.yml
SEARXNG_URL = getattr(settings, "searxng_url", "http://localhost:8080")
SEARXNG_TIMEOUT = 20.0
SEARXNG_PAGES = 3


# ── SearXNG Search ───────────────────────────────────────────────────

async def searxng_search(
    query: str,
    pages: int = SEARXNG_PAGES,
    categories: str = "general",
) -> list[dict]:
    """Search via self-hosted SearXNG instance with rotating proxies.

    SearXNG aggregates results from Google, Bing, Brave, DuckDuckGo, and
    Startpage — with 100 rotating proxies to avoid rate limits.

    Returns list of {title, url, snippet, engine} dicts.
    """
    all_results = []

    async with httpx.AsyncClient(timeout=SEARXNG_TIMEOUT) as client:
        for page in range(1, pages + 1):
            try:
                resp = await client.get(
                    f"{SEARXNG_URL}/search",
                    params={
                        "q": query,
                        "format": "json",
                        "pageno": page,
                        "categories": categories,
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                results = data.get("results", [])

                for r in results:
                    all_results.append({
                        "title": r.get("title", ""),
                        "url": r.get("url", ""),
                        "snippet": r.get("content", ""),
                        "engine": r.get("engine", "unknown"),
                    })

                if not results:
                    break

            except httpx.TimeoutException:
                logger.warning("SearXNG timeout on page %d for query: %s", page, query[:50])
                break
            except httpx.HTTPStatusError as e:
                logger.warning("SearXNG HTTP %d for query: %s", e.response.status_code, query[:50])
                break
            except Exception as e:
                logger.warning("SearXNG error: %s", str(e)[:100])
                break

    return all_results


# ── DuckDuckGo Fallback ──────────────────────────────────────────────

class _DDGParser(HTMLParser):
    """Parse DuckDuckGo HTML search results."""

    def __init__(self):
        super().__init__()
        self.results: list[dict] = []
        self._current: dict = {}
        self._in_title = False
        self._in_snippet = False
        self._text = ""

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        cls = attrs_dict.get("class", "")
        if tag == "a" and "result__a" in cls:
            self._in_title = True
            self._current = {
                "url": attrs_dict.get("href", ""),
                "title": "",
                "snippet": "",
                "engine": "duckduckgo",
            }
            self._text = ""
        elif tag == "a" and "result__snippet" in cls:
            self._in_snippet = True
            self._text = ""

    def handle_endtag(self, tag):
        if tag == "a" and self._in_title:
            self._current["title"] = self._text.strip()
            self._in_title = False
        elif tag == "a" and self._in_snippet:
            self._current["snippet"] = self._text.strip()
            self._in_snippet = False
            if self._current.get("title"):
                self.results.append(self._current)
            self._current = {}

    def handle_data(self, data):
        if self._in_title or self._in_snippet:
            self._text += data


USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
]


async def duckduckgo_search(query: str, max_results: int = 10) -> list[dict]:
    """Search DuckDuckGo HTML endpoint. Zero API key needed.

    Returns list of {title, url, snippet, engine} dicts.
    """
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(
                "https://html.duckduckgo.com/html/",
                params={"q": query},
                headers={"User-Agent": random.choice(USER_AGENTS)},
            )

        parser = _DDGParser()
        parser.feed(resp.text)

        if parser.results:
            return parser.results[:max_results]

        # Fallback: regex extraction
        titles = re.findall(r'class="result__a"[^>]*>(.*?)</a>', resp.text, re.DOTALL)
        snippets = re.findall(r'class="result__snippet"[^>]*>(.*?)</a>', resp.text, re.DOTALL)

        results = []
        for i in range(min(len(titles), len(snippets), max_results)):
            title = re.sub(r"<[^>]+>", "", titles[i]).strip()
            snippet = re.sub(r"<[^>]+>", "", snippets[i]).strip()
            if title:
                results.append({
                    "title": title,
                    "snippet": snippet,
                    "url": "",
                    "engine": "duckduckgo",
                })
        return results

    except Exception as e:
        logger.warning("DuckDuckGo search error: %s", str(e)[:100])
        return []


# ── Unified Search Interface ─────────────────────────────────────────

async def web_search(
    query: str,
    max_results: int = 10,
    use_searxng: bool = True,
) -> list[dict]:
    """Search the web using SearXNG (primary) with DuckDuckGo fallback.

    Args:
        query: Search query string.
        max_results: Maximum results to return.
        use_searxng: If True, try SearXNG first. Falls back to DDG on failure.

    Returns:
        List of {title, url, snippet, engine} dicts.
    """
    results = []

    # Try SearXNG first (aggregates Google, Bing, Brave, DDG, Startpage)
    if use_searxng:
        try:
            results = await searxng_search(query)
            if results:
                logger.debug("SearXNG returned %d results for: %s", len(results), query[:50])
                return results[:max_results]
        except Exception as e:
            logger.info("SearXNG unavailable, falling back to DDG: %s", str(e)[:80])

    # Fallback: DuckDuckGo direct
    results = await duckduckgo_search(query, max_results)
    logger.debug("DDG returned %d results for: %s", len(results), query[:50])
    return results
