"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { SOCIAL_PLATFORMS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ErrorOrQuota, getQuotaMessage } from "@/components/shared/quota-exceeded";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CopyButton } from "@/components/shared/copy-button";
import type { SocialGenerateRequest, SocialResponse } from "@/types/api";
import { Share2, Sparkles, ArrowLeft, ImageIcon } from "lucide-react";
import Link from "next/link";

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
  const [generateImage, setGenerateImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SocialResponse | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) return;

    setError("");
    setLoading(true);
    setResult(null);

    try {
      const payload: SocialGenerateRequest = {
        platform,
        product_name: productName,
        product_details: productDetails,
        tone,
        generate_image: generateImage,
      };

      const data = (await api.generateSocial(
        payload,
        session.access_token,
      )) as SocialResponse;

      setResult(data);
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
    <div className="max-w-5xl mx-auto space-y-6">
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
            Generate Social Content
          </h1>
          <p className="text-text-muted mt-1">
            Create engaging social media posts for your products
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
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

              {/* Generate image toggle */}
              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div className="flex items-center gap-3">
                  <ImageIcon className="h-5 w-5 text-text-muted" />
                  <div>
                    <p className="text-sm font-medium text-text">
                      Generate image too
                    </p>
                    <p className="text-xs text-text-muted">
                      AI will create a matching social media image
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGenerateImage(!generateImage)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer",
                    generateImage ? "bg-primary" : "bg-slate-200",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm",
                      generateImage ? "translate-x-6" : "translate-x-1",
                    )}
                  />
                </button>
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

        {/* Result */}
        <div className="space-y-4">
          {!result && !loading && (
            <Card>
              <CardBody className="flex flex-col items-center justify-center py-20 text-center">
                <div className="rounded-2xl bg-pink-50 p-4 mb-4">
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
              <CardBody className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-pink-100 border-t-pink-500 animate-spin" />
                </div>
                <p className="mt-4 text-sm font-medium text-text-muted">
                  Creating your social post...
                </p>
                <p className="text-xs text-text-muted mt-1">
                  This usually takes 5-10 seconds
                </p>
              </CardBody>
            </Card>
          )}

          {result && (
            <>
              {/* Image preview if generated */}
              {result.image_url && (
                <Card>
                  <CardBody>
                    <div className="rounded-xl overflow-hidden border border-border">
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

              {/* Caption */}
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-secondary">
                    Caption
                  </h3>
                  <CopyButton text={result.caption} />
                </CardHeader>
                <CardBody>
                  <div className="rounded-lg bg-surface-alt p-4">
                    <p className="text-sm text-text leading-relaxed whitespace-pre-line">
                      {result.caption}
                    </p>
                  </div>
                </CardBody>
              </Card>

              {/* Hashtags */}
              {result.hashtags && result.hashtags.length > 0 && (
                <Card>
                  <CardHeader className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-secondary">
                      Hashtags
                    </h3>
                    <CopyButton text={result.hashtags.join(" ")} />
                  </CardHeader>
                  <CardBody>
                    <div className="flex flex-wrap gap-2">
                      {result.hashtags.map((tag, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-pink-50 border border-pink-100 px-3 py-1 text-xs font-medium text-pink-700"
                        >
                          {tag.startsWith("#") ? tag : `#${tag}`}
                        </span>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* CTA */}
              {result.cta_text && (
                <Card>
                  <CardHeader className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-secondary">
                      Call to Action
                    </h3>
                    <CopyButton text={result.cta_text} />
                  </CardHeader>
                  <CardBody>
                    <p className="text-sm font-medium text-primary">
                      {result.cta_text}
                    </p>
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
