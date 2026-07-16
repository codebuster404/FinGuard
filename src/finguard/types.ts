// Shared types for the FinGuard demo. There's no real bank data here -
// everything is generated client-side in useTransactionFeed.ts.

export type AccountKind = "personal" | "shell" | "merchant" | "offshore" | "mule";

export interface Account {
  id: string;
  label: string;
  kind: AccountKind;
  country: string;
  x: number; // position on the graph canvas, not real geography
  y: number;
  risk: number; // baseline risk 0-1, set when the account is created
}

export interface Transaction {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  timestamp: number;
  risk: number; // 0 (safe) to 1 (certain fraud)
  flags: string[]; // e.g. "structuring", "loop"
  chainId?: string; // set once this transaction is confirmed part of a loop
}

export interface FraudAlert {
  id: string;
  chainId: string;
  severity: "critical" | "high" | "medium";
  pattern: string;
  nodes: string[]; // account ids in the suspicious loop, in order
  totalAmount: number;
  timestamp: number;
}

export type DashboardTab = "dashboard" | "ledger" | "graph" | "alerts";

export const ACCOUNT_KINDS: AccountKind[] = ["personal", "shell", "merchant", "offshore", "mule"];
export const COUNTRIES = ["IN", "SG", "AE", "KY", "CH", "CY", "PA", "HK", "MT", "GB"];
export const HIGH_RISK_COUNTRIES = ["KY", "PA", "CY"]; // just for this demo, not a real list
