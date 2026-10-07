"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import type { Club, DB } from "@/lib/types";
import { type LogFn, useStore } from "@/lib/store";
import { cx, getPath, setPath, uid } from "@/lib/utils";
import { Confirm, Empty, Field, ImageInput, Modal, RichEditor } from "../ui";

export const AdminClubCtx = createContext<Club | null>(null);
export function useAdminClub() {
  const c = useContext(AdminClubCtx);
  if (!c) throw new Error("No admin club");
  return c;
}

export function AdminHead({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="display text-4xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-white/55">{sub}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "select" | "datetime" | "date" | "rich" | "image" | "images" | "list" | "bool";
  options?: string[];
  required?: boolean;
  max?: number;
  help?: string;
  full?: boolean;
  step?: string;
}

type Row = { id: string; clubId: string } & Record<string, any>;
type Collection = { [K in keyof DB]: DB[K] extends { id: string; clubId: string }[] ? K : never }[keyof DB];

const toLocal = (ts: number, len: number) => (Number.isFinite(ts) ? new Date(ts - new Date(ts).getTimezoneOffset() * 60000).toISOString().slice(0, len) : "");

export function FormFields({ fields, value, onChange }: { fields: FieldDef[]; value: any; onChange: (v: any) => void }) {
  const set = (key: string, v: any) => onChange(setPath(value, key, v));
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => {
        const v = getPath(value, f.key);
        const type = f.type ?? "text";
        const wide = f.full || ["rich", "textarea", "images", "list"].includes(type);
        let control: React.ReactNode;
        if (type === "textarea") control = <textarea className="input min-h-[5.5rem]" maxLength={f.max ?? 1000} value={v ?? ""} onChange={(e) => set(f.key, e.target.value)} />;
        else if (type === "number") control = <input className="input" type="number" step={f.step ?? "1"} value={v ?? ""} onChange={(e) => set(f.key, e.target.value === "" ? "" : Number(e.target.value))} />;
        else if (type === "select") control = <select className="input" value={v ?? ""} onChange={(e) => set(f.key, e.target.value)}>{!f.required && <option value="">—</option>}{f.options?.map((o) => <option key={o}>{o}</option>)}</select>;
        else if (type === "datetime") control = <input className="input" type="datetime-local" value={toLocal(v, 16)} onChange={(e) => set(f.key, e.target.value ? new Date(e.target.value).getTime() : NaN)} />;
        else if (type === "date") control = <input className="input" type="date" value={toLocal(v, 10)} onChange={(e) => set(f.key, e.target.value ? new Date(e.target.value + "T12:00").getTime() : NaN)} />;
        else if (type === "rich") control = <RichEditor value={v ?? ""} onChange={(html) => set(f.key, html)} />;
        else if (type === "image") control = <ImageInput value={v} onChange={(img) => set(f.key, img)} />;
        else if (type === "images")
          control = (
            <div className="space-y-2">
              {(v ?? []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(v as string[]).map((src, i) => (
                    <div key={i} className="relative h-16 w-16 overflow-hidden rounded-md border border-line">
                      <img src={src} alt="" className="h-full w-full object-cover" />
                      <button type="button" aria-label="Remove image" onClick={() => set(f.key, (v as string[]).filter((_, k) => k !== i))} className="absolute right-0 top-0 bg-black/70 p-0.5 text-white"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
              {(v ?? []).length < 4 ? <ImageInput onChange={(img) => img && set(f.key, [...(v ?? []), img])} /> : <p className="text-xs text-white/40">Maximum of 4 images in the demo.</p>}
            </div>
          );
        else if (type === "list") control = <textarea className="input min-h-[5.5rem]" value={(v ?? []).join("\n")} onChange={(e) => set(f.key, e.target.value.split("\n"))} />;
        else if (type === "bool") control = <label className="flex cursor-pointer items-center gap-2 py-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[rgb(var(--accent))]" checked={!!v} onChange={(e) => set(f.key, e.target.checked)} /> Yes</label>;
        else control = <input className="input" maxLength={f.max ?? 160} value={v ?? ""} onChange={(e) => set(f.key, e.target.value)} />;
        const body = <Field label={f.label} required={f.required} help={f.help ?? (type === "list" ? "One per line" : undefined)}>{control}</Field>;
        // Rich editors and uploads contain their own controls, so they must not sit inside a <label>.
        return (
          <div key={f.key} className={cx(wide && "sm:col-span-2")}>
            {["rich", "image", "images", "bool"].includes(type) ? <div><span className="label">{f.label} {f.required && <span className="text-accent">*</span>}</span>{control}{f.help && <span className="mt-1 block text-xs text-white/40">{f.help}</span>}</div> : body}
          </div>
        );
      })}
    </div>
  );
}

/** Trims strings, drops empty list entries and coerces blank numbers to 0 before saving. */
export function cleanRecord<T>(fields: FieldDef[], item: T): T {
  let out: any = item;
  fields.forEach((f) => {
    const v = getPath(out, f.key);
    if (f.type === "number") out = setPath(out, f.key, Number.isFinite(Number(v)) && v !== "" ? Number(v) : f.required ? NaN : 0);
    else if (f.type === "list") out = setPath(out, f.key, ((v ?? []) as string[]).map((s) => s.trim()).filter(Boolean));
    else if (typeof v === "string" && f.type !== "rich") out = setPath(out, f.key, v.trim());
  });
  return out;
}

export function missingField(fields: FieldDef[], item: any) {
  const f = fields.find((x) => {
    if (!x.required) return false;
    const v = getPath(item, x.key);
    return v === undefined || v === null || v === "" || (typeof v === "number" && !Number.isFinite(v)) || (x.type === "rich" && !String(v).replace(/<[^>]*>/g, "").trim());
  });
  return f ? `${f.label} is required.` : null;
}

interface CrudProps<T extends Row> {
  collection: Collection;
  title: string;
  sub?: string;
  noun: string;
  fields: FieldDef[];
  columns: { label: string; render: (item: T) => React.ReactNode; hide?: boolean }[];
  blank: () => Partial<T>;
  label: (item: T) => string;
  sort?: (a: T, b: T) => number;
  validate?: (item: T, db: DB) => string | null;
  prepare?: (item: T, prev: T | undefined, db: DB) => T;
  afterSave?: (item: T, prev: T | undefined, log: LogFn) => void;
  rowActions?: (item: T) => React.ReactNode;
  verbs?: { create: string; edit: string; remove: string };
  removeLabel?: string;
  removeBody?: (item: T) => string;
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;
  seedDraft?: Partial<T> | null;
  onSeedUsed?: () => void;
  emptyHint?: string;
}

export function Crud<T extends Row>(p: CrudProps<T>) {
  const club = useAdminClub();
  const { db, update, toast } = useStore();
  const [editing, setEditing] = useState<T | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);
  const verbs = p.verbs ?? { create: `${p.noun} created`, edit: `${p.noun} edited`, remove: `${p.noun} deleted` };
  const rows = (db[p.collection] as unknown as T[]).filter((r) => r.clubId === club.id);
  if (p.sort) rows.sort(p.sort);

  const open = (item: Partial<T>, fresh: boolean) => {
    setEditing({ ...(item as T) });
    setIsNew(fresh);
    setError("");
  };
  useEffect(() => {
    if (p.seedDraft) {
      open({ ...p.blank(), ...p.seedDraft, id: uid(), clubId: club.id }, true);
      p.onSeedUsed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.seedDraft]);

  const save = () => {
    if (!editing || busy) return;
    let item = cleanRecord(p.fields, editing);
    const prev = isNew ? undefined : rows.find((r) => r.id === item.id);
    const err = missingField(p.fields, item) ?? p.validate?.(item, db) ?? null;
    if (err) return setError(err);
    if (p.prepare) item = p.prepare(item, prev, db);
    setBusy(true);
    const ok = update((d, log) => {
      const list = d[p.collection] as unknown as T[];
      const i = list.findIndex((r) => r.id === item.id);
      if (i >= 0) list[i] = item;
      else list.unshift(item);
      log(isNew ? verbs.create : verbs.edit, p.label(item), "", club.id);
      p.afterSave?.(item, prev, log);
    });
    setBusy(false);
    if (!ok) return setError("We couldn't save your changes. Please try again.");
    toast(`${p.noun} ${isNew ? "created" : "saved"}. The public site has been updated.`);
    setEditing(null);
  };

  const remove = () => {
    if (!removing) return;
    update((d, log) => {
      (d as any)[p.collection] = (d[p.collection] as unknown as T[]).filter((r) => r.id !== removing.id);
      log(verbs.remove, p.label(removing), "", club.id);
    });
    toast(`${p.noun} removed.`);
    setRemoving(null);
  };

  const visible = p.columns.filter((c) => !c.hide);
  return (
    <div>
      <AdminHead title={p.title} sub={p.sub}>
        {p.headerExtra}
        <button className="btn-primary" onClick={() => open({ ...p.blank(), id: uid(), clubId: club.id }, true)}><Plus size={16} /> Add {p.noun.toLowerCase()}</button>
      </AdminHead>

      {rows.length ? (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <thead className="border-b border-line text-left text-[10px] uppercase tracking-wider text-white/45">
              <tr>{visible.map((c) => <th key={c.label} className="px-4 py-3 font-semibold">{c.label}</th>)}<th className="px-4 py-3 text-right font-semibold">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.03]">
                  {visible.map((c) => <td key={c.label} className="px-4 py-3 align-middle">{c.render(r)}</td>)}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {p.rowActions?.(r)}
                      <button title="Edit" aria-label={`Edit ${p.label(r)}`} onClick={() => open(r, false)} className="rounded p-2 text-white/60 hover:bg-white/10 hover:text-accent"><Pencil size={15} /></button>
                      <button title="Delete" aria-label={`Delete ${p.label(r)}`} onClick={() => setRemoving(r)} className="rounded p-2 text-white/60 hover:bg-white/10 hover:text-red-400"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty title={`No ${p.title.toLowerCase()} yet`} hint={p.emptyHint ?? `Add your first ${p.noun.toLowerCase()} to see it on the public site.`} />
      )}
      {p.footer}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`${isNew ? "Add" : "Edit"} ${p.noun.toLowerCase()}`} wide>
        {editing && (
          <form onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
            <FormFields fields={p.fields} value={editing} onChange={setEditing} />
            {error && <p role="alert" className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : isNew ? `Create ${p.noun.toLowerCase()}` : "Save changes"}</button>
            </div>
          </form>
        )}
      </Modal>
      <Confirm open={!!removing} title={`${p.removeLabel ?? "Delete"}?`} body={removing ? p.removeBody?.(removing) ?? `Delete “${p.label(removing)}”? This cannot be undone.` : ""} action={p.removeLabel ?? "Delete"} onCancel={() => setRemoving(null)} onConfirm={remove} />
    </div>
  );
}
