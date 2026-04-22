"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { AD_PLATFORMS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ErrorOrQuota, getQuotaMessage } from "@/components/shared/quota-exceeded";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/shared/copy-button";
import { HistoryPanel } from "@/components/shared/history-panel";
import type { AdGenerateRequest, AdResponse } from "@/types/api";
import {
  Megaphone,
  Sparkles,
  ArrowLeft,
  Minus,
  Plus,
  Upload,
  X,
  Image as ImageIcon,
  Camera,
  Download,
  FileText,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { TemplatePreviewModal } from "@/components/ui/template-preview-modal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type AdPlatform = keyof typeof AD_PLATFORMS;

const platformEntries = Object.entries(AD_PLATFORMS) as [
  AdPlatform,
  (typeof AD_PLATFORMS)[AdPlatform],
][];

// ── Creative size definitions ─────────────────────────────────────────
const CREATIVE_SIZES = [
  { id: "1080x1080", label: "Feed Square", desc: "1080 x 1080" },
  { id: "1200x628", label: "Facebook Feed", desc: "1200 x 628" },
  { id: "1080x1920", label: "Story / Reel", desc: "1080 x 1920" },
  { id: "1080x1350", label: "Portrait Feed", desc: "1080 x 1350" },
  { id: "1920x1080", label: "Landscape", desc: "1920 x 1080" },
] as const;

// ── Creative templates (loaded from manifest) ────────────────────────
import allTemplates from "@/lib/creative-templates.json";

const TEMPLATE_CATEGORIES = [
  { id: "all", name: "All" },
  { id: "minimalist", name: "Minimalist" },
  { id: "pastel", name: "Pastel" },
  { id: "genz", name: "Gen Z" },
  { id: "millennial", name: "Millennial" },
  { id: "sale", name: "Sale & Promo" },
  { id: "launch", name: "Product Launch" },
  { id: "lifestyle", name: "Lifestyle" },
  { id: "luxury", name: "Premium" },
  { id: "social", name: "Social Media" },
  { id: "industry", name: "Industry" },
  { id: "campaign", name: "Campaigns" },
  { id: "tech", name: "Tech & Apps" },
] as const;

const CREATIVE_TEMPLATES = allTemplates as {
  id: string;
  category: string;
  name: string;
  description: string;
  preview: string;
}[];

interface CreativeResult {
  id: string;
  size: string;
  aspect_ratio: string;
  prompt_used: string;
  image_base64: string | null;
  success: boolean;
  error?: string;
}

interface AdCreativeResponse {
  product_analysis: {
    product_name: string;
    product_category: string;
    color: string;
  };
  creatives: CreativeResult[];
  created_at: string;
}

export default function AdsGeneratePage() {
  const { session } = useAuth();

  // Mode: "copy" (text-only MiniMax) or "creative" (visual Grok)
  const [mode, setMode] = useState<"copy" | "creative">("copy");

  // ── Ad Copy state ──
  const [adPlatform, setAdPlatform] = useState<AdPlatform>("facebook");
  const [productName, setProductName] = useState("");
  const [productDetails, setProductDetails] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [numVariants, setNumVariants] = useState(3);
  const [copyLoading, setCopyLoading] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [copyResult, setCopyResult] = useState<AdResponse | null>(null);
  const [copyHistory, setCopyHistory] = useState<Array<{ id: string; ad_platform: string; headline: string; primary_text?: string; description?: string; cta?: string; variant_label?: string; created_at?: string }>>([]);
  const [copyHistoryLoading, setCopyHistoryLoading] = useState(true);

  useEffect(() => {
    if (!session?.access_token) return;
    (async () => {
      try {
        const data = await api.getAds(session.access_token, 1) as any;
        const items = Array.isArray(data) ? data : (data.items || []);
        setCopyHistory(items);
        if (!copyResult && items.length >= 1) {
          // Group recent variants (same product_name or created close in time) into a single AdResponse
          const mostRecent = items[0];
          const sameGroup = items.filter((x: any) => {
            if (!mostRecent.created_at || !x.created_at) return x.ad_platform === mostRecent.ad_platform;
            const diff = Math.abs(new Date(x.created_at).getTime() - new Date(mostRecent.created_at).getTime());
            return diff < 60000; // within 1 minute
          });
          setCopyResult({
            id: mostRecent.id,
            ad_platform: mostRecent.ad_platform,
            variants: sameGroup.map((x: any) => ({
              headline: x.headline || "",
              primary_text: x.primary_text || "",
              description: x.description || "",
              cta: x.cta || "",
              variant_label: x.variant_label || "",
            })),
            created_at: mostRecent.created_at || "",
          } as AdResponse);
        }
      } catch {}
      finally { setCopyHistoryLoading(false); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token]);

  // ── Ad Creative state ──
  const [creativePlatform, setCreativePlatform] =
    useState<AdPlatform>("facebook");
  const [creativeProductName, setCreativeProductName] = useState("");
  const [creativeProductDetails, setCreativeProductDetails] = useState("");
  const [creativeTargetAudience, setCreativeTargetAudience] = useState("");
  const [contentDirection, setContentDirection] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>(["1080x1080"]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateCategory, setTemplateCategory] = useState("all");
  const [templatesExpanded, setTemplatesExpanded] = useState(false);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [templateBase64Cache, setTemplateBase64Cache] = useState<Record<string, string>>({});
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [creativeLoading, setCreativeLoading] = useState(false);
  const [creativeError, setCreativeError] = useState("");
  const [creativeResult, setCreativeResult] =
    useState<AdCreativeResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File upload handler ──
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCreativeError("Please upload an image file (PNG, JPG, WebP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setCreativeError("Image must be under 10MB");
      return;
    }

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setUploadedImage(base64);
      setCreativeError("");
      setCreativeResult(null);
    };
    reader.readAsDataURL(file);
  };

  // ── Size toggle ──
  const toggleSize = (sizeId: string) => {
    setSelectedSizes((prev) => {
      if (prev.includes(sizeId)) {
        if (prev.length <= 1) return prev;
        return prev.filter((s) => s !== sizeId);
      }
      if (prev.length >= 5) return prev;
      return [...prev, sizeId];
    });
  };

  // ── Ad Copy generate ──
  const handleCopyGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) return;

    setCopyError("");
    setCopyLoading(true);
    setCopyResult(null);

    try {
      const payload: AdGenerateRequest = {
        ad_platform: adPlatform,
        product_name: productName,
        product_details: productDetails,
        target_audience: targetAudience || undefined,
        num_variants: numVariants,
      };

      const data = (await api.generateAds(
        payload,
        session.access_token,
      )) as AdResponse;

      setCopyResult(data);
      // Refresh history
      try {
        const refreshed = await api.getAds(session.access_token, 1) as any;
        const items = Array.isArray(refreshed) ? refreshed : (refreshed.items || []);
        setCopyHistory(items);
      } catch {}
    } catch (err) {
      const quotaMsg = getQuotaMessage(err);
      setCopyError(
        quotaMsg || (err instanceof Error ? err.message : "Failed to generate ad copy. Please try again."),
      );
    } finally {
      setCopyLoading(false);
    }
  };

  const loadAdFromHistory = (id: string) => {
    const item = copyHistory.find((x) => x.id === id);
    if (!item) return;
    // Show just this single variant
    setCopyResult({
      id: item.id,
      ad_platform: item.ad_platform,
      variants: [{
        headline: item.headline || "",
        primary_text: item.primary_text || "",
        description: item.description || "",
        cta: item.cta || "",
        variant_label: item.variant_label || "",
      }],
      created_at: item.created_at || "",
    } as AdResponse);
  };

  // ── Ad Creative generate ──
  const handleCreativeGenerate = async () => {
    if (!uploadedImage) {
      setCreativeError("Please upload a product image first");
      return;
    }

    if (selectedSizes.length === 0) {
      setCreativeError("Please select at least one creative size");
      return;
    }

    setCreativeError("");
    setCreativeLoading(true);
    setCreativeResult(null);

    try {
      // If template selected, fetch its image as base64
      let templateB64: string | null = null;
      if (selectedTemplate) {
        if (templateBase64Cache[selectedTemplate]) {
          templateB64 = templateBase64Cache[selectedTemplate];
        } else {
          const tpl = CREATIVE_TEMPLATES.find((t) => t.id === selectedTemplate);
          if (tpl) {
            const tplResp = await fetch(tpl.preview);
            const tplBlob = await tplResp.blob();
            templateB64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve((reader.result as string).split(",")[1]);
              reader.readAsDataURL(tplBlob);
            });
            setTemplateBase64Cache((prev) => ({ ...prev, [selectedTemplate]: templateB64! }));
          }
        }
      }

      const prefix = "/api/v1";
      const fetchHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) fetchHeaders["Authorization"] = `Bearer ${session.access_token}`;

      const resp = await fetch(`${API_URL}${prefix}/creatives/generate`, {
        method: "POST",
        headers: fetchHeaders,
        body: JSON.stringify({
          image_base64: uploadedImage,
          product_name: creativeProductName,
          product_details: creativeProductDetails,
          target_audience: creativeTargetAudience,
          ad_platform: creativePlatform,
          creative_sizes: selectedSizes,
          content_direction: contentDirection,
          template_id: selectedTemplate,
          template_base64: templateB64,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        const detail = errData?.detail ?? errData;
        const msg = typeof detail === "string" ? detail : JSON.stringify(detail);
        throw new Error(msg || `Server error ${resp.status}`);
      }

      const data = (await resp.json()) as AdCreativeResponse;
      setCreativeResult(data);
    } catch (err) {
      const quotaMsg = getQuotaMessage(err);
      setCreativeError(
        quotaMsg || (err instanceof Error ? err.message : "Failed to generate ad creatives. Please try again."),
      );
    } finally {
      setCreativeLoading(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="rounded-lg p-2 hover:bg-surface-alt dark:hover:bg-white/5 transition-colors text-text-muted hover:text-text"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-secondary">
            Generate Ads
          </h1>
          <p className="text-text-muted mt-0.5 text-sm">
            Create high-converting ad copy or visual ad creatives for your
            products
          </p>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 border-b border-border pb-0">
        <button
          onClick={() => setMode("copy")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer",
            mode === "copy"
              ? "border-primary text-primary"
              : "border-transparent text-text-muted hover:text-text",
          )}
        >
          <FileText className="h-4 w-4 inline mr-2" />
          Ad Copy
        </button>
        <button
          onClick={() => setMode("creative")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer",
            mode === "creative"
              ? "border-primary text-primary"
              : "border-transparent text-text-muted hover:text-text",
          )}
        >
          <Camera className="h-4 w-4 inline mr-2" />
          Ad Creatives
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* AD COPY MODE                                                   */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {mode === "copy" && (
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
          {/* Form + History */}
          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pb-4 lg:pr-1">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-secondary flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-amber-600" />
                Ad Settings
              </h2>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleCopyGenerate} className="space-y-5">
                {/* Platform selector */}
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Ad Platform
                  </label>
                  <div className="flex gap-2">
                    {platformEntries.map(([key, plat]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setAdPlatform(key)}
                        className={cn(
                          "flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                          adPlatform === key
                            ? "border-transparent shadow-sm"
                            : "border-border bg-white text-text-muted hover:bg-surface-alt",
                        )}
                        style={
                          adPlatform === key
                            ? {
                                backgroundColor: `${plat.color}15`,
                                color: plat.color,
                                borderColor: `${plat.color}40`,
                              }
                            : undefined
                        }
                      >
                        {plat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Product Name"
                  placeholder="e.g., SmartFit Watch Pro"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                />

                <Textarea
                  label="Product Details"
                  placeholder="Key features, benefits, USPs..."
                  value={productDetails}
                  onChange={(e) => setProductDetails(e.target.value)}
                  required
                />

                <Input
                  label="Target Audience"
                  placeholder="e.g., Fitness enthusiasts aged 25-45"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />

                {/* Variants slider */}
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Number of Variants
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        setNumVariants(Math.max(1, numVariants - 1))
                      }
                      className="rounded-lg border border-border p-1.5 text-text-muted hover:bg-surface-alt transition-colors cursor-pointer disabled:opacity-50"
                      disabled={numVariants <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <div className="flex-1">
                      <input
                        type="range"
                        min={1}
                        max={5}
                        value={numVariants}
                        onChange={(e) =>
                          setNumVariants(Number(e.target.value))
                        }
                        className="w-full accent-primary"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setNumVariants(Math.min(5, numVariants + 1))
                      }
                      className="rounded-lg border border-border p-1.5 text-text-muted hover:bg-surface-alt transition-colors cursor-pointer disabled:opacity-50"
                      disabled={numVariants >= 5}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <span className="text-lg font-bold text-secondary w-8 text-center">
                      {numVariants}
                    </span>
                  </div>
                </div>

                {copyError && (
                  <ErrorOrQuota error={copyError} />
                )}

                <Button
                  type="submit"
                  loading={copyLoading}
                  className="w-full"
                  size="lg"
                >
                  <Sparkles className="h-4 w-4" />
                  {copyLoading
                    ? "Generating..."
                    : `Generate ${numVariants} Variant${numVariants > 1 ? "s" : ""}`}
                </Button>
              </form>
            </CardBody>
          </Card>

          <HistoryPanel
            items={copyHistory.map((a) => ({
              id: a.id,
              label: a.headline || "Ad variant",
              subtitle: `${a.ad_platform} · ${a.variant_label || ""}`,
              timestamp: a.created_at,
            }))}
            loading={copyHistoryLoading}
            onSelect={loadAdFromHistory}
            title="Recent Ads"
            emptyText="No ad copy yet."
            accentColor="amber"
          />
          </div>

          {/* Results */}
          <div className="space-y-4 min-w-0">
            {!copyResult && !copyLoading && (
              <Card>
                <CardBody className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 p-4 mb-4">
                    <Megaphone className="h-8 w-8 text-amber-400" />
                  </div>
                  <h3 className="text-base font-semibold text-secondary mb-1">
                    Ad variants will appear here
                  </h3>
                  <p className="text-sm text-text-muted max-w-xs">
                    Choose a platform, describe your product, and generate
                    multiple ad copy variants.
                  </p>
                </CardBody>
              </Card>
            )}

            {copyLoading && (
              <Card>
                <CardBody className="flex flex-col items-center justify-center py-24">
                  <div className="h-14 w-14 rounded-full border-4 border-amber-100 dark:border-amber-900/30 border-t-amber-500 animate-spin" />
                  <p className="mt-5 text-sm font-semibold text-secondary">
                    Generating {numVariants} ad variant
                    {numVariants > 1 ? "s" : ""}...
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    Typically 10-15 seconds
                  </p>
                </CardBody>
              </Card>
            )}

            {copyResult && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {copyResult.variants.map((variant, i) => (
                  <Card key={i} className="overflow-hidden h-full flex flex-col">
                    <CardHeader className="flex items-center justify-between bg-surface-alt/50 dark:bg-white/5">
                      <div className="flex items-center gap-2">
                        <Badge variant="primary">
                          {variant.variant_label || `Variant ${i + 1}`}
                        </Badge>
                        <Badge
                          style={{
                            backgroundColor: `${AD_PLATFORMS[adPlatform].color}15`,
                            color: AD_PLATFORMS[adPlatform].color,
                          }}
                        >
                          {AD_PLATFORMS[adPlatform].name}
                        </Badge>
                      </div>
                      <CopyButton
                        text={`${variant.headline}\n\n${variant.primary_text}\n\n${variant.description}\n\nCTA: ${variant.cta}`}
                        label="Copy All"
                      />
                    </CardHeader>
                    <CardBody className="space-y-3 flex-1">
                      <div>
                        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                          Headline
                        </p>
                        <p className="text-base font-bold text-secondary leading-snug">
                          {variant.headline}
                        </p>
                      </div>
                      <div className="border-t border-border/50 pt-3">
                        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                          Primary Text
                        </p>
                        <p className="text-sm text-text leading-relaxed">
                          {variant.primary_text}
                        </p>
                      </div>
                      {variant.description && (
                        <div className="border-t border-border/50 pt-3">
                          <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                            Description
                          </p>
                          <p className="text-sm text-text-muted leading-relaxed">
                            {variant.description}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-3 border-t border-border/50 mt-auto">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                          CTA:
                        </p>
                        <Badge variant="primary">{variant.cta}</Badge>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* AD CREATIVES MODE — Full-width step layout                     */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {mode === "creative" && (
        <div className="space-y-8">

          {/* ── ROW 1: Upload + Product Details — side by side ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Product Image Upload */}
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
                    className="w-full border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center gap-4 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer min-h-[280px] justify-center"
                  >
                    <div className="rounded-full bg-surface-alt p-4">
                      <Upload className="h-8 w-8 text-text-muted" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-text">
                        Click to upload your product image
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
                        setCreativeResult(null);
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

            {/* Right: Product Details */}
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-secondary">
                  Product Details
                </h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  label="Product Name"
                  placeholder="e.g., SmartFit Watch Pro"
                  value={creativeProductName}
                  onChange={(e) => setCreativeProductName(e.target.value)}
                  required
                />

                <Textarea
                  label="Product Details"
                  placeholder="Key features, benefits, USPs..."
                  value={creativeProductDetails}
                  onChange={(e) =>
                    setCreativeProductDetails(e.target.value)
                  }
                  required
                />

                <Input
                  label="Target Audience"
                  placeholder="e.g., Fitness enthusiasts aged 25-45"
                  value={creativeTargetAudience}
                  onChange={(e) =>
                    setCreativeTargetAudience(e.target.value)
                  }
                />

                <Textarea
                  label="Content Direction (optional)"
                  placeholder="What should the creative convey? e.g., 'Summer sale 30% off', 'New arrival', 'Free shipping'"
                  value={contentDirection}
                  onChange={(e) => setContentDirection(e.target.value)}
                />

                {/* Platform selector */}
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Ad Platform
                  </label>
                  <div className="flex gap-2">
                    {platformEntries.map(([key, plat]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setCreativePlatform(key)}
                        className={cn(
                          "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer",
                          creativePlatform === key
                            ? "border-transparent shadow-sm"
                            : "border-border bg-white text-text-muted hover:bg-surface-alt",
                        )}
                        style={
                          creativePlatform === key
                            ? {
                                backgroundColor: `${plat.color}15`,
                                color: plat.color,
                                borderColor: `${plat.color}40`,
                              }
                            : undefined
                        }
                      >
                        {plat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* ── ROW 2: Template — compact quick picks, expandable full gallery ── */}
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-secondary">Style Template</h2>
                  <span className="text-xs text-text-muted">(optional)</span>
                </div>
                {selectedTemplate ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="primary">
                      {CREATIVE_TEMPLATES.find((t) => t.id === selectedTemplate)?.name}
                    </Badge>
                    <button type="button" onClick={() => setSelectedTemplate(null)}
                      className="text-text-muted hover:text-red-500 cursor-pointer">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-text-muted">Freestyle mode</span>
                )}
              </div>

              {/* Selected template inline preview */}
              {selectedTemplate && !templatesExpanded && (
                <div className="flex items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <div className="w-[140px] flex-shrink-0 rounded-lg overflow-hidden border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={CREATIVE_TEMPLATES.find((t) => t.id === selectedTemplate)?.preview || ""}
                      alt="Selected template" className="w-full h-auto" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary">
                      {CREATIVE_TEMPLATES.find((t) => t.id === selectedTemplate)?.name}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {CREATIVE_TEMPLATES.find((t) => t.id === selectedTemplate)?.description}
                    </p>
                    <button type="button" onClick={() => setTemplatesExpanded(true)}
                      className="text-xs text-primary font-medium mt-1.5 cursor-pointer hover:underline">
                      Change template
                    </button>
                  </div>
                </div>
              )}

              {/* Quick picks — one row of top 5, shown when no template selected and gallery collapsed */}
              {!selectedTemplate && !templatesExpanded && (
                <div className="flex gap-3 items-stretch">
                  {CREATIVE_TEMPLATES.filter((t) =>
                    ["flash_sale", "new_arrival", "premium", "black_friday", "seasonal"].includes(t.id)
                  ).map((tpl) => (
                    <div key={tpl.id} className="flex-shrink-0 w-[155px] rounded-lg border border-border overflow-hidden hover:shadow-md hover:border-primary/30 transition-all group relative">
                      <div className="aspect-video overflow-hidden bg-surface-alt relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={tpl.preview} alt={tpl.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        {/* Hover overlay with preview + select */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <button type="button"
                            onClick={() => setPreviewTemplateId(tpl.id)}
                            className="rounded-full bg-white shadow-lg p-2 text-secondary hover:bg-primary hover:text-white transition-colors cursor-pointer"
                            title="Preview full size">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button type="button"
                            onClick={() => setSelectedTemplate(tpl.id)}
                            className="rounded-full bg-primary shadow-lg p-2 text-white hover:bg-primary-dark transition-colors cursor-pointer"
                            title="Use this template">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="p-1.5 text-center">
                        <p className="text-[11px] font-semibold text-text truncate">{tpl.name}</p>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setTemplatesExpanded(true)}
                    className="flex-shrink-0 w-[155px] rounded-lg border-2 border-dashed border-border overflow-hidden hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2">
                    <div className="rounded-full bg-surface-alt p-2">
                      <Plus className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-xs font-semibold text-primary">{CREATIVE_TEMPLATES.length}+ Templates</p>
                    <p className="text-[10px] text-text-muted">Browse all</p>
                  </button>
                </div>
              )}

              {/* Expanded full gallery */}
              {templatesExpanded && (
                <div className="space-y-3 border-t border-border pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {TEMPLATE_CATEGORIES.map((cat) => (
                        <button key={cat.id} type="button" onClick={() => setTemplateCategory(cat.id)}
                          className={cn(
                            "text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer",
                            templateCategory === cat.id ? "bg-primary text-white" : "bg-surface-alt text-text-muted hover:text-text",
                          )}>
                          {cat.name}
                        </button>
                      ))}
                    </div>
                    <button type="button" onClick={() => setTemplatesExpanded(false)}
                      className="text-xs text-text-muted hover:text-text cursor-pointer flex items-center gap-1">
                      <Minus className="h-3.5 w-3.5" /> Collapse
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
                    {CREATIVE_TEMPLATES.filter((t) => templateCategory === "all" || t.category === templateCategory)
                      .map((tpl) => (
                      <div key={tpl.id} className={cn(
                        "rounded-lg border overflow-hidden transition-all group text-left relative",
                        selectedTemplate === tpl.id ? "ring-2 ring-primary border-primary shadow-md" : "border-border hover:shadow-sm",
                      )}>
                        <div className="aspect-video overflow-hidden bg-surface-alt relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={tpl.preview} alt={tpl.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <button type="button"
                              onClick={() => setPreviewTemplateId(tpl.id)}
                              className="rounded-full bg-white shadow-lg p-2 text-secondary hover:bg-primary hover:text-white transition-colors cursor-pointer"
                              title="Preview full size">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button type="button"
                              onClick={() => { setSelectedTemplate(tpl.id); setTemplatesExpanded(false); }}
                              className="rounded-full bg-primary shadow-lg p-2 text-white hover:bg-primary-dark transition-colors cursor-pointer"
                              title="Use this template">
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="p-1.5">
                          <p className="text-[11px] font-semibold text-text truncate">{tpl.name}</p>
                          <p className="text-[10px] text-text-muted truncate">{tpl.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* ── ROW 3: Size Selection + Generate — side by side ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Creative Size Picker */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-secondary">
                    Creative Sizes
                  </h2>
                  <Badge
                    variant={selectedSizes.length <= 5 ? "primary" : "danger"}
                  >
                    {selectedSizes.length}/5 selected
                  </Badge>
                </div>
              </CardHeader>
              <CardBody>
                <div className="flex flex-wrap gap-2">
                  {CREATIVE_SIZES.map((size) => {
                    const isSelected = selectedSizes.includes(size.id);
                    return (
                      <button
                        key={size.id}
                        type="button"
                        onClick={() => toggleSize(size.id)}
                        className={cn(
                          "flex items-center gap-2 rounded-full border px-4 py-2 transition-all cursor-pointer",
                          isSelected
                            ? "bg-primary/5 border-primary/40 text-primary"
                            : "border-border hover:bg-surface-alt text-text",
                        )}
                      >
                        <div
                          className={cn(
                            "h-3.5 w-3.5 rounded border-2 flex items-center justify-center transition-colors shrink-0",
                            isSelected
                              ? "border-primary bg-primary"
                              : "border-border",
                          )}
                        >
                          {isSelected && (
                            <svg
                              className="h-2 w-2 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm font-medium whitespace-nowrap">
                          {size.label}
                        </span>
                        <span className="text-xs text-text-muted whitespace-nowrap">
                          {size.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardBody>
            </Card>

            {/* Right: Generate Button */}
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-secondary">
                  Generate
                </h2>
              </CardHeader>
              <CardBody className="flex flex-col justify-center gap-4">
                <p className="text-sm text-text-muted">
                  {selectedTemplate
                    ? `Generate ${selectedSizes.length} creative${selectedSizes.length > 1 ? "s" : ""} using ${CREATIVE_TEMPLATES.find((t) => t.id === selectedTemplate)?.name ?? "selected"} template`
                    : `Generate ${selectedSizes.length} freestyle creative${selectedSizes.length > 1 ? "s" : ""}`}
                </p>

                {creativeError && (
                  <ErrorOrQuota error={creativeError} />
                )}

                <Button
                  onClick={handleCreativeGenerate}
                  loading={creativeLoading}
                  disabled={
                    !uploadedImage ||
                    creativeLoading ||
                    selectedSizes.length === 0
                  }
                  className="w-full"
                  size="lg"
                >
                  <Camera className="h-4 w-4" />
                  {creativeLoading
                    ? `Generating ${selectedSizes.length} creative${selectedSizes.length > 1 ? "s" : ""}...`
                    : `Generate ${selectedSizes.length} Ad Creative${selectedSizes.length > 1 ? "s" : ""}`}
                </Button>
              </CardBody>
            </Card>
          </div>

          {/* ── ROW 4: Results — full width ── */}
          {!creativeResult && !creativeLoading && (
            <Card>
              <CardBody className="flex flex-col items-center justify-center py-20 text-center">
                <div className="rounded-2xl bg-purple-50 p-4 mb-4">
                  <Camera className="h-8 w-8 text-purple-400" />
                </div>
                <h3 className="text-base font-semibold text-secondary mb-1">
                  AI Ad Creatives
                </h3>
                <p className="text-sm text-text-muted max-w-md">
                  Upload your product image, select ad sizes, and generate
                  scroll-stopping visual ad creatives. The AI analyzes your
                  product and creates conversion-focused advertising scenes.
                </p>
              </CardBody>
            </Card>
          )}

          {creativeLoading && (
            <Card>
              <CardBody className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                </div>
                <p className="mt-4 text-sm font-medium text-text-muted">
                  AI is analyzing your product and creating ad creatives...
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Generating {selectedSizes.length} creative
                  {selectedSizes.length > 1 ? "s" : ""} — this takes 30-60
                  seconds
                </p>
              </CardBody>
            </Card>
          )}

          {creativeResult && (
            <div className="space-y-4">
              {/* Analysis Card */}
              <Card>
                <CardBody className="flex items-center gap-4">
                  <div className="rounded-xl bg-purple-100 p-2.5">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-secondary">
                      {creativeResult.product_analysis.product_name}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {creativeResult.product_analysis.color} &middot;{" "}
                      {creativeResult.product_analysis.product_category}
                    </p>
                  </div>
                  <Badge
                    style={{
                      backgroundColor: `${AD_PLATFORMS[creativePlatform].color}15`,
                      color: AD_PLATFORMS[creativePlatform].color,
                    }}
                  >
                    {AD_PLATFORMS[creativePlatform].name}
                  </Badge>
                </CardBody>
              </Card>

              {/* Creative Grid — full width, larger cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {creativeResult.creatives.map((creative, i) => (
                  <Card key={creative.id}>
                    <CardBody className="space-y-3">
                      {creative.success && creative.image_base64 ? (
                        <div className="rounded-lg overflow-hidden border border-border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`data:image/png;base64,${creative.image_base64}`}
                            alt={`${creative.size} ad creative`}
                            className="w-full h-auto"
                          />
                        </div>
                      ) : (
                        <div className="rounded-lg border border-red-200 bg-red-50 flex flex-col items-center justify-center py-16 px-4">
                          <p className="text-sm text-red-600 font-medium">
                            Failed to generate
                          </p>
                          {creative.error && (
                            <p className="text-xs text-red-500 mt-1 text-center">
                              {creative.error}
                            </p>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="primary">
                            {creative.size}
                          </Badge>
                          {selectedTemplate && (
                            <Badge>
                              {CREATIVE_TEMPLATES.find(
                                (t) => t.id === selectedTemplate,
                              )?.name ?? "Template"}
                            </Badge>
                          )}
                        </div>
                        {creative.success && creative.image_base64 && (
                          <a
                            href={`data:image/png;base64,${creative.image_base64}`}
                            download={`ad_creative_${creative.size}_${i + 1}.png`}
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
                          {creative.prompt_used}
                        </p>
                      </details>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Template Preview Modal with navigation + selection */}
      {previewTemplateId && (() => {
        const tpl = CREATIVE_TEMPLATES.find((t) => t.id === previewTemplateId);
        if (!tpl) return null;
        const visible = CREATIVE_TEMPLATES.filter(
          (t) => templateCategory === "all" || t.category === templateCategory
        );
        return (
          <TemplatePreviewModal
            current={{ id: tpl.id, src: tpl.preview, name: tpl.name, description: tpl.description }}
            items={visible.map((t) => ({ id: t.id, src: t.preview, name: t.name, description: t.description }))}
            selectedId={selectedTemplate}
            onNavigate={(item) => setPreviewTemplateId(item.id)}
            onSelect={(item) => {
              setSelectedTemplate(item.id);
              setPreviewTemplateId(null);
              setTemplatesExpanded(false);
            }}
            onClose={() => setPreviewTemplateId(null)}
          />
        );
      })()}
    </div>
  );
}
