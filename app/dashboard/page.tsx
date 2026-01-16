"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  RefreshCw,
  Trash2,
  ArrowUpRight,
  Zap,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { DEFAULTS } from "@/lib/constants";
import { toast } from "sonner";

interface WatchlistItem {
  id: string;
  symbol: string;
  market: string;
  addedAt: string;
}

interface PriceData {
  symbol: string;
  price: number;
  timestamp: number;
}

interface TradeSignal {
  id: string;
  symbol: string;
  market: string;
  direction: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  confidence: number;
  status: string;
  validUntil: string | null;
  interval: string;
  createdAt: string;
}

interface Settings {
  accountSize: number;
  riskPerTrade: number;
  defaultStrategy: string;
  onboardingDone: boolean;
}

function isSignalStale(signal: TradeSignal): boolean {
  if (!signal.validUntil) return false;
  return new Date() > new Date(signal.validUntil);
}

function getSignalAge(createdAt: string): string {
  const minutes = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60)
  );
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type TimeFilter = "today" | "yesterday" | "week" | "all";

function getSignalAgeCategory(createdAt: string): "today" | "yesterday" | "older" {
  const signalDate = new Date(createdAt);
  const now = new Date();

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (signalDate >= today) {
    return "today";
  } else if (signalDate >= yesterday) {
    return "yesterday";
  }
  return "older";
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [signals, setSignals] = useState<TradeSignal[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [activeTab, setActiveTab] = useState<"signals" | "watchlist">("signals");

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  useEffect(() => {
    if (session && settings?.onboardingDone) {
      loadSignals();
    }
  }, [timeFilter]);

  const loadSignals = async () => {
    try {
      const signalsUrl = timeFilter === "all"
        ? "/api/signals?limit=20"
        : `/api/signals?limit=20&timeFilter=${timeFilter}`;
      const signalsRes = await fetch(signalsUrl);
      const signalsData = await signalsRes.json();
      setSignals(signalsData);
    } catch (error) {
      console.error("Failed to load signals:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load settings first to check onboarding
      const settingsRes = await fetch("/api/settings");
      const settingsData = await settingsRes.json();
      setSettings(settingsData);

      // Redirect to onboarding if not done
      if (!settingsData.onboardingDone) {
        router.push("/onboarding");
        return;
      }

      // Load watchlist and signals in parallel
      const signalsUrl = timeFilter === "all"
        ? "/api/signals?limit=20"
        : `/api/signals?limit=20&timeFilter=${timeFilter}`;

      const [watchlistRes, signalsRes] = await Promise.all([
        fetch("/api/watchlist"),
        fetch(signalsUrl),
      ]);

      const watchlistData = await watchlistRes.json();
      const signalsData = await signalsRes.json();

      setWatchlist(watchlistData);
      setSignals(signalsData);

      // Load prices for watchlist items
      if (watchlistData.length > 0) {
        const symbols = watchlistData.map((w: WatchlistItem) => w.symbol);
        await loadPrices(symbols);
      }
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const loadPrices = async (symbols: string[]) => {
    try {
      const res = await fetch(`/api/prices?symbols=${symbols.join(",")}`);
      const data = await res.json();
      setPrices(data);
    } catch (error) {
      toast.error("Failed to load prices");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const symbols = watchlist.map((w) => w.symbol);
    await loadPrices(symbols);
    setRefreshing(false);
  };

  const handleAnalyze = async (symbol: string) => {
    setAnalyzing(symbol);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });
      const result = await res.json();

      if (result.signal?.hasValidSetup) {
        toast.success(`Signal found for ${symbol}`);
        await loadSignals();
      }

      router.push(`/analyze/${encodeURIComponent(symbol)}`);
    } catch (error) {
      toast.error("Analysis failed");
    } finally {
      setAnalyzing(null);
    }
  };

  const handleRemoveFromWatchlist = async (id: string) => {
    try {
      await fetch(`/api/watchlist/${id}`, { method: "DELETE" });
      setWatchlist((prev) => prev.filter((w) => w.id !== id));
      toast.success("Removed from watchlist");
    } catch (error) {
      toast.error("Failed to remove from watchlist");
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

  const newSignalsCount = signals.filter((s) => s.status === "new").length;
  const highConfidenceSignals = signals.filter((s) => s.confidence >= DEFAULTS.HIGH_CONFIDENCE_THRESHOLD).length;
  const staleSignalsCount = signals.filter(isSignalStale).length;
  const activeSignals = signals.filter((s) => !isSignalStale(s));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">TefTef Trader</h1>
          <nav className="flex items-center gap-2">
            <Link href="/alerts">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                {newSignalsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {newSignalsCount}
                  </span>
                )}
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ fetchOptions: { onSuccess: () => router.push("/login") } })}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">New Signals</p>
                  <p className="text-2xl font-bold">{newSignalsCount}</p>
                </div>
                <Bell className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">High Confidence</p>
                  <p className="text-2xl font-bold">{highConfidenceSignals}</p>
                </div>
                <Zap className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Stale</p>
                  <p className="text-2xl font-bold">{staleSignalsCount}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Watching</p>
                  <p className="text-2xl font-bold">{watchlist.length}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Signals & Watchlist Section */}
        <Card>
          <CardHeader className="space-y-4">
            {/* Tab Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => setActiveTab("signals")}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === "signals"
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  Signals
                  {activeSignals.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                      {activeSignals.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("watchlist")}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === "watchlist"
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Watchlist
                  {watchlist.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                      {watchlist.length}
                    </span>
                  )}
                </button>
              </div>
              {activeTab === "signals" ? (
                <Link href="/alerts">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw
                    className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                </Button>
              )}
            </div>

            {/* Time Filter - Only show for Signals tab */}
            {activeTab === "signals" && (
              <div className="flex flex-wrap gap-2">
                {(["today", "yesterday", "week", "all"] as const).map((filter) => (
                  <Button
                    key={filter}
                    variant={timeFilter === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeFilter(filter)}
                    className="text-xs"
                  >
                    {filter === "today" && "Today"}
                    {filter === "yesterday" && "Yesterday"}
                    {filter === "week" && "Last Week"}
                    {filter === "all" && "All"}
                  </Button>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {/* Signals Tab Content */}
            {activeTab === "signals" && (
              <>
                {activeSignals.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No active trade signals. Analyze an asset to generate signals.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeSignals.slice(0, 6).map((signal) => {
                      const isBuy = signal.direction === "BUY";
                      const isStale = isSignalStale(signal);
                      const ageCategory = getSignalAgeCategory(signal.createdAt);

                      return (
                        <Link
                          key={signal.id}
                          href={`/signals/${signal.id}`}
                          className="block"
                        >
                          <Card
                            className={`transition-all hover:shadow-md ${
                              signal.status === "new"
                                ? "border-primary/50 bg-primary/5"
                                : ""
                            } ${isStale ? "opacity-60" : ""}`}
                          >
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`p-2 rounded-full ${
                                      isBuy
                                        ? "bg-green-500/10 text-green-500"
                                        : "bg-red-500/10 text-red-500"
                                    }`}
                                  >
                                    {isBuy ? (
                                      <TrendingUp className="w-5 h-5" />
                                    ) : (
                                      <TrendingDown className="w-5 h-5" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-mono font-bold text-lg flex items-center gap-2">
                                      <span
                                        className={`inline-block w-2 h-2 rounded-full ${
                                          ageCategory === "today"
                                            ? "bg-green-500"
                                            : ageCategory === "yesterday"
                                              ? "bg-yellow-500"
                                              : "bg-gray-400"
                                        }`}
                                        title={
                                          ageCategory === "today"
                                            ? "Today"
                                            : ageCategory === "yesterday"
                                              ? "Yesterday"
                                              : "Older"
                                        }
                                      />
                                      {signal.symbol}
                                    </p>
                                    <p
                                      className={`text-sm font-medium ${
                                        isBuy ? "text-green-500" : "text-red-500"
                                      }`}
                                    >
                                      {signal.direction}
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
                                    {signal.confidence}%
                                  </p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {getSignalAge(signal.createdAt)}
                                  </p>
                                </div>
                              </div>

                              {/* Price Levels */}
                              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                <div className="p-2 rounded bg-muted/50">
                                  <p className="text-xs text-muted-foreground">
                                    Entry
                                  </p>
                                  <p className="font-mono">
                                    ${signal.entryPrice.toFixed(2)}
                                  </p>
                                </div>
                                <div className="p-2 rounded bg-red-500/10">
                                  <p className="text-xs text-red-500">SL</p>
                                  <p className="font-mono text-red-500">
                                    ${signal.stopLoss.toFixed(2)}
                                  </p>
                                </div>
                                <div className="p-2 rounded bg-green-500/10">
                                  <p className="text-xs text-green-500">TP</p>
                                  <p className="font-mono text-green-500">
                                    ${signal.takeProfit.toFixed(2)}
                                  </p>
                                </div>
                              </div>

                              {/* Bottom Info */}
                              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                <span>R:R {signal.riskReward.toFixed(2)}</span>
                                <span className="capitalize">{signal.interval}</span>
                                {isStale && (
                                  <span className="text-yellow-500 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Stale
                                  </span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Watchlist Tab Content */}
            {activeTab === "watchlist" && (
              <>
                {watchlist.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No assets in your watchlist.{" "}
                    <Link href="/settings" className="text-primary hover:underline">
                      Add some
                    </Link>
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {watchlist.map((item) => {
                      const priceData = prices[item.symbol];
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-mono font-medium text-sm">
                                {item.symbol}
                              </p>
                              {priceData && (
                                <p className="font-mono text-xs text-muted-foreground">
                                  ${priceData.price.toFixed(item.market === "crypto" ? 2 : 5)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAnalyze(item.symbol)}
                              disabled={analyzing === item.symbol}
                              className="h-8 px-2"
                            >
                              {analyzing === item.symbol ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFromWatchlist(item.id)}
                              className="h-8 px-2"
                            >
                              <Trash2 className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
