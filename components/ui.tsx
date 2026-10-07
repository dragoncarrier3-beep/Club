"use client";

import { useEffect, useRef, useState } from "react";
import { Bold, Heading2, ImagePlus, Italic, List, X } from "lucide-react";
import { cx } from "@/lib/utils";
import { useStore } from "@/lib/store";

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={cx("card flex max-h-[92vh] w-full animate-rise flex-col rounded-b-none sm:rounded-b-xl", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="display text-xl">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-white/60 hover:bg-white/10 hover:text-white"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function Confirm({ open, title, body, action, onCancel, onConfirm }: { open: boolean; title: string; body: string; action: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-white/70">{body}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn-danger" onClick={onConfirm}>{action}</button>
      </div>
    </Modal>
  );
}

export function Field({ label, required, error, help, children }: { label: string; required?: boolean; error?: string; help?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">
        {label} {required && <span className="text-accent">*</span>}
      </span>
      {children}
      {help && !error && <span className="mt-1 block text-xs text-white/40">{help}</span>}
      {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
    </label>
  );
}

export function Empty({ title, hint, children }: { title: string; hint?: string; children?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-3 h-1 w-10 rounded bg-accent/60" />
      <p className="font-display text-lg font-semibold uppercase tracking-wide">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-white/50">{hint}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

const TONES: Record<string, string> = {
  green: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  red: "border-red-400/40 bg-red-400/10 text-red-300",
  amber: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  blue: "border-sky-400/40 bg-sky-400/10 text-sky-300",
  grey: "border-white/15 bg-white/5 text-white/60",
  accent: "border-accent/50 bg-accent/10 text-accent",
};
const STATUS_TONE: Record<string, string> = {
  win: "green", published: "green", active: "green", accepted: "green", completed: "green", paid: "green", used: "grey", available: "accent", online: "green",
  loss: "red", rejected: "red", suspended: "red", cancelled: "red", refunded: "red", offline: "grey",
  draw: "amber", draft: "amber", pending: "amber", reviewing: "amber", processing: "amber", new: "accent",
  "trial offered": "blue", shipped: "blue", archived: "grey", match: "accent", training: "blue", trial: "amber", tournament: "green", "club event": "grey",
};

export function Badge({ children, tone }: { children: string; tone?: string }) {
  const key = tone ?? STATUS_TONE[children.toLowerCase().split(" —")[0]] ?? "grey";
  return <span className={cx("inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", TONES[key] ?? TONES.grey)}>{children}</span>;
}

export function SectionHead({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h2 className="display text-3xl sm:text-4xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function PageHero({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="grid-glow border-b border-line">
      <div className="wrap py-12 sm:py-16">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display mt-2 text-5xl sm:text-6xl">{title}</h1>
        {sub && <p className="mt-3 max-w-2xl text-white/60">{sub}</p>}
      </div>
    </div>
  );
}

/** Renders CMS HTML authored by club administrators. */
export function RichText({ html }: { html: string }) {
  return <div className="prose-club" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function RichEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value || "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const cmd = (c: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(c, false, arg);
    onChange(ref.current?.innerHTML ?? "");
  };
  const Tool = ({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" title={label} aria-label={label} onMouseDown={(e) => e.preventDefault()} onClick={onClick} className="rounded p-1.5 text-white/70 hover:bg-white/10 hover:text-white">{children}</button>
  );
  return (
    <div className="rounded-md border border-white/15 bg-black/40 focus-within:border-accent/70">
      <div className="flex gap-1 border-b border-line px-2 py-1.5">
        <Tool label="Bold" onClick={() => cmd("bold")}><Bold size={15} /></Tool>
        <Tool label="Italic" onClick={() => cmd("italic")}><Italic size={15} /></Tool>
        <Tool label="Heading" onClick={() => cmd("formatBlock", "h2")}><Heading2 size={15} /></Tool>
        <Tool label="Paragraph" onClick={() => cmd("formatBlock", "p")}><span className="px-0.5 text-xs font-bold">P</span></Tool>
        <Tool label="Bullet list" onClick={() => cmd("insertUnorderedList")}><List size={15} /></Tool>
      </div>
      <div ref={ref} contentEditable suppressContentEditableWarning onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)} className="prose-club min-h-[9rem] px-3 py-3 outline-none" />
    </div>
  );
}

const MAX_IMAGE_BYTES = 350 * 1024;

export function ImageInput({ value, onChange }: { value?: string; onChange: (v: string | undefined) => void }) {
  const { toast } = useStore();
  const [busy, setBusy] = useState(false);
  const pick = (file?: File) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) return toast("Please choose a PNG, JPG, WebP or GIF image.", "error");
    if (file.size > MAX_IMAGE_BYTES) return toast("That image is too large for the demo. Please use one under 350 KB.", "error");
    setBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      onChange(String(reader.result));
      setBusy(false);
    };
    reader.onerror = () => {
      toast("We couldn't read that image.", "error");
      setBusy(false);
    };
    reader.readAsDataURL(file);
  };
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-black/40 text-white/30">
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <ImagePlus size={20} />}
      </div>
      <div className="flex flex-wrap gap-2">
        <label className="btn-ghost cursor-pointer !py-2 text-xs">
          {busy ? "Uploading…" : value ? "Replace image" : "Upload image"}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        {value && <button type="button" className="btn-ghost !py-2 text-xs" onClick={() => onChange(undefined)}>Remove</button>}
      </div>
    </div>
  );
}

export function Loading({ label }: { label: string }) {
  return (
    <div className="space-y-3" aria-busy="true">
      <p className="text-sm text-white/50">{label}</p>
      <div className="skeleton h-24" />
      <div className="skeleton h-24" />
    </div>
  );
}
