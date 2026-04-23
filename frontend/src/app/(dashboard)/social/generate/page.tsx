"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { SOCIAL_PLATFORMS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ErrorOrQuota, getQuotaMessage } from "@/components/shared/quota-exceeded";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CopyButton } from "@/components/shared/copy-button";
import { HistoryPanel } from "@/components/shared/history-panel";
import type { SocialGenerateRequest, SocialResponse } from "@/types/api";
import { Share2, Sparkles, ArrowLeft, ImageIcon, Upload, X, Type, Wand2 } from "lucide-react";
import Link from "next/link";

type ImageMode = "none" | "upload" | "generate";

type SocialPlatform = keyof typeof SOCIAL_PLATFORMS;

const platformEntries = Object.entries(SOCIAL_PLATFORMS) as [
  SocialPlatform,
  (typeof SOCIAL_PLATFORMS)[SocialPlatform],
][];

const tones = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "playful", label: "Playful" },
  { value: "luxurious", label: "Luxurious" },
  { value: "urgent", label: "Urgent" },
  { value: "educational", label: "Educational" },
];

export default function SocialGeneratePage() {
  const { session } = useAuth();
  const [platform, setPlatform] = useState<SocialPlatform>("instagram");
  const [productName, setProductName] = useState("");
  const [productDetails, setProductDetails] = useState("");
  const [tone, setTone] = useState("casual");
  const [imageMode, setImageMode] = useState<ImageMode>("none");
  const [uploadedBase64, setUploadedBase64] = useState<string>("");
  const [uploadedPreview, setUploadedPreview] = useState<string>("");
  const [uploadedName, setUploadedName] = useState<string>("");
  const [uploadError, setUploadError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SocialResponse | null>(null);
  const [history, setHistory] = useState<SocialResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    if (!session?.access_token) return;
    (async () => {
      try {
        const data = await api.getSocialPosts(session.access_token, 1) as SocialResponse[] | { items: SocialResponse[] };
        const items = Array.isArray(data) ? data : (data.items || []);
        setHistory(items);
        if (!result && items.length > 0) setResult(items[0]);
      } catch {}
      finally { setHistoryLoading(false); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token]);

  const compressImage = (file: File): Promise<{ base64: string; dataUrl: string }> =>
    new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const MAX = 1200;
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
        const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
        resolve({ base64: dataUrl.split(",")[1], dataUrl });
      };
      img.onerror = () => reject(new Error("Load failed"));
      img.src = URL.createObjectURL(file);
    });

  const handleFile = async (file: File) => {
    setUploadError("");
    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image (PNG, JPG, WebP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image must be under 10MB.");
      return;
    }
    try {
      const { base64, dataUrl } = await compressImage(file);
      setUploadedBase64(base64);
      setUploadedPreview(dataUrl);
      setUploadedName(file.name);
    } catch {
      setUploadError("Could not process that file. Try another.");
    }
  };

  const clearUpload = () => {
    setUploadedBase64("");
    setUploadedPreview("");
    setUploadedName("");
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) return;

    // If user chose "upload" but didn't upload → prompt them.
    if (imageMode === "upload" && !uploadedBase64) {
      setError("Please upload an image or choose a different option.");
      return;
    }

    setError("");
    setLoading(true);
    setResult(null);

    try {
      const payload: SocialGenerateRequest = {
        platform,
        product_name: productName,
        product_details: productDetails,
        tone,
        generate_image: imageMode === "generate",
        uploaded_image_base64: imageMode === "upload" ? uploadedBase64 : undefined,
      };

      const data = (await api.generateSocial(
        payload,
        session.access_token,
      )) as SocialResponse;

      setResult(data);
      setHistory((h) => [data, ...h.filter((x) => x.id !== data.id)]);
    } catch (err) {
      const quotaMsg = getQuotaMessage(err);
      setError(
        quotaMsg || (err instanceof Error ? err.message : "Failed to generate social content. Please try again."),
      );
    } finally {
      setLoading(false);
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
            Generate Social Content
          </h1>
          <p className="text-text-muted mt-0.5 text-sm">
            Create engaging social media posts for your products
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
        {/* Form + History */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pb-4 lg:pr-1">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-secondary flex items-center gap-2">
              <Share2 className="h-5 w-5 text-pink-600" />
              Post Settings
            </h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleGenerate} className="space-y-5">
              {/* Platform selector */}
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Platform
                </label>
                <div className="flex gap-2">
                  {platformEntries.map(([key, plat]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPlatform(key)}
                      className={cn(
                        "flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                        platform === key
                          ? "border-transparent shadow-sm"
                          : "border-border bg-white text-text-muted hover:bg-surface-alt",
                      )}
                      style={
                        platform === key
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
                placeholder="e.g., Wireless Earbuds Pro"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />

              <Textarea
                label="Product Details"
                placeholder="Key features, benefits, what makes it special..."
                value={productDetails}
                onChange={(e) => setProductDetails(e.target.value)}
                required
              />

              {/* Tone selector */}
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Tone
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {tones.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTone(t.value)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer",
                        tone === t.value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-text-muted hover:bg-surface-alt hover:text-text",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image option — three-way picker */}
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Image
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { key: "none",     label: "Text only",  icon: Type,      hint: "No image" },
                    { key: "upload",   label: "Upload",     icon: Upload,    hint: "Your photo · free" },
                    { key: "generate", label: "AI image",   icon: Wand2,     hint: "Uses image quota" },
                  ] as const).map((opt) => {
                    const active = imageMode === opt.key;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          setImageMode(opt.key);
                          setUploadError("");
                          if (opt.key !== "upload") clearUpload();
                        }}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-center transition-all cursor-pointer",
                          active
                            ? "border-pink-400 bg-pink-50 dark:bg-pink-950/30"
                            : "border-border bg-white dark:bg-transparent hover:bg-surface-alt",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4",
                            active ? "text-pink-600" : "text-text-muted",
                          )}
                        />
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            active ? "text-pink-700 dark:text-pink-300" : "text-text",
                          )}
                        >
                          {opt.label}
                        </span>
                        <span className="text-[10px] text-text-muted leading-tight">
                          {opt.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Upload widget (shown only in upload mode) */}
                {imageMode === "upload" && (
                  <div className="mt-3">
                    {!uploadedPreview ? (
                      <div
                        onDrop={(e) => {
                          e.preventDefault();
                          const f = e.dataTransfer.files?.[0];
                          if (f) handleFile(f);
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-pink-400 hover:bg-pink-50/50 dark:hover:bg-pink-950/10 transition-colors"
                      >
                        <Upload className="h-6 w-6 mx-auto text-text-muted mb-1.5" />
                        <p className="text-xs font-medium text-secondary">
                          Drop an image or click to browse
                        </p>
                        <p className="text-[10px] text-text-muted mt-0.5">
                          PNG, JPG, WebP · up to 10MB
                        </p>
                      </div>
                    ) : (
                      <div className="relative rounded-lg overflow-hidden border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={uploadedPreview}
                          alt="Upload preview"
                          className="w-full max-h-48 object-cover"
                        />
                        <button
                          type="button"
                          onClick={clearUpload}
                          className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                          aria-label="Remove image"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <p className="absolute bottom-1 left-2 text-[10px] text-white bg-black/50 rounded px-1.5 py-0.5 max-w-[70%] truncate">
                          {uploadedName}
                        </p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f);
                      }}
                      className="hidden"
                    />
                    {uploadError && (
                      <p className="mt-2 text-[11px] text-red-600 dark:text-red-400">
                        {uploadError}
                      </p>
                    )}
                  </div>
                )}

                {imageMode === "generate" && (
                  <p className="mt-2 text-[11px] text-text-muted flex items-center gap-1.5">
                    <ImageIcon className="h-3 w-3" />
                    Uses 1 slot from your monthly image quota.
                  </p>
                )}
              </div>

              {error && <ErrorOrQuota error={error} />}

              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
              >
                <Sparkles className="h-4 w-4" />
                {loading ? "Generating..." : "Generate Social Post"}
              </Button>
            </form>
          </CardBody>
        </Card>

        <HistoryPanel
          items={history.map((s) => ({
            id: s.id,
            label: s.caption?.slice(0, 60) || "Social post",
            subtitle: `${s.platform} · ${s.hashtags?.length || 0} hashtags`,
            timestamp: (s as { created_at?: string }).created_at,
          }))}
          activeId={result?.id}
          loading={historyLoading}
          onSelect={(id) => {
            const found = history.find((s) => s.id === id);
            if (found) setResult(found);
          }}
          title="Recent Posts"
          emptyText="No social posts yet."
          accentColor="pink"
        />
        </div>

        {/* Result */}
        <div className="space-y-4 min-w-0">
          {!result && !loading && (
            <Card>
              <CardBody className="flex flex-col items-center justify-center py-24 text-center">
                <div className="rounded-2xl bg-pink-50 dark:bg-pink-950/30 p-4 mb-4">
                  <Share2 className="h-8 w-8 text-pink-400" />
                </div>
                <h3 className="text-base font-semibold text-secondary mb-1">
                  Your social post will appear here
                </h3>
                <p className="text-sm text-text-muted max-w-xs">
                  Select a platform, describe your product, and generate
                  engaging social content.
                </p>
              </CardBody>
            </Card>
          )}

          {loading && (
            <Card>
              <CardBody className="flex flex-col items-center justify-center py-24">
                <div className="h-14 w-14 rounded-full border-4 border-pink-100 dark:border-pink-900/30 border-t-pink-500 animate-spin" />
                <p className="mt-5 text-sm font-semibold text-secondary">
                  Creating your social post...
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Typically 5-10 seconds
                </p>
              </CardBody>
            </Card>
          )}

          {result && (
            <>
              {/* Caption hero + sidebar (image, CTA) */}
              <div className={cn(
                "grid grid-cols-1 gap-4",
                result.image_url ? "xl:grid-cols-[1fr_380px]" : ""
              )}>
                {/* Caption */}
                <Card>
                  <CardHeader className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-secondary flex items-center gap-2">
                      <Share2 className="h-4 w-4 text-pink-600" />
                      Caption
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-muted">
                        {result.caption.length} chars
                      </span>
                      <CopyButton text={result.caption} />
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="rounded-lg bg-surface-alt dark:bg-white/5 p-4 border border-border/50">
                      <p className="text-sm text-text leading-relaxed whitespace-pre-line">
                        {result.caption}
                      </p>
                    </div>
                    {/* CTA inline */}
                    {result.cta_text && (
                      <div className="mt-3 rounded-lg border border-pink-200 dark:border-pink-900/50 bg-pink-50 dark:bg-pink-950/30 p-3 flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-pink-700 dark:text-pink-400 mb-1">
                            Call to Action
                          </p>
                          <p className="text-sm font-semibold text-secondary">
                            {result.cta_text}
                          </p>
                        </div>
                        <CopyButton text={result.cta_text} />
                      </div>
                    )}
                  </CardBody>
                </Card>

                {/* Image preview if generated */}
                {result.image_url && (
                  <Card>
                    <CardHeader>
                      <h3 className="text-sm font-semibold text-secondary">Image</h3>
                    </CardHeader>
                    <CardBody>
                      <div className="rounded-lg overflow-hidden border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={result.image_url}
                          alt="Generated social media image"
                          className="w-full h-auto"
                        />
                      </div>
                    </CardBody>
                  </Card>
                )}
              </div>

              {/* Hashtags */}
              {result.hashtags && result.hashtags.length > 0 && (
                <Card>
                  <CardHeader className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-secondary">
                      Hashtags ({result.hashtags.length})
                    </h3>
                    <CopyButton text={result.hashtags.join(" ")} />
                  </CardHeader>
                  <CardBody>
                    <div className="flex flex-wrap gap-1.5">
                      {result.hashtags.map((tag, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-pink-50 dark:bg-pink-950/30 border border-pink-100 dark:border-pink-900/50 px-2.5 py-0.5 text-xs font-medium text-pink-700 dark:text-pink-300"
                        >
                          {tag.startsWith("#") ? tag : `#${tag}`}
                        </span>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
