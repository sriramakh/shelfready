"use client";

import { useEffect, useCallback } from "react";
import { X } from "lucide-react";

interface TemplatePreviewModalProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export function TemplatePreviewModal({
  src,
  alt,
  onClose,
}: TemplatePreviewModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 rounded-full bg-white shadow-lg p-2 text-text-muted hover:text-text transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="w-full h-auto max-h-[80vh] object-contain"
          />
        </div>
        <p className="mt-3 text-sm text-white/80 font-medium">{alt}</p>
      </div>
    </div>
  );
}
