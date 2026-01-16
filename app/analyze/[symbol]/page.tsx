"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Target,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Zap,
  Brain,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

interface AnalysisResult {
  symbol: string;
  market: string;
  strategy: string;
  strategyId?: string;
  ragContext?: string;
  signal: {
    hasValidSetup: boolean;
    direction: "BUY" | "SELL";
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    confidence: number;
    reasoning: string;
    keyLevels: {
      support: number[];
      resistance: number[];
    };
    marketStructure: string;
  };
  riskReward: number;
  positionSize: number;
  timestamp: string;
}

interface PriceData {
  symbol: string;
  price: number;
  timestamp: number;
}

interface UserStrategy {
  id: string;
  name: string;
  description: string | null;
  baseStrategy: string | null;
  _count: {
    contents: number;
  };
}

import {
  BASE_STRATEGIES,
  getConfidenceColor,
  getConfidenceLabel,
} from "@/lib/constants";

export default function AnalyzePage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const resolvedParams = use(params);
  const symbol = decodeURIComponent(resolvedParams.symbol);
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [currentPrice, setCurrentPrice] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [showRagContext, setShowRagContext] = useState(false);
  const [customStrategies, setCustomStrategies] = useState<UserStrategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string>("ai_decide");
  const [selectedCustomStrategyId, setSelectedCustomStrategyId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) {
      loadPrice();
      loadCustomStrategies();
    }
  }, [session, symbol]);

  const loadPrice = async () => {
    try {
      const res = await fetch(`/api/prices?symbols=${symbol}`);
      const data = await res.json();
      if (data[symbol]) {
        setCurrentPrice(data[symbol]);
      }
    } catch (err) {
      console.error("Failed to load price:", err);
    }
  };

  const loadCustomStrategies = async () => {
    try {
      const res = await fetch("/api/strategies");
      if (res.ok) {
        const data = await res.json();
        setCustomStrategies(data.filter((s: UserStrategy) => s._count.contents > 0));
      }
    } catch (err) {
      console.error("Failed to load strategies:", err);
    }
  };

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const body: Record<string, string> = { symbol };

      if (selectedCustomStrategyId) {
        body.strategyId = selectedCustomStrategyId;
      } else {
        body.strategy = selectedStrategy;
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }

      const result = await res.json();
      setAnalysis(result);

      if (result.signal?.hasValidSetup) {
        toast.success(`${result.signal.direction} signal found with ${result.signal.confidence}% confidence`);
      } else {
        toast.info("No valid trade setup found");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  if (isPending) {
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
          <div>
            <h1 className="text-xl font-bold font-mono">{symbol}</h1>
            {currentPrice && (
              <p className="text-2xl font-mono">
                $
                {currentPrice.price.toFixed(
                  symbol.includes("BTC") || symbol.includes("ETH") ? 2 : 5
                )}
              </p>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
        {/* Analysis Button */}
        {!analysis && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Zap className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <h2 className="text-lg font-semibold">AI Trade Analysis</h2>
                  <p className="text-sm text-muted-foreground">
                    Run AI-powered analysis to find trade setups for {symbol}
                  </p>
                </div>

                {/* Strategy Selection */}
                <div className="space-y-3 text-left max-w-md mx-auto">
                  <p className="text-sm font-medium">Select Strategy</p>

                  {/* Base Strategies */}
                  <div className="grid grid-cols-2 gap-2">
                    {BASE_STRATEGIES.map((strategy) => (
                      <button
                        key={strategy.id}
                        onClick={() => {
                          setSelectedStrategy(strategy.id);
                          setSelectedCustomStrategyId(null);
                        }}
                        className={`p-2 text-sm rounded-lg border text-left transition-colors ${
                          selectedStrategy === strategy.id &&
                          !selectedCustomStrategyId
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
                            onClick={() => {
                              setSelectedCustomStrategyId(strategy.id);
                              setSelectedStrategy("");
                            }}
                            className={`w-full p-3 rounded-lg border text-left transition-colors ${
                              selectedCustomStrategyId === strategy.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-muted-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Brain className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium text-sm">
                                {strategy.name}
                              </span>
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

                <Button
                  onClick={runAnalysis}
                  disabled={loading}
                  className="w-full max-w-xs"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Run Analysis
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Result */}
        {analysis && (
          <>
            {/* Signal Card */}
            <Card
              className={`border-2 ${
                analysis.signal.hasValidSetup
                  ? analysis.signal.direction === "BUY"
                    ? "border-green-500/50"
                    : "border-red-500/50"
                  : "border-muted"
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {analysis.signal.hasValidSetup ? (
                      analysis.signal.direction === "BUY" ? (
                        <>
                          <TrendingUp className="w-5 h-5 text-green-500" />
                          <span className="text-green-500">BUY Signal</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-5 h-5 text-red-500" />
                          <span className="text-red-500">SELL Signal</span>
                        </>
                      )
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        <span>No Valid Setup</span>
                      </>
                    )}
                  </CardTitle>
                  <div
                    className={`text-sm font-medium ${getConfidenceColor(
                      analysis.signal.confidence
                    )}`}
                  >
                    {getConfidenceLabel(analysis.signal.confidence)} Confidence (
                    {analysis.signal.confidence}%)
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {analysis.signal.hasValidSetup && (
                  <>
                    {/* Price Levels */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 rounded-lg bg-muted">
                        <p className="text-xs text-muted-foreground mb-1">
                          Entry
                        </p>
                        <p className="font-mono font-medium">
                          ${analysis.signal.entryPrice.toFixed(5)}
                        </p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-red-500/10">
                        <p className="text-xs text-red-500 mb-1">Stop Loss</p>
                        <p className="font-mono font-medium text-red-500">
                          ${analysis.signal.stopLoss.toFixed(5)}
                        </p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-green-500/10">
                        <p className="text-xs text-green-500 mb-1">
                          Take Profit
                        </p>
                        <p className="font-mono font-medium text-green-500">
                          ${analysis.signal.takeProfit.toFixed(5)}
                        </p>
                      </div>
                    </div>

                    {/* Risk Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg border">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="w-4 h-4 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            Risk/Reward
                          </p>
                        </div>
                        <p className="font-mono text-lg font-medium">
                          1:{analysis.riskReward.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg border">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="w-4 h-4 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            Position Size
                          </p>
                        </div>
                        <p className="font-mono text-lg font-medium">
                          {analysis.positionSize.toLocaleString()} units
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Market Structure */}
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground mb-1">
                    Market Structure
                  </p>
                  <p className="font-medium capitalize">
                    {analysis.signal.marketStructure}
                  </p>
                </div>

                {/* Key Levels */}
                {analysis.signal.keyLevels && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Support Levels
                      </p>
                      <div className="space-y-1">
                        {analysis.signal.keyLevels.support.map((level, i) => (
                          <p key={i} className="font-mono text-sm text-green-500">
                            ${level.toFixed(5)}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Resistance Levels
                      </p>
                      <div className="space-y-1">
                        {analysis.signal.keyLevels.resistance.map((level, i) => (
                          <p key={i} className="font-mono text-sm text-red-500">
                            ${level.toFixed(5)}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Reasoning */}
            <Card>
              <CardHeader>
                <button
                  onClick={() => setShowReasoning(!showReasoning)}
                  className="flex items-center justify-between w-full"
                >
                  <CardTitle className="text-base">AI Reasoning</CardTitle>
                  {showReasoning ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </CardHeader>
              {showReasoning && (
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {analysis.signal.reasoning}
                  </p>
                </CardContent>
              )}
            </Card>

            {/* RAG Context (if available) */}
            {analysis.ragContext && (
              <Card>
                <CardHeader>
                  <button
                    onClick={() => setShowRagContext(!showRagContext)}
                    className="flex items-center justify-between w-full"
                  >
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Strategy Context Used
                    </CardTitle>
                    {showRagContext ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </CardHeader>
                {showRagContext && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {analysis.ragContext}
                    </p>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Run Again */}
            <Button
              variant="outline"
              onClick={runAnalysis}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Analysis Again
                </>
              )}
            </Button>

            {/* Strategy Info */}
            <p className="text-xs text-center text-muted-foreground">
              Analysis performed using{" "}
              {analysis.strategy === "custom"
                ? "custom strategy"
                : analysis.strategy.replace("_", " ")}{" "}
              strategy
              {analysis.ragContext && " with RAG context"}
            </p>
          </>
        )}
      </main>
    </div>
  );
}
