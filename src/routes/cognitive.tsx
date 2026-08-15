import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app-nav";
import { RiskBadge, ScoreRing } from "@/components/RiskBadge";
import {
  AttentionTest,
  MemorySpanTest,
  PatternTest,
  ReactionTest,
  RecallTest,
  type TestScore,
} from "@/components/cognitive-tests";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { levelFromScore, useNeuro } from "@/lib/neuro-store";

export const Route = createFileRoute("/cognitive")({
  head: () => ({
    meta: [
      { title: "Cognitive Assessment — NeuroShield AI" },
      {
        name: "description",
        content:
          "Memory span, attention, delayed recall, reaction time and pattern recognition tests for preliminary cognitive screening.",
      },
      { property: "og:title", content: "Cognitive Assessment — NeuroShield AI" },
      {
        property: "og:description",
        content: "Five browser-based cognitive tasks that build a longitudinal cognitive performance profile.",
      },
    ],
  }),
  component: CognitivePage,
});

function CognitivePage() {
  const { recordModule } = useNeuro();
  const [scores, setScores] = useState<Record<string, TestScore>>({});
  const add = (s: TestScore) => setScores((prev) => ({ ...prev, [s.key]: s }));

  const get = (k: string) => scores[k]?.score ?? null;
  const values = Object.values(scores).map((s) => s.score);
  const overall = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
  const consistency =
    values.length > 1
      ? Math.max(
          0,
          Math.round(
            100 -
              Math.sqrt(
                values.reduce((a, v) => a + (v - values.reduce((x, y) => x + y, 0) / values.length) ** 2, 0) /
                  values.length,
              ),
          ),
        )
      : 100;

  const save = () => {
    if (overall == null) return;
    recordModule(
      "cognitive",
      {
        memory: get("memory") ?? overall,
        attention: get("attention") ?? overall,
        recall: get("recall") ?? overall,
        reaction: get("reaction") ?? overall,
        pattern: get("pattern") ?? overall,
        consistency,
        overall,
        level: levelFromScore(overall),
        mri: null,
      },
      "cognitive-challenge",
    );
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Module 2"
        title="Cognitive Assessment"
        description="Five short tasks covering memory, attention, delayed recall, reaction speed and pattern recognition."
        action={overall != null ? <RiskBadge level={levelFromScore(overall)} /> : undefined}
      />

      <Alert className="mb-6">
        <AlertTitle>Not a dementia diagnosis</AlertTitle>
        <AlertDescription>
          Task performance is affected by tiredness, distraction and practice. Use these results to track your own
          trend over time, not to diagnose Alzheimer's disease or cognitive impairment.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        <MemorySpanTest onDone={add} />
        <AttentionTest onDone={add} />
        <RecallTest onDone={add} />
        <ReactionTest onDone={add} />
        <PatternTest onDone={add} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Assessment summary</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-8">
          <ScoreRing value={overall ?? 0} caption="Overall" />
          <div className="min-w-64 space-y-2 text-sm text-muted-foreground">
            {Object.values(scores).map((s) => (
              <p key={s.key}>
                <strong className="text-foreground">{s.label}:</strong> {s.score}/100 — {s.detail}
              </p>
            ))}
            <p>Consistency across tasks: {consistency}/100</p>
            <button
              type="button"
              onClick={save}
              disabled={overall == null}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              Save to my profile
            </button>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
