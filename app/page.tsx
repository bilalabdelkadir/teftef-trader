"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { TrendingUp, Zap, Bell, BarChart3 } from "lucide-react";

export default function Page() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && session) {
      router.push("/dashboard");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading...</p>
      </div>
    );
  }

  if (session) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <h1 className="text-lg font-bold">TefTef Trader</h1>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Sign up</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            AI-Powered Trading Analysis
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Automate 90% of your trading analysis with advanced AI that identifies
            high-probability trade setups across Forex, Crypto, and Stocks.
          </p>
          <div className="flex gap-4 justify-center mb-16">
            <Button size="lg" asChild>
              <Link href="/signup">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="p-6 rounded-xl border bg-card">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
              <p className="text-muted-foreground text-sm">
                Advanced AI analyzes price action, indicators, and market structure
                to identify high-probability setups.
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Bell className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Alerts</h3>
              <p className="text-muted-foreground text-sm">
                Get notified when high-confidence trade signals are detected
                on your watchlist assets.
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Multiple Strategies</h3>
              <p className="text-muted-foreground text-sm">
                Choose from ICT/SMC, Technical Analysis, Indicator-based,
                or let AI decide the best approach.
              </p>
            </div>
          </div>

          <div className="mt-16 p-8 rounded-xl border bg-card">
            <div className="flex items-center justify-center gap-3 mb-4">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <span className="text-3xl font-bold font-mono">EUR/USD BUY</span>
            </div>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto text-center">
              <div>
                <p className="text-xs text-muted-foreground">Entry</p>
                <p className="font-mono">$1.08520</p>
              </div>
              <div>
                <p className="text-xs text-red-500">Stop Loss</p>
                <p className="font-mono text-red-500">$1.08320</p>
              </div>
              <div>
                <p className="text-xs text-green-500">Take Profit</p>
                <p className="font-mono text-green-500">$1.08920</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              R:R 2.00 | 85% Confidence | ICT/SMC Strategy
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          TefTef Trader - Trade smarter with AI
        </div>
      </footer>
    </div>
  );
}
