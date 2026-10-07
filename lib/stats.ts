"use client";

/**
 * Statistics provider architecture.
 *
 * Every public page reads club statistics through the `StatsProvider` interface.
 * - `DemoStatsProvider` serves deterministic seeded data and is used whenever no live endpoint is configured.
 * - `LiveStatsProvider` calls a REST endpoint (NEXT_PUBLIC_STATS_API_URL). If a call fails it falls back to the
 *   last cached response, then to the demo provider, so the site never breaks because a stats API is down.
 *
 * To connect the real EA FC source, implement the eight methods of `LiveStatsProvider` against it — no page changes.
 */
import { useEffect, useState } from "react";
import type { DB, LeagueRow, Match, Player, PlayerStats } from "./types";
import { rng } from "./utils";

export interface ExternalPlayer {
  eaId: string;
  gamerTag: string;
  firstName: string;
  lastName: string;
  position: string;
  nationality: string;
  stats: PlayerStats;
}
export interface Leader {
  label: string;
  unit: string;
  value: number;
  player: Player | null;
}
export interface ClubStats {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface StatsProvider {
  readonly name: string;
  getClub(): Promise<{ name: string; league: string }>;
  getClubStatus(): Promise<{ lastActivityAt: number }>;
  getLeaderboard(): Promise<LeagueRow[]>;
  getRecentMatches(limit: number): Promise<Match[]>;
  getPlayers(): Promise<ExternalPlayer[]>;
  getPlayerStats(eaId: string): Promise<PlayerStats | null>;
  getSeasonLeaders(): Promise<Leader[]>;
  getClubStats(): Promise<ClubStats>;
}

const EXTRA_ROSTER: [string, string, string, string, string, number, number, number, number][] = [
  ["GHOST", "Kyle", "Turner", "CM", "England", 9, 2, 4, 7.4],
  ["BOLT", "Nathan", "Shaw", "RW", "Wales", 7, 4, 2, 7.6],
  ["TALON", "Ieuan", "Rhys", "CB", "Wales", 11, 1, 0, 7.2],
  ["RELIC", "Max", "Stone", "GK", "Scotland", 5, 0, 0, 7.1],
];

export function seasonLeaders(players: Player[]): Leader[] {
  const active = players.filter((p) => p.status === "active");
  const top = (key: keyof PlayerStats, label: string, unit: string): Leader => {
    const player = [...active].sort((a, b) => b.stats[key] - a.stats[key])[0] ?? null;
    return { label, unit, value: player?.stats[key] ?? 0, player };
  };
  return [top("goals", "Top Scorer", "Goals"), top("assists", "Most Assists", "Assists"), top("apps", "Most Appearances", "Appearances"), top("rating", "Best Rating", "Avg Rating")];
}

export class DemoStatsProvider implements StatsProvider {
  readonly name = "DemoStatsProvider";
  constructor(private db: DB, private clubId: string) {}
  private get club() {
    return this.db.clubs.find((c) => c.id === this.clubId)!;
  }
  private get matches() {
    return this.db.matches.filter((m) => m.clubId === this.clubId).sort((a, b) => b.playedAt - a.playedAt);
  }
  private get players() {
    return this.db.players.filter((p) => p.clubId === this.clubId);
  }
  async getClub() {
    return { name: this.club.name, league: this.club.league };
  }
  async getClubStatus() {
    return { lastActivityAt: this.club.lastActivityAt };
  }
  async getLeaderboard() {
    return [...(this.db.leagues[this.clubId] ?? [])].sort((a, b) => b.pts - a.pts);
  }
  async getRecentMatches(limit: number) {
    return this.matches.slice(0, limit);
  }
  async getPlayers() {
    const taken = new Set(this.players.map((p) => p.eaId.toLowerCase()));
    return EXTRA_ROSTER.map(([gamerTag, firstName, lastName, position, nationality, apps, goals, assists, rating]) => ({
      eaId: `${gamerTag.toLowerCase()}_${this.clubId.slice(0, 3)}`, gamerTag, firstName, lastName, position, nationality,
      stats: { apps, goals, assists, cleanSheets: position === "GK" ? 2 : 0, rating, motm: 1, yellow: 1, red: 0 },
    })).filter((p) => !taken.has(p.eaId));
  }
  async getPlayerStats(eaId: string) {
    return this.players.find((p) => p.eaId === eaId)?.stats ?? null;
  }
  async getSeasonLeaders() {
    return seasonLeaders(this.players);
  }
  async getClubStats() {
    const m = this.matches;
    return {
      played: m.length, wins: m.filter((x) => x.gf > x.ga).length, draws: m.filter((x) => x.gf === x.ga).length, losses: m.filter((x) => x.gf < x.ga).length,
      goalsFor: m.reduce((s, x) => s + x.gf, 0), goalsAgainst: m.reduce((s, x) => s + x.ga, 0),
    };
  }
}

export type StatsSource = "demo" | "live" | "cache";
export const LIVE_STATS_URL = process.env.NEXT_PUBLIC_STATS_API_URL || "";

/** Calls `${NEXT_PUBLIC_STATS_API_URL}/clubs/{slug}/{resource}`; falls back to cache, then demo data. */
export class LiveStatsProvider implements StatsProvider {
  readonly name = "LiveStatsProvider";
  source: StatsSource = "live";
  updatedAt = Date.now();
  constructor(private base: string, private slug: string, private fallback: StatsProvider) {}

  private async resolve<T>(resource: string, demo: () => Promise<T>): Promise<T> {
    const cacheKey = `venari-stats-cache:${this.slug}:${resource}`;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(`${this.base.replace(/\/$/, "")}/clubs/${this.slug}/${resource}`, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error("bad status");
      const data = (await res.json()) as T;
      localStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), data }));
      return data;
    } catch {
      try {
        const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
        if (cached?.data) {
          this.source = "cache";
          this.updatedAt = Math.min(this.updatedAt, cached.at);
          return cached.data as T;
        }
      } catch {
        /* no usable cache */
      }
      this.source = "demo";
      return demo();
    }
  }
  getClub() { return this.resolve("club", () => this.fallback.getClub()); }
  getClubStatus() { return this.resolve("status", () => this.fallback.getClubStatus()); }
  getLeaderboard() { return this.resolve("leaderboard", () => this.fallback.getLeaderboard()); }
  getRecentMatches(limit: number) { return this.resolve(`matches?limit=${limit}`, () => this.fallback.getRecentMatches(limit)); }
  getPlayers() { return this.resolve("players", () => this.fallback.getPlayers()); }
  getPlayerStats(eaId: string) { return this.resolve(`players/${encodeURIComponent(eaId)}`, () => this.fallback.getPlayerStats(eaId)); }
  getSeasonLeaders() { return this.resolve("leaders", () => this.fallback.getSeasonLeaders()); }
  getClubStats() { return this.resolve("stats", () => this.fallback.getClubStats()); }
}

export function getStatsProvider(db: DB, clubId: string): StatsProvider {
  const demo = new DemoStatsProvider(db, clubId);
  const slug = db.clubs.find((c) => c.id === clubId)?.slug ?? clubId;
  return LIVE_STATS_URL ? new LiveStatsProvider(LIVE_STATS_URL, slug, demo) : demo;
}

export interface StatsSnapshot {
  loading: boolean;
  source: StatsSource;
  updatedAt: number;
  lastActivityAt: number;
  leaderboard: LeagueRow[];
  recent: Match[];
  leaders: Leader[];
  clubStats: ClubStats | null;
}

export function useStats(db: DB, clubId: string | undefined): StatsSnapshot {
  const [snap, setSnap] = useState<StatsSnapshot>({ loading: true, source: "demo", updatedAt: Date.now(), lastActivityAt: 0, leaderboard: [], recent: [], leaders: [], clubStats: null });
  useEffect(() => {
    if (!clubId) return;
    let alive = true;
    const provider = getStatsProvider(db, clubId);
    Promise.all([provider.getClubStatus(), provider.getLeaderboard(), provider.getRecentMatches(50), provider.getSeasonLeaders(), provider.getClubStats()])
      .then(([status, leaderboard, recent, leaders, clubStats]) => {
        if (!alive) return;
        const live = provider instanceof LiveStatsProvider ? provider : null;
        setSnap({ loading: false, source: live ? live.source : "demo", updatedAt: live ? live.updatedAt : Date.now(), lastActivityAt: status.lastActivityAt, leaderboard, recent, leaders, clubStats });
      })
      .catch(() => alive && setSnap((s) => ({ ...s, loading: false })));
    return () => {
      alive = false;
    };
  }, [db, clubId]);
  return snap;
}

export const ONLINE_WINDOW_MS = 20 * 60000;
export const isOnline = (lastActivityAt: number, now: number) => now - lastActivityAt <= ONLINE_WINDOW_MS;

/** Per-player match log and career history, derived deterministically from match data. */
export function playerDetail(player: Player, matches: Match[]) {
  const r = rng(player.id);
  const log = [...matches].sort((a, b) => b.playedAt - a.playedAt).slice(0, 8).map((m) => {
    const goals = m.scorers.filter((s) => s.startsWith(player.gamerTag + " ")).length;
    const base = player.stats.rating + (r() - 0.5) * 1.2 + goals * 0.5 + (m.motm === player.gamerTag ? 0.6 : 0);
    return { match: m, goals, rating: Math.min(10, Math.max(5.5, Math.round(base * 10) / 10)) };
  });
  const joined = new Date(player.joinedAt).getFullYear();
  const career = [2026, 2025, 2024, 2023].filter((y) => y >= joined).map((year, i) => {
    if (i === 0) return { season: `EA SPORTS FC ${year - 2000}`, apps: player.stats.apps, goals: player.stats.goals, assists: player.stats.assists, rating: player.stats.rating };
    const k = 1.6 + r() * 1.2;
    return { season: `EA SPORTS FC ${year - 2000}`, apps: Math.round(player.stats.apps * k), goals: Math.round(player.stats.goals * k), assists: Math.round(player.stats.assists * k), rating: Math.round((player.stats.rating - 0.3 + r() * 0.4) * 10) / 10 };
  });
  const achievements = [
    player.stats.motm >= 5 && `${player.stats.motm}× Player of the Match this season`,
    player.stats.goals >= 10 && "Double-figure goals this season",
    player.stats.assists >= 10 && "Double-figure assists this season",
    player.stats.cleanSheets >= 10 && `${player.stats.cleanSheets} clean sheets this season`,
    player.stats.apps >= 30 && "30+ appearances this season",
    career.length >= 3 && `${career.length} seasons with the club`,
  ].filter(Boolean) as string[];
  return { log, career, achievements };
}
