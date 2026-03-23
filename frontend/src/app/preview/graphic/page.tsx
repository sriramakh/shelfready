"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  Camera,
  Share2,
  Megaphone,
  Search,
  Layers,
  ArrowRight,
  Check,
  Sparkles,
  Zap,
  Star,
  ChevronRight,
} from "lucide-react";
import { PLANS } from "@/lib/constants";

/* ------------------------------------------------------------------ */
/*  INLINE STYLES — all @keyframes & CSS animations                    */
/* ------------------------------------------------------------------ */

const inlineStyles = `
  /* ---- Base resets ---- */
  .graphic-landing {
    --neon-blue: #3b82f6;
    --neon-purple: #a855f7;
    --neon-pink: #ec4899;
    --bg-primary: #0a0a0f;
    --bg-card: rgba(255, 255, 255, 0.03);
    --border-glass: rgba(255, 255, 255, 0.08);
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
    background: var(--bg-primary);
    color: #e2e8f0;
    overflow-x: hidden;
  }

  /* ---- Animated grid background ---- */
  .grid-bg {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background-image:
      linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
    background-size: 60px 60px;
    animation: gridPulse 8s ease-in-out infinite;
  }

  @keyframes gridPulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }

  /* ---- Particle dots ---- */
  .particles {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .particle {
    position: absolute;
    width: 2px;
    height: 2px;
    border-radius: 50%;
    background: var(--neon-blue);
    opacity: 0;
    animation: particleFloat 12s ease-in-out infinite;
  }

  .particle:nth-child(1)  { left: 5%;  top: 20%; animation-delay: 0s;   background: var(--neon-blue); }
  .particle:nth-child(2)  { left: 15%; top: 60%; animation-delay: 1.5s; background: var(--neon-purple); }
  .particle:nth-child(3)  { left: 25%; top: 40%; animation-delay: 3s;   background: var(--neon-pink); }
  .particle:nth-child(4)  { left: 35%; top: 80%; animation-delay: 4.5s; background: var(--neon-blue); }
  .particle:nth-child(5)  { left: 45%; top: 15%; animation-delay: 6s;   background: var(--neon-purple); }
  .particle:nth-child(6)  { left: 55%; top: 50%; animation-delay: 7.5s; background: var(--neon-pink); }
  .particle:nth-child(7)  { left: 65%; top: 30%; animation-delay: 9s;   background: var(--neon-blue); }
  .particle:nth-child(8)  { left: 75%; top: 70%; animation-delay: 10.5s; background: var(--neon-purple); }
  .particle:nth-child(9)  { left: 85%; top: 10%; animation-delay: 2s;   background: var(--neon-pink); }
  .particle:nth-child(10) { left: 92%; top: 45%; animation-delay: 5s;   background: var(--neon-blue); }
  .particle:nth-child(11) { left: 10%; top: 90%; animation-delay: 3.5s; background: var(--neon-purple); }
  .particle:nth-child(12) { left: 50%; top: 85%; animation-delay: 8s;   background: var(--neon-pink); }
  .particle:nth-child(13) { left: 30%; top: 5%;  animation-delay: 1s;   background: var(--neon-blue); }
  .particle:nth-child(14) { left: 70%; top: 95%; animation-delay: 6.5s; background: var(--neon-purple); }
  .particle:nth-child(15) { left: 80%; top: 25%; animation-delay: 4s;   background: var(--neon-pink); }
  .particle:nth-child(16) { left: 40%; top: 55%; animation-delay: 11s;  background: var(--neon-blue); }
  .particle:nth-child(17) { left: 60%; top: 75%; animation-delay: 7s;   background: var(--neon-purple); }
  .particle:nth-child(18) { left: 20%; top: 35%; animation-delay: 9.5s; background: var(--neon-pink); }
  .particle:nth-child(19) { left: 88%; top: 65%; animation-delay: 2.5s; background: var(--neon-blue); }
  .particle:nth-child(20) { left: 3%;  top: 50%; animation-delay: 5.5s; background: var(--neon-purple); }

  @keyframes particleFloat {
    0%   { opacity: 0; transform: translateY(0) scale(1); }
    15%  { opacity: 0.8; }
    50%  { opacity: 0.3; transform: translateY(-120px) scale(2.5); }
    85%  { opacity: 0.6; }
    100% { opacity: 0; transform: translateY(-250px) scale(0.5); }
  }

  /* ---- Floating gradient orbs ---- */
  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
    opacity: 0.15;
  }

  .orb-1 {
    width: 600px; height: 600px;
    background: radial-gradient(circle, var(--neon-blue), transparent 70%);
    top: -200px; left: -150px;
    animation: orbFloat1 20s ease-in-out infinite;
  }

  .orb-2 {
    width: 500px; height: 500px;
    background: radial-gradient(circle, var(--neon-purple), transparent 70%);
    top: 30%; right: -100px;
    animation: orbFloat2 25s ease-in-out infinite;
  }

  .orb-3 {
    width: 400px; height: 400px;
    background: radial-gradient(circle, var(--neon-pink), transparent 70%);
    bottom: 10%; left: 20%;
    animation: orbFloat3 18s ease-in-out infinite;
  }

  .orb-4 {
    width: 350px; height: 350px;
    background: radial-gradient(circle, var(--neon-blue), transparent 70%);
    top: 60%; right: 25%;
    animation: orbFloat1 22s ease-in-out infinite reverse;
  }

  .orb-5 {
    width: 450px; height: 450px;
    background: radial-gradient(circle, var(--neon-purple), transparent 70%);
    top: 80%; left: -100px;
    animation: orbFloat2 28s ease-in-out infinite reverse;
  }

  @keyframes orbFloat1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(80px, 40px) scale(1.1); }
    50% { transform: translate(30px, 100px) scale(0.9); }
    75% { transform: translate(-50px, 60px) scale(1.05); }
  }

  @keyframes orbFloat2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(-60px, 80px) scale(1.15); }
    66% { transform: translate(40px, -40px) scale(0.85); }
  }

  @keyframes orbFloat3 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    20% { transform: translate(60px, -30px) scale(1.1); }
    40% { transform: translate(-40px, -60px) scale(0.95); }
    60% { transform: translate(80px, 20px) scale(1.05); }
    80% { transform: translate(-20px, 50px) scale(0.9); }
  }

  /* ---- Animated gradient text ---- */
  .gradient-text {
    background: linear-gradient(
      135deg,
      var(--neon-blue) 0%,
      var(--neon-purple) 25%,
      var(--neon-pink) 50%,
      var(--neon-purple) 75%,
      var(--neon-blue) 100%
    );
    background-size: 300% 300%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: gradientShift 6s ease-in-out infinite;
  }

  @keyframes gradientShift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  /* ---- Glow text ---- */
  .glow-text-blue {
    text-shadow:
      0 0 10px rgba(59, 130, 246, 0.5),
      0 0 30px rgba(59, 130, 246, 0.3),
      0 0 60px rgba(59, 130, 246, 0.15);
  }

  .glow-text-purple {
    text-shadow:
      0 0 10px rgba(168, 85, 247, 0.5),
      0 0 30px rgba(168, 85, 247, 0.3),
      0 0 60px rgba(168, 85, 247, 0.15);
  }

  /* ---- Glass card ---- */
  .glass-card {
    background: var(--bg-card);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--border-glass);
    border-radius: 16px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .glass-card:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-4px) scale(1.01);
    box-shadow:
      0 0 20px rgba(59, 130, 246, 0.1),
      0 20px 60px rgba(0, 0, 0, 0.4);
  }

  .glass-card-glow:hover {
    border-color: rgba(168, 85, 247, 0.4);
    box-shadow:
      0 0 30px rgba(168, 85, 247, 0.15),
      0 0 60px rgba(59, 130, 246, 0.1),
      0 20px 60px rgba(0, 0, 0, 0.5);
  }

  /* ---- Popular plan glow ---- */
  .plan-popular {
    border: 1px solid rgba(168, 85, 247, 0.4);
    box-shadow:
      0 0 30px rgba(168, 85, 247, 0.1),
      0 0 60px rgba(168, 85, 247, 0.05);
    animation: popularGlow 4s ease-in-out infinite;
  }

  @keyframes popularGlow {
    0%, 100% {
      box-shadow:
        0 0 30px rgba(168, 85, 247, 0.1),
        0 0 60px rgba(168, 85, 247, 0.05);
    }
    50% {
      box-shadow:
        0 0 40px rgba(168, 85, 247, 0.2),
        0 0 80px rgba(168, 85, 247, 0.1),
        0 0 120px rgba(59, 130, 246, 0.05);
    }
  }

  .plan-popular:hover {
    border-color: rgba(168, 85, 247, 0.6);
    box-shadow:
      0 0 50px rgba(168, 85, 247, 0.25),
      0 0 100px rgba(168, 85, 247, 0.1),
      0 20px 60px rgba(0, 0, 0, 0.5);
  }

  /* ---- CTA Buttons ---- */
  .btn-neon-primary {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 32px;
    font-weight: 600;
    font-size: 16px;
    color: white;
    background: linear-gradient(135deg, var(--neon-blue), var(--neon-purple));
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    overflow: hidden;
    letter-spacing: 0.02em;
  }

  .btn-neon-primary::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--neon-purple), var(--neon-pink));
    opacity: 0;
    transition: opacity 0.3s ease;
    border-radius: 12px;
  }

  .btn-neon-primary:hover {
    transform: translateY(-2px);
    box-shadow:
      0 0 20px rgba(59, 130, 246, 0.4),
      0 0 40px rgba(168, 85, 247, 0.2);
  }

  .btn-neon-primary:hover::before {
    opacity: 1;
  }

  .btn-neon-primary span,
  .btn-neon-primary svg {
    position: relative;
    z-index: 1;
  }

  .btn-neon-secondary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 32px;
    font-weight: 600;
    font-size: 16px;
    color: #e2e8f0;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    letter-spacing: 0.02em;
    backdrop-filter: blur(10px);
  }

  .btn-neon-secondary:hover {
    border-color: var(--neon-blue);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
    background: rgba(59, 130, 246, 0.05);
  }

  /* ---- Scroll-triggered fade-in animations ---- */
  .fade-up {
    opacity: 0;
    transform: translateY(40px);
    animation: fadeUp 0.8s ease forwards;
  }

  .fade-up-delay-1 { animation-delay: 0.1s; }
  .fade-up-delay-2 { animation-delay: 0.2s; }
  .fade-up-delay-3 { animation-delay: 0.3s; }
  .fade-up-delay-4 { animation-delay: 0.4s; }
  .fade-up-delay-5 { animation-delay: 0.5s; }
  .fade-up-delay-6 { animation-delay: 0.6s; }

  @keyframes fadeUp {
    to { opacity: 1; transform: translateY(0); }
  }

  .fade-in {
    opacity: 0;
    animation: fadeIn 1s ease forwards;
  }

  @keyframes fadeIn {
    to { opacity: 1; }
  }

  /* ---- Mockup 3D float ---- */
  .mockup-float {
    animation: mockupFloat 6s ease-in-out infinite;
  }

  @keyframes mockupFloat {
    0%, 100% { transform: translateY(0) rotateX(2deg) rotateY(-2deg); }
    50% { transform: translateY(-20px) rotateX(-2deg) rotateY(2deg); }
  }

  /* ---- Icon glow pulse ---- */
  .icon-glow {
    transition: all 0.4s ease;
  }

  .glass-card:hover .icon-glow-blue {
    filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.6));
  }

  .glass-card:hover .icon-glow-purple {
    filter: drop-shadow(0 0 12px rgba(168, 85, 247, 0.6));
  }

  .glass-card:hover .icon-glow-pink {
    filter: drop-shadow(0 0 12px rgba(236, 72, 153, 0.6));
  }

  /* ---- Horizontal scroll line ---- */
  .scan-line {
    position: absolute;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--neon-blue), transparent);
    opacity: 0.3;
    animation: scanLine 8s linear infinite;
  }

  @keyframes scanLine {
    0% { top: 0; opacity: 0; }
    5% { opacity: 0.3; }
    95% { opacity: 0.3; }
    100% { top: 100%; opacity: 0; }
  }

  /* ---- Photoshoot image hover ---- */
  .photo-showcase-item {
    position: relative;
    overflow: hidden;
    border-radius: 16px;
    border: 1px solid var(--border-glass);
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .photo-showcase-item::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      transparent 40%,
      rgba(10, 10, 15, 0.9) 100%
    );
    pointer-events: none;
  }

  .photo-showcase-item:hover {
    transform: scale(1.03);
    border-color: rgba(168, 85, 247, 0.4);
    box-shadow:
      0 0 30px rgba(168, 85, 247, 0.15),
      0 20px 60px rgba(0, 0, 0, 0.5);
  }

  .photo-showcase-label {
    position: absolute;
    bottom: 16px;
    left: 16px;
    z-index: 2;
    font-weight: 600;
    font-size: 14px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: white;
    opacity: 0.9;
  }

  /* ---- Badge ---- */
  .badge-glow {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 16px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--neon-purple);
    border: 1px solid rgba(168, 85, 247, 0.3);
    border-radius: 999px;
    background: rgba(168, 85, 247, 0.08);
    animation: badgePulse 3s ease-in-out infinite;
  }

  @keyframes badgePulse {
    0%, 100% { box-shadow: 0 0 10px rgba(168, 85, 247, 0.1); }
    50% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.2); }
  }

  /* ---- Pricing toggle ---- */
  .pricing-toggle {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 4px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-glass);
  }

  .pricing-toggle button {
    padding: 8px 20px;
    border-radius: 999px;
    border: none;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    color: rgba(255, 255, 255, 0.5);
    background: transparent;
  }

  .pricing-toggle button.active {
    color: white;
    background: linear-gradient(135deg, var(--neon-blue), var(--neon-purple));
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
  }

  /* ---- Final CTA animated bg ---- */
  .cta-gradient-bg {
    background: linear-gradient(
      135deg,
      rgba(59, 130, 246, 0.15) 0%,
      rgba(168, 85, 247, 0.15) 50%,
      rgba(236, 72, 153, 0.15) 100%
    );
    background-size: 200% 200%;
    animation: ctaGradient 8s ease-in-out infinite;
  }

  @keyframes ctaGradient {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  /* ---- Nav glass ---- */
  .nav-glass {
    background: rgba(10, 10, 15, 0.8);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border-glass);
  }

  /* ---- Section divider ---- */
  .section-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--border-glass), transparent);
    margin: 0 auto;
    max-width: 800px;
  }

  /* ---- Typing cursor ---- */
  .cursor-blink {
    display: inline-block;
    width: 3px;
    height: 1em;
    background: var(--neon-blue);
    margin-left: 4px;
    animation: cursorBlink 1s step-end infinite;
    vertical-align: text-bottom;
  }

  @keyframes cursorBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  /* ---- Shine sweep on hero headline ---- */
  .shine-sweep {
    position: relative;
    overflow: hidden;
  }

  .shine-sweep::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.08),
      transparent
    );
    animation: shineSweep 5s ease-in-out infinite;
  }

  @keyframes shineSweep {
    0%, 100% { left: -100%; }
    50% { left: 150%; }
  }

  /* ---- Rotate icon on hover ---- */
  .hover-rotate {
    transition: transform 0.4s ease;
  }

  .glass-card:hover .hover-rotate {
    transform: rotate(8deg) scale(1.1);
  }

  /* ---- Counter animation ---- */
  .stat-number {
    font-variant-numeric: tabular-nums;
    background: linear-gradient(135deg, white, rgba(255, 255, 255, 0.7));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  /* ---- Photo arrow connector ---- */
  .connector-line {
    position: relative;
  }

  .connector-line::after {
    content: '';
    position: absolute;
    top: 50%;
    right: -20px;
    width: 40px;
    height: 2px;
    background: linear-gradient(90deg, var(--neon-purple), transparent);
    opacity: 0.4;
  }

  /* ---- Smooth section scroll ---- */
  html {
    scroll-behavior: smooth;
  }
`;

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

const features = [
  {
    icon: Package,
    title: "AI Listing Optimizer",
    desc: "Generate SEO-optimized titles, bullets, and descriptions for Amazon, Etsy, and Shopify in seconds.",
    color: "blue" as const,
  },
  {
    icon: Camera,
    title: "Product Photoshoot",
    desc: "Upload a product photo and get 5 professional images — model, studio, outdoor, and lifestyle scenes.",
    color: "purple" as const,
  },
  {
    icon: Share2,
    title: "Social Content Engine",
    desc: "One-click Instagram, Facebook, and Pinterest posts with scroll-stopping copy and imagery.",
    color: "pink" as const,
  },
  {
    icon: Megaphone,
    title: "160+ Ad Templates",
    desc: "Premium ad creatives for Facebook, Instagram, and Google — customized to your brand in seconds.",
    color: "blue" as const,
  },
  {
    icon: Search,
    title: "Market Intelligence",
    desc: "Competitor analysis, keyword research, and market trends — all powered by real-time AI insights.",
    color: "purple" as const,
  },
  {
    icon: Layers,
    title: "Multi-Platform Export",
    desc: "Push listings and creatives to Amazon, Etsy, Shopify, and more with a single click.",
    color: "pink" as const,
  },
];

const colorMap = {
  blue: {
    gradient: "from-blue-500 to-cyan-400",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    glow: "icon-glow-blue",
    border: "hover:border-blue-500/30",
  },
  purple: {
    gradient: "from-purple-500 to-violet-400",
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    glow: "icon-glow-purple",
    border: "hover:border-purple-500/30",
  },
  pink: {
    gradient: "from-pink-500 to-rose-400",
    bg: "bg-pink-500/10",
    text: "text-pink-400",
    glow: "icon-glow-pink",
    border: "hover:border-pink-500/30",
  },
};

const showcaseImages = [
  { src: "/showcase/input.png", label: "Your Product" },
  { src: "/showcase/model.png", label: "Model Shot" },
  { src: "/showcase/studio.png", label: "Studio" },
  { src: "/showcase/outdoor.png", label: "Outdoor" },
  { src: "/showcase/context.png", label: "Lifestyle" },
];

const pricingPlans = [
  { key: "starter" as const, plan: PLANS.starter, accent: "blue" },
  { key: "pro" as const, plan: PLANS.pro, accent: "purple" },
  { key: "business" as const, plan: PLANS.business, accent: "pink" },
];

const stats = [
  { value: "160+", label: "Ad Templates" },
  { value: "50K+", label: "Listings Generated" },
  { value: "5x", label: "Faster Than Manual" },
  { value: "98%", label: "Customer Satisfaction" },
];

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function GraphicLanding() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="graphic-landing min-h-screen relative">
      <style dangerouslySetInnerHTML={{ __html: inlineStyles }} />

      {/* ---- Ambient background layers ---- */}
      <div className="grid-bg" />
      <div className="particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="particle" />
        ))}
      </div>

      {/* ---- Floating orbs ---- */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />
      <div className="orb orb-5" />

      {/* ================================================================ */}
      {/*  NAV                                                              */}
      {/* ================================================================ */}
      <nav className="nav-glass fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <span className="text-lg font-bold tracking-wider text-white">
              SHELF<span className="text-purple-400">READY</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-white/50 hover:text-white transition-colors tracking-wide no-underline">
              Features
            </a>
            <a href="#photoshoot" className="text-sm text-white/50 hover:text-white transition-colors tracking-wide no-underline">
              Photoshoot
            </a>
            <a href="#pricing" className="text-sm text-white/50 hover:text-white transition-colors tracking-wide no-underline">
              Pricing
            </a>
            <Link href="/login" className="btn-neon-primary !py-2 !px-5 !text-sm no-underline">
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ================================================================ */}
      {/*  HERO                                                             */}
      {/* ================================================================ */}
      <section className="relative z-10 pt-32 pb-20 md:pt-44 md:pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left — Text */}
            <div className="flex-1 text-center lg:text-left">
              <div className="fade-up">
                <span className="badge-glow">
                  <Zap className="w-3 h-3" />
                  AI-POWERED E-COMMERCE
                </span>
              </div>

              <h1 className="fade-up fade-up-delay-1 mt-8 text-5xl md:text-7xl lg:text-8xl font-extrabold leading-[1.05] tracking-tight">
                <span className="gradient-text shine-sweep inline-block">
                  AI That Sells
                </span>
                <br />
                <span className="text-white glow-text-blue">
                  Your Products
                </span>
                <span className="cursor-blink" />
              </h1>

              <p className="fade-up fade-up-delay-2 mt-6 text-lg md:text-xl text-white/50 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                From product photos to optimized listings, ad creatives to market
                intelligence — ShelfReady is the all-in-one AI platform that
                turns your products into revenue.
              </p>

              <div className="fade-up fade-up-delay-3 mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/login" className="btn-neon-primary no-underline">
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="#features" className="btn-neon-secondary no-underline">
                  <span>Explore Features</span>
                  <ChevronRight className="w-5 h-5" />
                </a>
              </div>

              {/* Stats row */}
              <div className="fade-up fade-up-delay-4 mt-14 grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center lg:text-left">
                    <div className="stat-number text-2xl md:text-3xl font-bold">
                      {stat.value}
                    </div>
                    <div className="text-xs text-white/40 mt-1 tracking-wider uppercase">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Mockup */}
            <div className="flex-1 max-w-lg w-full fade-up fade-up-delay-3">
              <div className="mockup-float" style={{ perspective: "1000px" }}>
                <div className="glass-card p-1 relative overflow-hidden">
                  <div className="scan-line" />
                  <div className="relative rounded-xl overflow-hidden">
                    <Image
                      src="/showcase/studio.png"
                      alt="AI-generated product photoshoot"
                      width={600}
                      height={450}
                      className="w-full h-auto object-cover rounded-xl"
                      priority
                    />
                    {/* Overlay UI elements to suggest app interface */}
                    <div className="absolute top-4 left-4 glass-card !rounded-lg px-3 py-1.5 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs font-medium text-white/80 tracking-wider">
                        AI GENERATING
                      </span>
                    </div>
                    <div className="absolute bottom-4 right-4 glass-card !rounded-lg px-3 py-1.5">
                      <span className="text-xs font-medium text-purple-300 tracking-wider">
                        STUDIO MODE
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  FEATURES                                                         */}
      {/* ================================================================ */}
      <section id="features" className="relative z-10 py-24 md:py-32 px-6">
        <div className="section-divider mb-24" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="badge-glow fade-up">
              <Star className="w-3 h-3" />
              CAPABILITIES
            </span>
            <h2 className="fade-up fade-up-delay-1 mt-6 text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
              <span className="gradient-text">Everything You Need</span>
              <br />
              <span className="text-white glow-text-purple">to Dominate E-Commerce</span>
            </h2>
            <p className="fade-up fade-up-delay-2 mt-4 text-white/40 text-lg max-w-2xl mx-auto">
              Six powerful AI modules, one unified platform. No switching tools.
              No wasted time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const c = colorMap[feature.color];
              return (
                <div
                  key={feature.title}
                  className={`glass-card glass-card-glow p-8 fade-up fade-up-delay-${Math.min(i + 1, 6)}`}
                >
                  <div
                    className={`w-14 h-14 rounded-xl ${c.bg} flex items-center justify-center mb-5 hover-rotate`}
                  >
                    <feature.icon
                      className={`w-7 h-7 ${c.text} icon-glow ${c.glow}`}
                    />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-wide mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-white/40 leading-relaxed text-sm">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  PHOTOSHOOT SHOWCASE                                              */}
      {/* ================================================================ */}
      <section id="photoshoot" className="relative z-10 py-24 md:py-32 px-6">
        <div className="section-divider mb-24" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="badge-glow fade-up">
              <Camera className="w-3 h-3" />
              AI PHOTOSHOOT
            </span>
            <h2 className="fade-up fade-up-delay-1 mt-6 text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
              <span className="text-white glow-text-blue">One Photo In.</span>{" "}
              <span className="gradient-text">Five Scenes Out.</span>
            </h2>
            <p className="fade-up fade-up-delay-2 mt-4 text-white/40 text-lg max-w-2xl mx-auto">
              Upload your product image and watch AI generate professional
              photoshoot scenes — models, studio lighting, outdoor settings, and
              lifestyle contexts.
            </p>
          </div>

          {/* Showcase grid */}
          <div className="fade-up fade-up-delay-3">
            {/* Top row: input (large) + model */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
              <div className="md:col-span-5 photo-showcase-item aspect-square md:aspect-auto md:h-80">
                <Image
                  src={showcaseImages[0].src}
                  alt={showcaseImages[0].label}
                  width={500}
                  height={400}
                  className="w-full h-full object-cover"
                />
                <span className="photo-showcase-label">
                  {showcaseImages[0].label}
                </span>
                <div className="absolute top-4 right-4 z-10 badge-glow !bg-blue-500/10 !border-blue-500/30 !text-blue-400">
                  INPUT
                </div>
              </div>

              <div className="md:col-span-7 photo-showcase-item aspect-video md:h-80">
                <Image
                  src={showcaseImages[1].src}
                  alt={showcaseImages[1].label}
                  width={700}
                  height={400}
                  className="w-full h-full object-cover"
                />
                <span className="photo-showcase-label">
                  {showcaseImages[1].label}
                </span>
                <div className="absolute top-4 right-4 z-10 badge-glow">
                  AI GENERATED
                </div>
              </div>
            </div>

            {/* Bottom row: 3 equal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {showcaseImages.slice(2).map((img) => (
                <div
                  key={img.label}
                  className="photo-showcase-item aspect-[4/3]"
                >
                  <Image
                    src={img.src}
                    alt={img.label}
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                  <span className="photo-showcase-label">{img.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  PRICING                                                          */}
      {/* ================================================================ */}
      <section id="pricing" className="relative z-10 py-24 md:py-32 px-6">
        <div className="section-divider mb-24" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="badge-glow fade-up">
              <Zap className="w-3 h-3" />
              PRICING
            </span>
            <h2 className="fade-up fade-up-delay-1 mt-6 text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
              <span className="gradient-text">Invest in Growth.</span>
              <br />
              <span className="text-white glow-text-purple">Not Guesswork.</span>
            </h2>
            <p className="fade-up fade-up-delay-2 mt-4 text-white/40 text-lg max-w-xl mx-auto">
              Start free. Scale when you&apos;re ready. Cancel anytime.
            </p>

            {/* Billing toggle */}
            <div className="fade-up fade-up-delay-3 mt-8 flex justify-center">
              <div className="pricing-toggle">
                <button
                  className={billing === "monthly" ? "active" : ""}
                  onClick={() => setBilling("monthly")}
                >
                  Monthly
                </button>
                <button
                  className={billing === "yearly" ? "active" : ""}
                  onClick={() => setBilling("yearly")}
                >
                  Yearly
                  <span className="ml-1.5 text-xs text-green-400 font-semibold">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map(({ key, plan, accent }, i) => {
              const isPopular = "popular" in plan && plan.popular;
              const price =
                billing === "monthly"
                  ? plan.priceMonthly
                  : Math.round(plan.priceYearly / 12);

              return (
                <div
                  key={key}
                  className={`
                    glass-card p-8 flex flex-col relative fade-up fade-up-delay-${i + 1}
                    ${isPopular ? "plan-popular md:-mt-4 md:mb-0 md:pb-12" : ""}
                  `}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="badge-glow !text-xs">
                        <Star className="w-3 h-3" />
                        MOST POPULAR
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-lg font-bold tracking-wider text-white uppercase">
                      {plan.name}
                    </h3>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-5xl font-extrabold text-white stat-number">
                        ${price}
                      </span>
                      <span className="text-white/30 text-sm">/mo</span>
                    </div>
                    {billing === "yearly" && (
                      <div className="mt-1 text-xs text-green-400/70">
                        Billed ${plan.priceYearly}/year
                      </div>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-white/50">
                        <Check className="w-4 h-4 mt-0.5 text-purple-400 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/login"
                    className={`
                      no-underline text-center font-semibold tracking-wide text-sm py-3 px-6 rounded-xl transition-all duration-300
                      ${
                        isPopular
                          ? "btn-neon-primary !justify-center"
                          : "btn-neon-secondary !justify-center"
                      }
                    `}
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  FINAL CTA                                                        */}
      {/* ================================================================ */}
      <section className="relative z-10 py-24 md:py-32 px-6">
        <div className="section-divider mb-24" />
        <div className="max-w-4xl mx-auto">
          <div className="cta-gradient-bg glass-card p-12 md:p-20 text-center relative overflow-hidden">
            <div className="scan-line" />

            <h2 className="fade-up text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              <span className="gradient-text">Ready to Transform</span>
              <br />
              <span className="text-white glow-text-blue">Your E-Commerce?</span>
            </h2>

            <p className="fade-up fade-up-delay-1 mt-6 text-white/40 text-lg max-w-xl mx-auto">
              Join thousands of sellers using AI to create better listings,
              stunning photos, and high-converting ads — all in one place.
            </p>

            <div className="fade-up fade-up-delay-2 mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" className="btn-neon-primary no-underline">
                <span>Start Free — No Card Required</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="fade-up fade-up-delay-3 mt-8 flex items-center justify-center gap-6 text-xs text-white/30">
              <span className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-green-400/60" />
                Free plan available
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-green-400/60" />
                No credit card needed
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-green-400/60" />
                Cancel anytime
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  FOOTER                                                           */}
      {/* ================================================================ */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="font-bold tracking-wider text-white/60">
              SHELF<span className="text-purple-400/60">READY</span>
            </span>
          </div>
          <div className="flex items-center gap-8 text-xs text-white/30">
            <a href="#" className="hover:text-white/60 transition-colors no-underline">
              Terms
            </a>
            <a href="#" className="hover:text-white/60 transition-colors no-underline">
              Privacy
            </a>
            <a href="#" className="hover:text-white/60 transition-colors no-underline">
              Support
            </a>
          </div>
          <p className="text-xs text-white/20">
            &copy; {new Date().getFullYear()} ShelfReady. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
