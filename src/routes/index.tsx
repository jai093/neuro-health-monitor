import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowRight, Brain, CalendarClock, Heart, Trophy } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-nav";
import { RiskBadge, ScoreRing } from "@/components/RiskBadge";
import { Button } from "@/components/ui/button";
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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NeuroShield AI — Neurological Screening Dashboard" },
      {
        name: "description",
        content:
          "Preliminary screening and monthly monitoring for Parkinson's, cognitive health and stroke risk. Educational screening, not a medical diagnosis.",
      },
      { property: "og:title", content: "NeuroShield AI — Neurological Screening Dashboard" },
      {
        property: "og:description",
        content: "Screen early, monitor continuously and understand your neurological progress over time.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { state, hydrated } = useNeuro();
  const { assessments, badges } = state;
  const status = overallStatus(assessments);

  const p = latestOf(assessments, "parkinson")?.parkinson;
  const c = latestOf(assessments, "cognitive")?.cognitive;
  const s = latestOf(assessments, "stroke")?.stroke;
  const cPrev = previousOf(assessments, "cognitive")?.cognitive;
  const pPrev = previousOf(assessments, "parkinson")?.parkinson;

  const modules = [
    {
      to: "/parkinson" as const,
      icon: Activity,
      title: "Parkinson Screening",
      body: "Camera motor tasks, voice analysis and motor games.",
      score: p?.overall,
      level: p?.level,
      trend: trendLabel(p?.overall, pPrev?.overall),
    },
    {
      to: "/cognitive" as const,
      icon: Brain,
      title: "Cognitive Assessment",
      body: "Memory, attention, recall, reaction and pattern tests.",
      score: c?.overall,
      level: c?.level,
      trend: trendLabel(c?.overall, cPrev?.overall),
    },
    {
      to: "/stroke" as const,
      icon: Heart,
      title: "Stroke Risk",
      body: "Health-factor based risk estimation and FAST guidance.",
      score: s ? Math.round((1 - s.probability) * 100) : undefined,
      level: s?.level,
      trend: { text: s ? `${Math.round(s.probability * 100)}% estimated risk` : "No comparison yet", delta: 0 },
    },
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Screen Early · Monitor Continuously"
        title={`Welcome${state.profile.fullName ? `, ${state.profile.fullName.split(" ")[0]}` : ""}`}
        description="Your longitudinal neurological screening profile. Results are preliminary indicators, never a diagnosis."
        action={<RiskBadge level={status.level} label={status.text} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Overall screening status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <ScoreRing
              value={
                hydrated && (p || c)
                  ? Math.round(((p?.overall ?? c?.overall ?? 0) + (c?.overall ?? p?.overall ?? 0)) / 2)
                  : 0
              }
              caption="Composite"
            />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Based on {assessments.length} recorded session{assessments.length === 1 ? "" : "s"}.
              </p>
              <p>
                Next scheduled assessment: <strong className="text-foreground">{formatDate(nextAssessmentDate(assessments))}</strong>
              </p>
              <Button asChild size="sm">
                <Link to="/parkinson">
                  Start assessment <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="size-4 text-primary" aria-hidden /> Monthly monitoring
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>Assessments build a personal baseline so changes over time become visible.</p>
            <Link to="/progress" className="inline-flex items-center gap-1 font-medium text-primary">
              View progress <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="size-4 text-primary" aria-hidden /> Badges
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {badges.length === 0 ? (
              <p className="text-sm text-muted-foreground">Complete an assessment to earn your first badge.</p>
            ) : (
              badges.map((b) => (
                <span key={b} className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                  {b.replace(/-/g, " ")}
                </span>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {modules.map(({ to, icon: Icon, title, body, score, level, trend }) => (
          <Card key={to}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2 text-base">
                <span className="flex items-center gap-2">
                  <Icon className="size-4 text-primary" aria-hidden /> {title}
                </span>
                {level ? <RiskBadge level={level} label={undefined} /> : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{body}</p>
              <p className="text-sm">
                {score != null ? (
                  <>
                    <strong className="text-2xl font-bold">{score}</strong>
                    <span className="text-muted-foreground">/100 · {trend.text}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Not assessed yet</span>
                )}
              </p>
              <Button asChild variant="secondary" size="sm">
                <Link to={to}>Open module</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
