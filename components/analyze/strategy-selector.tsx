"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, FileText } from "lucide-react";
import { BASE_STRATEGIES } from "@/lib/constants";

interface UserStrategy {
  id: string;
  name: string;
  description: string | null;
  baseStrategy: string | null;
  _count: {
    contents: number;
  };
}

interface StrategySelectorProps {
  selectedStrategy: string;
  selectedCustomStrategyId: string | null;
  customStrategies: UserStrategy[];
  onSelectBaseStrategy: (strategyId: string) => void;
  onSelectCustomStrategy: (strategyId: string) => void;
}

export function StrategySelector({
  selectedStrategy,
  selectedCustomStrategyId,
  customStrategies,
  onSelectBaseStrategy,
  onSelectCustomStrategy,
}: StrategySelectorProps) {
  return (
    <div className="space-y-3 text-left max-w-md mx-auto">
      <p className="text-sm font-medium">Select Strategy</p>

      {/* Base Strategies */}
      <div className="grid grid-cols-2 gap-2">
        {BASE_STRATEGIES.map((strategy) => (
          <button
            key={strategy.id}
            onClick={() => onSelectBaseStrategy(strategy.id)}
            className={`p-2 text-sm rounded-lg border text-left transition-colors ${
              selectedStrategy === strategy.id && !selectedCustomStrategyId
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground"
            }`}
          >
            {strategy.name}
          </button>
        ))}
      </div>

      {/* Custom Strategies */}
      {customStrategies.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">
              Custom Strategies
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="space-y-2">
            {customStrategies.map((strategy) => (
              <button
                key={strategy.id}
                onClick={() => onSelectCustomStrategy(strategy.id)}
                className={`w-full p-3 rounded-lg border text-left transition-colors ${
                  selectedCustomStrategyId === strategy.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{strategy.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    <FileText className="w-3 h-3 mr-1" />
                    {strategy._count.contents} content
                  </Badge>
                </div>
                {strategy.description && (
                  <p className="text-xs text-muted-foreground mt-1 ml-6">
                    {strategy.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {customStrategies.length === 0 && (
        <div className="text-center py-2">
          <Link href="/strategies">
            <Button variant="link" size="sm" className="text-xs">
              <Brain className="w-3 h-3 mr-1" />
              Create custom strategy with your own rules
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
