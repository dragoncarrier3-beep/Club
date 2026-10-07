"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCurrentClub } from "@/components/SiteShell";
import { Field } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function RegisterPage() {
  const club = useCurrentClub();
  const router = useRouter();
  const { register, toast } = useStore();
  const [f, setF] = useState({ username: "", email: "", password: "", confirm: "", psn: "", discord: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const er: Record<string, string> = {};
    if (!/^[A-Za-z0-9_]{3,20}$/.test(f.username.trim())) er.username = "3–20 letters, numbers or underscores.";
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) er.email = "Please enter a valid email address.";
    if (f.password.length < 8) er.password = "Use at least 8 characters.";
    if (f.confirm !== f.password) er.confirm = "Passwords do not match.";
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    const err = await register({ username: f.username, email: f.email, password: f.password, psn: f.psn.trim() || undefined, discord: f.discord.trim() || undefined, clubId: club.id });
    setBusy(false);
    if (err) return setErrors({ form: err });
    toast("Account created. Demo mode: the verification email is logged in Admin → Logs rather than sent.");
    router.push(`/${club.slug}/tactics`);
  };

  return (
    <div className="grid-glow">
      <div className="wrap flex min-h-[70vh] items-center justify-center py-12">
        <div className="card w-full max-w-lg p-6">
          <p className="eyebrow">{club.name}</p>
          <h1 className="display mt-1 text-4xl">Create an account</h1>
          <p className="mt-2 text-sm text-white/55">Members can access the Tactics Centre and protected club content.</p>
          <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2" noValidate>
            <Field label="Username" required error={errors.username}><input className="input" maxLength={20} autoComplete="username" value={f.username} onChange={set("username")} /></Field>
            <Field label="Email" required error={errors.email}><input className="input" type="email" maxLength={120} autoComplete="email" value={f.email} onChange={set("email")} /></Field>
            <Field label="Password" required error={errors.password}><input className="input" type="password" maxLength={72} autoComplete="new-password" value={f.password} onChange={set("password")} /></Field>
            <Field label="Confirm password" required error={errors.confirm}><input className="input" type="password" maxLength={72} autoComplete="new-password" value={f.confirm} onChange={set("confirm")} /></Field>
            <Field label="PSN / EA ID" help="Optional"><input className="input" maxLength={32} value={f.psn} onChange={set("psn")} /></Field>
            <Field label="Discord username" help="Optional"><input className="input" maxLength={40} value={f.discord} onChange={set("discord")} /></Field>
            {errors.form && <p role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200 sm:col-span-2">{errors.form}</p>}
            <button className="btn-primary sm:col-span-2" disabled={busy}>{busy ? "Creating account…" : "Register"}</button>
          </form>
          <p className="mt-4 text-center text-sm text-white/55">Already registered? <Link href={`/${club.slug}/login`} className="text-accent hover:underline">Log in</Link></p>
        </div>
      </div>
    </div>
  );
}
