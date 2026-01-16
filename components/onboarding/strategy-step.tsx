"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { STRATEGIES } from "@/lib/constants";

interface StrategyStepProps {
  selectedStrategy: string;
  onSelectStrategy: (strategyId: string) => void;
}

export function StrategyStep({
  selectedStrategy,
  onSelectStrategy,
}: StrategyStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose your analysis strategy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {STRATEGIES.map((strategy) => {
          const Icon = strategy.icon;
          const isSelected = selectedStrategy === strategy.id;
          return (
            <button
              key={strategy.id}
              onClick={() => onSelectStrategy(strategy.id)}
              className={`flex items-center gap-4 w-full p-4 rounded-lg border-2 transition-colors text-left ${
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
              <div className="flex-1">
                <div className="font-medium">{strategy.name}</div>
                <div className="text-sm text-muted-foreground">
                  {strategy.description}
                </div>
              </div>
              {isSelected && <Check className="w-5 h-5 text-primary" />}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
