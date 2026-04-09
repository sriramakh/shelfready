"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import {
  Package, FileText, Image, Share2, Megaphone, Search, Camera,
  Upload, Play, Pause, SkipForward, ChevronRight, Check, Sparkles,
  Loader2, ArrowRight, X, Circle, Square, Download, Volume2, VolumeX, Music, Film,
} from "lucide-react";
import { playKeyTick, playClick, playSuccess, playProcessing, createBGM } from "@/lib/audio-engine";

/* ─── Types ─────────────────────────────────────────────────────────── */

interface GeneratedData {
  listing: any;
  social: any;
  ads: any;
  research: any;
  photoshoot: any;
  creative: any;
}

interface ToolConfig {
  id: keyof GeneratedData;
  label: string;
  icon: typeof FileText;
  color: string;
  inputLabel: string;
}

const TOOLS: ToolConfig[] = [
  { id: "listing", label: "Listing Optimizer", icon: FileText, color: "#3b82f6", inputLabel: "Generate Amazon listing for:" },
  { id: "photoshoot", label: "Product Photoshoot", icon: Camera, color: "#8b5cf6", inputLabel: "Generate photoshoot for:" },
  { id: "creative", label: "Ad Creatives", icon: Image, color: "#f59e0b", inputLabel: "Create ad creatives for:" },
  { id: "social", label: "Social Content", icon: Share2, color: "#ec4899", inputLabel: "Write Instagram post for:" },
  { id: "ads", label: "Ad Copy", icon: Megaphone, color: "#f97316", inputLabel: "Generate Facebook ad copy for:" },
  { id: "research", label: "Market Research", icon: Search, color: "#10b981", inputLabel: "Research market for:" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/* ─── Presentation Components ───────────────────────────────────────── */

function TypeWriter({ text, speed = 30, onDone }: { text: string; speed?: number; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(t);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(t);
  }, [text, speed, onDone]);
  return <>{displayed}<span className="animate-pulse">|</span></>;
}

function StreamingDots({ color, steps }: { color: string; steps: string[] }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    setCurrent(0);
    const interval = 400;
    const timers = steps.map((_, i) => setTimeout(() => setCurrent(i + 1), interval * (i + 1)));
    return () => timers.forEach(clearTimeout);
  }, [steps]);
  return (
    <div className="space-y-1.5 font-mono text-xs">
      {steps.slice(0, current).map((s, i) => (
        <p key={i} className="flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
          <span style={{ color }}>✓</span>
          <span className="text-neutral-400">{s}</span>
        </p>
      ))}
      {current < steps.length && (
        <div className="flex gap-1 mt-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Output Renderers ──────────────────────────────────────────────── */

function ListingOutput({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="space-y-3">
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Optimized Title</p>
        <p className="text-[14px] font-semibold text-white leading-snug">{data.generated_title}</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Bullet Points</p>
        {(data.generated_bullets || []).slice(0, 5).map((b: string, i: number) => (
          <p key={i} className="text-[12px] text-neutral-300 flex gap-2"><Check className="h-3.5 w-3.5 text-blue-400 flex-shrink-0 mt-0.5" />{b}</p>
        ))}
      </div>
      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1.5">Keywords</p>
        <div className="flex flex-wrap gap-1">
          {(data.generated_keywords || []).slice(0, 10).map((k: string) => (
            <span key={k} className="text-[10px] bg-blue-500/15 text-blue-300 px-2 py-0.5 rounded-full">{k}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PhotoshootOutput({ data }: { data: any }) {
  if (!data?.images) return null;
  return (
    <div className="grid grid-cols-2 gap-2">
      {data.images.filter((img: any) => img.success && img.image_base64).map((img: any, i: number) => (
        <div key={i} className="rounded-xl overflow-hidden border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/png;base64,${img.image_base64}`} alt={img.theme} className="w-full aspect-square object-cover" />
          <div className="bg-white/5 px-2 py-1">
            <p className="text-[10px] text-neutral-400 capitalize font-medium">{img.theme}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function CreativeOutput({ data }: { data: any }) {
  if (!data?.creatives) return null;
  return (
    <div className="grid grid-cols-2 gap-2">
      {data.creatives.filter((c: any) => c.success && c.image_base64).map((c: any, i: number) => (
        <div key={i} className="rounded-xl overflow-hidden border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/png;base64,${c.image_base64}`} alt={c.size} className="w-full aspect-square object-cover" />
          <div className="bg-white/5 px-2 py-1">
            <p className="text-[10px] text-neutral-400 font-medium">{c.size}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SocialOutput({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="space-y-3">
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-600" />
          <span className="text-[10px] text-pink-400 font-bold uppercase">{data.platform}</span>
        </div>
        <p className="text-[12px] text-neutral-300 leading-relaxed whitespace-pre-line">{(data.caption || "").slice(0, 300)}</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
        <p className="text-[10px] font-bold text-pink-400 uppercase tracking-wider mb-1.5">Hashtags</p>
        <div className="flex flex-wrap gap-1">
          {(data.hashtags || []).slice(0, 12).map((h: string) => (
            <span key={h} className="text-[10px] bg-pink-500/15 text-pink-300 px-2 py-0.5 rounded-full">{h}</span>
          ))}
        </div>
      </div>
      {data.cta_text && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <p className="text-[10px] font-bold text-pink-400 uppercase mb-1">CTA</p>
          <p className="text-[12px] text-neutral-300">{data.cta_text}</p>
        </div>
      )}
    </div>
  );
}

function AdsOutput({ data }: { data: any }) {
  if (!data?.variants) return null;
  return (
    <div className="space-y-2">
      {data.variants.slice(0, 3).map((v: any, i: number) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-orange-500/15 text-orange-300 mb-2 inline-block">{v.variant_label || `Variant ${i + 1}`}</span>
          <p className="text-[13px] font-bold text-white mt-1">{v.headline}</p>
          <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">{(v.primary_text || "").slice(0, 120)}...</p>
        </div>
      ))}
    </div>
  );
}

function ResearchOutput({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="space-y-3">
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Analysis</p>
        <p className="text-[12px] text-neutral-300 leading-relaxed">{(data.analysis || "").slice(0, 250)}...</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1.5">Competitors</p>
        {(data.competitors || []).slice(0, 3).map((c: any, i: number) => (
          <div key={i} className="flex justify-between py-1 border-b border-white/5 last:border-0">
            <span className="text-[11px] text-neutral-300 font-medium">{c.name}</span>
            <span className="text-[10px] text-neutral-500">{c.price_range || c.price || ""}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {(data.keywords_found || []).slice(0, 8).map((k: string) => (
          <span key={k} className="text-[10px] bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full">{k}</span>
        ))}
      </div>
    </div>
  );
}

const OUTPUT_RENDERERS: Record<string, (data: any) => React.ReactNode> = {
  listing: (d) => <ListingOutput data={d} />,
  photoshoot: (d) => <PhotoshootOutput data={d} />,
  creative: (d) => <CreativeOutput data={d} />,
  social: (d) => <SocialOutput data={d} />,
  ads: (d) => <AdsOutput data={d} />,
  research: (d) => <ResearchOutput data={d} />,
};

const STREAMING_STEPS: Record<string, string[]> = {
  listing: ["Analyzing product details...", "Optimizing for Amazon A9...", "Generating SEO title...", "Writing bullet points...", "Extracting keywords..."],
  photoshoot: ["Analyzing product shape & color...", "Selecting shot compositions...", "Generating studio shot...", "Generating lifestyle scene...", "Creating model shot..."],
  creative: ["Analyzing product for ads...", "Matching template style...", "Compositing product...", "Adding text overlays...", "Rendering creative..."],
  social: ["Crafting engaging hook...", "Generating hashtags...", "Writing call-to-action...", "Optimizing for Instagram...", "Finalizing post..."],
  ads: ["Analyzing target audience...", "Writing headline variants...", "Generating primary text...", "Creating urgency hooks...", "Finalizing ad copy..."],
  research: ["Searching 11 data sources...", "Analyzing competitors...", "Extracting pricing data...", "Finding keyword gaps...", "Generating insights..."],
};

/* ─── Main Studio Page ──────────────────────────────────────────────── */

export default function StudioPage() {
  const { session } = useAuth();
  const [productName, setProductName] = useState("");
  const [productDetails, setProductDetails] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState<Record<string, "pending" | "loading" | "done" | "error">>({});
  const [results, setResults] = useState<Partial<GeneratedData>>({});

  // Presentation state
  const [presenting, setPresenting] = useState(false);
  const [presStep, setPresStep] = useState(0);
  const [presPhase, setPresPhase] = useState<"input" | "streaming" | "output">("input");
  const [autoPlay, setAutoPlay] = useState(false);
  const autoRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Recording & Video Studio state
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [showVideoStudio, setShowVideoStudio] = useState(false);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [bgmEnabled, setBgmEnabled] = useState(true);
  const [bgmVolume, setBgmVolume] = useState(0.5);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const bgmRef = useRef<ReturnType<typeof createBGM> | null>(null);
  const stopProcessingRef = useRef<(() => void) | null>(null);

  // Lazy-init BGM (can't create AudioContext during SSR)
  const getBGM = useCallback(() => {
    if (!bgmRef.current) bgmRef.current = createBGM();
    return bgmRef.current;
  }, []);

  // Auth: check for session, handle OAuth callback, or show sign-in
  const [token, setToken] = useState("");
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (session?.access_token) {
      setToken(session.access_token);
      setAuthLoading(false);
      return;
    }

    // Try to get session from Supabase directly (handles OAuth callback hash)
    async function initAuth() {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );

        // Handle OAuth callback — exchange code for session
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code) {
          const { data } = await supabase.auth.exchangeCodeForSession(code);
          if (data.session?.access_token) {
            setToken(data.session.access_token);
            window.history.replaceState({}, "", window.location.pathname);
          }
        } else if (window.location.hash.includes("access_token")) {
          // Implicit flow fallback
          const { data } = await supabase.auth.getSession();
          if (data.session?.access_token) {
            setToken(data.session.access_token);
            window.history.replaceState({}, "", window.location.pathname);
          }
        } else {
          // Check for existing session
          const { data } = await supabase.auth.getSession();
          if (data.session?.access_token) {
            setToken(data.session.access_token);
          }
        }
      } catch {}
      setAuthLoading(false);
    }
    initAuth();
  }, [session?.access_token]);

  const signInWithGoogle = async () => {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/studio` },
      });
    } catch {}
  };

  // ── Image upload with compression ──
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      setUploadedImage(canvas.toDataURL("image/jpeg", 0.85).split(",")[1]);
    };
    img.src = URL.createObjectURL(file);
  };

  // ── Generate all 6 outputs ──
  const generateAll = async () => {
    if (!token || !productName) return;
    setGenerating(true);
    setResults({});
    const progress: Record<string, "pending" | "loading" | "done" | "error"> = {};
    TOOLS.forEach((t) => { progress[t.id] = "pending"; });
    setGenProgress({ ...progress });

    const calls: Promise<void>[] = [];

    // 1. Listing
    calls.push((async () => {
      setGenProgress((p) => ({ ...p, listing: "loading" }));
      try {
        const r = await api.generateListing({ platform: "amazon", product_name: productName, product_details: productDetails, target_audience: targetAudience, category, price_range: price }, token);
        setResults((prev) => ({ ...prev, listing: r }));
        setGenProgress((p) => ({ ...p, listing: "done" }));
      } catch { setGenProgress((p) => ({ ...p, listing: "error" })); }
    })());

    // 2. Social
    calls.push((async () => {
      setGenProgress((p) => ({ ...p, social: "loading" }));
      try {
        const r = await api.generateSocial({ platform: "instagram", product_name: productName, product_details: productDetails, tone: "casual" }, token);
        setResults((prev) => ({ ...prev, social: r }));
        setGenProgress((p) => ({ ...p, social: "done" }));
      } catch { setGenProgress((p) => ({ ...p, social: "error" })); }
    })());

    // 3. Ads
    calls.push((async () => {
      setGenProgress((p) => ({ ...p, ads: "loading" }));
      try {
        const r = await api.generateAds({ ad_platform: "facebook", product_name: productName, product_details: productDetails, target_audience: targetAudience, num_variants: 3 }, token);
        setResults((prev) => ({ ...prev, ads: r }));
        setGenProgress((p) => ({ ...p, ads: "done" }));
      } catch { setGenProgress((p) => ({ ...p, ads: "error" })); }
    })());

    // 4. Research
    calls.push((async () => {
      setGenProgress((p) => ({ ...p, research: "loading" }));
      try {
        const r = await api.searchResearch({ query: `${productName} market competitors pricing` }, token);
        setResults((prev) => ({ ...prev, research: r }));
        setGenProgress((p) => ({ ...p, research: "done" }));
      } catch { setGenProgress((p) => ({ ...p, research: "error" })); }
    })());

    // 5. Photoshoot (needs image)
    if (uploadedImage) {
      calls.push((async () => {
        setGenProgress((p) => ({ ...p, photoshoot: "loading" }));
        try {
          const resp = await fetch(`${API_URL}/api/v1/photoshoot/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ image_base64: uploadedImage, themes: ["studio", "outdoor", "model", "context"], aspect_ratio: "1:1" }),
          });
          const r = await resp.json();
          setResults((prev) => ({ ...prev, photoshoot: r }));
          setGenProgress((p) => ({ ...p, photoshoot: "done" }));
        } catch { setGenProgress((p) => ({ ...p, photoshoot: "error" })); }
      })());

      // 6. Creative (needs image)
      calls.push((async () => {
        setGenProgress((p) => ({ ...p, creative: "loading" }));
        try {
          const resp = await fetch(`${API_URL}/api/v1/creatives/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ image_base64: uploadedImage, product_name: productName, product_details: productDetails, creative_sizes: ["1080x1080", "1080x1920"], ad_platform: "facebook", content_direction: "25% off, limited time" }),
          });
          const r = await resp.json();
          setResults((prev) => ({ ...prev, creative: r }));
          setGenProgress((p) => ({ ...p, creative: "done" }));
        } catch { setGenProgress((p) => ({ ...p, creative: "error" })); }
      })());
    } else {
      setGenProgress((p) => ({ ...p, photoshoot: "done", creative: "done" }));
    }

    await Promise.allSettled(calls);
    setGenerating(false);
  };

  // ── Presentation mode ──
  const startPresentation = () => {
    setPresenting(true);
    setPresStep(0);
    setPresPhase("input");
    setAutoPlay(true);
    if (bgmEnabled) getBGM().start();
  };

  // ── Recording controls ──
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" } as any,
        audio: true,
      });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        setShowVideoStudio(true);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
      // Auto-start presentation
      startPresentation();
    } catch {
      // User cancelled screen picker
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    getBGM().stop();
  };

  // Auto-advance through phases with sound effects
  useEffect(() => {
    if (!presenting || !autoPlay) return;

    if (presPhase === "input") {
      // Play keyboard ticks during typing
      if (sfxEnabled) {
        const tickInterval = setInterval(playKeyTick, 80);
        autoRef.current = setTimeout(() => {
          clearInterval(tickInterval);
          if (sfxEnabled) playClick();
          setPresPhase("streaming");
        }, 1500);
        return () => { clearInterval(tickInterval); clearTimeout(autoRef.current); };
      }
      autoRef.current = setTimeout(() => setPresPhase("streaming"), 1500);
    } else if (presPhase === "streaming") {
      // Play processing hum
      if (sfxEnabled) stopProcessingRef.current = playProcessing();
      autoRef.current = setTimeout(() => {
        if (stopProcessingRef.current) { stopProcessingRef.current(); stopProcessingRef.current = null; }
        setPresPhase("output");
      }, 2500);
    } else if (presPhase === "output") {
      // Play success chime
      if (sfxEnabled) playSuccess();
      autoRef.current = setTimeout(() => {
        if (presStep < TOOLS.length - 1) {
          setPresStep((s) => s + 1);
          setPresPhase("input");
        } else {
          setAutoPlay(false);
          getBGM().stop();
          if (recording) stopRecording();
        }
      }, 4000);
    }
    return () => clearTimeout(autoRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presenting, autoPlay, presPhase, presStep, sfxEnabled]);

  // Update BGM volume
  useEffect(() => {
    getBGM().setVolume(bgmVolume);
  }, [bgmVolume]);

  const activeTool = TOOLS[presStep];
  const activeColor = activeTool?.color || "#2563eb";

  // ── Filter tools that have results ──
  const availableTools = TOOLS.filter((t) => {
    if (t.id === "photoshoot" || t.id === "creative") return !!uploadedImage;
    return true;
  });

  if (presenting) {
    const tool = TOOLS[presStep];
    const Icon = tool.icon;
    const data = results[tool.id];

    return (
      <div className="min-h-screen bg-[#0c0c0c] text-white">
        {/* Minimal header */}
        <div className="h-14 border-b border-white/5 flex items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.png" alt="ShelfReady" className="h-7 w-7 rounded-lg" />
            <span className="text-[15px] font-bold">ShelfReady</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {TOOLS.map((t, i) => (
                <div key={t.id} className={`h-1 rounded-full transition-all ${i === presStep ? "w-6 bg-white" : i < presStep ? "w-2 bg-white/30" : "w-2 bg-white/10"}`} />
              ))}
            </div>
            <button onClick={() => setPresenting(false)} className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"><X className="h-4 w-4 text-neutral-400" /></button>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-4xl mx-auto px-8 py-10">
          {/* Tool header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${tool.color}20` }}>
              <Icon className="h-5 w-5" style={{ color: tool.color }} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: tool.color }}>{tool.label}</p>
              <p className="text-[13px] text-neutral-500">{tool.inputLabel} {productName}</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${presPhase === "output" ? "bg-green-400" : "bg-amber-400 animate-pulse"}`} />
              <span className="text-[10px] font-mono text-neutral-500">
                {presPhase === "input" ? "preparing..." : presPhase === "streaming" ? "generating..." : "complete"}
              </span>
            </div>
          </div>

          {/* Content area */}
          <div className="bg-[#111318] border border-white/5 rounded-2xl p-6 min-h-[450px]">
            {/* Input phase */}
            {presPhase === "input" && (
              <div className="animate-[fadeIn_0.3s_ease-out]">
                <div className="flex gap-2.5 items-start">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px]">👤</span>
                  </div>
                  <div className="bg-white/5 border border-white/8 rounded-xl px-4 py-3 flex-1">
                    <p className="text-[13px] text-neutral-400">
                      <TypeWriter text={`${tool.inputLabel} ${productName} — ${productDetails.slice(0, 80)}`} speed={20} />
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Streaming phase */}
            {presPhase === "streaming" && (
              <div className="animate-[fadeIn_0.3s_ease-out]">
                <div className="flex gap-2.5 items-start">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${tool.color}20` }}>
                    <Sparkles className="h-3.5 w-3.5" style={{ color: tool.color }} />
                  </div>
                  <div className="flex-1">
                    <StreamingDots color={tool.color} steps={STREAMING_STEPS[tool.id] || []} />
                  </div>
                </div>
              </div>
            )}

            {/* Output phase */}
            {presPhase === "output" && (
              <div className="animate-[fadeIn_0.4s_ease-out]">
                <div className="flex gap-2.5 items-start">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${tool.color}20` }}>
                    <Sparkles className="h-3.5 w-3.5" style={{ color: tool.color }} />
                  </div>
                  <div className="flex-1">
                    {OUTPUT_RENDERERS[tool.id]?.(data) || (
                      <p className="text-neutral-500 text-sm">No data available</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => { if (presStep > 0) { setPresStep(presStep - 1); setPresPhase("input"); } }}
                disabled={presStep === 0}
                className="px-3 py-1.5 text-xs text-neutral-500 hover:text-white disabled:opacity-30 cursor-pointer"
              >
                Previous
              </button>
            </div>

            {/* Center: playback controls */}
            <div className="flex items-center gap-2">
              <button onClick={() => setAutoPlay(!autoPlay)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
                {autoPlay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                onClick={() => { if (presStep < TOOLS.length - 1) { setPresStep(presStep + 1); setPresPhase("input"); } }}
                disabled={presStep >= TOOLS.length - 1}
                className="px-3 py-1.5 text-xs font-medium bg-white/10 rounded-lg hover:bg-white/15 disabled:opacity-30 cursor-pointer flex items-center gap-1"
              >
                Next <SkipForward className="h-3 w-3" />
              </button>
            </div>

            {/* Right: audio + recording controls */}
            <div className="flex items-center gap-1.5">
              <button onClick={() => setSfxEnabled(!sfxEnabled)} className={`p-1.5 rounded-md cursor-pointer ${sfxEnabled ? "bg-white/10 text-white" : "text-neutral-600"}`} title="Sound effects">
                {sfxEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => { setBgmEnabled(!bgmEnabled); if (bgmEnabled) getBGM().stop(); else getBGM().start(); }} className={`p-1.5 rounded-md cursor-pointer ${bgmEnabled ? "bg-white/10 text-white" : "text-neutral-600"}`} title="Background music">
                <Music className="h-3.5 w-3.5" />
              </button>
              {recording ? (
                <button onClick={stopRecording} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg cursor-pointer animate-pulse">
                  <Square className="h-3 w-3" /> Stop
                </button>
              ) : (
                <button onClick={startRecording} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg cursor-pointer hover:bg-red-500">
                  <Circle className="h-3 w-3" /> Record
                </button>
              )}
            </div>
          </div>
        </div>

        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
      </div>
    );
  }

  // ── Input / Generation Mode ──
  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white">
      {/* Header */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-icon.png" alt="ShelfReady" className="h-7 w-7 rounded-lg" />
          <span className="text-[15px] font-bold">ShelfReady Studio</span>
          <span className="text-[10px] bg-white/10 text-neutral-400 px-2 py-0.5 rounded-full font-medium ml-1">Reel Mode</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-10">
        <h1 className="text-2xl font-bold mb-1">Prepare Content</h1>
        <p className="text-neutral-500 text-sm mb-8">Enter product details, generate all 6 outputs, then present for recording.</p>

        {/* Auth */}
        {!token ? (
          <div className="mb-6 bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <p className="text-sm text-neutral-400">Sign in to connect to the AI engine</p>
            <button onClick={signInWithGoogle} disabled={authLoading} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-white text-black rounded-lg hover:bg-neutral-200 disabled:opacity-50 cursor-pointer">
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              {authLoading ? "Connecting..." : "Sign in with Google"}
            </button>
          </div>
        ) : (
          <div className="mb-6 flex items-center gap-2 text-xs text-green-400">
            <Check className="h-3.5 w-3.5" /> API connected
          </div>
        )}

        {/* Input form */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-neutral-400 mb-1 block">Product Name *</label>
              <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Portable Espresso Maker" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/20" />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-400 mb-1 block">Category</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Kitchen Appliances" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/20" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-400 mb-1 block">Product Details *</label>
            <textarea value={productDetails} onChange={(e) => setProductDetails(e.target.value)} rows={3} placeholder="18-bar manual hand press, works with ground coffee and Nespresso pods, 0.9 lbs, carrying case, dishwasher-safe parts" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/20 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-neutral-400 mb-1 block">Target Audience</label>
              <input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="Coffee lovers, travelers" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/20" />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-400 mb-1 block">Price</label>
              <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$54.99" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/20" />
            </div>
          </div>

          {/* Image upload */}
          <div>
            <label className="text-xs font-medium text-neutral-400 mb-1 block">Product Image (for photoshoot & creatives)</label>
            <label className="flex items-center gap-3 bg-white/5 border border-dashed border-white/15 rounded-lg px-4 py-3 cursor-pointer hover:border-white/25 transition-colors">
              <Upload className="h-4 w-4 text-neutral-500" />
              <span className="text-sm text-neutral-500">{uploadedImage ? "Image uploaded" : "Click to upload"}</span>
              {uploadedImage && <Check className="h-4 w-4 text-green-400 ml-auto" />}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={generateAll}
          disabled={generating || !productName || !productDetails}
          className="mt-8 w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:brightness-110 disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating all outputs...</> : !token ? <>Connect above to generate</> : <><Sparkles className="h-4 w-4" /> Generate All 6 Outputs</>}
        </button>

        {/* Progress */}
        {generating && (
          <div className="mt-6 grid grid-cols-3 gap-2">
            {TOOLS.map((t) => {
              const status = genProgress[t.id] || "pending";
              const TIcon = t.icon;
              return (
                <div key={t.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${status === "done" ? "bg-green-500/10 text-green-400" : status === "loading" ? "bg-white/5 text-white" : status === "error" ? "bg-red-500/10 text-red-400" : "bg-white/[0.02] text-neutral-600"}`}>
                  {status === "loading" ? <Loader2 className="h-3 w-3 animate-spin" /> : status === "done" ? <Check className="h-3 w-3" /> : <TIcon className="h-3 w-3" />}
                  {t.label}
                </div>
              );
            })}
          </div>
        )}

        {/* Present button (after generation) */}
        {!generating && Object.keys(results).length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={startPresentation}
              className="py-3 rounded-xl text-sm font-semibold bg-white text-black hover:bg-neutral-200 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="h-4 w-4" /> Present
            </button>
            <button
              onClick={async () => { await startRecording(); }}
              className="py-3 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-500 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Circle className="h-4 w-4" /> Record Reel
            </button>
          </div>
        )}

        {/* Video Studio */}
        {recordedUrl && (
          <div className="mt-8 border-t border-white/10 pt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Film className="h-5 w-5 text-purple-400" /> Video Studio
              </h2>
              {!showVideoStudio && (
                <button onClick={() => setShowVideoStudio(true)} className="text-xs text-purple-400 hover:text-purple-300 cursor-pointer">Open Studio</button>
              )}
            </div>

            {showVideoStudio && (
              <div className="space-y-4">
                {/* Video preview */}
                <div className="rounded-xl overflow-hidden border border-white/10 bg-black">
                  <video
                    src={recordedUrl}
                    controls
                    className="w-full"
                    style={{ maxHeight: 400 }}
                  />
                </div>

                {/* Audio controls */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Audio Settings</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-neutral-500" />
                      <span className="text-sm text-neutral-300">Sound Effects</span>
                    </div>
                    <button
                      onClick={() => setSfxEnabled(!sfxEnabled)}
                      className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${sfxEnabled ? "bg-blue-600" : "bg-white/10"}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${sfxEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4 text-neutral-500" />
                      <span className="text-sm text-neutral-300">Background Music</span>
                    </div>
                    <button
                      onClick={() => setBgmEnabled(!bgmEnabled)}
                      className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${bgmEnabled ? "bg-purple-600" : "bg-white/10"}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${bgmEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>

                  {bgmEnabled && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-neutral-500 w-16">Volume</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={bgmVolume}
                        onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                        className="flex-1 accent-purple-500"
                      />
                      <span className="text-xs text-neutral-400 w-8">{Math.round(bgmVolume * 100)}%</span>
                    </div>
                  )}

                  <p className="text-[10px] text-neutral-600 leading-relaxed">
                    Sounds play during the next recording. For best results, enable &quot;Share tab audio&quot; when the browser asks.
                  </p>
                </div>

                {/* Download */}
                <a
                  href={recordedUrl}
                  download={`shelfready-reel-${productName.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.webm`}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:brightness-110 transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4" /> Download Reel (.webm)
                </a>

                {/* Re-record */}
                <button
                  onClick={() => { setRecordedBlob(null); setRecordedUrl(null); setShowVideoStudio(false); }}
                  className="w-full py-2 text-xs text-neutral-500 hover:text-neutral-300 cursor-pointer"
                >
                  Discard &amp; re-record
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
