"use client";

import Link from "next/link";
import { useState } from "react";
import { donationSummary } from "@/components/blocks";
import { canManage, useStore } from "@/lib/store";
import type { Order, Trial, User } from "@/lib/types";
import { cx, fmtDate, fmtDateTime, money, timeAgo } from "@/lib/utils";
import { Badge, Confirm, Empty, Modal } from "../ui";
import { AdminHead, useAdminClub } from "./Crud";

function Filter({ options, value, onChange, counts }: { options: string[]; value: string; onChange: (v: string) => void; counts: Record<string, number> }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {["All", ...options].map((o) => (
        <button key={o} onClick={() => onChange(o)} className={cx("chip transition", value === o && "!border-accent/60 !bg-accent/10 !text-accent")}>{o}{o !== "All" && <span className="opacity-60">{counts[o] ?? 0}</span>}</button>
      ))}
    </div>
  );
}

const th = "px-4 py-3 font-semibold";
const td = "px-4 py-3 align-middle";
const thead = "border-b border-line text-left text-[10px] uppercase tracking-wider text-white/45";

export function Dashboard() {
  const club = useAdminClub();
  const { db, now } = useStore();
  const mine = <T extends { clubId: string }>(list: T[]) => list.filter((x) => x.clubId === club.id);
  const don = donationSummary(db, club, now);
  const newTrials = mine(db.trials).filter((t) => t.status === "New");
  const newOrders = mine(db.orders).filter((o) => o.status === "New");
  const tiles: [string, string | number, string][] = [
    ["Members", mine(db.users).length, "users"],
    ["Squad players", mine(db.players).filter((p) => p.status === "active").length, "squad"],
    ["Upcoming events", mine(db.events).filter((e) => e.startsAt >= now && !e.cancelled).length, "events"],
    ["New trials", newTrials.length, "trials"],
    ["Shop orders", mine(db.orders).length, "orders"],
    ["Donations this month", money(don.raised), "donations"],
    ["News articles", mine(db.news).length, "news"],
    ["Products", mine(db.products).filter((p) => p.active).length, "shop"],
  ];
  const audit = mine(db.audit).slice(0, 8);
  return (
    <div>
      <AdminHead title="Dashboard" sub={`Everything happening at ${club.name}. Changes you make here appear on the public website straight away.`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(([label, value, href]) => (
          <Link key={label} href={`/admin/${href}`} className="card card-hover p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">{label}</p>
            <p className="display mt-1 text-4xl">{value}</p>
          </Link>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <p className="eyebrow mb-3">Needs attention</p>
          {newTrials.length + newOrders.length === 0 ? <p className="text-sm text-white/50">Nothing is waiting for you. Nice work.</p> : (
            <ul className="divide-y divide-line text-sm">
              {newOrders.slice(0, 4).map((o) => <li key={o.id} className="flex items-center justify-between gap-3 py-2.5"><span className="truncate"><span className="font-semibold">{o.ref}</span> · {o.customer} · {money(o.total)}</span><Link href="/admin/orders" className="shrink-0 text-accent hover:underline">Process</Link></li>)}
              {newTrials.slice(0, 4).map((t) => <li key={t.id} className="flex items-center justify-between gap-3 py-2.5"><span className="truncate"><span className="font-semibold">{t.ref}</span> · {t.realName} ({t.primaryPos})</span><Link href="/admin/trials" className="shrink-0 text-accent hover:underline">Review</Link></li>)}
            </ul>
          )}
        </div>
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between"><p className="eyebrow">Recent activity</p><Link href="/admin/logs" className="text-xs text-white/50 hover:text-accent">View all</Link></div>
          {audit.length ? (
            <ul className="divide-y divide-line text-sm">
              {audit.map((a) => <li key={a.id} className="flex items-center justify-between gap-3 py-2.5"><span className="min-w-0 truncate"><span className="font-semibold">{a.action}</span> <span className="text-white/55">· {a.entity}</span></span><span className="shrink-0 text-xs text-white/40">{timeAgo(a.at, now)}</span></li>)}
            </ul>
          ) : <p className="text-sm text-white/50">No activity recorded yet.</p>}
        </div>
      </div>
      <div className="card mt-6 p-5">
        <p className="eyebrow mb-3">Quick actions</p>
        <div className="flex flex-wrap gap-2">
          {[["news", "Write a news article"], ["squad", "Add a player"], ["events", "Add a calendar event"], ["trials", "Review trials"], ["orders", "Process orders"], ["statistics", "Online status controls"]].map(([h, l]) => <Link key={h} href={`/admin/${h}`} className="btn-ghost !py-2 text-xs">{l}</Link>)}
        </div>
      </div>
    </div>
  );
}

const TRIAL_STATUSES: Trial["status"][] = ["New", "Reviewing", "Trial Offered", "Accepted", "Rejected"];

export function TrialsAdmin() {
  const club = useAdminClub();
  const { db, update, toast } = useStore();
  const [filter, setFilter] = useState("All");
  const [selId, setSelId] = useState<string | null>(null);
  const all = db.trials.filter((t) => t.clubId === club.id).sort((a, b) => b.createdAt - a.createdAt);
  const counts = Object.fromEntries(TRIAL_STATUSES.map((s) => [s, all.filter((t) => t.status === s).length]));
  const list = filter === "All" ? all : all.filter((t) => t.status === filter);
  const sel = all.find((t) => t.id === selId);
  const setStatus = (t: Trial, status: Trial["status"]) => {
    if (status === t.status) return;
    update((d, log) => {
      const x = d.trials.find((y) => y.id === t.id);
      if (x) x.status = status;
      log("Trial status changed", t.ref, `${t.status} → ${status}`, club.id);
    });
    toast(`${t.ref} moved to ${status}.`);
  };
  return (
    <div>
      <AdminHead title="Trials" sub="Applications submitted through the public trial form." />
      <Filter options={TRIAL_STATUSES} value={filter} onChange={setFilter} counts={counts} />
      {list.length ? (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className={thead}><tr><th className={th}>Trial ID</th><th className={th}>Applicant</th><th className={th}>Position</th><th className={th}>Received</th><th className={th}>Status</th><th className={th} /></tr></thead>
            <tbody className="divide-y divide-line">
              {list.map((t) => (
                <tr key={t.id} className="hover:bg-white/[0.03]">
                  <td className={cx(td, "whitespace-nowrap font-semibold")}>{t.ref}</td>
                  <td className={td}>{t.realName} <span className="text-white/50">“{t.gamerTag}”</span></td>
                  <td className={td}>{t.primaryPos}{t.secondaryPos ? ` / ${t.secondaryPos}` : ""}</td>
                  <td className={cx(td, "whitespace-nowrap text-white/60")}>{fmtDate(t.createdAt)}</td>
                  <td className={td}>
                    <select aria-label={`Status for ${t.ref}`} className="input !w-auto !py-1.5 text-xs" value={t.status} onChange={(e) => setStatus(t, e.target.value as Trial["status"])}>{TRIAL_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
                  </td>
                  <td className={cx(td, "text-right")}><button className="btn-ghost !px-2.5 !py-1.5 text-[11px]" onClick={() => setSelId(t.id)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty title="No applications here" hint="No trial applications are waiting for review." />}
      <Modal open={!!sel} onClose={() => setSelId(null)} title={sel?.ref ?? ""} wide>
        {sel && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="display text-3xl">{sel.realName} “{sel.gamerTag}”</p><p className="text-sm text-white/55">Age {sel.age} · received {fmtDateTime(sel.createdAt)}</p></div>
              <select aria-label="Status" className="input !w-auto" value={sel.status} onChange={(e) => setStatus(sel, e.target.value as Trial["status"])}>{TRIAL_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
            </div>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
              {[["Email", sel.email], ["Discord", sel.discord], ["PSN / EA ID", sel.psn], ["Primary position", sel.primaryPos], ["Secondary position", sel.secondaryPos], ["Formation", sel.formation], ["Current club", sel.currentClub], ["Competitive experience", sel.compExp], ["League experience", sel.leagueExp], ["Availability", sel.availability], ["Microphone", sel.mic], ["Connection", sel.connection]].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-line p-3"><dt className="label !mb-0.5">{k}</dt><dd className="break-words">{v || "—"}</dd></div>
              ))}
            </dl>
            <div className="mt-4 space-y-3 text-sm">
              {[["Previous clubs", sel.previousClubs], ["Why do you want to join?", sel.why], ["What would you bring to the squad?", sel.bring], ["Strongest qualities", sel.strengths], ["Areas to improve", sel.improve]].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-line p-3"><p className="label !mb-1">{k}</p><p className="whitespace-pre-line text-white/80">{v || "—"}</p></div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export function DonationsAdmin() {
  const club = useAdminClub();
  const { db, now } = useStore();
  const list = db.donations.filter((d) => d.clubId === club.id).sort((a, b) => b.createdAt - a.createdAt);
  const s = donationSummary(db, club, now);
  return (
    <div>
      <AdminHead title="Donations" sub="Successful test-mode donations. The public progress bar is calculated from these records." />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["Raised this month", money(s.raised)], ["Monthly goal", money(s.goal)], ["Progress", `${s.pct}%`], ["Supporters this month", s.supporters]].map(([k, v]) => (
          <div key={k} className="card p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">{k}</p><p className="display mt-1 text-4xl">{v}</p></div>
        ))}
      </div>
      {list.length ? (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[28rem] text-sm">
            <thead className={thead}><tr><th className={th}>Supporter</th><th className={th}>Amount</th><th className={th}>Date</th><th className={th}>Payment</th></tr></thead>
            <tbody className="divide-y divide-line">
              {list.map((d) => <tr key={d.id}><td className={cx(td, "font-semibold")}>{d.name}</td><td className={cx(td, "display text-lg text-accent")}>{money(d.amount)}</td><td className={cx(td, "whitespace-nowrap text-white/60")}>{fmtDateTime(d.createdAt)}</td><td className={td}><Badge tone="green">Succeeded — Test Mode</Badge></td></tr>)}
            </tbody>
          </table>
        </div>
      ) : <Empty title="No donations yet" hint="Donations made on the public Donate page will be listed here." />}
      <p className="mt-3 text-xs text-white/40">The monthly goal can be changed in Settings.</p>
    </div>
  );
}

const ORDER_STATUSES: Order["status"][] = ["New", "Processing", "Shipped", "Completed", "Cancelled", "Refunded"];

export function OrdersAdmin() {
  const club = useAdminClub();
  const { db, update, toast } = useStore();
  const [filter, setFilter] = useState("All");
  const [selId, setSelId] = useState<string | null>(null);
  const all = db.orders.filter((o) => o.clubId === club.id).sort((a, b) => b.createdAt - a.createdAt);
  const counts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, all.filter((o) => o.status === s).length]));
  const list = filter === "All" ? all : all.filter((o) => o.status === filter);
  const sel = all.find((o) => o.id === selId);
  const setStatus = (o: Order, status: Order["status"]) => {
    if (status === o.status) return;
    update((d, log) => {
      const x = d.orders.find((y) => y.id === o.id);
      if (x) {
        x.status = status;
        x.payment = status === "Refunded" ? "Refunded — Test Mode" : "Paid — Test Mode";
      }
      log("Order status changed", o.ref, `${o.status} → ${status}`, club.id);
    });
    toast(`${o.ref} marked as ${status}.`);
  };
  const items = (o: Order) => o.items.map((i) => `${i.name} × ${i.qty}${i.size ? ` (${i.size})` : ""}`).join(", ");
  return (
    <div>
      <AdminHead title="Orders" sub="Orders placed through the store. Update the fulfilment status as you pack and post." />
      <Filter options={ORDER_STATUSES} value={filter} onChange={setFilter} counts={counts} />
      {list.length ? (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className={thead}><tr><th className={th}>Order</th><th className={th}>Customer</th><th className={th}>Items</th><th className={th}>Total</th><th className={th}>Payment</th><th className={th}>Fulfilment</th><th className={th} /></tr></thead>
            <tbody className="divide-y divide-line">
              {list.map((o) => (
                <tr key={o.id} className="hover:bg-white/[0.03]">
                  <td className={cx(td, "whitespace-nowrap")}><span className="font-semibold">{o.ref}</span><span className="block text-xs text-white/45">{fmtDate(o.createdAt)}</span></td>
                  <td className={td}>{o.customer}</td>
                  <td className={cx(td, "max-w-[14rem] truncate text-white/65")}>{items(o)}</td>
                  <td className={cx(td, "whitespace-nowrap font-semibold")}>{money(o.total)}</td>
                  <td className={td}><Badge tone={o.payment.startsWith("Paid") ? "green" : "red"}>{o.payment}</Badge></td>
                  <td className={td}><select aria-label={`Fulfilment for ${o.ref}`} className="input !w-auto !py-1.5 text-xs" value={o.status} onChange={(e) => setStatus(o, e.target.value as Order["status"])}>{ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></td>
                  <td className={cx(td, "text-right")}><button className="btn-ghost !px-2.5 !py-1.5 text-[11px]" onClick={() => setSelId(o.id)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty title="No orders here" hint="No orders match these filters." />}
      <Modal open={!!sel} onClose={() => setSelId(null)} title={sel?.ref ?? ""}>
        {sel && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between"><Badge>{sel.status}</Badge><span className="text-white/50">{fmtDateTime(sel.createdAt)}</span></div>
            <div className="rounded-lg border border-line p-3"><p className="label !mb-1">Customer</p><p className="font-semibold">{sel.customer}</p><p className="text-white/60">{sel.email}</p></div>
            <div className="rounded-lg border border-line p-3"><p className="label !mb-1">Ship to</p><p className="text-white/80">{sel.address}</p></div>
            <div className="rounded-lg border border-line">
              {sel.items.map((i, k) => <div key={k} className="flex items-center justify-between border-b border-line px-3 py-2.5 last:border-0"><span>{i.name} × {i.qty}{i.size && <span className="ml-2 text-white/50">Size {i.size}</span>}</span><span className="font-semibold">{money(i.price * i.qty)}</span></div>)}
              <div className="flex items-center justify-between bg-white/5 px-3 py-2.5"><span className="uppercase tracking-wider text-white/55">Total</span><span className="display text-2xl">{money(sel.total)}</span></div>
            </div>
            <p className="text-white/60">Payment: {sel.payment}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

export function UsersAdmin() {
  const club = useAdminClub();
  const { db, user: me, update, toast } = useStore();
  const [target, setTarget] = useState<User | null>(null);
  const isSuper = me?.role === "superadmin";
  const list = db.users.filter((u) => u.clubId === club.id && (isSuper || u.role !== "superadmin")).sort((a, b) => b.createdAt - a.createdAt);
  const setRole = (u: User, role: User["role"]) => {
    update((d, log) => {
      const x = d.users.find((y) => y.id === u.id);
      if (x) x.role = role;
      log("User role changed", u.username, `${u.role} → ${role}`, club.id);
    });
    toast(`${u.username} is now ${role === "admin" ? "an administrator" : role === "superadmin" ? "a super admin" : "a member"}.`);
  };
  const setStatus = (u: User, status: User["status"]) => {
    update((d, log) => {
      const x = d.users.find((y) => y.id === u.id);
      if (x) x.status = status;
      log(status === "suspended" ? "User suspended" : "User reactivated", u.username, "", club.id);
    });
    toast(status === "suspended" ? `${u.username} has been suspended and can no longer sign in.` : `${u.username} is active.`);
    setTarget(null);
  };
  return (
    <div>
      <AdminHead title="Registered users" sub="Everyone who has signed up to the website. Passwords are never stored in readable form or shown here." />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[46rem] text-sm">
          <thead className={thead}><tr><th className={th}>Username</th><th className={th}>Email</th><th className={th}>Role</th><th className={th}>Registered</th><th className={th}>Last login</th><th className={th}>Status</th><th className={th} /></tr></thead>
          <tbody className="divide-y divide-line">
            {list.map((u) => {
              const self = u.id === me?.id;
              const locked = self || !canManage(me, u.clubId) || (u.role === "superadmin" && !isSuper);
              return (
                <tr key={u.id} className="hover:bg-white/[0.03]">
                  <td className={cx(td, "font-semibold")}>{u.username}{self && <span className="ml-2 text-xs font-normal text-accent">you</span>}</td>
                  <td className={cx(td, "text-white/65")}>{u.email}</td>
                  <td className={td}>
                    {locked ? <span className="capitalize">{u.role === "superadmin" ? "Super admin" : u.role}</span> : (
                      <select aria-label={`Role for ${u.username}`} className="input !w-auto !py-1.5 text-xs" value={u.role} onChange={(e) => setRole(u, e.target.value as User["role"])}>
                        <option value="member">Member</option><option value="admin">Admin</option>{isSuper && <option value="superadmin">Super admin</option>}
                      </select>
                    )}
                  </td>
                  <td className={cx(td, "whitespace-nowrap text-white/60")}>{fmtDate(u.createdAt)}</td>
                  <td className={cx(td, "whitespace-nowrap text-white/60")}>{u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : "Never"}</td>
                  <td className={td}><Badge>{u.status}</Badge></td>
                  <td className={cx(td, "text-right")}>
                    {!locked && (u.status === "suspended" || u.status === "pending"
                      ? <button className="btn-ghost !px-2.5 !py-1.5 text-[11px]" onClick={() => setStatus(u, "active")}>{u.status === "pending" ? "Approve" : "Reactivate"}</button>
                      : <button className="btn-ghost !px-2.5 !py-1.5 text-[11px] hover:!border-red-400/60 hover:!text-red-300" onClick={() => setTarget(u)}>Suspend</button>)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Confirm open={!!target} title="Suspend user?" body={target ? `Suspend ${target.username}? They will be signed out and unable to log in until reactivated.` : ""} action="Suspend user" onCancel={() => setTarget(null)} onConfirm={() => target && setStatus(target, "suspended")} />
    </div>
  );
}

export function LogsAdmin() {
  const club = useAdminClub();
  const { db } = useStore();
  const [tab, setTab] = useState<"audit" | "email">("audit");
  const audit = db.audit.filter((a) => a.clubId === club.id);
  const emails = db.emails.filter((e) => e.clubId === club.id).sort((a, b) => b.createdAt - a.createdAt);
  return (
    <div>
      <AdminHead title="Logs" sub="Audit trail of administrative activity, and the outgoing email log." />
      <div className="mb-4 flex rounded-md border border-line p-1 sm:w-fit">
        {([["audit", `Activity (${audit.length})`], ["email", `Email deliveries (${emails.length})`]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={cx("flex-1 rounded px-4 py-1.5 font-display text-sm font-semibold uppercase tracking-wider", tab === k ? "bg-accent text-black" : "text-white/60 hover:text-white")}>{l}</button>
        ))}
      </div>
      {tab === "audit" ? (
        audit.length ? (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead className={thead}><tr><th className={th}>When</th><th className={th}>User</th><th className={th}>Action</th><th className={th}>Entity</th><th className={th}>Details</th></tr></thead>
              <tbody className="divide-y divide-line">
                {audit.map((a) => <tr key={a.id}><td className={cx(td, "whitespace-nowrap text-white/60")}>{fmtDateTime(a.at)}</td><td className={td}>{a.user}</td><td className={cx(td, "font-semibold")}>{a.action}</td><td className={td}>{a.entity}</td><td className={cx(td, "text-white/60")}>{a.meta || "—"}</td></tr>)}
              </tbody>
            </table>
          </div>
        ) : <Empty title="No activity yet" hint="Administrative actions will be recorded here." />
      ) : (
        <>
          <div className="mb-4 rounded-md border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">No email provider is connected in this demo. Each notification below was generated and stored, but <strong>not sent</strong>. With a provider configured these are delivered to the addresses shown.</div>
          {emails.length ? (
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[36rem] text-sm">
                <thead className={thead}><tr><th className={th}>When</th><th className={th}>To</th><th className={th}>Subject</th><th className={th}>Status</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {emails.map((e) => <tr key={e.id}><td className={cx(td, "whitespace-nowrap text-white/60")}>{fmtDateTime(e.createdAt)}</td><td className={td}>{e.to}</td><td className={cx(td, "font-semibold")}>{e.subject}</td><td className={td}><Badge tone="amber">{e.status}</Badge></td></tr>)}
                </tbody>
              </table>
            </div>
          ) : <Empty title="No emails logged" hint="Trial and order notifications will be listed here." />}
        </>
      )}
    </div>
  );
}
