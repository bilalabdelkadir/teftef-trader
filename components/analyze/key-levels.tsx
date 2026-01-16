"use client";

interface KeyLevelsProps {
  support: number[];
  resistance: number[];
}

export function KeyLevels({ support, resistance }: KeyLevelsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-xs text-muted-foreground mb-2">Support Levels</p>
        <div className="space-y-1">
          {support.map((level, i) => (
            <p key={i} className="font-mono text-sm text-green-500">
              ${level.toFixed(5)}
            </p>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-2">Resistance Levels</p>
        <div className="space-y-1">
          {resistance.map((level, i) => (
            <p key={i} className="font-mono text-sm text-red-500">
              ${level.toFixed(5)}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
