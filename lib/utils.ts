export const HOUR = 3600e3;
export const DAY = 24 * HOUR;

export function cx(...parts: (string | false | null | undefined | 0)[]) {
  return parts.filter(Boolean).join(" ");
}

export function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Deterministic pseudo-random generator seeded by a string. */
export function rng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function money(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
}

export function fmtDate(ts: number, opts?: Intl.DateTimeFormatOptions) {
  if (!Number.isFinite(ts)) return "—";
  return new Date(ts).toLocaleDateString("en-GB", opts ?? { day: "numeric", month: "short", year: "numeric" });
}

export function fmtTime(ts: number) {
  if (!Number.isFinite(ts)) return "—";
  return new Date(ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function fmtDateTime(ts: number) {
  return `${fmtDate(ts)} · ${fmtTime(ts)}`;
}

export function timeAgo(ts: number, now = Date.now()) {
  const m = Math.max(0, Math.round((now - ts) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

export function getPath(obj: any, path: string) {
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}

export function setPath(obj: any, path: string, value: any) {
  const keys = path.split(".");
  const out = structuredClone(obj);
  let o = out;
  keys.slice(0, -1).forEach((k) => {
    o[k] = o[k] ?? {};
    o = o[k];
  });
  o[keys[keys.length - 1]] = value;
  return out;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function playerName(p: { firstName: string; lastName: string; gamerTag: string }) {
  return `${p.firstName} “${p.gamerTag}” ${p.lastName}`;
}

export function resultOf(m: { gf: number; ga: number }) {
  return m.gf > m.ga ? "Win" : m.gf < m.ga ? "Loss" : "Draw";
}
