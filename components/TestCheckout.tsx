"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { money } from "@/lib/utils";
import { Modal } from "./ui";

/**
 * Stand-in for a Stripe Checkout session in test mode. In production this step is a redirect to Stripe,
 * and `onPaid` is replaced by the verified `checkout.session.completed` webhook.
 */
export function TestCheckout({ open, amount, description, onClose, onPaid }: { open: boolean; amount: number; description: string; onClose: () => void; onPaid: () => void }) {
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) setBusy(false);
  }, [open]);
  const pay = () => {
    if (busy) return;
    setBusy(true);
    setTimeout(onPaid, 1100);
  };
  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title="Secure checkout">
      <div className="mb-4 rounded-md border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
        <strong>Test mode — simulated payment.</strong> No card is charged and no real card details are collected in this demo.
      </div>
      <div className="flex items-center justify-between rounded-lg border border-line p-4">
        <span className="text-sm text-white/65">{description}</span>
        <span className="display text-3xl">{money(amount)}</span>
      </div>
      <div className="mt-4 space-y-3 opacity-80">
        <div><span className="label">Card number</span><div className="input select-none font-mono tracking-widest">4242 4242 4242 4242</div></div>
        <div className="grid grid-cols-2 gap-3">
          <div><span className="label">Expiry</span><div className="input select-none font-mono">12 / 34</div></div>
          <div><span className="label">CVC</span><div className="input select-none font-mono">123</div></div>
        </div>
      </div>
      <button onClick={pay} disabled={busy} className="btn-primary mt-5 w-full">
        <Lock size={15} /> {busy ? "Processing test payment…" : `Pay ${money(amount)}`}
      </button>
      <button onClick={onClose} disabled={busy} className="mt-2 w-full py-2 text-xs text-white/45 hover:text-white">Cancel and return</button>
    </Modal>
  );
}
