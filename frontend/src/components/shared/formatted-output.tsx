"use client";

import React from "react";

/**
 * Renders markdown-style text from AI responses with proper formatting.
 * Supports:
 *  - **Bold** / **Headers**
 *  - Bullet lists (- item)
 *  - Numbered lists (1. item)
 *  - [impact / effort] inline badges
 *  - Paragraphs
 */

interface Props {
  text: string;
  accentColor?: string; // tailwind color like "emerald", "blue"
}

export function FormattedText({ text, accentColor = "emerald" }: Props) {
  if (!text) return null;

  const accentClasses: Record<string, { text: string; bg: string; border: string }> = {
    emerald: { text: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-100 dark:border-emerald-900/50" },
    blue: { text: "text-blue-700 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-100 dark:border-blue-900/50" },
    purple: { text: "text-purple-700 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-100 dark:border-purple-900/50" },
    amber: { text: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-100 dark:border-amber-900/50" },
    pink: { text: "text-pink-700 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-950/30", border: "border-pink-100 dark:border-pink-900/50" },
  };
  const c = accentClasses[accentColor] || accentClasses.emerald;

  // Parse text into blocks
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;
  let currentParagraph: string[] = [];
  let key = 0;

  const flushList = () => {
    if (!currentList) return;
    const items = currentList.items;
    const isUl = currentList.type === "ul";
    blocks.push(
      <div key={key++} className="space-y-1.5 my-3">
        {items.map((item, i) => (
          <div key={i} className="flex gap-3 text-sm leading-relaxed">
            <span className={`flex-shrink-0 mt-0.5 ${c.text} font-semibold min-w-[20px]`}>
              {isUl ? "•" : `${i + 1}.`}
            </span>
            <span className="text-text flex-1">{renderInline(item)}</span>
          </div>
        ))}
      </div>
    );
    currentList = null;
  };

  const flushParagraph = () => {
    if (currentParagraph.length === 0) return;
    const text = currentParagraph.join(" ").trim();
    if (text) {
      blocks.push(
        <p key={key++} className="text-sm text-text leading-relaxed my-2">
          {renderInline(text)}
        </p>
      );
    }
    currentParagraph = [];
  };

  const flushAll = () => {
    flushList();
    flushParagraph();
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    // Empty line — flush paragraph
    if (!line) {
      flushParagraph();
      return;
    }

    // Section header: **Header** or ## Header
    const headerMatch =
      line.match(/^\*\*(.+?)\*\*:?\s*$/) || line.match(/^##\s+(.+?)\s*$/);
    if (headerMatch) {
      flushAll();
      blocks.push(
        <h3
          key={key++}
          className={`text-xs font-bold uppercase tracking-wider ${c.text} mt-4 mb-2 first:mt-0`}
        >
          {headerMatch[1]}
        </h3>
      );
      return;
    }

    // Bullet list: - item  or  * item
    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      return;
    }

    // Numbered list: 1. item  or  1) item
    const numberMatch = line.match(/^\d+[.)]\s+(.+)$/);
    if (numberMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(numberMatch[1]);
      return;
    }

    // Key: Value line (e.g., "Market range: $10-20")
    const kvMatch = line.match(/^([A-Z][A-Za-z\s]{1,40}):\s+(.+)$/);
    if (kvMatch && !line.includes("**")) {
      flushAll();
      blocks.push(
        <div key={key++} className="flex gap-2 text-sm my-1.5">
          <span className={`font-semibold ${c.text} flex-shrink-0`}>{kvMatch[1]}:</span>
          <span className="text-text">{renderInline(kvMatch[2])}</span>
        </div>
      );
      return;
    }

    // Regular paragraph line
    flushList();
    currentParagraph.push(line);
  });

  flushAll();

  return <div className="space-y-1">{blocks}</div>;
}

/** Render inline formatting: **bold**, [impact/effort] tags */
function renderInline(text: string): React.ReactNode {
  // Split by **bold** markers
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Match [impact / effort] badge
    const badgeMatch = remaining.match(
      /\[(high|medium|low)\s+impact\s*\/\s*(high|medium|low)\s+effort\]/i
    );
    if (badgeMatch && badgeMatch.index !== undefined) {
      if (badgeMatch.index > 0) {
        parts.push(renderBold(remaining.slice(0, badgeMatch.index), key++));
      }
      const impact = badgeMatch[1].toLowerCase();
      const effort = badgeMatch[2].toLowerCase();
      parts.push(
        <span key={key++} className="inline-flex gap-1 mr-1">
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              impact === "high"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                : impact === "medium"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300"
            }`}
          >
            {impact} impact
          </span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              effort === "low"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                : effort === "medium"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                : "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
            }`}
          >
            {effort} effort
          </span>
        </span>
      );
      remaining = remaining.slice(badgeMatch.index + badgeMatch[0].length);
    } else {
      parts.push(renderBold(remaining, key++));
      break;
    }
  }

  return <>{parts}</>;
}

function renderBold(text: string, baseKey: number): React.ReactNode {
  const regex = /\*\*(.+?)\*\*/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let i = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <strong key={`${baseKey}-${i++}`} className="font-semibold text-secondary">
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 0 ? text : <>{parts}</>;
}
