"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  Settings as SettingsIcon,
  Bell,
  DollarSign,
  BarChart3,
} from "lucide-react";
import {
  STRATEGIES,
  AVAILABLE_ASSETS,
  DEFAULTS,
  LIMITS,
} from "@/lib/constants";

interface UserSettings {
  accountSize: number;
  riskPerTrade: number;
  defaultStrategy: string;
  emailAlerts: boolean;
}

interface WatchlistItem {
  id: string;
  symbol: string;
  market: string;
}

// Map strategies to settings format
const STRATEGY_OPTIONS = STRATEGIES.map(s => ({ id: s.id, name: s.name }));

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [settings, setSettings] = useState<UserSettings>({
    accountSize: DEFAULTS.ACCOUNT_SIZE,
    riskPerTrade: DEFAULTS.RISK_PER_TRADE,
    defaultStrategy: DEFAULTS.DEFAULT_STRATEGY,
    emailAlerts: true,
  });
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<string>("forex");

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsRes, watchlistRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/watchlist"),
      ]);

      const settingsData = await settingsRes.json();
      const watchlistData = await watchlistRes.json();

      setSettings({
        accountSize: settingsData.accountSize || DEFAULTS.ACCOUNT_SIZE,
        riskPerTrade: settingsData.riskPerTrade || DEFAULTS.RISK_PER_TRADE,
        defaultStrategy: settingsData.defaultStrategy || DEFAULTS.DEFAULT_STRATEGY,
        emailAlerts: settingsData.emailAlerts ?? true,
      });
      setWatchlist(watchlistData);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save settings");
      }

      toast.success("Settings saved successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAddAsset = async (symbol: string) => {
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });

      if (res.ok) {
        const newItem = await res.json();
        setWatchlist((prev) => [...prev, newItem]);
        setShowAddAsset(false);
        toast.success(`${symbol} added to watchlist`);
      } else {
        throw new Error("Failed to add asset");
      }
    } catch (err) {
      toast.error("Failed to add asset to watchlist");
    }
  };

  const handleRemoveAsset = async (id: string) => {
    try {
      await fetch(`/api/watchlist/${id}`, { method: "DELETE" });
      setWatchlist((prev) => prev.filter((w) => w.id !== id));
      toast.success("Asset removed from watchlist");
    } catch (err) {
      toast.error("Failed to remove asset from watchlist");
    }
  };

  const getAvailableAssets = () => {
    const assets = AVAILABLE_ASSETS[selectedMarket as keyof typeof AVAILABLE_ASSETS] || [];
    const watchedSymbols = watchlist.map((w) => w.symbol);
    return assets.filter((a) => !watchedSymbols.includes(a));
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
        {/* Risk Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Risk Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountSize">Account Size ($)</Label>
              <Input
                id="accountSize"
                type="number"
                min={LIMITS.MIN_ACCOUNT_SIZE}
                step={100}
                value={settings.accountSize}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    accountSize: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="riskPerTrade">Risk Per Trade (%)</Label>
              <Input
                id="riskPerTrade"
                type="number"
                min={LIMITS.MIN_RISK_PER_TRADE}
                max={LIMITS.MAX_RISK_PER_TRADE}
                step={0.1}
                value={settings.riskPerTrade}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    riskPerTrade: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>

            <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
              Max risk per trade: $
              {((settings.accountSize * settings.riskPerTrade) / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        {/* Strategy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Analysis Strategy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {STRATEGY_OPTIONS.map((strategy) => (
                <button
                  key={strategy.id}
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      defaultStrategy: strategy.id,
                    }))
                  }
                  className={`p-3 rounded-lg border text-sm text-left transition-colors ${
                    settings.defaultStrategy === strategy.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  {strategy.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <button
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  emailAlerts: !prev.emailAlerts,
                }))
              }
              className="flex items-center justify-between w-full p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div>
                <p className="font-medium">Email Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Receive email notifications for new trade signals
                </p>
              </div>
              <div
                className={`w-10 h-6 rounded-full transition-colors ${
                  settings.emailAlerts ? "bg-primary" : "bg-muted"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${
                    settings.emailAlerts
                      ? "translate-x-4.5 ml-0.5"
                      : "translate-x-0.5"
                  }`}
                />
              </div>
            </button>
          </CardContent>
        </Card>

        {/* Watchlist */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Watchlist</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddAsset(!showAddAsset)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Asset
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {showAddAsset && (
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex gap-2">
                  {Object.keys(AVAILABLE_ASSETS).map((market) => (
                    <button
                      key={market}
                      onClick={() => setSelectedMarket(market)}
                      className={`px-3 py-1.5 text-sm rounded-lg capitalize ${
                        selectedMarket === market
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {market}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {getAvailableAssets().map((symbol) => (
                    <button
                      key={symbol}
                      onClick={() => handleAddAsset(symbol)}
                      className="p-2 text-sm font-mono border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {symbol}
                    </button>
                  ))}
                  {getAvailableAssets().length === 0 && (
                    <p className="col-span-3 text-sm text-muted-foreground text-center py-2">
                      All assets from this market are already in your watchlist
                    </p>
                  )}
                </div>
              </div>
            )}

            {watchlist.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No assets in your watchlist
              </p>
            ) : (
              <div className="space-y-2">
                {watchlist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-mono font-medium">{item.symbol}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {item.market}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAsset(item.id)}
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSaveSettings}
          disabled={saving}
          className="w-full"
        >
          {saving ? (
            "Saving..."
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </main>
    </div>
  );
}
