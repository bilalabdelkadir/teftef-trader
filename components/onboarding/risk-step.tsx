"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULTS, LIMITS } from "@/lib/constants";

interface RiskStepProps {
  accountSize: number;
  riskPerTrade: number;
  onAccountSizeChange: (value: number) => void;
  onRiskChange: (value: number) => void;
}

export function RiskStep({
  accountSize,
  riskPerTrade,
  onAccountSizeChange,
  onRiskChange,
}: RiskStepProps) {
  const maxRiskAmount = (accountSize * riskPerTrade) / 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configure your risk settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="accountSize">Account Size ($)</Label>
          <Input
            id="accountSize"
            type="number"
            min={LIMITS.MIN_ACCOUNT_SIZE}
            step={100}
            value={accountSize}
            onChange={(e) => onAccountSizeChange(parseFloat(e.target.value) || 0)}
            placeholder={String(DEFAULTS.ACCOUNT_SIZE)}
          />
          <p className="text-xs text-muted-foreground">
            Your trading account balance for position sizing calculations
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="riskPerTrade">Risk Per Trade (%)</Label>
          <Input
            id="riskPerTrade"
            type="number"
            min={LIMITS.MIN_RISK_PER_TRADE}
            max={LIMITS.MAX_RISK_PER_TRADE}
            step={0.1}
            value={riskPerTrade}
            onChange={(e) => onRiskChange(parseFloat(e.target.value) || 0)}
            placeholder={String(DEFAULTS.RISK_PER_TRADE)}
          />
          <p className="text-xs text-muted-foreground">
            Percentage of account to risk on each trade (recommended: 1-2%)
          </p>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Risk Summary</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Account Size: ${accountSize.toLocaleString()}</p>
            <p>Risk per trade: {riskPerTrade}%</p>
            <p>Max risk per trade: ${maxRiskAmount.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
