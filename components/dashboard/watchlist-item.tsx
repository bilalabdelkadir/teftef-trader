"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowUpRight, Trash2 } from "lucide-react";

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

interface WatchlistItemProps {
  item: WatchlistItem;
  priceData?: PriceData;
  analyzing: boolean;
  onAnalyze: (symbol: string) => void;
  onRemove: (id: string) => void;
}

export function WatchlistItemCard({
  item,
  priceData,
  analyzing,
  onAnalyze,
  onRemove,
}: WatchlistItemProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div>
          <p className="font-mono font-medium text-sm">{item.symbol}</p>
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
          onClick={() => onAnalyze(item.symbol)}
          disabled={analyzing}
          className="h-8 px-2"
        >
          {analyzing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowUpRight className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(item.id)}
          className="h-8 px-2"
        >
          <Trash2 className="w-4 h-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}
