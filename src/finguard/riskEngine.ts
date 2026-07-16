// Simplified "fraud detection" rules for the demo - not a real AML model.
// scoreTransaction() gives every transfer a 0-1 risk score, and findLoop()
// looks for A -> B -> C -> A chains, the classic way of disguising where
// money came from (a.k.a. layering).

import { ACCOUNT_KINDS, COUNTRIES, HIGH_RISK_COUNTRIES, type Account } from "./types";

const CENTER_X = 480;
const CENTER_Y = 300;
const ACCOUNT_COUNT = 22;

/** A fixed ring of demo accounts spread over a couple of radii. */
export function createDemoAccounts(): Account[] {
  return Array.from({ length: ACCOUNT_COUNT }, (_, i) => {
    const angle = (i / ACCOUNT_COUNT) * Math.PI * 2;
    const radius = 180 + (i % 3) * 60;
    return {
      id: `AC-${1000 + i}`,
      label: `AC-${1000 + i}`,
      kind: ACCOUNT_KINDS[i % ACCOUNT_KINDS.length],
      country: COUNTRIES[i % COUNTRIES.length],
      x: CENTER_X + Math.cos(angle) * radius,
      y: CENTER_Y + Math.sin(angle) * radius,
      risk: Math.random() * 0.3,
    };
  });
}

/** Scores one transaction 0 (fine) to 1 (looks like fraud), with a flag for each rule that fired. */
export function scoreTransaction(
  amount: number,
  from: Account,
  to: Account,
  recentAmountsByAccount: Map<string, number[]>,
): { risk: number; flags: string[] } {
  const flags: string[] = [];
  let risk = 0;

  // Sudden jump compared to the sender's recent history?
  const history = recentAmountsByAccount.get(from.id) ?? [];
  const mean = history.length ? history.reduce((a, b) => a + b, 0) / history.length : amount;
  const spread = history.length > 2 ? stdDev(history, mean) : mean * 0.4 + 1;
  if (Math.abs((amount - mean) / (spread || 1)) > 2.2) {
    risk += 0.28;
    flags.push("unusual-amount");
  }

  // "Structuring": staying just under a reporting threshold (~₹8L here).
  if (amount > 740_000 && amount < 820_000) {
    risk += 0.32;
    flags.push("structuring");
  }

  if (to.kind === "offshore" || to.kind === "shell") {
    risk += 0.22;
    flags.push("shell-corridor");
  }

  if (from.kind === "mule" || to.kind === "mule") {
    risk += 0.3;
    flags.push("mule-linked");
  }

  if (HIGH_RISK_COUNTRIES.includes(to.country) && !HIGH_RISK_COUNTRIES.includes(from.country)) {
    risk += 0.18;
    flags.push(`routed-to-${to.country}`);
  }

  risk += (0.35 * (from.risk + to.risk)) / 2; // both accounts' own baseline risk

  return { risk: Math.min(1, risk), flags };
}

function stdDev(values: number[], mean: number): number {
  return Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length);
}

/**
 * Depth-first search for a loop back to `startAccountId` in the recent
 * transfer graph, e.g. A -> B -> C -> A. Returns the loop's account ids
 * (excluding the repeated start) or null if none is found within `maxHops`.
 */
export function findLoop(
  edges: Array<{ fromAccountId: string; toAccountId: string }>,
  startAccountId: string,
  maxHops = 5,
): string[] | null {
  const outgoing = new Map<string, string[]>();
  for (const { fromAccountId, toAccountId } of edges) {
    outgoing.set(fromAccountId, [...(outgoing.get(fromAccountId) ?? []), toAccountId]);
  }

  const path: string[] = [];
  const visited = new Set<string>();

  function search(current: string, hops: number): string[] | null {
    if (hops > maxHops) return null;
    for (const next of outgoing.get(current) ?? []) {
      if (next === startAccountId && path.length >= 2) return [...path, next];
      if (visited.has(next)) continue;
      visited.add(next);
      path.push(next);
      const found = search(next, hops + 1);
      if (found) return found;
      path.pop();
    }
    return null;
  }

  return search(startAccountId, 0);
}

/** Formats an amount as Indian Rupees, switching units for readability. */
export function formatInr(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)} Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(2)} L`;
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`;
  return `₹${amount.toFixed(0)}`;
}
