"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ErrorOrQuota, getQuotaMessage } from "@/components/shared/quota-exceeded";
import { Textarea } from "@/components/ui/input";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ImageGenerateRequest, ImageResponse } from "@/types/api";
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  AlertTriangle,
  ArrowLeft,
  Upload,
  Camera,
  User,
  Trees,
  Building,
  Crosshair,
  X,
  Plus,
  Minus,
} from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Theme definitions ────────────────────────────────────────────────
const THEMES = [
  {
    id: "studio" as const,
    label: "Studio",
    desc: "Clean backdrop, e-commerce ready",
    icon: Building,
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-300",
  },
  {
    id: "outdoor" as const,
    label: "Outdoor",
    desc: "Natural environment scene",
    icon: Trees,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-300",
  },
  {
    id: "model" as const,
    label: "With Model",
    desc: "Human model using product",
    icon: User,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-300",
  },
  {
    id: "context" as const,
    label: "In Context",
    desc: "Product in active use",
    icon: Crosshair,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-300",
  },
];

type ThemeId = (typeof THEMES)[number]["id"];

interface PhotoshootResult {
  product_analysis: {
    product_name: string;
    product_category: string;
    color: string;
    model_gender: string;
    model_gender_reasoning: string;
  };
  images: {
    id: string;
    theme: string;
    prompt_used: string;
    image_base64: string | null;
    success: boolean;
    error?: string;
  }[];
}

export default function ImageGeneratePage() {
  const { session } = useAuth();

  // Mode: "scratch" (text-to-image via MiniMax) or "photoshoot" (upload + Grok)
  const [mode, setMode] = useState<"scratch" | "photoshoot">("photoshoot");

  // ── Scratch mode state ──
  const [description, setDescription] = useState("");
  const [scratchLoading, setScratchLoading] = useState(false);
  const [scratchError, setScratchError] = useState("");
  const [scratchResult, setScratchResult] = useState<ImageResponse | null>(
    null,
  );

  // ── Photoshoot mode state ──
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [selectedThemes, setSelectedThemes] = useState<ThemeId[]>([
    "studio",
    "outdoor",
    "context",
  ]);
  const [photoshootLoading, setPhotoshootLoading] = useState(false);
  const [photoshootError, setPhotoshootError] = useState("");
  const [photoshootResult, setPhotoshootResult] =
    useState<PhotoshootResult | null>(null);
  const [generatingIndex, setGeneratingIndex] = useState(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalImages = selectedThemes.length;
  const canAddMore = totalImages < 5;
  const hasContext = selectedThemes.includes("context");

  // ── Resize image to max 1024px and compress as JPEG ──
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const MAX = 1024;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const scale = MAX / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not supported")); return; }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        resolve(dataUrl.split(",")[1]);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  // ── File upload handler ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPhotoshootError("Please upload an image file (PNG, JPG, WebP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setPhotoshootError("Image must be under 10MB");
      return;
    }

    setUploadedFileName(file.name);
    try {
      const base64 = await compressImage(file);
      setUploadedImage(base64);
      setPhotoshootError("");
      setPhotoshootResult(null);
    } catch {
      setPhotoshootError("Failed to process image. Try a different file.");
    }
  };

  // ── Theme toggle ──
  const toggleTheme = (themeId: ThemeId) => {
    setSelectedThemes((prev) => {
      if (prev.includes(themeId)) {
        // Don't allow removing the last one
        if (prev.length <= 1) return prev;
        return prev.filter((t) => t !== themeId);
      }
      if (prev.length >= 5) return prev;
      return [...prev, themeId];
    });
  };

  const addTheme = (themeId: ThemeId) => {
    if (selectedThemes.length >= 5) return;
    setSelectedThemes((prev) => [...prev, themeId]);
  };

  const removeThemeAt = (index: number) => {
    if (selectedThemes.length <= 1) return;
    setSelectedThemes((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Scratch mode generate ──
  const handleScratchGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) return;

    setScratchError("");
    setScratchLoading(true);
    setScratchResult(null);

    try {
      const data = (await api.generateImage(
        { description, aspect_ratio: "1:1", image_type: "lifestyle", style: "photorealistic" },
        session.access_token,
      )) as ImageResponse;
      setScratchResult(data);
    } catch (err) {
      setScratchError(
        err instanceof Error ? err.message : "Failed to generate image.",
      );
    } finally {
      setScratchLoading(false);
    }
  };

  // ── Photoshoot generate ──
  const handlePhotoshootGenerate = async () => {
    if (!uploadedImage) {
      setPhotoshootError("Please upload a product image first");
      return;
    }

    setPhotoshootError("");
    setPhotoshootLoading(true);
    setPhotoshootResult(null);
    setGeneratingIndex(0);

    try {
      const prefix = "/api/v1";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      const resp = await fetch(`${API_URL}${prefix}/photoshoot/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          image_base64: uploadedImage,
          themes: selectedThemes,
          aspect_ratio: "1:1",
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error ${resp.status}`);
      }

      const data = (await resp.json()) as PhotoshootResult;
      setPhotoshootResult(data);
    } catch (err) {
      setPhotoshootError(
        err instanceof Error ? err.message : "Photoshoot generation failed.",
      );
    } finally {
      setPhotoshootLoading(false);
      setGeneratingIndex(-1);
    }
  };

  const themeLabel = (id: string) =>
    THEMES.find((t) => t.id === id)?.label ?? id;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="rounded-lg p-2 hover:bg-surface-alt transition-colors text-text-muted hover:text-text"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-secondary">
            Generate Product Images
          </h1>
          <p className="text-text-muted mt-1">
            Create AI-powered product photos from scratch or from your own
            product image
          </p>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 border-b border-border pb-0">
        <button
          onClick={() => setMode("photoshoot")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer",
            mode === "photoshoot"
              ? "border-primary text-primary"
              : "border-transparent text-text-muted hover:text-text",
          )}
        >
          <Camera className="h-4 w-4 inline mr-2" />
          Product Photoshoot
        </button>
        <button
          onClick={() => setMode("scratch")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer",
            mode === "scratch"
              ? "border-primary text-primary"
              : "border-transparent text-text-muted hover:text-text",
          )}
        >
          <Sparkles className="h-4 w-4 inline mr-2" />
          From Description
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* PHOTOSHOOT MODE                                                */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {mode === "photoshoot" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Upload + Theme Selection */}
            <div className="space-y-4">
              {/* Upload */}
              <Card>
                <CardHeader>
                  <h2 className="text-sm font-semibold text-secondary flex items-center gap-2">
                    <Upload className="h-4 w-4 text-primary" />
                    Upload Product Image
                  </h2>
                </CardHeader>
                <CardBody>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  {!uploadedImage ? (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer"
                    >
                      <div className="rounded-full bg-surface-alt p-3">
                        <Upload className="h-6 w-6 text-text-muted" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-text">
                          Click to upload
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          PNG, JPG, WebP up to 10MB
                        </p>
                      </div>
                    </button>
                  ) : (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`data:image/png;base64,${uploadedImage}`}
                        alt="Uploaded product"
                        className="w-full rounded-lg border border-border"
                      />
                      <button
                        onClick={() => {
                          setUploadedImage(null);
                          setUploadedFileName("");
                          setPhotoshootResult(null);
                        }}
                        className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <p className="text-xs text-text-muted mt-2 truncate">
                        {uploadedFileName}
                      </p>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Theme Selection */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-secondary">
                      Shot Types
                    </h2>
                    <Badge variant={totalImages <= 5 ? "primary" : "danger"}>
                      {totalImages}/5 images
                    </Badge>
                  </div>
                </CardHeader>
                <CardBody className="space-y-3">
                  {THEMES.map((theme) => {
                    const count = selectedThemes.filter(
                      (t) => t === theme.id,
                    ).length;
                    return (
                      <div
                        key={theme.id}
                        className={cn(
                          "flex items-center justify-between rounded-lg border p-3 transition-all",
                          count > 0
                            ? `${theme.bg} ${theme.border}`
                            : "border-border",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <theme.icon
                            className={cn("h-4.5 w-4.5", theme.color)}
                          />
                          <div>
                            <p
                              className={cn(
                                "text-sm font-medium",
                                count > 0 ? theme.color : "text-text",
                              )}
                            >
                              {theme.label}
                            </p>
                            <p className="text-xs text-text-muted">
                              {theme.desc}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              const idx = selectedThemes.lastIndexOf(theme.id);
                              if (idx >= 0) removeThemeAt(idx);
                            }}
                            disabled={count === 0}
                            className="rounded-md border border-border p-1 hover:bg-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold">
                            {count}
                          </span>
                          <button
                            onClick={() => addTheme(theme.id)}
                            disabled={!canAddMore}
                            className="rounded-md border border-border p-1 hover:bg-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {!hasContext && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 flex items-start gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-amber-700">
                        At least one &quot;In Context&quot; shot is required. It
                        will be auto-added when you generate.
                      </p>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Selected shots summary */}
              <Card>
                <CardBody>
                  <p className="text-xs font-medium text-text-muted mb-2">
                    YOUR SHOT LIST
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedThemes.map((t, i) => {
                      const theme = THEMES.find((th) => th.id === t);
                      return (
                        <span
                          key={i}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                            theme?.bg,
                            theme?.color,
                          )}
                        >
                          {theme?.label}
                          <button
                            onClick={() => removeThemeAt(i)}
                            className="hover:opacity-70 cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>

                  {photoshootError && <ErrorOrQuota error={photoshootError} />}

                  <Button
                    onClick={handlePhotoshootGenerate}
                    loading={photoshootLoading}
                    disabled={!uploadedImage || photoshootLoading}
                    className="w-full mt-3"
                    size="lg"
                  >
                    <Camera className="h-4 w-4" />
                    {photoshootLoading
                      ? `Generating ${totalImages} shots...`
                      : `Generate ${totalImages} Photoshoot Images`}
                  </Button>
                </CardBody>
              </Card>
            </div>

            {/* Right: Results */}
            <div className="lg:col-span-2">
              {!photoshootResult && !photoshootLoading && (
                <Card>
                  <CardBody className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="rounded-2xl bg-purple-50 p-4 mb-4">
                      <Camera className="h-8 w-8 text-purple-400" />
                    </div>
                    <h3 className="text-base font-semibold text-secondary mb-1">
                      AI Product Photoshoot
                    </h3>
                    <p className="text-sm text-text-muted max-w-md">
                      Upload your product image, choose shot types, and get
                      professional photoshoot images. The AI automatically
                      detects your product, chooses the right model, and
                      creates context-appropriate scenes.
                    </p>
                  </CardBody>
                </Card>
              )}

              {photoshootLoading && (
                <Card>
                  <CardBody className="flex flex-col items-center justify-center py-20">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-text-muted">
                      AI is analyzing your product and creating photoshoot
                      scenes...
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      Generating {totalImages} images — this takes 30-60 seconds
                    </p>
                  </CardBody>
                </Card>
              )}

              {photoshootResult && (
                <div className="space-y-4">
                  {/* Analysis Card */}
                  <Card>
                    <CardBody className="flex items-center gap-4">
                      <div className="rounded-xl bg-purple-100 p-2.5">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-secondary">
                          {photoshootResult.product_analysis.product_name}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {photoshootResult.product_analysis.color} &middot;{" "}
                          {photoshootResult.product_analysis.product_category}
                        </p>
                      </div>
                      <Badge variant="primary">
                        AI-selected model
                      </Badge>
                    </CardBody>
                  </Card>

                  {/* Image Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {photoshootResult.images.map((img, i) => (
                      <Card key={img.id}>
                        <CardBody className="space-y-3">
                          {img.success && img.image_base64 ? (
                            <div className="rounded-lg overflow-hidden border border-border">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`data:image/png;base64,${img.image_base64}`}
                                alt={`${img.theme} shot`}
                                className="w-full h-auto"
                              />
                            </div>
                          ) : (
                            <div className="rounded-lg border border-red-200 bg-red-50 flex items-center justify-center py-16">
                              <p className="text-sm text-red-600">
                                Failed to generate
                              </p>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge>
                                {themeLabel(img.theme)}
                              </Badge>
                              <span className="text-xs text-text-muted">
                                Shot {i + 1}
                              </span>
                            </div>
                            {img.success && img.image_base64 && (
                              <a
                                href={`data:image/png;base64,${img.image_base64}`}
                                download={`photoshoot_${img.theme}_${i + 1}.png`}
                              >
                                <Button variant="outline" size="sm">
                                  <Download className="h-3.5 w-3.5" />
                                  Save
                                </Button>
                              </a>
                            )}
                          </div>
                          <details className="group">
                            <summary className="text-xs text-text-muted cursor-pointer hover:text-text">
                              View prompt used
                            </summary>
                            <p className="text-xs text-text-muted mt-2 bg-surface-alt rounded-lg p-3 leading-relaxed">
                              {img.prompt_used}
                            </p>
                          </details>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* FROM DESCRIPTION MODE                                          */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {mode === "scratch" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-secondary flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-purple-600" />
                Describe Your Image
              </h2>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleScratchGenerate} className="space-y-5">
                <Textarea
                  label="Product & Scene Description"
                  placeholder="Describe your product and the scene you want. e.g., 'A premium leather wallet on a marble desk next to a coffee cup, morning sunlight streaming through a window'"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />

                <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-xs text-blue-700">
                  <p className="font-medium">Tip: Be specific</p>
                  <p className="mt-1">
                    Include details about lighting, background, angle, and mood
                    for best results. No product photo needed — the AI generates
                    entirely from your description.
                  </p>
                </div>

                {scratchError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {scratchError}
                  </div>
                )}

                <Button
                  type="submit"
                  loading={scratchLoading}
                  className="w-full"
                  size="lg"
                >
                  <Sparkles className="h-4 w-4" />
                  {scratchLoading ? "Generating..." : "Generate Image"}
                </Button>
              </form>
            </CardBody>
          </Card>

          <div>
            {!scratchResult && !scratchLoading && (
              <Card>
                <CardBody className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="rounded-2xl bg-purple-50 p-4 mb-4">
                    <ImageIcon className="h-8 w-8 text-purple-400" />
                  </div>
                  <h3 className="text-base font-semibold text-secondary mb-1">
                    Your image will appear here
                  </h3>
                  <p className="text-sm text-text-muted max-w-xs">
                    Describe your product and generate a professional AI image.
                    No upload needed.
                  </p>
                </CardBody>
              </Card>
            )}

            {scratchLoading && (
              <Card>
                <CardBody className="flex flex-col items-center justify-center py-20">
                  <div className="h-16 w-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                  <p className="mt-4 text-sm font-medium text-text-muted">
                    Creating your image...
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    This takes 15-30 seconds
                  </p>
                </CardBody>
              </Card>
            )}

            {scratchResult && (
              <Card>
                <CardBody className="space-y-4">
                  <div className="rounded-xl overflow-hidden border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={scratchResult.public_url}
                      alt="Generated product image"
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-text">
                      AI Generated Image
                    </p>
                    <a
                      href={scratchResult.public_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </a>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
