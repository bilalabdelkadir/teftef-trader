"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import {
  MARKETS,
  ASSETS,
  STRATEGIES,
  DEFAULTS,
  LIMITS,
} from "@/lib/constants";

interface OnboardingData {
  markets: string[];
  assets: string[];
  strategy: string;
  accountSize: number;
  riskPerTrade: number;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    markets: [],
    assets: [],
    strategy: DEFAULTS.DEFAULT_STRATEGY,
    accountSize: DEFAULTS.ACCOUNT_SIZE,
    riskPerTrade: DEFAULTS.RISK_PER_TRADE,
  });

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  const toggleMarket = (marketId: string) => {
    setData((prev) => {
      const newMarkets = prev.markets.includes(marketId)
        ? prev.markets.filter((m) => m !== marketId)
        : [...prev.markets, marketId];

      // Remove assets from deselected markets
      const newAssets = prev.assets.filter((asset) => {
        for (const market of newMarkets) {
          const marketAssets = ASSETS[market as keyof typeof ASSETS];
          if (marketAssets?.some((a) => a.symbol === asset)) {
            return true;
          }
        }
        return false;
      });

      return { ...prev, markets: newMarkets, assets: newAssets };
    });
  };

  const toggleAsset = (symbol: string) => {
    setData((prev) => ({
      ...prev,
      assets: prev.assets.includes(symbol)
        ? prev.assets.filter((a) => a !== symbol)
        : [...prev.assets, symbol],
    }));
  };

  const getAvailableAssets = () => {
    const assets: { symbol: string; name: string; market: string }[] = [];
    for (const market of data.markets) {
      const marketAssets = ASSETS[market as keyof typeof ASSETS];
      if (marketAssets) {
        assets.push(...marketAssets.map((a) => ({ ...a, market })));
      }
    }
    return assets;
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.markets.length > 0;
      case 2:
        return data.assets.length > 0;
      case 3:
        return data.strategy !== "";
      case 4:
        return data.accountSize > 0 && data.riskPerTrade > 0;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to save onboarding data");
      }

      toast.success("Setup complete!");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  s < step
                    ? "bg-primary border-primary text-primary-foreground"
                    : s === step
                      ? "border-primary text-primary"
                      : "border-muted text-muted-foreground"
                }`}
              >
                {s < step ? <Check className="w-5 h-5" /> : s}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Markets</span>
            <span>Assets</span>
            <span>Strategy</span>
            <span>Risk</span>
          </div>
        </div>

        {/* Step 1: Select Markets */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Which markets do you trade?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {MARKETS.map((market) => {
                  const Icon = market.icon;
                  const isSelected = data.markets.includes(market.id);
                  return (
                    <button
                      key={market.id}
                      onClick={() => toggleMarket(market.id)}
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
        )}

        {/* Step 2: Select Assets */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Select assets to watch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.markets.map((market) => (
                <div key={market}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 capitalize">
                    {market}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {ASSETS[market as keyof typeof ASSETS]?.map((asset) => {
                      const isSelected = data.assets.includes(asset.symbol);
                      return (
                        <button
                          key={asset.symbol}
                          onClick={() => toggleAsset(asset.symbol)}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground"
                          }`}
                        >
                          <div>
                            <div className="font-mono text-sm font-medium">
                              {asset.symbol}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {asset.name}
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Select Strategy */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Choose your analysis strategy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {STRATEGIES.map((strategy) => {
                const Icon = strategy.icon;
                const isSelected = data.strategy === strategy.id;
                return (
                  <button
                    key={strategy.id}
                    onClick={() =>
                      setData((prev) => ({ ...prev, strategy: strategy.id }))
                    }
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
                    {isSelected && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Risk Settings */}
        {step === 4 && (
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
                  value={data.accountSize}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      accountSize: parseFloat(e.target.value) || 0,
                    }))
                  }
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
                  value={data.riskPerTrade}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      riskPerTrade: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder={String(DEFAULTS.RISK_PER_TRADE)}
                />
                <p className="text-xs text-muted-foreground">
                  Percentage of account to risk on each trade (recommended:
                  1-2%)
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Risk Summary</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    Max risk per trade: $
                    {((data.accountSize * data.riskPerTrade) / 100).toFixed(2)}
                  </p>
                  <p>Watching {data.assets.length} asset(s)</p>
                  <p className="capitalize">Strategy: {data.strategy.replace("_", " ")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {step < 4 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
            >
              {loading ? "Saving..." : "Complete Setup"}
              {!loading && <Check className="w-4 h-4 ml-2" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
