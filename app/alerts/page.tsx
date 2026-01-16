"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Bell,
  Eye,
  Filter,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface TradeSignal {
  id: string;
  symbol: string;
  market: string;
  direction: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  positionSize: number;
  confidence: number;
  reasoning: string;
  strategy: string;
  status: string;
  createdAt: string;
}

type MarketFilter = "all" | "forex" | "crypto" | "stocks";
type StatusFilter = "all" | "new" | "caution" | "viewed";

export default function AlertsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [signals, setSignals] = useState<TradeSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [marketFilter, setMarketFilter] = useState<MarketFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) {
      loadSignals();
    }
  }, [session, marketFilter, statusFilter]);

  const loadSignals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (marketFilter !== "all") {
        params.set("market", marketFilter);
      }
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const res = await fetch(`/api/signals?${params.toString()}`);
      const data = await res.json();
      setSignals(data);
    } catch (error) {
      toast.error("Failed to load signals");
    } finally {
      setLoading(false);
    }
  };

  const markAsViewed = async (signalId: string) => {
    try {
      await fetch(`/api/signals/${signalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "viewed" }),
      });
      setSignals((prev) =>
        prev.map((s) => (s.id === signalId ? { ...s, status: "viewed" } : s))
      );
    } catch (error) {
      toast.error("Failed to mark signal as viewed");
    }
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const newCount = signals.filter((s) => s.status === "new").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <h1 className="text-xl font-bold">Trade Alerts</h1>
            {newCount > 0 && (
              <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                {newCount} new
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-3xl">
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          {/* Market Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="flex rounded-lg border overflow-hidden">
              {(["all", "forex", "crypto", "stocks"] as MarketFilter[]).map(
                (market) => (
                  <button
                    key={market}
                    onClick={() => setMarketFilter(market)}
                    className={`px-3 py-1.5 text-sm capitalize transition-colors ${
                      marketFilter === market
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    {market}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex rounded-lg border overflow-hidden">
            {(["all", "new", "caution", "viewed"] as StatusFilter[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-sm capitalize transition-colors ${
                  statusFilter === status
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Signals List */}
        {signals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No trade signals found.
                {marketFilter !== "all" && ` Try changing the market filter.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {signals.map((signal) => (
              <Card
                key={signal.id}
                className={`transition-colors ${
                  signal.status === "new"
                    ? "border-primary/50 bg-primary/5"
                    : signal.status === "caution"
                      ? "border-yellow-500/50 bg-yellow-500/5"
                      : ""
                }`}
              >
                {/* Caution Warning Banner */}
                {signal.status === "caution" && (
                  <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-medium">
                      Low confidence - Not recommended for trading
                    </span>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          signal.direction === "BUY"
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {signal.direction === "BUY" ? (
                          <TrendingUp className="w-5 h-5" />
                        ) : (
                          <TrendingDown className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg font-mono">
                          {signal.symbol}
                          <span
                            className={`ml-2 text-sm ${
                              signal.direction === "BUY"
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {signal.direction}
                          </span>
                        </CardTitle>
                        <p className="text-xs text-muted-foreground capitalize">
                          {signal.market} • {signal.strategy.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-medium ${
                          signal.confidence >= 80
                            ? "text-green-500"
                            : signal.confidence >= 60
                              ? "text-yellow-500"
                              : "text-red-500"
                        }`}
                      >
                        {signal.confidence}% confidence
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(signal.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Price Levels */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Entry</p>
                      <p className="font-mono">${signal.entryPrice.toFixed(5)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-red-500">Stop Loss</p>
                      <p className="font-mono text-red-500">
                        ${signal.stopLoss.toFixed(5)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-green-500">Take Profit</p>
                      <p className="font-mono text-green-500">
                        ${signal.takeProfit.toFixed(5)}
                      </p>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span>R:R {signal.riskReward.toFixed(2)}</span>
                    <span>•</span>
                    <span>{signal.positionSize.toLocaleString()} units</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/signals/${signal.id}`}
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full">
                        View Signal
                      </Button>
                    </Link>
                    {signal.status === "new" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsViewed(signal.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
