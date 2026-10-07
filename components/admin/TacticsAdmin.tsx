"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Pitch } from "@/components/Pitch";
import { FORMATIONS } from "@/lib/seed";
import { useStore } from "@/lib/store";
import type { Tactic } from "@/lib/types";
import { cx, fmtDate, uid } from "@/lib/utils";
import { Badge, Confirm, Empty, ImageInput } from "../ui";
import { AdminHead, useAdminClub } from "./Crud";

const SECTIONS = ["Formation", "Build-up", "Defensive Shape", "Attacking Patterns", "Set Pieces", "Match Notes"];

export function TacticsAdmin() {
  const club = useAdminClub();
  const { db, update, toast } = useStore();
  const tactics = db.tactics.filter((t) => t.clubId === club.id);
  const [draft, setDraft] = useState<Tactic | null>(null);
  const [removing, setRemoving] = useState<Tactic | null>(null);
  const [error, setError] = useState("");
  const dirty = draft && JSON.stringify(draft) !== JSON.stringify(tactics.find((t) => t.id === draft.id));

  const create = () => setDraft({ id: uid(), clubId: club.id, name: "", formation: "4-2-3-1", published: false, markers: FORMATIONS["4-2-3-1"], sections: SECTIONS.map((title) => ({ title, body: "" })), images: [], updatedAt: Date.now() });
  const save = (publish?: boolean) => {
    if (!draft) return;
    if (!draft.name.trim()) return setError("Please give this tactic a name.");
    const next = { ...draft, name: draft.name.trim(), published: publish ?? draft.published, updatedAt: Date.now() };
    const ok = update((d, log) => {
      const i = d.tactics.findIndex((t) => t.id === next.id);
      if (i >= 0) d.tactics[i] = next;
      else d.tactics.push(next);
      log("Tactics updated", next.name, next.published ? "Published" : "Draft", club.id);
    });
    if (!ok) return;
    setDraft(next);
    setError("");
    toast(next.published ? "Tactic saved and visible to members." : "Tactic saved as a draft. Members cannot see it yet.");
  };
  const remove = () => {
    if (!removing) return;
    update((d, log) => {
      d.tactics = d.tactics.filter((t) => t.id !== removing.id);
      log("Tactics deleted", removing.name, "", club.id);
    });
    if (draft?.id === removing.id) setDraft(null);
    setRemoving(null);
    toast("Tactic deleted.");
  };

  return (
    <div>
      <AdminHead title="Tactics" sub="Members-only formations and notes. Drag the markers on the pitch to position players.">
        <button className="btn-primary" onClick={create}><Plus size={16} /> New tactic</button>
      </AdminHead>
      <div className="mb-6 flex flex-wrap gap-2">
        {tactics.map((t) => (
          <button key={t.id} onClick={() => { setDraft(structuredClone(t)); setError(""); }} className={cx("rounded-lg border px-4 py-3 text-left transition", draft?.id === t.id ? "border-accent bg-accent/10" : "border-line bg-panel hover:border-accent/50")}>
            <span className="display block text-lg">{t.name}</span>
            <span className="flex items-center gap-2 text-xs text-white/50">{t.formation} <Badge>{t.published ? "Published" : "Draft"}</Badge></span>
          </button>
        ))}
      </div>

      {!draft ? (
        <Empty title={tactics.length ? "Select a tactic to edit" : "No tactics yet"} hint={tactics.length ? "Choose one above, or create a new tactic." : "Create your first tactic to share it with club members."} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
          <div className="card p-5">
            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 block sm:col-span-1"><span className="label">Name <span className="text-accent">*</span></span><input className="input" maxLength={50} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
              <label className="col-span-2 block sm:col-span-1"><span className="label">Formation</span>
                <select className="input" value={draft.formation} onChange={(e) => setDraft({ ...draft, formation: e.target.value, markers: FORMATIONS[e.target.value] ?? draft.markers })}>
                  {Object.keys(FORMATIONS).map((f) => <option key={f}>{f}</option>)}
                </select>
              </label>
            </div>
            <p className="my-3 text-xs text-white/45">Drag any marker to reposition it. Changing the formation resets the markers.</p>
            <Pitch markers={draft.markers} onChange={(markers) => setDraft({ ...draft, markers })} />
          </div>
          <div className="space-y-4">
            {draft.sections.map((s, i) => (
              <label key={s.title} className="block"><span className="label">{s.title}</span>
                <textarea className="input min-h-[4.5rem]" maxLength={1200} value={s.body} onChange={(e) => setDraft({ ...draft, sections: draft.sections.map((x, k) => (k === i ? { ...x, body: e.target.value } : x)) })} />
              </label>
            ))}
            <div>
              <span className="label">Tactical diagrams</span>
              {draft.images.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {draft.images.map((src, i) => (
                    <div key={i} className="relative h-20 w-20 overflow-hidden rounded-md border border-line">
                      <img src={src} alt={`Diagram ${i + 1}`} className="h-full w-full object-cover" />
                      <button type="button" aria-label="Remove diagram" onClick={() => setDraft({ ...draft, images: draft.images.filter((_, k) => k !== i) })} className="absolute right-0 top-0 bg-black/70 p-0.5"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
              {draft.images.length < 3 ? <ImageInput onChange={(img) => img && setDraft({ ...draft, images: [...draft.images, img] })} /> : <p className="text-xs text-white/40">Maximum of 3 diagrams in the demo.</p>}
              <p className="mt-1 text-xs text-white/40">Diagrams are stored privately and only shown to signed-in members.</p>
            </div>
            {error && <p role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}
            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <button className="btn-primary" onClick={() => save()}>{dirty ? "Save changes" : "Saved"}</button>
              <button className="btn-ghost" onClick={() => save(!draft.published)}>{draft.published ? "Unpublish" : "Save & publish"}</button>
              <span className="text-xs text-white/40">Updated {fmtDate(draft.updatedAt)}</span>
              {tactics.some((t) => t.id === draft.id) && <button className="ml-auto rounded p-2 text-white/50 hover:bg-white/10 hover:text-red-400" aria-label="Delete tactic" title="Delete tactic" onClick={() => setRemoving(draft)}><Trash2 size={16} /></button>}
            </div>
          </div>
        </div>
      )}
      <Confirm open={!!removing} title="Delete tactic?" body={removing ? `Delete “${removing.name}”? Members will no longer be able to see it.` : ""} action="Delete tactic" onCancel={() => setRemoving(null)} onConfirm={remove} />
    </div>
  );
}
