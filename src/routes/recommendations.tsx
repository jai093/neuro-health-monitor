import { createFileRoute } from "@tanstack/react-router";
import { Lightbulb } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-nav";
import { RiskBadge } from "@/components/RiskBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildRecommendations, overallStatus, useNeuro } from "@/lib/neuro-store";

export const Route = createFileRoute("/recommendations")({
  head: () => ({
    meta: [
      { title: "Recommendations — NeuroShield AI" },
      {
        name: "description",
        content:
          "Personalised lifestyle, exercise and follow-up suggestions generated from your latest NeuroShield AI screening results.",
      },
      { property: "og:title", content: "Recommendations — NeuroShield AI" },
      {
        property: "og:description",
        content: "Rule-based guidance derived from your screening results — never a prescription.",
      },
    ],
  }),
  component: RecommendationsPage,
});

function RecommendationsPage() {
  const { state } = useNeuro();
  const recs = buildRecommendations(state.assessments);
  const status = overallStatus(state.assessments);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Guidance"
        title="Recommendations"
        description="Generated from your most recent results. These suggestions never include medication advice."
        action={<RiskBadge level={status.level} />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {recs.map((r) => (
          <Card key={r.title}>
            <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
              <CardTitle className="flex items-start gap-2 text-base">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {r.title}
              </CardTitle>
              <RiskBadge level={r.tone} />
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{r.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6 border-dashed">
        <CardContent className="py-5 text-sm leading-relaxed text-muted-foreground">
          These recommendations are educational. Always consult a qualified healthcare professional before making
          changes to your care, medication or treatment.
        </CardContent>
      </Card>
    </AppShell>
  );
}
