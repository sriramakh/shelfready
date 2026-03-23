"""Web search via MiniMax tool use (Anthropic-compatible SDK)."""

import json
import logging
from typing import Any

import anthropic

from ..config import settings
from ..core.rate_limiter import rate_limiter

logger = logging.getLogger(__name__)

_client = anthropic.Anthropic(
    api_key=settings.minimax_api_key,
    base_url=settings.minimax_base_url,
)

# Tool definition for web search capability
_WEB_SEARCH_TOOL: dict[str, Any] = {
    "type": "web_search",
    "name": "web_search",
}


async def web_search(query: str, max_results: int = 10) -> list[dict]:
    """Perform a web search using MiniMax tool-use and return structured results.

    Args:
        query: The search query string.
        max_results: Maximum number of results to return.

    Returns:
        A list of dicts with keys: title, url, snippet.

    Raises:
        RuntimeError: If rate limit cannot be acquired or the API call fails.
    """
    acquired = await rate_limiter.acquire_search()
    if not acquired:
        raise RuntimeError(
            "Search rate limit exceeded. Please try again shortly."
        )

    system_prompt = (
        "You are a research assistant. When asked to search the web, "
        "use the web_search tool. After obtaining results, return them as "
        "a JSON array of objects with keys: title, url, snippet. "
        "Return ONLY the JSON array, no other text."
    )

    try:
        response = _client.messages.create(
            model=settings.minimax_model,
            max_tokens=4096,
            temperature=0.0,
            system=system_prompt,
            tools=[_WEB_SEARCH_TOOL],
            messages=[
                {
                    "role": "user",
                    "content": f"Search the web for: {query}",
                },
            ],
        )

        results = _extract_search_results(response, max_results)
        return results

    except anthropic.APIConnectionError as exc:
        logger.error("MiniMax search API connection error: %s", exc)
        raise RuntimeError(
            "Unable to connect to the search service. Please try again later."
        ) from exc
    except anthropic.RateLimitError as exc:
        logger.warning("MiniMax search API rate limit hit: %s", exc)
        raise RuntimeError(
            "Search service is temporarily overloaded. Please try again."
        ) from exc
    except anthropic.APIStatusError as exc:
        logger.error(
            "MiniMax search API error (status %s): %s",
            exc.status_code,
            exc.message,
        )
        raise RuntimeError(
            f"Search service error (HTTP {exc.status_code}). Please try again."
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error during web search")
        raise RuntimeError(
            "An unexpected error occurred during web search."
        ) from exc


def _extract_search_results(
    response: anthropic.types.Message,
    max_results: int,
) -> list[dict]:
    """Parse search results from the model response.

    Handles multiple response formats:
    - Direct JSON text in a text content block
    - Tool-use blocks with structured results
    - JSON wrapped in markdown code fences
    """
    results: list[dict] = []

    for block in response.content:
        # If the model returned a tool_use block, the input may contain results
        if hasattr(block, "type") and block.type == "tool_use":
            if isinstance(block.input, dict):
                # Some formats nest results under a key
                raw = block.input.get("results", block.input.get("data", []))
                if isinstance(raw, list):
                    for item in raw:
                        if isinstance(item, dict):
                            results.append(_normalize_result(item))

        # If the model returned text, try to parse JSON from it
        if hasattr(block, "text") and block.text:
            parsed = _parse_json_from_text(block.text)
            if isinstance(parsed, list):
                for item in parsed:
                    if isinstance(item, dict):
                        results.append(_normalize_result(item))
            elif isinstance(parsed, dict):
                # Single result or nested structure
                nested = parsed.get("results", parsed.get("data", []))
                if isinstance(nested, list):
                    for item in nested:
                        if isinstance(item, dict):
                            results.append(_normalize_result(item))
                else:
                    results.append(_normalize_result(parsed))

    return results[:max_results]


def _normalize_result(item: dict) -> dict:
    """Normalize a search result dict to standard keys."""
    return {
        "title": item.get("title", ""),
        "url": item.get("url", item.get("link", "")),
        "snippet": item.get("snippet", item.get("description", item.get("text", ""))),
    }


def _parse_json_from_text(text: str) -> Any:
    """Attempt to parse JSON from text, handling markdown code fences."""
    text = text.strip()

    # Try direct parse first
    try:
        return json.loads(text)
    except (json.JSONDecodeError, ValueError):
        pass

    # Try extracting from markdown code block
    if "```" in text:
        # Find content between code fences
        parts = text.split("```")
        for i, part in enumerate(parts):
            if i % 2 == 1:  # Odd indices are inside code fences
                # Remove optional language identifier on first line
                lines = part.strip().splitlines()
                if lines and lines[0].strip().lower() in ("json", "jsonl", ""):
                    content = "\n".join(lines[1:])
                else:
                    content = part
                try:
                    return json.loads(content.strip())
                except (json.JSONDecodeError, ValueError):
                    continue

    return None
