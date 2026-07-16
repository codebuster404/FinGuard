import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { GraphCanvas, Kpi, LedgerTable, Legend, Logo } from "../finguard/components";
import { formatInr } from "../finguard/riskEngine";
import type { DashboardTab } from "../finguard/types";
import { useTransactionFeed } from "../finguard/useTransactionFeed";

export const Route = createFileRoute("/")({
  component: FinGuardApp,
});

const TABS: [DashboardTab, string][] = [
  ["dashboard", "Dashboard"],
  ["ledger", "Live Transaction Ledger"],
  ["graph", "Transaction Graph"],
  ["alerts", "Structural Fraud Alerts"],
];

function FinGuardApp() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("dashboard");
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(0.55);

  const feed = useTransactionFeed(threshold);
  const { accounts, accountsById, transactions, alerts, totals, visibleEdges, isPaused, setIsPaused } = feed;

  // Accounts belonging to the alert chain the user clicked, so the graph
  // view can highlight them.
  const selectedChainAccountIds = useMemo(() => {
    const alert = alerts.find((a) => a.chainId === selectedChainId);
    return alert ? new Set(alert.nodes) : null;
  }, [selectedChainId, alerts]);

  function openChainOnGraph(chainId: string) {
    setSelectedChainId((current) => (current === chainId ? null : chainId));
    setActiveTab("graph");
  }

  return (
    <main className="min-h-screen font-sans text-foreground">
      <header className="border-b border-border/60 glass-panel sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center gap-6 flex-wrap">
          <Logo />

          <nav className="flex items-center gap-1 ml-2">
            {TABS.map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs font-mono px-3 py-1.5 rounded-md border transition-colors ${
                  activeTab === tab
                    ? "border-primary/60 text-primary bg-primary/10 text-glow-neon"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span className="inline-block w-2 h-2 rounded-full bg-safe live-dot" />
              <span>
                STREAM · <span className="text-safe">LIVE</span>
              </span>
            </div>

            <label className="text-xs font-mono flex items-center gap-2 text-muted-foreground">
              risk ≥
              <input
                type="range"
                min={0.2}
                max={0.9}
                step={0.05}
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="accent-[oklch(0.78_0.16_195)] w-24"
              />
              <span className="text-primary tabular-nums w-8">{threshold.toFixed(2)}</span>
            </label>

            <button
              onClick={() => setIsPaused((paused) => !paused)}
              className="text-xs font-mono px-3 py-1.5 rounded-md border border-border hover:border-primary/60 hover:text-primary transition-colors"
            >
              {isPaused ? "▶ RESUME" : "❚❚ PAUSE"}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-4">
        {activeTab === "dashboard" && <DashboardView totals={totals} threshold={threshold} />}

        {activeTab === "ledger" && <LedgerView transactions={transactions} accountsById={accountsById} threshold={threshold} />}

        {activeTab === "graph" && (
          <GraphView
            accounts={accounts}
            accountsById={accountsById}
            transactions={transactions}
            edges={visibleEdges}
            alertCount={alerts.length}
            threshold={threshold}
            selectedChainAccountIds={selectedChainAccountIds}
          />
        )}

        {activeTab === "alerts" && (
          <AlertsView alerts={alerts} selectedChainId={selectedChainId} onSelectChain={openChainOnGraph} />
        )}

        <footer className="text-[10px] font-mono text-muted-foreground/60 pt-2 pb-6 flex items-center justify-between">
          <span>FinGuard AML Compliance Console · demo stream</span>
          <span>© {new Date().getFullYear()} FinGuard</span>
        </footer>
      </div>
    </main>
  );
}

// ---------- Tab views ----------
// Kept in this file (not finguard/components.tsx) since they're specific to
// this route's layout rather than reusable pieces.

function DashboardView({ totals, threshold }: { totals: { processed: number; flagged: number; blocked: number; volume: number }; threshold: number }) {
  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Kpi label="Transactions Screened" value={totals.processed.toLocaleString()} accent="primary" hint="live stream" />
      <Kpi label="Flagged for Review" value={totals.flagged.toLocaleString()} accent="warn" hint={`≥ ${threshold.toFixed(2)} risk`} />
      <Kpi label="Auto-Blocked" value={totals.blocked.toLocaleString()} accent="danger" hint="≥ 0.80 risk" />
      <Kpi label="Volume Analysed" value={formatInr(totals.volume)} accent="safe" hint="INR equivalent" />
    </section>
  );
}

function LedgerView({
  transactions,
  accountsById,
  threshold,
}: {
  transactions: ReturnType<typeof useTransactionFeed>["transactions"];
  accountsById: ReturnType<typeof useTransactionFeed>["accountsById"];
  threshold: number;
}) {
  const recent = transactions.slice(0, 12);
  return (
    <section className="glass-panel rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold tracking-wide">Live Transaction Ledger</h2>
        <span className="text-[10px] font-mono text-muted-foreground">
          showing {recent.length} of {transactions.length}
        </span>
      </div>
      <LedgerTable transactions={recent} accountsById={accountsById} threshold={threshold} />
    </section>
  );
}

function GraphView({
  accounts,
  accountsById,
  transactions,
  edges,
  alertCount,
  threshold,
  selectedChainAccountIds,
}: {
  accounts: ReturnType<typeof useTransactionFeed>["accounts"];
  accountsById: ReturnType<typeof useTransactionFeed>["accountsById"];
  transactions: ReturnType<typeof useTransactionFeed>["transactions"];
  edges: ReturnType<typeof useTransactionFeed>["visibleEdges"];
  alertCount: number;
  threshold: number;
  selectedChainAccountIds: Set<string> | null;
}) {
  return (
    <section className="glass-panel rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wide">Transaction Link Graph</h2>
          <p className="text-xs text-muted-foreground font-mono">
            nodes: {accounts.length} · edges: {edges.length} · cycles: {alertCount}
          </p>
        </div>
        <Legend />
      </div>

      <GraphCanvas
        accounts={accounts}
        edges={edges}
        transactions={transactions}
        chainAccountIds={selectedChainAccountIds}
        accountsById={accountsById}
        threshold={threshold}
      />

      <div className="mt-3 text-[11px] font-mono text-muted-foreground">
        {selectedChainAccountIds ? (
          <span className="text-destructive text-glow-danger">◉ CHAIN ISOLATED · {selectedChainAccountIds.size} nodes</span>
        ) : (
          "Open Structural Fraud Alerts and click an alert to isolate its chain here."
        )}
      </div>
    </section>
  );
}

function AlertsView({
  alerts,
  selectedChainId,
  onSelectChain,
}: {
  alerts: ReturnType<typeof useTransactionFeed>["alerts"];
  selectedChainId: string | null;
  onSelectChain: (chainId: string) => void;
}) {
  return (
    <section className="glass-panel rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold tracking-wide">Structural Fraud Alerts</h2>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-destructive/20 text-destructive border border-destructive/40">
          {alerts.length} OPEN
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {alerts.length === 0 && (
          <div className="col-span-full text-xs text-muted-foreground font-mono border border-dashed border-border rounded-md p-6 text-center">
            No structural loops detected. Monitoring live stream…
          </div>
        )}

        {alerts.map((alert) => (
          <button
            key={alert.id}
            onClick={() => onSelectChain(alert.chainId)}
            className={`text-left rounded-lg border p-3 transition-all ${
              selectedChainId === alert.chainId
                ? "ring-danger-glow border-destructive/60 bg-destructive/5"
                : "border-border hover:border-destructive/50 hover:bg-destructive/5"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  alert.severity === "critical"
                    ? "bg-destructive text-destructive-foreground"
                    : alert.severity === "high"
                      ? "bg-warn/80 text-background"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {alert.severity.toUpperCase()}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">{alert.chainId}</span>
            </div>

            <div className="mt-2 text-sm font-medium">{alert.pattern}</div>
            <div className="mt-1 text-xs text-muted-foreground font-mono truncate">
              {alert.nodes.slice(0, 5).join(" → ")}
              {alert.nodes.length > 5 ? " → …" : ""}
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
              <span className="text-destructive text-glow-danger">{formatInr(alert.totalAmount)}</span>
              <span className="text-muted-foreground">{new Date(alert.timestamp).toLocaleTimeString()}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
