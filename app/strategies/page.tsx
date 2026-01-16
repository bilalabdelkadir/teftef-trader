"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Brain,
  Trash2,
  Save,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface UserStrategy {
  id: string;
  name: string;
  description: string | null;
  baseStrategy: string | null;
  customPrompt: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    contents: number;
    signals: number;
  };
  contents: Array<{
    content: {
      id: string;
      name: string;
      status: string;
      content: string;
    };
  }>;
}

import { BASE_STRATEGIES } from "@/lib/constants";

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3 h-3 text-yellow-500" />,
  processing: <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />,
  ready: <CheckCircle className="w-3 h-3 text-green-500" />,
  error: <AlertCircle className="w-3 h-3 text-red-500" />,
};

export default function StrategiesPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [strategies, setStrategies] = useState<UserStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    baseStrategy: "ai_decide",
    customPrompt: "",
    strategyText: "",
  });

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) {
      loadStrategies();
    }
  }, [session]);

  const loadStrategies = async () => {
    try {
      const res = await fetch("/api/strategies");
      if (res.ok) {
        const data = await res.json();
        setStrategies(data);
      }
    } catch (error) {
      toast.error("Failed to load strategies");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name) return;

    setSaving(true);
    try {
      // First create the content if text is provided
      let contentId: string | null = null;
      if (formData.strategyText.trim()) {
        const contentRes = await fetch("/api/contents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${formData.name} - Rules`,
            content: formData.strategyText,
            description: `Strategy rules for ${formData.name}`,
          }),
        });
        if (contentRes.ok) {
          const content = await contentRes.json();
          contentId = content.id;
        }
      }

      // Create the strategy
      const res = await fetch("/api/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          baseStrategy: formData.baseStrategy,
          customPrompt: formData.customPrompt,
          contentIds: contentId ? [contentId] : [],
        }),
      });

      if (res.ok) {
        await loadStrategies();
        setFormData({
          name: "",
          description: "",
          baseStrategy: "ai_decide",
          customPrompt: "",
          strategyText: "",
        });
        setShowForm(false);
        toast.success("Strategy created successfully!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create strategy");
      }
    } catch (error) {
      toast.error("Failed to create strategy");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this strategy?")) return;

    try {
      const res = await fetch(`/api/strategies/${id}`, { method: "DELETE" });
      if (res.ok) {
        setStrategies((prev) => prev.filter((s) => s.id !== id));
        toast.success("Strategy deleted");
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      toast.error("Failed to delete strategy");
    }
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              <h1 className="text-xl font-bold">My Strategies</h1>
            </div>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {showForm ? "Cancel" : "New Strategy"}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-3xl">
        {/* Info */}
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">
              Create custom strategies by choosing a base approach and pasting your trading rules.
              The AI will use your rules when analyzing markets.
            </p>
          </CardContent>
        </Card>

        {/* Create Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create Strategy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Strategy Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., My ICT Rules"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Brief description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Base Approach</Label>
                <div className="grid grid-cols-2 gap-2">
                  {BASE_STRATEGIES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setFormData((prev) => ({ ...prev, baseStrategy: s.id }))}
                      className={`p-2 text-left text-sm rounded-lg border transition-colors ${
                        formData.baseStrategy === s.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="strategyText">Your Trading Rules (paste here)</Label>
                <Textarea
                  id="strategyText"
                  placeholder="Paste your trading strategy, entry/exit rules, risk management guidelines here...

Example:
- Only enter on CHoCH with order block confirmation
- Stop loss below/above the order block
- Take profit at next liquidity pool
- Risk max 1% per trade
- Only trade during London/NY session"
                  className="min-h-[150px] font-mono text-sm"
                  value={formData.strategyText}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, strategyText: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {formData.strategyText.length} characters
                  {formData.strategyText.length > 0 && " - will be processed for AI context"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customPrompt">Additional Instructions (optional)</Label>
                <Textarea
                  id="customPrompt"
                  placeholder="Extra instructions for the AI (e.g., 'Focus on higher timeframes', 'Be more conservative')"
                  className="min-h-[60px]"
                  value={formData.customPrompt}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, customPrompt: e.target.value }))
                  }
                />
              </div>

              <Button onClick={handleCreate} disabled={saving || !formData.name} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Strategy
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Strategies List */}
        {strategies.length === 0 && !showForm ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No strategies yet</p>
              <p className="text-sm mb-4">Create your first custom strategy</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Strategy
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {strategies.map((strategy) => (
              <Card key={strategy.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{strategy.name}</h3>
                        {strategy.baseStrategy && (
                          <Badge variant="outline" className="text-xs">
                            {BASE_STRATEGIES.find((s) => s.id === strategy.baseStrategy)?.name}
                          </Badge>
                        )}
                        {!strategy.isActive && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      {strategy.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {strategy.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {strategy.contents.length > 0 && (
                          <span className="flex items-center gap-1">
                            {STATUS_ICONS[strategy.contents[0]?.content?.status || "pending"]}
                            {strategy.contents[0]?.content?.status === "ready"
                              ? "Ready"
                              : strategy.contents[0]?.content?.status}
                          </span>
                        )}
                        <span>{strategy._count.signals} signals</span>
                      </div>

                      {/* Expandable content preview */}
                      {strategy.contents.length > 0 && (
                        <button
                          onClick={() =>
                            setExpandedId(expandedId === strategy.id ? null : strategy.id)
                          }
                          className="flex items-center gap-1 text-xs text-muted-foreground mt-2 hover:text-foreground"
                        >
                          {expandedId === strategy.id ? (
                            <>
                              <ChevronUp className="w-3 h-3" /> Hide rules
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3" /> Show rules
                            </>
                          )}
                        </button>
                      )}
                      {expandedId === strategy.id && strategy.contents[0]?.content && (
                        <div className="mt-2 p-3 bg-muted rounded-lg text-xs font-mono whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                          {strategy.contents[0].content.content}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(strategy.id)}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
