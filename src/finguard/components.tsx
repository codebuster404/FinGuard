import { useMemo } from "react";
import { formatInr } from "./riskEngine";
import type { Account, AccountKind, Transaction } from "./types";

// Plain hex colors, one per account type - easier to read than the neon
// oklch() values the graph used to use.
const KIND_COLOR: Record<AccountKind, string> = {
  personal: "#38bdf8",
  merchant: "#facc15",
  shell: "#a78bfa",
  mule: "#f87171",
  offshore: "#fb923c",
};

const RISK_DANGER = "#f87171";
const RISK_WARN = "#facc15";
const RISK_SAFE = "#4ade80";

function riskColor(risk: number): string {
  if (risk >= 0.8) return RISK_DANGER;
  if (risk >= 0.55) return RISK_WARN;
  return RISK_SAFE;
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 rounded-md bg-gradient-to-br from-primary to-[oklch(0.55_0.2_270)]" />
        <div className="absolute inset-[3px] rounded-[4px] bg-background flex items-center justify-center">
          <svg viewBox="0 0 20 20" className="w-4 h-4 text-primary">
            <path fill="currentColor" d="M10 1 3 4v5c0 4.4 3 8.4 7 10 4-1.6 7-5.6 7-10V4l-7-3Zm0 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
          </svg>
        </div>
      </div>
      <div className="text-base font-bold tracking-wide">FinGuard</div>
    </div>
  );
}

interface KpiProps {
  label: string;
  value: string;
  hint: string;
  accent: "primary" | "warn" | "danger" | "safe";
}

const KPI_ACCENT_CLASS: Record<KpiProps["accent"], string> = {
  primary: "text-primary text-glow-neon",
  warn: "text-warn",
  danger: "text-destructive text-glow-danger",
  safe: "text-safe",
};

export function Kpi({ label, value, hint, accent }: KpiProps) {
  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">{label}</div>
      <div className={`mt-1 text-3xl font-bold tabular-nums ${KPI_ACCENT_CLASS[accent]}`}>{value}</div>
      <div className="text-[10px] font-mono text-muted-foreground/70 mt-1">{hint}</div>
    </div>
  );
}

export function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-muted-foreground">
      {(Object.entries(KIND_COLOR) as [AccountKind, string][]).map(([kind, color]) => (
        <span key={kind} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
          {kind}
        </span>
      ))}
    </div>
  );
}

export function RiskBar({ value }: { value: number }) {
  const color = riskColor(value);
  return (
    <div className="inline-flex items-center gap-2 w-full max-w-[130px] ml-auto">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.round(value * 100)}%`, background: color }} />
      </div>
      <span className="tabular-nums text-[10px]" style={{ color }}>
        {value.toFixed(2)}
      </span>
    </div>
  );
}

function statusFor(risk: number, threshold: number): "BLOCK" | "REVIEW" | "PASS" {
  if (risk >= 0.8) return "BLOCK";
  if (risk >= threshold) return "REVIEW";
  return "PASS";
}

const STATUS_CLASS = {
  BLOCK: "bg-destructive text-destructive-foreground",
  REVIEW: "bg-warn/80 text-background",
  PASS: "bg-safe/20 text-safe",
};

const FLAG_CLASS: Record<string, string> = {
  loop: "bg-destructive/25 text-destructive",
  structuring: "bg-warn/20 text-warn",
};

interface LedgerTableProps {
  transactions: Transaction[];
  accountsById: Map<string, Account>;
  threshold: number;
}

export function LedgerTable({ transactions, accountsById, threshold }: LedgerTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead className="text-[10px] uppercase text-muted-foreground">
          <tr className="border-b border-border">
            <th className="text-left py-2 pr-3">Txn ID</th>
            <th className="text-left py-2 pr-3">From</th>
            <th className="text-left py-2 pr-3">To</th>
            <th className="text-right py-2 pr-3">Amount</th>
            <th className="text-left py-2 pr-3">Signals</th>
            <th className="text-right py-2 pr-3">Risk</th>
            <th className="text-right py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => {
            const from = accountsById.get(t.fromAccountId);
            const to = accountsById.get(t.toAccountId);
            const status = statusFor(t.risk, threshold);
            return (
              <tr key={t.id} className="ticker-row border-b border-border/40 hover:bg-accent/20">
                <td className="py-2 pr-3 text-muted-foreground">{t.id.slice(0, 14)}</td>
                <td className="py-2 pr-3">
                  {from?.label} <span className="text-muted-foreground">·{from?.country}</span>
                </td>
                <td className="py-2 pr-3">
                  {to?.label} <span className="text-muted-foreground">·{to?.country}</span>
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">{formatInr(t.amount)}</td>
                <td className="py-2 pr-3">
                  <div className="flex flex-wrap gap-1">
                    {t.flags.slice(0, 3).map((flag) => (
                      <span key={flag} className={`px-1.5 py-0.5 rounded text-[10px] ${FLAG_CLASS[flag] ?? "bg-muted text-muted-foreground"}`}>
                        {flag}
                      </span>
                    ))}
                    {t.flags.length === 0 && <span className="text-muted-foreground/50">—</span>}
                  </div>
                </td>
                <td className="py-2 pr-3 text-right">
                  <RiskBar value={t.risk} />
                </td>
                <td className="py-2 text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_CLASS[status]}`}>{status}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface TransferEdge {
  fromAccountId: string;
  toAccountId: string;
  transactionId: string;
}

interface GraphCanvasProps {
  accounts: Account[];
  edges: TransferEdge[];
  transactions: Transaction[];
  chainAccountIds: Set<string> | null;
  accountsById: Map<string, Account>;
  threshold: number;
}

/**
 * A plain node-and-line diagram of who is sending money to whom. Kept
 * intentionally simple: straight lines, flat colors, no gradients or
 * glow effects - just enough SVG to see which accounts are connected
 * and how risky each transfer looks.
 */
export function GraphCanvas({ accounts, edges, transactions, chainAccountIds, accountsById, threshold }: GraphCanvasProps) {
  const transactionsById = useMemo(() => new Map(transactions.map((t) => [t.id, t])), [transactions]);

  return (
    <div className="relative w-full h-[520px] rounded-lg overflow-hidden bg-muted/20 border border-border">
      <svg viewBox="0 0 960 600" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
        {/* Lines: one per recent transfer, colored and sized by risk. */}
        {edges.map((edge) => {
          const from = accountsById.get(edge.fromAccountId);
          const to = accountsById.get(edge.toAccountId);
          if (!from || !to) return null;

          const risk = transactionsById.get(edge.transactionId)?.risk ?? 0.2;
          const inSelectedChain = chainAccountIds?.has(edge.fromAccountId) && chainAccountIds?.has(edge.toAccountId);
          const color = risk >= threshold || inSelectedChain ? riskColor(risk) : "#64748b";

          return (
            <line
              key={edge.transactionId}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={color}
              strokeWidth={inSelectedChain ? 3 : 1 + risk * 2}
              opacity={inSelectedChain ? 1 : 0.5}
            />
          );
        })}

        {/* Nodes: one circle per account, colored by account type. */}
        {accounts.map((account) => {
          const highlighted = chainAccountIds?.has(account.id);
          const radius = 8 + account.risk * 6;

          return (
            <g key={account.id}>
              <circle
                cx={account.x}
                cy={account.y}
                r={radius}
                fill={KIND_COLOR[account.kind]}
                fillOpacity={0.25}
                stroke={highlighted ? RISK_DANGER : KIND_COLOR[account.kind]}
                strokeWidth={highlighted ? 3 : 1.5}
              />
              <text x={account.x} y={account.y + radius + 12} textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#94a3b8">
                {account.label}
              </text>
              <text x={account.x} y={account.y + radius + 22} textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#64748b">
                {account.kind}·{account.country}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
