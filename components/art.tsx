"use client";

import { useState } from "react";
import type { Club, Product } from "@/lib/types";
import { cx, initials } from "@/lib/utils";

/** Image that swaps to a supplied fallback instead of showing a broken icon. */
export function SafeImg({ src, alt, className, fallback }: { src?: string; alt: string; className?: string; fallback: React.ReactNode }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <>{fallback}</>;
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}

export function Crest({ club, name, size = 40, className }: { club?: Pick<Club, "short" | "accent" | "logo" | "name">; name?: string; size?: number; className?: string }) {
  const text = club?.short ?? initials(name ?? "FC");
  const color = club ? `rgb(${club.accent})` : "rgba(255,255,255,0.55)";
  const shield = (
    <svg width={size} height={size} viewBox="0 0 48 48" className={cx("shrink-0", className)} role="img" aria-label={`${club?.name ?? name ?? "Club"} crest`}>
      <path d="M24 3 42 9v15c0 11-7.5 17.5-18 21C13.500 41.500 6 35 6 24V9z" fill="#0c0e11" stroke={color} strokeWidth="2.5" />
      <path d="M24 8.500 37 13v11c0 8-5 13-13 16z" fill={color} opacity="0.16" />
      <text x="24" y="28.500" textAnchor="middle" fontSize={text.length > 2 ? 12 : 15} fontWeight="800" fill={color} fontFamily="var(--font-display), Impact, sans-serif" letterSpacing="0.5">{text}</text>
    </svg>
  );
  return <SafeImg src={club?.logo} alt={`${club?.name ?? ""} logo`} className={cx("shrink-0 rounded object-contain", className)} fallback={shield} />;
}

export function Avatar({ src, name, className }: { src?: string; name: string; className?: string }) {
  const silhouette = (
    <div className={cx("flex items-end justify-center overflow-hidden bg-gradient-to-b from-white/[0.07] to-transparent", className)} role="img" aria-label={name}>
      <svg viewBox="0 0 120 120" className="h-[92%] w-[92%]">
        <defs>
          <linearGradient id="sil" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgb(var(--accent))" stopOpacity="0.55" />
            <stop offset="1" stopColor="rgb(var(--accent))" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="40" r="20" fill="url(#sil)" />
        <path d="M18 120c0-28 18-46 42-46s42 18 42 46z" fill="url(#sil)" />
      </svg>
    </div>
  );
  return <SafeImg src={src} alt={name} className={cx("object-cover", className)} fallback={silhouette} />;
}

function productKind(p: Pick<Product, "name" | "category">) {
  const n = p.name.toLowerCase();
  if (n.includes("mug")) return "mug";
  if (n.includes("cap")) return "cap";
  if (n.includes("scarf")) return "scarf";
  if (p.category === "Hoodies") return "hoodie";
  if (p.category === "T-Shirts") return "tee";
  if (p.category === "Jerseys") return "jersey";
  return "box";
}

export function ProductArt({ product, className }: { product: Pick<Product, "name" | "category" | "image">; className?: string }) {
  const kind = productKind(product);
  const a = "rgb(var(--accent))";
  const body = "#1b1f26";
  const shapes: Record<string, React.ReactNode> = {
    jersey: (<><path d="M70 40 95 30q25 14 50 0l25 10 30 30-22 22-13-12v100H75V80L62 92 40 70z" fill={body} stroke={a} strokeWidth="3" /><path d="M95 30q25 22 50 0" fill="none" stroke={a} strokeWidth="5" /><path d="M110 60h20v20h-20z" fill={a} opacity=".9" /><path d="M75 150h90" stroke={a} strokeWidth="3" opacity=".5" /></>),
    tee: (<><path d="M70 42 96 32q24 14 48 0l26 10 28 28-22 20-11-10v98H75V80L64 90 42 70z" fill={body} stroke="rgba(255,255,255,.35)" strokeWidth="3" /><text x="120" y="118" textAnchor="middle" fontSize="22" fontWeight="800" fill={a} fontFamily="var(--font-display)">VENARI</text></>),
    hoodie: (<><path d="M64 60 96 40q24-18 48 0l32 20 22 86-26 8-10-44v52H78v-52l-10 44-26-8z" fill={body} stroke={a} strokeWidth="3" /><path d="M96 40q24 34 48 0" fill="#0c0e11" stroke={a} strokeWidth="3" /><path d="M98 138h44v24H98z" fill="none" stroke={a} strokeWidth="2.500" opacity=".7" /><path d="M112 62v26M128 62v26" stroke="rgba(255,255,255,.5)" strokeWidth="2" /></>),
    cap: (<><path d="M52 132c0-44 30-72 68-72s62 26 66 66z" fill={body} stroke={a} strokeWidth="3" /><path d="M52 132q70-22 150 6 8 12-10 14-70-18-140-6z" fill={a} opacity=".85" /><circle cx="120" cy="62" r="5" fill={a} /></>),
    mug: (<><rect x="62" y="60" width="92" height="110" rx="10" fill={body} stroke={a} strokeWidth="3" /><path d="M154 86h18a20 20 0 0 1 0 54h-18" fill="none" stroke={a} strokeWidth="8" /><path d="M108 96 126 102v14c0 10-7 16-18 20-11-4-18-10-18-20v-14z" fill={a} opacity=".85" /></>),
    scarf: (<><rect x="40" y="86" width="160" height="42" rx="4" fill={body} stroke={a} strokeWidth="3" /><path d="M72 86v42M104 86v42M136 86v42M168 86v42" stroke={a} strokeWidth="10" opacity=".7" /><path d="M40 128v22M52 128v22M188 128v22M200 128v22" stroke={a} strokeWidth="3" /></>),
    box: (<><path d="M60 80 120 54l60 26v70l-60 28-60-28z" fill={body} stroke={a} strokeWidth="3" /><path d="M60 80l60 28 60-28M120 108v70" stroke={a} strokeWidth="3" fill="none" /></>),
  };
  const art = (
    <div className={cx("flex items-center justify-center bg-[radial-gradient(circle_at_50%_35%,rgb(var(--accent)/0.18),transparent_65%)]", className)} role="img" aria-label={product.name}>
      <svg viewBox="0 0 240 220" className="h-[86%] w-[86%]">{shapes[kind]}</svg>
    </div>
  );
  return <SafeImg src={product.image} alt={product.name} className={cx("object-cover", className)} fallback={art} />;
}

/** Branded fallback artwork used when an article, era or page has no image. */
export function BrandArt({ src, label, sub, className }: { src?: string; label: string; sub?: string; className?: string }) {
  const art = (
    <div className={cx("relative flex items-end overflow-hidden bg-[#0c0e11]", className)} role="img" aria-label={label}>
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgb(var(--accent)/0.28),transparent_55%)]" />
      <div className="absolute -right-6 -top-10 h-40 w-40 rotate-12 border-[10px] border-accent/15" />
      <div className="absolute inset-0 opacity-40 [background:repeating-linear-gradient(115deg,transparent_0_22px,rgba(255,255,255,0.035)_22px_23px)]" />
      <div className="relative p-4">
        {sub && <p className="eyebrow !text-[10px]">{sub}</p>}
        <p className="display text-2xl text-white/90">{label}</p>
      </div>
    </div>
  );
  return <SafeImg src={src} alt={label} className={cx("object-cover", className)} fallback={art} />;
}
