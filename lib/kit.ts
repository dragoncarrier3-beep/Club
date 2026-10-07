import type { Player } from "./types";
import { playerName } from "./utils";

export const MAX_KIT = 30;

/** One row per shirt number with the active player who holds it, if any. */
export function kitTable(players: Player[], clubId: string) {
  const active = players.filter((p) => p.clubId === clubId && p.status === "active");
  return Array.from({ length: MAX_KIT }, (_, i) => ({ number: i + 1, player: active.find((p) => p.kitNumber === i + 1) ?? null }));
}

/** Returns a friendly error if the number is invalid or already held by another active player. */
export function kitConflict(players: Player[], candidate: Pick<Player, "id" | "clubId" | "kitNumber" | "status">) {
  const n = Number(candidate.kitNumber);
  if (!Number.isInteger(n) || n < 1 || n > 99) return "Kit number must be a whole number between 1 and 99.";
  if (candidate.status !== "active") return null;
  const holder = players.find((p) => p.clubId === candidate.clubId && p.status === "active" && p.kitNumber === n && p.id !== candidate.id);
  return holder ? `Kit number ${n} is already assigned to ${playerName(holder).replace(/[“”]/g, (q) => (q === "“" ? "‘" : "’"))}.` : null;
}
