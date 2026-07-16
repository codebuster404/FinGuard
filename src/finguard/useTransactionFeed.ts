// Simulates a live stream of transactions between the demo accounts: every
// tick we make a small batch, score it with the risk engine, and check
// whether any transaction completes a fraud loop.

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { createDemoAccounts, findLoop, scoreTransaction } from "./riskEngine";
import type { Account, FraudAlert, Transaction } from "./types";

const TICK_MS = 900;
const MAX_TRANSACTIONS_KEPT = 80;
const MAX_ALERTS_KEPT = 20;
const MAX_EDGES_REMEMBERED = 60;
const MAX_EDGES_FOR_LOOP_SEARCH = 40;
const MIN_RISK_TO_CHECK_FOR_LOOP = 0.35;
const BLOCK_THRESHOLD = 0.8;

interface RunningTotals {
  processed: number;
  flagged: number;
  blocked: number;
  volume: number;
}

interface TransferEdge {
  fromAccountId: string;
  toAccountId: string;
  transactionId: string;
}

/** Random amount, occasionally nudged into a "structuring" or "large transfer" range. */
function randomAmount(): number {
  const roll = Math.random();
  if (roll < 0.14) return 740_000 + Math.random() * 80_000;
  if (roll < 0.19) return 3_000_000 + Math.random() * 15_000_000;
  return 15_000 + Math.random() * 650_000;
}

function pickTwoDistinctAccounts(accounts: Account[]): [Account, Account] {
  const from = accounts[Math.floor(Math.random() * accounts.length)];
  let to = accounts[Math.floor(Math.random() * accounts.length)];
  if (to.id === from.id) to = accounts[(accounts.indexOf(to) + 1) % accounts.length];
  return [from, to];
}

export function useTransactionFeed(threshold: number) {
  const [accounts] = useState<Account[]>(() => createDemoAccounts());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [totals, setTotals] = useState<RunningTotals>({ processed: 0, flagged: 0, blocked: 0, volume: 0 });

  // Refs, not state: read/written every tick, don't need their own re-render.
  const recentAmountsByAccount = useRef(new Map<string, number[]>());
  const recentEdges = useRef<TransferEdge[]>([]);

  const accountsById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  useEffect(() => {
    if (isPaused) return;

    const intervalId = window.setInterval(() => {
      const batchSize = 1 + Math.floor(Math.random() * 3);
      const newTransactions: Transaction[] = [];

      for (let i = 0; i < batchSize; i++) {
        const [from, to] = pickTwoDistinctAccounts(accounts);
        const amount = randomAmount();
        const { risk, flags } = scoreTransaction(amount, from, to, recentAmountsByAccount.current);

        const transaction: Transaction = {
          id: `TX-${Date.now().toString(36)}-${Math.floor(Math.random() * 999)}`,
          fromAccountId: from.id,
          toAccountId: to.id,
          amount,
          timestamp: Date.now(),
          risk,
          flags,
        };

        rememberAmount(recentAmountsByAccount.current, from.id, amount);
        rememberEdge(recentEdges.current, { fromAccountId: from.id, toAccountId: to.id, transactionId: transaction.id });
        newTransactions.push(transaction);
      }

      checkForFraudLoops(newTransactions, recentEdges.current, setAlerts);

      setTransactions((prev) => [...newTransactions.reverse(), ...prev].slice(0, MAX_TRANSACTIONS_KEPT));
      setTotals((prev) => ({
        processed: prev.processed + newTransactions.length,
        flagged: prev.flagged + newTransactions.filter((t) => t.risk >= threshold).length,
        blocked: prev.blocked + newTransactions.filter((t) => t.risk >= BLOCK_THRESHOLD).length,
        volume: prev.volume + newTransactions.reduce((sum, t) => sum + t.amount, 0),
      }));
    }, TICK_MS);

    return () => window.clearInterval(intervalId);
  }, [isPaused, accounts, threshold]);

  const visibleEdges = useMemo(() => recentEdges.current.slice(-24), [transactions]);

  return { accounts, accountsById, transactions, alerts, totals, visibleEdges, isPaused, setIsPaused };
}

function rememberAmount(store: Map<string, number[]>, accountId: string, amount: number) {
  const history = store.get(accountId) ?? [];
  history.push(amount);
  if (history.length > 12) history.shift();
  store.set(accountId, history);
}

function rememberEdge(store: TransferEdge[], edge: TransferEdge) {
  store.push(edge);
  if (store.length > MAX_EDGES_REMEMBERED) store.shift();
}

/** Checks new, risky transactions for a loop back to their own sender and raises an alert if one is found. */
function checkForFraudLoops(
  newTransactions: Transaction[],
  edges: TransferEdge[],
  setAlerts: Dispatch<SetStateAction<FraudAlert[]>>,
) {
  const searchableEdges = edges.slice(-MAX_EDGES_FOR_LOOP_SEARCH);

  for (const transaction of newTransactions) {
    if (transaction.risk < MIN_RISK_TO_CHECK_FOR_LOOP) continue;

    const loop = findLoop(searchableEdges, transaction.fromAccountId, 5);
    if (!loop || loop.length < 3) continue;

    const chainId = `CH-${transaction.id.slice(-5)}`;
    transaction.chainId = chainId;
    transaction.risk = Math.min(1, transaction.risk + 0.2);
    if (!transaction.flags.includes("loop")) transaction.flags.unshift("loop");

    const severity: FraudAlert["severity"] =
      transaction.risk > 0.85 ? "critical" : transaction.risk > 0.65 ? "high" : "medium";

    setAlerts((prev) =>
      [
        {
          id: `AL-${chainId}`,
          chainId,
          severity,
          pattern: `Structural loop · ${loop.length} hops`,
          nodes: [transaction.fromAccountId, ...loop],
          totalAmount: transaction.amount,
          timestamp: Date.now(),
        },
        ...prev,
      ].slice(0, MAX_ALERTS_KEPT),
    );
  }
}
