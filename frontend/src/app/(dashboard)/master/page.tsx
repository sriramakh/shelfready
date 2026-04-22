"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CopyButton } from "@/components/shared/copy-button";
import { ErrorOrQuota, getQuotaMessage } from "@/components/shared/quota-exceeded";
import {
  ArrowLeft, Upload, X, Sparkles, FileText, Camera, Image as ImageIcon,
  Share2, Megaphone, Search, Check, AlertTriangle, Loader2, Package,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type FeatureKey = "listing" | "photoshoot" | "image" | "social" | "ads" | "research";

interface FeatureDef {
  key: FeatureKey;
  label: string;
  description: string;
  icon: typeof FileText;
  color: string;
  bg: string;
  border: string;
}

const FEATURES: FeatureDef[] = [
  { key: "listing",    label: "Marketplace Listing", description: "Title, bullets, description, keywords", icon: FileText,  color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-950/30",       border: "border-blue-300 dark:border-blue-900" },
  { key: "photoshoot", label: "AI Photoshoot",        description: "4-angle studio/outdoor/model/context",  icon: Camera,    color: "text-purple-600",  bg: "bg-purple-50 dark:bg-purple-950/30",   border: "border-purple-300 dark:border-purple-900" },
  { key: "image",      label: "Hero Image",            description: "Single lifestyle product image",        icon: ImageIcon, color: "text-pink-600",    bg: "bg-pink-50 dark:bg-pink-950/30",       border: "border-pink-300 dark:border-pink-900" },
  { key: "social",     label: "Social Post",           description: "Caption + hashtags + CTA",              icon: Share2,    color: "text-rose-600",    bg: "bg-rose-50 dark:bg-rose-950/30",       border: "border-rose-300 dark:border-rose-900" },
  { key: "ads",        label: "Ad Copy",               description: "3 variants for Facebook/Google",        icon: Megaphone, color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-950/30",     border: "border-amber-300 dark:border-amber-900" },
  { key: "research",   label: "Market Research",       description: "Competitor + keyword intelligence",     icon: Search,    color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-300 dark:border-emerald-900" },
];

interface ProductInfo {
  product_name: string;
  product_category: string;
  key_features: string[];
  target_audience: string;
  suggested_platforms: string[];
  description: string;
  color: string;
  materials: string;
}

type FeatureStatus = "idle" | "loading" | "success" | "error";

interface FeatureState {
  status: FeatureStatus;
  data?: unknown;
  error?: string;
}

export default function MasterPage() {
  const { session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageBase64, setImageBase64] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [fileName, setFileName] = useState("");
  const [description, setDescription] = useState("");
  const [marketplace, setMarketplace] = useState<"amazon" | "etsy" | "shopify">("amazon");
  const [socialPlatform, setSocialPlatform] = useState<"instagram" | "facebook" | "pinterest">("instagram");
  const [adPlatform, setAdPlatform] = useState<"facebook" | "google">("facebook");

  const [selected, setSelected] = useState<Set<FeatureKey>>(
    new Set(FEATURES.map((f) => f.key)),
  );

  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [topError, setTopError] = useState("");

  const [features, setFeatures] = useState<Record<FeatureKey, FeatureState>>(
    Object.fromEntries(FEATURES.map((f) => [f.key, { status: "idle" as FeatureStatus }])) as Record<FeatureKey, FeatureState>,
  );

  const anyRunning = extracting || Object.values(features).some((f) => f.status === "loading");

  const compressImage = (file: File): Promise<{ base64: string; dataUrl: string }> =>
    new Promise((resolve, reject) => {
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
        if (!ctx) return reject(new Error("Canvas unsupported"));
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        resolve({ base64: dataUrl.split(",")[1], dataUrl });
      };
      img.onerror = () => reject(new Error("Load failed"));
      img.src = URL.createObjectURL(file);
    });

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setTopError("Please upload an image (PNG, JPG, WebP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setTopError("Image must be under 10MB.");
      return;
    }
    try {
      const { base64, dataUrl } = await compressImage(file);
      setImageBase64(base64);
      setPreviewUrl(dataUrl);
      setFileName(file.name);
      setTopError("");
    } catch {
      setTopError("Could not process this image. Try a different file.");
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const resetImage = () => {
    setImageBase64("");
    setPreviewUrl("");
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleFeature = (key: FeatureKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const dispatchFeature = async (key: FeatureKey, info: ProductInfo) => {
    if (!session?.access_token) return;
    const token = session.access_token;
    setFeatures((prev) => ({ ...prev, [key]: { status: "loading" } }));

    const details =
      (description.trim() || info.description || info.key_features.join(", "))
        .slice(0, 2999) || info.product_name;
    const longDetails =
      (description.trim() || info.description || info.key_features.join(", "))
        .slice(0, 4999) || info.product_name;

    try {
      let data: unknown;
      if (key === "listing") {
        data = await api.generateListing({
          platform: marketplace,
          product_name: info.product_name.slice(0, 200) || "Product",
          product_details: longDetails.length >= 10 ? longDetails : `${info.product_name}. ${longDetails}`,
          target_audience: info.target_audience.slice(0, 500),
          category: info.product_category.slice(0, 200),
        }, token);
      } else if (key === "social") {
        data = await api.generateSocial({
          platform: socialPlatform,
          product_name: info.product_name.slice(0, 200) || "Product",
          product_details: details.length >= 10 ? details : `${info.product_name}. ${details}`,
          generate_image: false,
          tone: "professional",
        }, token);
      } else if (key === "ads") {
        data = await api.generateAds({
          ad_platform: adPlatform,
          product_name: info.product_name.slice(0, 200) || "Product",
          product_details: details.length >= 10 ? details : `${info.product_name}. ${details}`,
          target_audience: info.target_audience.slice(0, 500),
          num_variants: 3,
        }, token);
      } else if (key === "research") {
        const q = info.product_category
          ? `${description.trim() || info.product_name} in ${info.product_category}`
          : (description.trim() || info.product_name);
        data = await api.searchResearch({ query: q.slice(0, 499) }, token);
      } else if (key === "image") {
        data = await api.generateImage({
          description: (details || info.product_name).slice(0, 1999),
          aspect_ratio: "1:1",
          image_type: "lifestyle",
          style: "photorealistic",
        }, token);
      } else if (key === "photoshoot") {
        // Photoshoot uses the raw uploaded image directly
        const resp = await fetch(`${API_URL}/api/v1/photoshoot/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            image_base64: imageBase64,
            themes: ["studio", "outdoor", "model", "context"],
            aspect_ratio: "1:1",
          }),
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.detail || `Server error ${resp.status}`);
        }
        data = await resp.json();
      }
      setFeatures((prev) => ({ ...prev, [key]: { status: "success", data } }));
    } catch (err) {
      const quotaMsg = getQuotaMessage(err);
      const msg = quotaMsg || (err instanceof Error ? err.message : "Generation failed.");
      setFeatures((prev) => ({ ...prev, [key]: { status: "error", error: msg } }));
    }
  };

  const handleGenerate = async () => {
    if (!imageBase64 || !session?.access_token) {
      setTopError("Upload a product image first.");
      return;
    }
    if (selected.size === 0) {
      setTopError("Pick at least one feature to generate.");
      return;
    }
    setTopError("");
    setProduct(null);
    setFeatures(
      Object.fromEntries(FEATURES.map((f) => [f.key, { status: "idle" as FeatureStatus }])) as Record<FeatureKey, FeatureState>,
    );

    setExtracting(true);
    try {
      const resp = (await api.masterExtract(
        { image_base64: imageBase64, description: description.trim() },
        session.access_token,
      )) as { product: ProductInfo };
      setProduct(resp.product);
      setExtracting(false);

      // Fan out selected features in parallel.
      await Promise.all(
        Array.from(selected).map((key) => dispatchFeature(key, resp.product)),
      );
    } catch (err) {
      setExtracting(false);
      const msg = err instanceof Error ? err.message : "Vision extraction failed.";
      setTopError(msg);
    }
  };

  const canSubmit = !!imageBase64 && selected.size > 0 && !anyRunning;

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
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-secondary flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Master Suite
          </h1>
          <p className="text-text-muted mt-0.5 text-sm">
            Upload one product image. Get a listing, photoshoot, social post, ad copy, and market research — all at once.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5">
        {/* Sidebar — inputs */}
        <div className="space-y-4">
          <Card className="sticky top-20">
            <CardHeader>
              <h2 className="text-sm font-semibold text-secondary">Input</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              {/* Upload area */}
              {!previewUrl ? (
                <div
                  onDrop={onDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-surface-alt/50 transition-colors"
                >
                  <Upload className="h-8 w-8 mx-auto text-text-muted mb-2" />
                  <p className="text-sm font-medium text-secondary">Drop image or click to upload</p>
                  <p className="text-[11px] text-text-muted mt-1">PNG, JPG, WebP · up to 10MB</p>
                </div>
              ) : (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Upload" className="w-full rounded-xl border border-border" />
                  <button
                    onClick={resetImage}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <p className="text-[11px] text-text-muted mt-1.5 truncate">{fileName}</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="hidden"
              />

              <Textarea
                label="Description (optional)"
                placeholder="Leave blank to let AI describe the product from the image, or add anything specific (e.g., 'handcrafted in Vermont, $45 retail')."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />

              {/* Platforms */}
              <div className="grid grid-cols-3 gap-2">
                <PlatformSelect
                  label="Marketplace"
                  value={marketplace}
                  onChange={(v) => setMarketplace(v as typeof marketplace)}
                  options={[
                    { value: "amazon", label: "Amazon" },
                    { value: "etsy", label: "Etsy" },
                    { value: "shopify", label: "Shopify" },
                  ]}
                />
                <PlatformSelect
                  label="Social"
                  value={socialPlatform}
                  onChange={(v) => setSocialPlatform(v as typeof socialPlatform)}
                  options={[
                    { value: "instagram", label: "Instagram" },
                    { value: "facebook", label: "Facebook" },
                    { value: "pinterest", label: "Pinterest" },
                  ]}
                />
                <PlatformSelect
                  label="Ad"
                  value={adPlatform}
                  onChange={(v) => setAdPlatform(v as typeof adPlatform)}
                  options={[
                    { value: "facebook", label: "Meta" },
                    { value: "google", label: "Google" },
                  ]}
                />
              </div>

              {/* Feature checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-secondary">Generate</p>
                  <button
                    onClick={() =>
                      setSelected(
                        selected.size === FEATURES.length
                          ? new Set()
                          : new Set(FEATURES.map((f) => f.key)),
                      )
                    }
                    className="text-[11px] text-primary hover:underline"
                  >
                    {selected.size === FEATURES.length ? "Clear all" : "Select all"}
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {FEATURES.map((f) => {
                    const isOn = selected.has(f.key);
                    const Icon = f.icon;
                    return (
                      <button
                        key={f.key}
                        onClick={() => toggleFeature(f.key)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors",
                          isOn ? `${f.border} ${f.bg}` : "border-border bg-surface hover:bg-surface-alt",
                        )}
                      >
                        <Icon className={cn("h-4 w-4 flex-shrink-0", isOn ? f.color : "text-text-muted")} />
                        <div className="flex-1 min-w-0">
                          <p className={cn("font-semibold truncate", isOn ? "text-secondary" : "text-text")}>
                            {f.label}
                          </p>
                          <p className="text-[10px] text-text-muted truncate">{f.description}</p>
                        </div>
                        <div
                          className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                            isOn ? "border-primary bg-primary" : "border-border",
                          )}
                        >
                          {isOn && <Check className="h-3 w-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {topError && <ErrorOrQuota error={topError} />}

              <Button
                onClick={handleGenerate}
                disabled={!canSubmit}
                loading={anyRunning}
                className="w-full"
                size="lg"
              >
                <Sparkles className="h-4 w-4" />
                {anyRunning ? "Generating…" : `Generate ${selected.size} output${selected.size === 1 ? "" : "s"}`}
              </Button>

              <p className="text-[11px] text-text-muted leading-relaxed">
                Vision extracts product info (~5s), then each selected feature runs in parallel. Cards stream in as they finish.
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Results column */}
        <div className="space-y-4 min-w-0">
          {/* Product card */}
          {(extracting || product) && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-secondary flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Product Analysis
                </h3>
              </CardHeader>
              <CardBody>
                {extracting && (
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing your image with Grok vision…
                  </div>
                )}
                {product && !extracting && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <Field k="Name" v={product.product_name} />
                    <Field k="Category" v={product.product_category} />
                    <Field k="Color" v={product.color} />
                    <Field k="Materials" v={product.materials} />
                    <Field k="Audience" v={product.target_audience} full />
                    {product.key_features.length > 0 && (
                      <Field k="Features" v={product.key_features.join(" · ")} full />
                    )}
                    {product.description && <Field k="Auto-description" v={product.description} full />}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Feature result cards */}
          {product && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {FEATURES.filter((f) => selected.has(f.key)).map((f) => (
                <FeatureCard key={f.key} feature={f} state={features[f.key]} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!extracting && !product && (
            <Card>
              <CardBody className="py-16 text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-secondary mb-1">One image → six outputs</h3>
                <p className="text-sm text-text-muted max-w-md mx-auto">
                  Upload a product photo on the left. We'll extract its details once, then run every feature you pick in parallel.
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ k, v, full }: { k: string; v: string; full?: boolean }) {
  if (!v) return null;
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{k}</p>
      <p className="text-text">{v}</p>
    </div>
  );
}

function PlatformSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1 block">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-xs rounded-lg border border-border bg-surface px-2 py-1.5 text-text"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FeatureCard({ feature, state }: { feature: FeatureDef; state: FeatureState }) {
  const Icon = feature.icon;
  return (
    <Card className={cn("overflow-hidden", feature.border)}>
      <CardHeader className={cn("flex items-center justify-between", feature.bg)}>
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", feature.color)} />
          <h3 className="text-sm font-semibold text-secondary">{feature.label}</h3>
        </div>
        <StatusBadge status={state.status} />
      </CardHeader>
      <CardBody>
        {state.status === "idle" && (
          <p className="text-xs text-text-muted">Queued.</p>
        )}
        {state.status === "loading" && (
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating…
          </div>
        )}
        {state.status === "error" && (
          <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p className="break-words">{state.error}</p>
          </div>
        )}
        {state.status === "success" && state.data !== undefined && (
          <FeatureResult featureKey={feature.key} data={state.data} />
        )}
      </CardBody>
    </Card>
  );
}

function StatusBadge({ status }: { status: FeatureStatus }) {
  const map: Record<FeatureStatus, { label: string; cls: string }> = {
    idle: { label: "Queued", cls: "bg-surface-alt text-text-muted" },
    loading: { label: "Running", cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" },
    success: { label: "Ready", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" },
    error: { label: "Failed", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" },
  };
  const m = map[status];
  return (
    <span className={cn("text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5", m.cls)}>
      {m.label}
    </span>
  );
}

function FeatureResult({ featureKey, data }: { featureKey: FeatureKey; data: unknown }) {
  const d = data as Record<string, unknown>;

  if (featureKey === "listing") {
    return (
      <div className="space-y-3 text-sm">
        <ResultBlock label="Title" text={String(d.generated_title || "")} />
        {Array.isArray(d.generated_bullets) && (
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Bullets</p>
              <CopyButton text={(d.generated_bullets as string[]).join("\n")} />
            </div>
            <ul className="mt-1 space-y-1 list-disc list-inside text-text">
              {(d.generated_bullets as string[]).map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </div>
        )}
        <ResultBlock label="Description" text={String(d.generated_description || "")} />
        {Array.isArray(d.generated_keywords) && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Keywords</p>
            <p className="text-xs text-text mt-1">{(d.generated_keywords as string[]).join(", ")}</p>
          </div>
        )}
      </div>
    );
  }

  if (featureKey === "social") {
    return (
      <div className="space-y-2 text-sm">
        <ResultBlock label="Caption" text={String(d.caption || "")} />
        {Array.isArray(d.hashtags) && (
          <p className="text-xs text-primary">{(d.hashtags as string[]).join(" ")}</p>
        )}
        {d.cta_text ? <p className="text-xs text-text-muted">CTA: {String(d.cta_text)}</p> : null}
      </div>
    );
  }

  if (featureKey === "ads") {
    const variants = Array.isArray(d.variants) ? (d.variants as Record<string, string>[]) : [];
    return (
      <div className="space-y-3">
        {variants.map((v, i) => (
          <div key={i} className="rounded-lg border border-border p-3 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{v.variant_label || `Variant ${i + 1}`}</p>
            <p className="text-sm font-semibold text-secondary">{v.headline}</p>
            <p className="text-xs text-text">{v.primary_text}</p>
            <p className="text-[11px] text-text-muted">{v.description} · CTA: {v.cta}</p>
          </div>
        ))}
      </div>
    );
  }

  if (featureKey === "research") {
    const competitors = Array.isArray(d.competitors) ? (d.competitors as { name?: string }[]) : [];
    const keywords = Array.isArray(d.keywords_found) ? (d.keywords_found as string[]) : [];
    return (
      <div className="space-y-2 text-sm">
        <p className="text-xs text-text-muted">
          {competitors.length} competitors · {keywords.length} keywords
        </p>
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {keywords.slice(0, 10).map((k, i) => (
              <span key={i} className="text-[11px] rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5">
                {k}
              </span>
            ))}
          </div>
        )}
        <Link
          href={`/research?id=${d.id}`}
          className="text-xs text-primary hover:underline inline-block mt-1"
        >
          View full analysis →
        </Link>
      </div>
    );
  }

  if (featureKey === "image") {
    const url = String(d.public_url || "");
    if (!url) return <p className="text-xs text-text-muted">Image generated but no URL returned.</p>;
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Generated" className="w-full rounded-lg border border-border hover:opacity-90 transition-opacity" />
      </a>
    );
  }

  if (featureKey === "photoshoot") {
    const images = Array.isArray(d.images) ? (d.images as { public_url?: string; theme?: string; success?: boolean }[]) : [];
    const ok = images.filter((i) => i.success && i.public_url);
    if (ok.length === 0) return <p className="text-xs text-text-muted">No images returned.</p>;
    return (
      <div className="grid grid-cols-2 gap-2">
        {ok.map((img, i) => (
          <a key={i} href={img.public_url} target="_blank" rel="noopener noreferrer" className="block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.public_url} alt={img.theme || ""} className="w-full aspect-square object-cover rounded-lg border border-border hover:opacity-90 transition-opacity" />
            <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">{img.theme}</p>
          </a>
        ))}
      </div>
    );
  }

  return null;
}

function ResultBlock({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</p>
        <CopyButton text={text} />
      </div>
      <p className="text-text mt-1 whitespace-pre-wrap">{text}</p>
    </div>
  );
}
