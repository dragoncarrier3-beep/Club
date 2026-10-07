"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { BasketItem, Club, DB, User } from "./types";
import { buildSeed, DB_VERSION, DEMO_PASSWORD } from "./seed";
import { uid } from "./utils";

const DB_KEY = "venari-demo-db";
const SESSION_KEY = "venari-demo-session";
const BASKET_KEY = "venari-demo-basket";

export type LogFn = (action: string, entity: string, meta?: string, clubId?: string, as?: string) => void;
type Toast = { id: string; msg: string; kind: "ok" | "error" };

interface Ctx {
  ready: boolean;
  db: DB;
  user: User | null;
  now: number;
  update: (fn: (d: DB, log: LogFn) => void) => boolean;
  login: (email: string, password: string) => Promise<string | null>;
  quickLogin: (userId: string) => void;
  logout: () => void;
  register: (f: { username: string; email: string; password: string; psn?: string; discord?: string; clubId: string }) => Promise<string | null>;
  basket: BasketItem[];
  setBasket: (b: BasketItem[]) => void;
  toast: (msg: string, kind?: "ok" | "error") => void;
  resetDemo: () => void;
}

const StoreCtx = createContext<Ctx | null>(null);

async function sha(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function load(): DB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed?.version === DB_VERSION && Array.isArray(parsed.clubs)) return parsed;
    }
  } catch {
    /* fall through to a fresh seed */
  }
  return buildSeed();
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [db, setDb] = useState<DB | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [basket, setBasketState] = useState<BasketItem[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const dbRef = useRef<DB | null>(null);
  const userRef = useRef<User | null>(null);

  const toast = useCallback((msg: string, kind: "ok" | "error" = "ok") => {
    const id = uid();
    setToasts((t) => [...t.slice(-2), { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const persist = useCallback(
    (next: DB) => {
      try {
        localStorage.setItem(DB_KEY, JSON.stringify(next));
        return true;
      } catch {
        toast("Demo storage is full. Try a smaller image or reset the demo data in Admin → Settings.", "error");
        return false;
      }
    },
    [toast]
  );

  useEffect(() => {
    const initial = load();
    dbRef.current = initial;
    setDb(initial);
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(initial));
      setUserId(localStorage.getItem(SESSION_KEY));
      setBasketState(JSON.parse(localStorage.getItem(BASKET_KEY) || "[]"));
    } catch {
      /* storage unavailable: the demo still runs in memory */
    }
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === DB_KEY && e.newValue) {
        try {
          const next = JSON.parse(e.newValue) as DB;
          dbRef.current = next;
          setDb(next);
        } catch {
          /* ignore malformed cross-tab payloads */
        }
      }
      if (e.key === SESSION_KEY) setUserId(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    const tick = setInterval(() => setNow(Date.now()), 20000);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(tick);
    };
  }, []);

  const user = useMemo(() => {
    const u = db?.users.find((x) => x.id === userId) ?? null;
    return u && u.status !== "suspended" ? u : null;
  }, [db, userId]);
  userRef.current = user;

  const update = useCallback<Ctx["update"]>(
    (fn) => {
      const cur = dbRef.current;
      if (!cur) return false;
      const draft = structuredClone(cur);
      const log: LogFn = (action, entity, meta = "", clubId, as) => {
        draft.audit.unshift({ id: uid(), clubId: clubId ?? userRef.current?.clubId ?? "venari", user: as ?? userRef.current?.username ?? "Visitor", action, entity, meta, at: Date.now() });
        draft.audit = draft.audit.slice(0, 300);
      };
      fn(draft, log);
      if (!persist(draft)) return false;
      dbRef.current = draft;
      setDb(draft);
      setNow(Date.now());
      return true;
    },
    [persist]
  );

  const setSession = (id: string | null) => {
    setUserId(id);
    try {
      if (id) localStorage.setItem(SESSION_KEY, id);
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      /* in-memory session only */
    }
  };

  const quickLogin = (id: string) => {
    update((d, log) => {
      const u = d.users.find((x) => x.id === id);
      if (u) {
        u.lastLoginAt = Date.now();
        log("User logged in", u.username, "Demo quick login", u.clubId, u.username);
      }
    });
    setSession(id);
  };

  const login: Ctx["login"] = async (email, password) => {
    const u = dbRef.current?.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    const ok = u && (u.passHash === "demo" ? password === DEMO_PASSWORD : (await sha(password)) === u.passHash);
    if (!u || !ok) return "That email and password combination was not recognised.";
    if (u.status === "suspended") return "This account has been suspended. Please contact the club.";
    quickLogin(u.id);
    return null;
  };

  const register: Ctx["register"] = async (f) => {
    const cur = dbRef.current;
    if (!cur) return "Please try again in a moment.";
    if (cur.users.some((u) => u.email.toLowerCase() === f.email.trim().toLowerCase())) return "An account with this email already exists.";
    if (cur.users.some((u) => u.username.toLowerCase() === f.username.trim().toLowerCase())) return "That username is already taken.";
    const passHash = await sha(f.password);
    const id = uid();
    const ok = update((d, log) => {
      d.users.unshift({ id, username: f.username.trim(), email: f.email.trim(), passHash, role: "member", clubId: f.clubId, status: "active", createdAt: Date.now(), lastLoginAt: Date.now(), psn: f.psn, discord: f.discord });
      d.emails.unshift({ id: uid(), clubId: f.clubId, to: f.email.trim(), subject: "Verify your email address", status: "Demo delivery — not sent", createdAt: Date.now() });
      log("User registered", f.username.trim(), f.email.trim(), f.clubId, f.username.trim());
    });
    if (!ok) return "We couldn't create your account right now.";
    setSession(id);
    return null;
  };

  const setBasket = (b: BasketItem[]) => {
    setBasketState(b);
    try {
      localStorage.setItem(BASKET_KEY, JSON.stringify(b));
    } catch {
      /* basket stays in memory */
    }
  };

  const resetDemo = () => {
    const fresh = buildSeed();
    dbRef.current = fresh;
    setDb(fresh);
    persist(fresh);
    setBasket([]);
    setNow(Date.now());
    toast("Demo data has been reset.");
  };

  if (!db) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink text-sm text-white/50">
        <span className="mr-3 h-2 w-2 animate-pulseDot rounded-full bg-accent" /> Loading club…
      </div>
    );
  }

  return (
    <StoreCtx.Provider value={{ ready, db, user, now, update, login, quickLogin, logout: () => setSession(null), register, basket, setBasket, toast, resetDemo }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex w-[min(92vw,26rem)] -translate-x-1/2 flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} role="status" className={`pointer-events-auto animate-rise rounded-lg border px-4 py-3 text-sm shadow-xl ${t.kind === "ok" ? "border-accent/40 bg-panel2 text-white" : "border-red-500/50 bg-[#2a1215] text-red-100"}`}>
            {t.msg}
          </div>
        ))}
      </div>
    </StoreCtx.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export function useClub(slug: string | undefined): Club | undefined {
  const { db } = useStore();
  return db.clubs.find((c) => c.slug === slug);
}

export const isAdmin = (u: User | null) => !!u && (u.role === "admin" || u.role === "superadmin");
export const canManage = (u: User | null, clubId: string) => !!u && (u.role === "superadmin" || (u.role === "admin" && u.clubId === clubId));
export const canViewTactics = (u: User | null, clubId: string) => !!u && (u.role === "superadmin" || u.clubId === clubId);
