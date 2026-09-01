import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell, PageHeader } from "@/components/app-nav";
import { ChartPanelSkeleton, LoadErrorCard, StatCardsSkeleton } from "@/components/page-skeletons";
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProgressPage,
});

type Point = {
  date: string;
  Motor: number | null;
  Cognitive: number | null;
  "Stroke risk": number | null;
};

const SERIES: { key: keyof Omit<Point, "date">; color: string; unit: string; better: "up" | "down" }[] = [
  { key: "Motor", color: "var(--primary)", unit: "/100", better: "up" },
  { key: "Cognitive", color: "var(--accent-foreground)", unit: "/100", better: "up" },
  { key: "Stroke risk", color: "var(--destructive)", unit: "%", better: "down" },
];

function DeltaTooltip({
  active,
  label,
  data,
}: {
  active?: boolean;
  label?: string | number;
  data: Point[];
}) {
  if (!active || label == null) return null;
  const index = data.findIndex((d) => d.date === label);
  if (index < 0) return null;
  const point = data[index]!;
  const prev = index > 0 ? data[index - 1] : undefined;

  return (
    <div className="rounded-xl border border-border bg-card p-3 text-xs shadow-lg">
      <p className="mb-2 font-semibold text-foreground">{point.date}</p>
      <ul className="space-y-1.5">
        {SERIES.map((s) => {
          const value = point[s.key];
          if (value == null) return null;
          const before = prev?.[s.key] ?? null;
          const diff = before == null ? null : value - before;
          const improved = diff == null ? null : s.better === "up" ? diff > 0 : diff < 0;
          return (
            <li key={s.key} className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ background: s.color }} aria-hidden />
              <span className="text-muted-foreground">{s.key}:</span>
              <span className="font-semibold text-foreground">
                {value}
                {s.unit}
              </span>
              {diff == null ? (
                <span className="text-muted-foreground">· first reading</span>
              ) : diff === 0 ? (
                <span className="text-muted-foreground">· no change</span>
              ) : (
                <span className={improved ? "text-primary" : "text-destructive"}>
                  · {diff > 0 ? "+" : ""}
                  {diff}
                  {s.unit} vs previous ({improved ? "better" : "worse"})
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 max-w-56 leading-relaxed text-muted-foreground">
        Higher motor and cognitive scores are better; a lower stroke-risk percentage is better.
      </p>
    </div>
  );
}

function ProgressPage() {
  const { state, hydrated, loadError, retry } = useNeuro();

  const data: Point[] = state.assessments.map((a) => ({
    date: formatDate(a.date),
    Motor: a.parkinson?.overall ?? null,
    Cognitive: a.cognitive?.overall ?? null,
    "Stroke risk": a.stroke ? Math.round(a.stroke.probability * 100) : null,
  }));

  const status = overallStatus(state.assessments);

  const cards = (["parkinson", "cognitive", "stroke"] as const).map((key) => {
    const cur = latestOf(state.assessments, key);
    const prev = previousOf(state.assessments, key);
    const read = (a: typeof cur) =>
      key === "parkinson"
        ? a?.parkinson?.overall
        : key === "cognitive"
          ? a?.cognitive?.overall
          : a?.stroke
            ? Math.round(a.stroke.probability * 100)
            : undefined;
    const curScore = read(cur);
    const prevScore = read(prev);
    const trend = trendLabel(curScore, prevScore);
    const diff = curScore != null && prevScore != null ? curScore - prevScore : null;
    const better = diff == null ? null : key === "stroke" ? diff < 0 : diff > 0;
    return {
      key,
      title: key === "parkinson" ? "Motor & voice" : key === "cognitive" ? "Cognitive" : "Stroke risk",
      unit: key === "stroke" ? "%" : "/100",
      score: curScore,
      trend,
      diff,
      better,
      explain:
        diff == null
          ? curScore == null
            ? "Not assessed yet — complete this module to start tracking."
            : "First recorded session; next month gives you a comparison."
          : diff === 0
            ? "Identical to your previous session — a steady baseline."
            : `${diff > 0 ? "Up" : "Down"} ${Math.abs(diff)}${key === "stroke" ? " points" : ""} vs your previous session — ${
                better ? "an improvement" : "worth monitoring"
              }.`,
    };
  });

  return (
    <AppShell>
      <PageHeader
        eyebrow="Tracking"
        title="Monthly Progress"
        description="Your screening scores over time, refreshed live as you complete assessments. Higher scores mean better performance; stroke risk is shown as a percentage."
        action={hydrated ? <RiskBadge level={status.level} /> : null}
      />

      {loadError ? (
        <LoadErrorCard onRetry={retry} />
      ) : !hydrated ? (
        <>
          <StatCardsSkeleton count={4} />
          <ChartPanelSkeleton />
        </>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((c) => {
              const Icon = c.diff == null || c.diff === 0 ? ArrowRight : c.better ? ArrowUpRight : ArrowDownRight;
              return (
                <Card key={c.key}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">{c.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-display text-3xl font-extrabold">
                      {c.score ?? "—"}
                      {c.score != null ? <span className="text-base font-semibold text-muted-foreground">{c.unit}</span> : null}
                    </p>
                    <p
                      className={`mt-1 flex items-center gap-1 text-xs font-medium ${
                        c.diff == null || c.diff === 0
                          ? "text-muted-foreground"
                          : c.better
                            ? "text-primary"
                            : "text-destructive"
                      }`}
                    >
                      <Icon className="size-3.5" aria-hidden />
                      {c.trend.text}
                      {c.diff != null && c.diff !== 0 ? ` (${c.diff > 0 ? "+" : ""}${c.diff})` : ""}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{c.explain}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_18rem]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Score history</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Hover any point to see the month-over-month change explained in plain language.
                </p>
              </CardHeader>
              <CardContent className="h-80">
                {data.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ left: -18, right: 12, top: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                      <Tooltip content={<DeltaTooltip data={data} />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      {SERIES.map((s) => (
                        <Line
                          key={s.key}
                          type="monotone"
                          dataKey={s.key}
                          stroke={s.color}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Complete an assessment to start your trend chart — it appears here instantly, no reload needed.
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
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
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Sessions recorded</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-display text-2xl font-extrabold">{state.assessments.length}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {status.text}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
