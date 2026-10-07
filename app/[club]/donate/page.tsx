"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { DonationProgress } from "@/components/blocks";
import { useCurrentClub } from "@/components/SiteShell";
import { TestCheckout } from "@/components/TestCheckout";
import { Field, PageHero } from "@/components/ui";
import { useStore } from "@/lib/store";
import { cx, money, timeAgo, uid } from "@/lib/utils";

const PRESETS = [5, 10, 20, 50];

export default function DonatePage() {
  const club = useCurrentClub();
  const { db, update, toast, now } = useStore();
  const [amount, setAmount] = useState<number | "custom">(10);
  const [custom, setCustom] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [thanks, setThanks] = useState<number | null>(null);
  const short = club.name.split(" ")[0];
  const value = amount === "custom" ? Math.round(Number(custom) * 100) / 100 : amount;
  const recent = db.donations.filter((d) => d.clubId === club.id).sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);

  const start = () => {
    if (!Number.isFinite(value) || value < 1 || value > 1000) return setError("Please enter an amount between £1 and £1,000.");
    setError("");
    setPaying(true);
  };
  // Stands in for the verified Stripe webhook: the donation only exists once "payment" has succeeded.
  const paid = () => {
    update((d, log) => {
      d.donations.unshift({ id: uid(), clubId: club.id, amount: value, name: name.trim() || "Anonymous", createdAt: Date.now(), status: "succeeded" });
      log("Donation received", money(value), name.trim() || "Anonymous", club.id, "Stripe webhook (test)");
    });
    setPaying(false);
    setThanks(value);
    toast(`Thank you — your ${money(value)} test donation has been recorded.`);
  };

  return (
    <>
      <PageHero eyebrow="Supporters" title={`Support ${short}`} sub="Donations help support league fees, website costs, competitions and community activities." />
      <div className="wrap grid gap-8 py-10 lg:grid-cols-[1.3fr_1fr]">
        <div className="card p-5 sm:p-7">
          {thanks !== null && (
            <div className="mb-5 flex items-center gap-3 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
              <Heart size={18} className="shrink-0 text-accent" /> Thank you for your {money(thanks)} donation. The club goal has been updated.
            </div>
          )}
          <h2 className="display text-2xl">Choose an amount</h2>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {PRESETS.map((p) => (
              <button key={p} onClick={() => setAmount(p)} className={cx("rounded-lg border py-4 font-display text-2xl font-bold transition", amount === p ? "border-accent bg-accent text-black" : "border-line bg-white/5 hover:border-accent/50")}>£{p}</button>
            ))}
            <button onClick={() => setAmount("custom")} className={cx("rounded-lg border py-4 font-display text-lg font-bold uppercase tracking-wider transition", amount === "custom" ? "border-accent bg-accent text-black" : "border-line bg-white/5 hover:border-accent/50")}>Custom</button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {amount === "custom" && <Field label="Custom amount (£)" required error={error}><input className="input" type="number" min={1} max={1000} step="0.01" value={custom} onChange={(e) => setCustom(e.target.value)} /></Field>}
            <Field label="Name to display" help="Optional — leave blank to donate anonymously"><input className="input" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} /></Field>
          </div>
          {amount !== "custom" && error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          <button onClick={start} className="btn-primary mt-6 w-full sm:w-auto"><Heart size={16} /> Donate {Number.isFinite(value) && value > 0 ? money(value) : ""}</button>
          <p className="mt-3 text-xs text-white/40">Payments run in test mode in this demo. No real money is taken.</p>
        </div>
        <aside className="space-y-5">
          <DonationProgress club={club} />
          <div className="card p-5">
            <p className="eyebrow mb-3">Recent supporters</p>
            {recent.length ? (
              <ul className="divide-y divide-line text-sm">
                {recent.map((d) => (
                  <li key={d.id} className="flex items-center justify-between py-2.5"><span>{d.name}<span className="ml-2 text-xs text-white/40">{timeAgo(d.createdAt, now)}</span></span><span className="display text-lg text-accent">{money(d.amount)}</span></li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-white/50">Be the first to support the club this month.</p>
            )}
          </div>
        </aside>
      </div>
      <TestCheckout open={paying} amount={Number.isFinite(value) ? value : 0} description={`Donation to ${club.name}`} onClose={() => setPaying(false)} onPaid={paid} />
    </>
  );
}
