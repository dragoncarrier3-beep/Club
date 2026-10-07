"use client";

import { useRef, useState } from "react";
import type { Marker } from "@/lib/types";
import { cx } from "@/lib/utils";

/** Football pitch with positioned player markers. When `onChange` is supplied the markers can be dragged. */
export function Pitch({ markers, onChange }: { markers: Marker[]; onChange?: (m: Marker[]) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const move = (e: React.PointerEvent) => {
    if (drag === null || !onChange || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = Math.min(96, Math.max(4, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.min(96, Math.max(4, ((e.clientY - r.top) / r.height) * 100));
    onChange(markers.map((m, i) => (i === drag ? { ...m, x: Math.round(x), y: Math.round(y) } : m)));
  };
  return (
    <div ref={ref} onPointerMove={move} onPointerUp={() => setDrag(null)} onPointerLeave={() => setDrag(null)}
      className="relative mx-auto aspect-[3/4] w-full max-w-md touch-none select-none overflow-hidden rounded-xl border border-white/15 bg-[repeating-linear-gradient(0deg,#0f3d24_0_10%,#12462a_10%_20%)]">
      <svg viewBox="0 0 300 400" className="absolute inset-0 h-full w-full" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" aria-hidden="true">
        <rect x="10" y="10" width="280" height="380" />
        <line x1="10" y1="200" x2="290" y2="200" />
        <circle cx="150" cy="200" r="36" />
        <rect x="70" y="10" width="160" height="60" />
        <rect x="110" y="10" width="80" height="24" />
        <rect x="70" y="330" width="160" height="60" />
        <rect x="110" y="366" width="80" height="24" />
      </svg>
      {markers.map((m, i) => (
        <div key={i} onPointerDown={(e) => { if (onChange) { e.preventDefault(); setDrag(i); } }}
          style={{ left: `${m.x}%`, top: `${m.y}%` }}
          className={cx("absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-black/60 bg-accent font-display text-[11px] font-extrabold text-black shadow-lg", onChange && "cursor-grab active:cursor-grabbing", drag === i && "scale-110 ring-2 ring-white")}>
          {m.label}
        </div>
      ))}
    </div>
  );
}
