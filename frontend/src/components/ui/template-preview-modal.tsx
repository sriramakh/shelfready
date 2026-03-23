"use client";

import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateItem {
  id: string;
  src: string;
  name: string;
  description?: string;
}

interface TemplatePreviewModalProps {
  /** Current template being previewed */
  current: TemplateItem;
  /** Full list for prev/next navigation — omit to disable navigation */
  items?: TemplateItem[];
  /** Currently selected template ID — shows "Selected" state */
  selectedId?: string | null;
  /** Called when user navigates to a different template */
  onNavigate?: (item: TemplateItem) => void;
  /** Called when user clicks "Use This Template" */
  onSelect?: (item: TemplateItem) => void;
  /** Called to close the modal */
  onClose: () => void;
}

export function TemplatePreviewModal({
  current,
  items,
  selectedId,
  onNavigate,
  onSelect,
  onClose,
}: TemplatePreviewModalProps) {
  const currentIndex = items?.findIndex((t) => t.id === current.id) ?? -1;
  const hasPrev = items && currentIndex > 0;
  const hasNext = items && currentIndex < items.length - 1;
  const isSelected = selectedId === current.id;

  const goPrev = useCallback(() => {
    if (hasPrev && items && onNavigate) {
      onNavigate(items[currentIndex - 1]);
    }
  }, [hasPrev, items, currentIndex, onNavigate]);

  const goNext = useCallback(() => {
    if (hasNext && items && onNavigate) {
      onNavigate(items[currentIndex + 1]);
    }
  }, [hasNext, items, currentIndex, onNavigate]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Enter" && onSelect) onSelect(current);
    },
    [onClose, goPrev, goNext, onSelect, current],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 rounded-full bg-white shadow-lg p-2 text-text-muted hover:text-text transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Prev/Next arrows */}
        {hasPrev && (
          <button
            onClick={goPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-14 rounded-full bg-white/90 shadow-lg p-3 text-text-muted hover:text-text transition-colors cursor-pointer hidden sm:flex"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {hasNext && (
          <button
            onClick={goNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-14 rounded-full bg-white/90 shadow-lg p-3 text-text-muted hover:text-text transition-colors cursor-pointer hidden sm:flex"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* Image */}
        <div className="rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.src}
            alt={current.name}
            className="w-full h-auto max-h-[70vh] object-contain"
          />
        </div>

        {/* Info bar below image */}
        <div className="mt-4 flex items-center justify-between w-full max-w-2xl">
          <div className="text-left">
            <p className="text-base font-semibold text-white">{current.name}</p>
            {current.description && (
              <p className="text-sm text-white/60 mt-0.5">{current.description}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Counter */}
            {items && items.length > 1 && (
              <span className="text-xs text-white/50">
                {currentIndex + 1} / {items.length}
              </span>
            )}

            {/* Select button */}
            {onSelect && (
              <button
                onClick={() => onSelect(current)}
                className={cn(
                  "rounded-lg px-5 py-2 text-sm font-semibold transition-all cursor-pointer",
                  isSelected
                    ? "bg-green-500 text-white"
                    : "bg-white text-secondary hover:bg-primary hover:text-white",
                )}
              >
                {isSelected ? (
                  <span className="flex items-center gap-1.5">
                    <Check className="h-4 w-4" /> Selected
                  </span>
                ) : (
                  "Use This Template"
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile prev/next */}
        {items && items.length > 1 && (
          <div className="flex gap-3 mt-4 sm:hidden">
            <button
              onClick={goPrev}
              disabled={!hasPrev}
              className="rounded-full bg-white/20 p-2 text-white disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goNext}
              disabled={!hasNext}
              className="rounded-full bg-white/20 p-2 text-white disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
