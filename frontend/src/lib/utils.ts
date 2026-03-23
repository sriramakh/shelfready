import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

/**
 * Basic HTML sanitizer — strips script tags, event handlers, and dangerous
 * attributes from HTML strings before rendering with dangerouslySetInnerHTML.
 * For production with user-generated content, consider using DOMPurify instead.
 */
export function sanitizeHtml(html: string): string {
  return html
    // Remove script tags and their contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove event handler attributes (onclick, onerror, onload, etc.)
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    // Remove javascript: protocol in href/src
    .replace(/(?:href|src)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, "")
    // Remove iframe, object, embed tags
    .replace(/<(?:iframe|object|embed|form|input|button)\b[^>]*>[\s\S]*?<\/(?:iframe|object|embed|form|input|button)>/gi, "")
    .replace(/<(?:iframe|object|embed|form|input|button)\b[^>]*\/?>/gi, "");
}
