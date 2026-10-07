"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { useCurrentClub } from "@/components/SiteShell";
import { Field, PageHero } from "@/components/ui";
import { useStore } from "@/lib/store";
import { cx, uid } from "@/lib/utils";

const POS = ["GK", "RB", "CB", "LB", "CDM", "CM", "CAM", "RW", "LW", "ST"];
const STEPS = ["Player", "Football", "Experience", "Profile", "Submit"];
type F = Record<string, string>;
const BLANK: F = { realName: "", gamerTag: "", age: "", email: "", discord: "", psn: "", primaryPos: "", secondaryPos: "", formation: "", currentClub: "", previousClubs: "", compExp: "", leagueExp: "", availability: "", mic: "", connection: "", why: "", bring: "", strengths: "", improve: "", agree: "" };

const REQUIRED: string[][] = [
  ["realName", "gamerTag", "age", "email", "discord", "psn"],
  ["primaryPos", "formation"],
  ["compExp", "availability", "mic", "connection"],
  ["why", "bring", "strengths", "improve"],
  ["agree"],
];

export default function TrialsPage() {
  const club = useCurrentClub();
  const { db, update } = useStore();
  const [step, setStep] = useState(0);
  const [f, setF] = useState<F>(BLANK);
  const [errors, setErrors] = useState<F>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const short = club.name.split(" ")[0];
  const prefix = club.short;

  const validate = (s: number) => {
    const er: F = {};
    REQUIRED[s].forEach((k) => {
      if (!f[k].trim()) er[k] = "This field is required.";
    });
    if (s === 0) {
      if (f.email && !/^\S+@\S+\.\S+$/.test(f.email.trim())) er.email = "Please enter a valid email address.";
      const age = Number(f.age);
      if (f.age && (!Number.isInteger(age) || age < 13 || age > 60)) er.age = "Please enter an age between 13 and 60.";
    }
    if (s === 3) ["why", "bring"].forEach((k) => f[k].trim() && f[k].trim().length < 15 && (er[k] = "Please tell us a little more (at least 15 characters)."));
    if (s === 4 && !f.agree) er.agree = "Please confirm before submitting.";
    setErrors(er);
    return !Object.keys(er).length;
  };

  const submit = () => {
    if (busy || !validate(4)) return;
    const open = db.trials.find((t) => t.clubId === club.id && t.email.toLowerCase() === f.email.trim().toLowerCase() && ["New", "Reviewing", "Trial Offered"].includes(t.status));
    if (open) return setErrors({ agree: `You already have an application under review (${open.ref}). The management team will be in touch.` });
    setBusy(true);
    let ref = "";
    setTimeout(() => {
      const ok = update((d, log) => {
        ref = `${prefix}-TRIAL-${d.counters.trial++}`;
        d.trials.unshift({
          id: uid(), ref, clubId: club.id, realName: f.realName.trim(), gamerTag: f.gamerTag.trim(), age: Number(f.age), email: f.email.trim(), discord: f.discord.trim(), psn: f.psn.trim(),
          primaryPos: f.primaryPos, secondaryPos: f.secondaryPos, formation: f.formation, currentClub: f.currentClub.trim(), previousClubs: f.previousClubs.trim(), compExp: f.compExp, leagueExp: f.leagueExp.trim(),
          availability: f.availability.trim(), mic: f.mic, connection: f.connection, why: f.why.trim(), bring: f.bring.trim(), strengths: f.strengths.trim(), improve: f.improve.trim(), status: "New", createdAt: Date.now(),
        });
        // No email provider is configured in the demo: the notification is recorded, never reported as delivered.
        d.emails.unshift({ id: uid(), clubId: club.id, to: club.contact.recruitment, subject: `New trial application ${ref} — ${f.realName.trim()}`, status: "Demo delivery — not sent", createdAt: Date.now() });
        log("Trial received", ref, `${f.realName.trim()} (${f.primaryPos})`, club.id, "Visitor");
      });
      setBusy(false);
      if (ok) setDone(ref);
      else setErrors({ agree: "We couldn't save your application right now. Please try again." });
    }, 600);
  };

  const input = (k: string, label: string, opts: { req?: boolean; type?: string; max?: number; ph?: string } = {}) => (
    <Field label={label} required={opts.req} error={errors[k]}>
      <input className="input" type={opts.type ?? "text"} maxLength={opts.max ?? 80} placeholder={opts.ph} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
    </Field>
  );
  const select = (k: string, label: string, options: string[], req?: boolean) => (
    <Field label={label} required={req} error={errors[k]}>
      <select className="input" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })}>
        <option value="">Select…</option>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </Field>
  );
  const area = (k: string, label: string) => (
    <Field label={label} required error={errors[k]} help={`${f[k].length}/600`}>
      <textarea className="input min-h-[6rem]" maxLength={600} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
    </Field>
  );

  if (done) {
    return (
      <div className="grid-glow">
        <div className="wrap flex min-h-[65vh] items-center justify-center py-12">
          <div className="card w-full max-w-lg animate-rise p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-black"><Check size={28} /></span>
            <h1 className="display mt-5 text-4xl">Application received</h1>
            <p className="label mt-6">Trial ID</p>
            <p className="display text-3xl text-accent">{done}</p>
            <p className="mt-4 text-sm text-white/65">Thanks for applying to {short}. The management team will review your application.</p>
            <p className="mt-3 text-xs text-white/40">Your application has been saved. Demo mode: the notification email to {club.contact.recruitment} is recorded as a demo delivery, not sent.</p>
            <div className="mt-7 flex justify-center gap-3">
              <Link href={`/${club.slug}`} className="btn-primary">Back to homepage</Link>
              <Link href="/admin/trials" className="btn-ghost">View in Admin</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHero eyebrow="Recruitment" title={`Join ${short}`} sub="Complete the trial application below. It takes about five minutes." />
      <div className="wrap max-w-3xl py-10">
        <ol className="mb-8 flex items-center gap-1 sm:gap-2">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 flex-col gap-1.5">
              <span className={cx("h-1.5 rounded-full", i <= step ? "bg-accent" : "bg-white/10")} />
              <span className={cx("text-[10px] font-bold uppercase tracking-wider sm:text-xs", i === step ? "text-accent" : "text-white/40")}>{i + 1}. {s}</span>
            </li>
          ))}
        </ol>
        <div className="card p-5 sm:p-7">
          <h2 className="display mb-5 text-2xl">Step {step + 1} — {["Player details", "Football", "Experience", "Player profile", "Agreement"][step]}</h2>
          {step === 0 && <div className="grid gap-4 sm:grid-cols-2">{input("realName", "Real name", { req: true })}{input("gamerTag", "Gamer tag", { req: true, max: 24 })}{input("age", "Age", { req: true, type: "number" })}{input("email", "Email", { req: true, type: "email", max: 120 })}{input("discord", "Discord", { req: true, max: 40 })}{input("psn", "PSN / EA ID", { req: true, max: 32 })}</div>}
          {step === 1 && <div className="grid gap-4 sm:grid-cols-2">{select("primaryPos", "Primary position", POS, true)}{select("secondaryPos", "Secondary position", POS)}{select("formation", "Preferred formation", ["4-2-3-1", "4-3-3", "4-4-2", "3-5-2", "No preference"], true)}{input("currentClub", "Current club", { ph: "Or 'Free agent'" })}<div className="sm:col-span-2">{input("previousClubs", "Previous clubs", { max: 200 })}</div></div>}
          {step === 2 && <div className="grid gap-4 sm:grid-cols-2">{select("compExp", "Competitive experience", ["None yet", "Under 1 season", "1–2 seasons", "3+ seasons"], true)}{input("leagueExp", "League experience", { ph: "e.g. VPG Championship" })}{input("availability", "Availability", { req: true, ph: "e.g. Sun–Thu evenings", max: 120 })}{select("mic", "Microphone available?", ["Yes", "No"], true)}{select("connection", "Connection quality", ["Wired fibre", "Wired broadband", "Wi-Fi"], true)}</div>}
          {step === 3 && <div className="space-y-4">{area("why", `Why do you want to join ${short}?`)}{area("bring", "What would you bring to the squad?")}{area("strengths", "What are your strongest qualities?")}{area("improve", "Which areas of your game are you trying to improve?")}</div>}
          {step === 4 && (
            <div>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                {[["Name", f.realName], ["Gamer tag", f.gamerTag], ["Email", f.email], ["Position", `${f.primaryPos}${f.secondaryPos ? ` / ${f.secondaryPos}` : ""}`], ["Formation", f.formation], ["Availability", f.availability]].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-line p-3"><dt className="label !mb-0.5">{k}</dt><dd className="truncate">{v || "—"}</dd></div>
                ))}
              </dl>
              <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm text-white/75">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[rgb(var(--accent))]" checked={!!f.agree} onChange={(e) => setF({ ...f, agree: e.target.checked ? "yes" : "" })} />
                <span>I confirm the information above is accurate and I agree to be contacted by {club.name} about this application. <span className="text-accent">*</span></span>
              </label>
              {errors.agree && <p role="alert" className="mt-2 text-sm text-red-400">{errors.agree}</p>}
            </div>
          )}
          <div className="mt-7 flex justify-between gap-3">
            <button className="btn-ghost" disabled={step === 0 || busy} onClick={() => { setErrors({}); setStep(step - 1); }}>Back</button>
            {step < 4 ? <button className="btn-primary" onClick={() => validate(step) && setStep(step + 1)}>Continue</button> : <button className="btn-primary" disabled={busy} onClick={submit}>{busy ? "Submitting…" : "Submit application"}</button>}
          </div>
        </div>
      </div>
    </>
  );
}
