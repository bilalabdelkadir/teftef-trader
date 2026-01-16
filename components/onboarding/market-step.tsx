"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { MARKETS } from "@/lib/constants";

interface MarketStepProps {
  selectedMarkets: string[];
  onToggleMarket: (marketId: string) => void;
}

export function MarketStep({ selectedMarkets, onToggleMarket }: MarketStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Which markets do you trade?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {MARKETS.map((market) => {
            const Icon = market.icon;
            const isSelected = selectedMarkets.includes(market.id);
            return (
              <button
                key={market.id}
                onClick={() => onToggleMarket(market.id)}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-colors text-left ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                {Icon && (
                  <Icon
                    className={`w-6 h-6 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                  />
                )}
                <div>
                  <div className="font-medium">{market.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {market.description}
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-primary ml-auto" />
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
