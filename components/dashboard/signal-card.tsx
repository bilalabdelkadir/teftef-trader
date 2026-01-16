"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertTriangle, Clock } from "lucide-react";

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

interface SignalCardProps {
  signal: TradeSignal;
  isStale: boolean;
  ageCategory: "today" | "yesterday" | "older";
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

export function SignalCard({ signal, isStale, ageCategory }: SignalCardProps) {
  const isBuy = signal.direction === "BUY";

  return (
    <Link href={`/signals/${signal.id}`} className="block">
      <Card
        className={`transition-all hover:shadow-md ${
          signal.status === "new" ? "border-primary/50 bg-primary/5" : ""
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
              <p className="text-xs text-muted-foreground">Entry</p>
              <p className="font-mono">${signal.entryPrice.toFixed(2)}</p>
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
}
