"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { ProductArt } from "@/components/art";
import { useCurrentClub } from "@/components/SiteShell";
import { TestCheckout } from "@/components/TestCheckout";
import { Empty, Field, PageHero } from "@/components/ui";
import { useStore } from "@/lib/store";
import { money, uid } from "@/lib/utils";

export default function BasketPage() {
  const club = useCurrentClub();
  const { db, basket, setBasket, update, toast } = useStore();
  const [f, setF] = useState({ name: "", email: "", line1: "", city: "", postcode: "", country: "United Kingdom" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);
  const [confirmed, setConfirmed] = useState<{ ref: string; total: number } | null>(null);

  // Prices always come from the catalogue, never from what the basket stored.
  const lines = basket.flatMap((b) => {
    const p = db.products.find((x) => x.id === b.productId && x.clubId === club.id && x.active);
    return p ? [{ b, p, price: p.salePrice ?? p.price }] : [];
  });
  const total = Math.round(lines.reduce((s, l) => s + l.price * l.b.qty, 0) * 100) / 100;
  const short = lines.find((l) => l.b.qty > l.p.stock);
  const setQty = (i: number, qty: number) => setBasket(basket.map((b) => (b === lines[i].b ? { ...b, qty } : b)).filter((b) => b.qty > 0));

  const checkout = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    (["name", "line1", "city", "postcode", "country"] as const).forEach((k) => !f[k].trim() && (er[k] = "Required."));
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) er.email = "Please enter a valid email address.";
    if (short) er.form = `${short.p.name} only has ${short.p.stock} left in stock. Please reduce the quantity.`;
    setErrors(er);
    if (!Object.keys(er).length) setPaying(true);
  };

  // Stands in for the verified Stripe webhook: stock is re-checked and the order is written in one update.
  const paid = () => {
    let ref = "";
    let failed = "";
    const ok = update((d, log) => {
      for (const l of lines) {
        const prod = d.products.find((x) => x.id === l.p.id);
        if (!prod || prod.stock < l.b.qty) {
          failed = `${l.p.name} sold out before your payment completed.`;
          return;
        }
      }
      ref = `${club.short}-ORD-${d.counters.order++}`;
      lines.forEach((l) => (d.products.find((x) => x.id === l.p.id)!.stock -= l.b.qty));
      d.orders.unshift({
        id: uid(), ref, clubId: club.id, customer: f.name.trim(), email: f.email.trim(), address: `${f.line1.trim()}, ${f.city.trim()}, ${f.postcode.trim()}, ${f.country.trim()}`,
        items: lines.map((l) => ({ productId: l.p.id, name: l.p.name, size: l.b.size, qty: l.b.qty, price: l.price })), total, payment: "Paid — Test Mode", status: "New", createdAt: Date.now(),
      });
      d.emails.unshift({ id: uid(), clubId: club.id, to: club.contact.general, subject: `New shop order ${ref} — ${f.name.trim()}`, status: "Demo delivery — not sent", createdAt: Date.now() });
      log("Order received", ref, money(total), club.id, "Stripe webhook (test)");
    });
    setPaying(false);
    if (!ok || failed) return toast(failed || "We couldn't complete your order. You have not been charged.", "error");
    setBasket(basket.filter((b) => !lines.some((l) => l.b === b)));
    setConfirmed({ ref, total });
  };

  if (confirmed) {
    return (
      <div className="grid-glow">
        <div className="wrap flex min-h-[65vh] items-center justify-center py-12">
          <div className="card w-full max-w-lg animate-rise p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-black"><Check size={28} /></span>
            <h1 className="display mt-5 text-4xl">Order confirmed</h1>
            <p className="display mt-4 text-3xl text-accent">{confirmed.ref}</p>
            <p className="mt-4 text-sm text-white/65">Thank you. Your test payment of {money(confirmed.total)} was successful and the club has your order.</p>
            <p className="mt-3 text-xs text-white/40">Demo mode: the order notification email is recorded as a demo delivery, not sent.</p>
            <div className="mt-7 flex justify-center gap-3">
              <Link href={`/${club.slug}/shop`} className="btn-primary">Continue shopping</Link>
              <Link href="/admin/orders" className="btn-ghost">View in Admin</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const inp = (k: keyof typeof f, label: string, type = "text") => (
    <Field label={label} required error={errors[k]}><input className="input" type={type} maxLength={120} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></Field>
  );

  return (
    <>
      <PageHero eyebrow="Store" title="Your basket" />
      <div className="wrap py-10">
        {!lines.length ? (
          <Empty title="Your basket is empty" hint="Add something from the store to get started."><Link href={`/${club.slug}/shop`} className="btn-primary">Visit the store</Link></Empty>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
            <div className="space-y-3">
              {lines.map((l, i) => (
                <div key={l.p.id + l.b.size} className="card flex items-center gap-4 p-3">
                  <ProductArt product={l.p} className="h-20 w-20 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{l.p.name}</p>
                    <p className="text-xs text-white/50">{l.b.size ? `Size ${l.b.size} · ` : ""}{money(l.price)} each</p>
                    {l.b.qty > l.p.stock && <p className="text-xs text-red-400">Only {l.p.stock} left in stock</p>}
                  </div>
                  <select aria-label="Quantity" className="input !w-16 !px-2" value={l.b.qty} onChange={(e) => setQty(i, Number(e.target.value))}>
                    {Array.from({ length: Math.max(l.b.qty, Math.min(10, l.p.stock)) }, (_, n) => <option key={n + 1}>{n + 1}</option>)}
                  </select>
                  <span className="display w-20 text-right text-xl">{money(l.price * l.b.qty)}</span>
                  <button aria-label={`Remove ${l.p.name}`} onClick={() => setQty(i, 0)} className="rounded p-2 text-white/45 hover:bg-white/10 hover:text-red-400"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            <form onSubmit={checkout} noValidate className="card h-fit space-y-4 p-5">
              <h2 className="display text-2xl">Delivery details</h2>
              {inp("name", "Full name")}
              {inp("email", "Email", "email")}
              {inp("line1", "Address")}
              <div className="grid grid-cols-2 gap-3">{inp("city", "Town / city")}{inp("postcode", "Postcode")}</div>
              {inp("country", "Country")}
              <div className="flex items-center justify-between border-t border-line pt-4">
                <span className="text-sm uppercase tracking-wider text-white/55">Total</span>
                <span className="display text-3xl">{money(total)}</span>
              </div>
              {errors.form && <p role="alert" className="text-sm text-red-400">{errors.form}</p>}
              <button className="btn-primary w-full !py-3.5">Proceed to checkout</button>
              <p className="text-center text-xs text-white/40">Checkout runs in test mode. No real payment is taken.</p>
            </form>
          </div>
        )}
      </div>
      <TestCheckout open={paying} amount={total} description={`${club.name} store order`} onClose={() => setPaying(false)} onPaid={paid} />
    </>
  );
}
