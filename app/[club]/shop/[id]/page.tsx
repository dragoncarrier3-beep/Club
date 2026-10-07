"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import { ProductArt } from "@/components/art";
import { useCurrentClub } from "@/components/SiteShell";
import { Badge, Empty } from "@/components/ui";
import { useStore } from "@/lib/store";
import { cx, money } from "@/lib/utils";

export default function ProductPage() {
  const club = useCurrentClub();
  const { id } = useParams<{ id: string }>();
  const { db, basket, setBasket, toast } = useStore();
  const p = db.products.find((x) => x.id === id && x.clubId === club.id && x.active);
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  if (!p) {
    return (
      <div className="wrap py-16">
        <Empty title="Product not available" hint="This item may have been removed from the store."><Link href={`/${club.slug}/shop`} className="btn-primary">Back to store</Link></Empty>
      </div>
    );
  }
  const price = p.salePrice ?? p.price;
  const inBasket = basket.filter((b) => b.productId === p.id).reduce((s, b) => s + b.qty, 0);
  const left = Math.max(0, p.stock - inBasket);
  const needsSize = p.sizes.length > 1;
  const add = () => {
    if (needsSize && !size) return setError("Please select a size.");
    if (qty > left) return setError(left ? `Only ${left} more available.` : "You already have all remaining stock in your basket.");
    const s = needsSize ? size : p.sizes[0] ?? "";
    const existing = basket.find((b) => b.productId === p.id && b.size === s);
    setBasket(existing ? basket.map((b) => (b === existing ? { ...b, qty: b.qty + qty } : b)) : [...basket, { productId: p.id, size: s, qty }]);
    setError("");
    setQty(1);
    toast(`${p.name} added to your basket.`);
  };
  return (
    <div className="wrap py-10">
      <Link href={`/${club.slug}/shop`} className="mb-6 inline-flex items-center gap-2 text-sm text-white/55 hover:text-accent"><ArrowLeft size={15} /> Store</Link>
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="card overflow-hidden"><ProductArt product={p} className="h-80 w-full sm:h-[28rem]" /></div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {["Front", "Detail", "Back"].map((v) => (
              <div key={v} className="card relative overflow-hidden"><ProductArt product={{ ...p, image: undefined }} className="h-24 w-full opacity-70" /><span className="absolute bottom-1.5 left-2 text-[10px] uppercase tracking-wider text-white/40">{v}</span></div>
            ))}
          </div>
        </div>
        <div>
          <p className="eyebrow">{p.category} · SKU {p.sku}</p>
          <h1 className="display mt-2 text-4xl sm:text-5xl">{p.name}</h1>
          <p className="display mt-4 text-4xl">
            {p.salePrice != null ? <><span className="text-accent">{money(p.salePrice)}</span> <span className="text-xl text-white/40 line-through">{money(p.price)}</span></> : money(price)}
          </p>
          <p className="mt-5 leading-relaxed text-white/70">{p.description}</p>
          <div className="mt-5">{p.stock <= 0 ? <Badge tone="red">Out of stock</Badge> : p.stock <= 5 ? <Badge tone="amber">{`Only ${p.stock} left`}</Badge> : <Badge tone="green">{`In stock — ${p.stock} available`}</Badge>}</div>
          {needsSize && (
            <div className="mt-6">
              <p className="label">Size <span className="text-accent">*</span></p>
              <div className="flex flex-wrap gap-2">
                {p.sizes.map((s) => <button key={s} onClick={() => { setSize(s); setError(""); }} className={cx("min-w-12 rounded-md border px-3 py-2.5 font-display font-bold transition", size === s ? "border-accent bg-accent text-black" : "border-line bg-white/5 hover:border-accent/50")}>{s}</button>)}
              </div>
            </div>
          )}
          {p.sizes.length === 1 && <p className="mt-6 text-sm text-white/55">Size: {p.sizes[0]}</p>}
          <div className="mt-6 flex flex-wrap items-end gap-4">
            <div>
              <p className="label">Quantity</p>
              <div className="flex items-center rounded-md border border-line">
                <button aria-label="Decrease quantity" className="p-3 text-white/70 hover:text-white disabled:opacity-30" disabled={qty <= 1} onClick={() => setQty(qty - 1)}><Minus size={15} /></button>
                <span className="w-10 text-center font-display text-lg font-bold tabular-nums">{qty}</span>
                <button aria-label="Increase quantity" className="p-3 text-white/70 hover:text-white disabled:opacity-30" disabled={qty >= left} onClick={() => setQty(qty + 1)}><Plus size={15} /></button>
              </div>
            </div>
            <button onClick={add} disabled={p.stock <= 0} className="btn-primary flex-1 !py-3.5 sm:flex-none sm:px-10"><ShoppingBag size={17} /> {p.stock <= 0 ? "Out of stock" : "Add to basket"}</button>
          </div>
          {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}
          {inBasket > 0 && <Link href={`/${club.slug}/basket`} className="mt-4 inline-block text-sm text-accent hover:underline">{inBasket} in your basket — view basket</Link>}
        </div>
      </div>
    </div>
  );
}
