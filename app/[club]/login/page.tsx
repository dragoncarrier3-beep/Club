"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCurrentClub } from "@/components/SiteShell";
import { Field } from "@/components/ui";
import { DEMO_PASSWORD } from "@/lib/seed";
import { useStore } from "@/lib/store";
import { uid } from "@/lib/utils";

const DEMO = [
  { id: "u-member", label: "Member", hint: "Can open the Tactics Centre" },
  { id: "u-admin", label: "Club Admin", hint: "Manages Venari content" },
  { id: "u-super", label: "Super Admin", hint: "Manages every club" },
];

export default function LoginPage() {
  const club = useCurrentClub();
  const router = useRouter();
  const { login, quickLogin, update, toast, user } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);

  const go = (admin?: boolean) => {
    const next = new URLSearchParams(window.location.search).get("next");
    router.push(next && next.startsWith("/") ? next : admin ? "/admin" : `/${club.slug}`);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError("");
    if (forgot) {
      if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Please enter a valid email address.");
      update((d) => d.emails.unshift({ id: uid(), clubId: club.id, to: email.trim(), subject: "Reset your password", status: "Demo delivery — not sent", createdAt: Date.now() }));
      toast("If that email is registered, a reset link has been queued. Demo mode: the email is logged in Admin → Logs, not sent.");
      setForgot(false);
      return;
    }
    setBusy(true);
    const err = await login(email, password);
    setBusy(false);
    if (err) return setError(err);
    toast("Welcome back.");
    go();
  };

  return (
    <div className="grid-glow">
      <div className="wrap grid min-h-[70vh] items-center gap-8 py-12 lg:grid-cols-2">
        <div className="card mx-auto w-full max-w-md p-6">
          <p className="eyebrow">{club.name}</p>
          <h1 className="display mt-1 text-4xl">{forgot ? "Reset password" : "Log in"}</h1>
          {user && <p className="mt-2 text-sm text-white/55">You are signed in as {user.username}.</p>}
          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <Field label="Email" required><input className="input" type="email" autoComplete="email" maxLength={120} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            {!forgot && <Field label="Password" required><input className="input" type="password" autoComplete="current-password" maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>}
            {error && <p role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}
            <button className="btn-primary w-full" disabled={busy}>{busy ? "Signing in…" : forgot ? "Send reset link" : "Log in"}</button>
          </form>
          <div className="mt-4 flex justify-between text-sm">
            <button onClick={() => { setForgot((v) => !v); setError(""); }} className="text-white/55 hover:text-accent">{forgot ? "Back to log in" : "Forgot password?"}</button>
            <Link href={`/${club.slug}/register`} className="text-accent hover:underline">Create an account</Link>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <p className="eyebrow">Demo accounts</p>
          <h2 className="display mt-1 text-3xl">One-click sign in</h2>
          <p className="mt-2 text-sm text-white/55">Use these to explore each role. All demo accounts also accept the password <code className="rounded bg-white/10 px-1.5 py-0.5 text-white">{DEMO_PASSWORD}</code>.</p>
          <div className="mt-5 space-y-3">
            {DEMO.map((d) => (
              <button key={d.id} onClick={() => { quickLogin(d.id); toast(`Signed in as ${d.label}.`); go(d.id !== "u-member"); }} className="card card-hover flex w-full items-center justify-between px-5 py-4 text-left">
                <span><span className="display block text-xl">{d.label}</span><span className="text-xs text-white/50">{d.hint}</span></span>
                <span className="btn-ghost !py-2 text-xs">Sign in</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
