"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { ASSETS } from "@/lib/constants";

interface AssetsStepProps {
  selectedMarkets: string[];
  selectedAssets: string[];
  onToggleAsset: (symbol: string) => void;
}

export function AssetsStep({
  selectedMarkets,
  selectedAssets,
  onToggleAsset,
}: AssetsStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select your assets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {selectedMarkets.map((market) => {
          const marketAssets = ASSETS[market] || [];
          return (
            <div key={market}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 capitalize">
                {market}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {marketAssets.map((asset) => {
                  const isSelected = selectedAssets.includes(asset.symbol);
                  return (
                    <button
                      key={asset.symbol}
                      onClick={() => onToggleAsset(asset.symbol)}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <div>
                        <p className="font-mono font-medium">
                          {asset.symbol}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {asset.name}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
