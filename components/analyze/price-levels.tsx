"use client";

interface PriceLevelsProps {
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
}

export function PriceLevels({ entryPrice, stopLoss, takeProfit }: PriceLevelsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center p-3 rounded-lg bg-muted">
        <p className="text-xs text-muted-foreground mb-1">Entry</p>
        <p className="font-mono font-medium">${entryPrice.toFixed(5)}</p>
      </div>
      <div className="text-center p-3 rounded-lg bg-red-500/10">
        <p className="text-xs text-red-500 mb-1">Stop Loss</p>
        <p className="font-mono font-medium text-red-500">
          ${stopLoss.toFixed(5)}
        </p>
      </div>
      <div className="text-center p-3 rounded-lg bg-green-500/10">
        <p className="text-xs text-green-500 mb-1">Take Profit</p>
        <p className="font-mono font-medium text-green-500">
          ${takeProfit.toFixed(5)}
        </p>
      </div>
    </div>
  );
}
