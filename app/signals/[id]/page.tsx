"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  Clock,
  Target,
  Shield,
  Zap,
} from "lucide-react";

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
  validUntil: string | null;
  interval: string;
  createdAt: string;
  isStale: boolean;
  minutesOld: number;
}

function formatTimeAgo(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

export default function SignalViewPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, isPending } = useSession();
  const [signal, setSignal] = useState<TradeSignal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session && params.id) {
      loadSignal();
    }
  }, [session, params.id]);

  const loadSignal = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/signals/${params.id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Signal not found");
        } else {
          setError("Failed to load signal");
        }
        return;
      }
      const data = await res.json();
      setSignal(data);

      // Auto-mark as viewed if status is "new"
      if (data.status === "new") {
        await fetch(`/api/signals/${params.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "viewed" }),
        });
      }
    } catch (err) {
      console.error("Failed to load signal:", err);
      setError("Failed to load signal");
    } finally {
      setLoading(false);
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

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Signal Details</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">{error}</p>
          <Link href="/dashboard">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </main>
      </div>
    );
  }

  if (!signal) {
    return null;
  }

  const isBuy = signal.direction === "BUY";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
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
                <h1 className="text-xl font-bold font-mono">
                  {signal.symbol}
                  <span
                    className={`ml-2 text-lg ${
                      isBuy ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {signal.direction}
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground capitalize">
                  {signal.market} • {signal.interval} • {signal.strategy.replace("_", " ")}
                </p>
              </div>
            </div>
          </div>
          <Link href={`/analyze/${encodeURIComponent(signal.symbol)}`}>
            <Button>
              <RefreshCw className="w-4 h-4 mr-2" />
              Re-analyze
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-3xl">
        {/* Low Confidence Warning */}
        {signal.status === "caution" && (
          <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="py-4">
              <div className="flex items-center gap-3 text-yellow-600 dark:text-yellow-500">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Low confidence signal</p>
                  <p className="text-sm opacity-80">
                    This signal has a confidence score below 70% and is not recommended
                    for trading. Use it for educational purposes only.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Staleness Warning */}
        {signal.isStale && (
          <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="py-4">
              <div className="flex items-center gap-3 text-yellow-600 dark:text-yellow-500">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Late notification</p>
                  <p className="text-sm opacity-80">
                    This signal is {formatTimeAgo(signal.minutesOld)} and may be stale.
                    Market conditions could have changed.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Signal Age */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Generated {formatTimeAgo(signal.minutesOld)}</span>
          {signal.validUntil && !signal.isStale && (
            <span className="text-green-500">• Valid</span>
          )}
        </div>

        {/* Price Levels Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5" />
              Trade Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Entry Price</p>
                <p className="text-2xl font-mono font-bold">
                  ${signal.entryPrice.toFixed(5)}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-red-500/10">
                <p className="text-sm text-red-500 mb-1">Stop Loss</p>
                <p className="text-2xl font-mono font-bold text-red-500">
                  ${signal.stopLoss.toFixed(5)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(
                    Math.abs(
                      ((signal.stopLoss - signal.entryPrice) / signal.entryPrice) * 100
                    )
                  ).toFixed(2)}
                  % from entry
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-500/10">
                <p className="text-sm text-green-500 mb-1">Take Profit</p>
                <p className="text-2xl font-mono font-bold text-green-500">
                  ${signal.takeProfit.toFixed(5)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(
                    Math.abs(
                      ((signal.takeProfit - signal.entryPrice) / signal.entryPrice) * 100
                    )
                  ).toFixed(2)}
                  % from entry
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Card */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Zap className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{signal.confidence}%</p>
              <p className="text-xs text-muted-foreground">Confidence</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Shield className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{signal.riskReward.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Risk/Reward</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Target className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">
                {signal.positionSize.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Position Size</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{signal.interval}</p>
              <p className="text-xs text-muted-foreground">Timeframe</p>
            </CardContent>
          </Card>
        </div>

        {/* Reasoning Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Analysis Reasoning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                {signal.reasoning}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href={`/analyze/${encodeURIComponent(signal.symbol)}`}
            className="flex-1"
          >
            <Button variant="outline" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Run Fresh Analysis
            </Button>
          </Link>
          <Link href="/alerts" className="flex-1">
            <Button variant="outline" className="w-full">
              View All Signals
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
