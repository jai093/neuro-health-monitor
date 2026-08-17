import { createFileRoute } from "@tanstack/react-router";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell, PageHeader } from "@/components/app-nav";
import { RiskBadge } from "@/components/RiskBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatDate,
  latestOf,
  nextAssessmentDate,
  overallStatus,
  previousOf,
  trendLabel,
  useNeuro,
} from "@/lib/neuro-store";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Monthly Progress — NeuroShield AI" },
      {
        name: "description",
        content:
          "Track how your motor, cognitive and stroke-risk screening scores change month over month in NeuroShield AI.",
      },
      { property: "og:title", content: "Monthly Progress — NeuroShield AI" },
      {
        property: "og:description",
        content: "Longitudinal charts of your neurological screening scores over time.",
      },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const { state, hydrated } = useNeuro();
  const data = state.assessments.map((a) => ({
    date: formatDate(a.date),
    Motor: a.parkinson?.overall ?? null,
    Cognitive: a.cognitive?.overall ?? null,
    "Stroke risk": a.stroke ? Math.round(a.stroke.probability * 100) : null,
  }));

  const status = overallStatus(state.assessments);
  const cards = (["parkinson", "cognitive"] as const).map((key) => {
    const cur = latestOf(state.assessments, key);
    const prev = previousOf(state.assessments, key);
    const curScore = key === "parkinson" ? cur?.parkinson?.overall : cur?.cognitive?.overall;
    const prevScore = key === "parkinson" ? prev?.parkinson?.overall : prev?.cognitive?.overall;
    return {
      key,
      title: key === "parkinson" ? "Motor & voice" : "Cognitive",
      score: curScore,
      trend: trendLabel(curScore, prevScore),
    };
  });

  return (
    <AppShell>
      <PageHeader
        eyebrow="Tracking"
        title="Monthly Progress"
        description="Your screening scores over time. Higher scores mean better performance; stroke risk is shown as a percentage."
        action={<RiskBadge level={status.level} />}
      />

      <div className="grid gap-6 sm:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{c.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-extrabold">{c.score ?? "—"}</p>
              <p className="mt-1 text-xs text-muted-foreground">{c.trend.text}</p>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Next assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-extrabold">
              {formatDate(nextAssessmentDate(state.assessments))}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Repeat every 30 days</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Score history</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {hydrated && data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="Motor" stroke="var(--primary)" strokeWidth={2} connectNulls />
                <Line type="monotone" dataKey="Cognitive" stroke="var(--accent-foreground)" strokeWidth={2} connectNulls />
                <Line type="monotone" dataKey="Stroke risk" stroke="var(--destructive)" strokeWidth={2} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">Complete an assessment to start your trend chart.</p>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
