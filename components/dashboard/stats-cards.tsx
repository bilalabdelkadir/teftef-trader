"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Bell, Zap, AlertTriangle, BarChart3 } from "lucide-react";

interface StatsCardsProps {
  newSignalsCount: number;
  highConfidenceCount: number;
  staleSignalsCount: number;
  watchlistCount: number;
}

export function StatsCards({
  newSignalsCount,
  highConfidenceCount,
  staleSignalsCount,
  watchlistCount,
}: StatsCardsProps) {
  const stats = [
    {
      label: "New Signals",
      value: newSignalsCount,
      icon: Bell,
    },
    {
      label: "High Confidence",
      value: highConfidenceCount,
      icon: Zap,
    },
    {
      label: "Stale",
      value: staleSignalsCount,
      icon: AlertTriangle,
    },
    {
      label: "Watching",
      value: watchlistCount,
      icon: BarChart3,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <stat.icon className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
