import { createFileRoute } from "@tanstack/react-router";
import { Download, Trash2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-nav";
import { RiskBadge } from "@/components/RiskBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, useNeuro, type RiskLevel } from "@/lib/neuro-store";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Assessment History — NeuroShield AI" },
      {
        name: "description",
        content:
          "Review every completed NeuroShield AI screening session, export your records, or delete individual assessments.",
      },
      { property: "og:title", content: "Assessment History — NeuroShield AI" },
      {
        property: "og:description",
        content: "All of your past neurological screening sessions in one place.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { state, hydrated, deleteAssessment } = useNeuro();
  const list = [...state.assessments].reverse();

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "neuroshield-assessments.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Records"
        title="Assessment History"
        description="Every screening session stored on this device. Nothing is uploaded to a server."
        action={
          <Button variant="outline" onClick={exportJson} disabled={!hydrated}>
            <Download className="size-4" aria-hidden /> Export data
          </Button>
        }
      />

      {hydrated && list.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No assessments recorded yet. Start with a screening module from the navigation.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {list.map((a) => (
            <Card key={a.id}>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-3">
                <div>
                  <CardTitle className="text-base">{a.label}</CardTitle>
                  <p className="text-xs text-muted-foreground">{formatDate(a.date)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteAssessment(a.id)}
                  aria-label={`Delete assessment from ${formatDate(a.date)}`}
                >
                  <Trash2 className="size-4" aria-hidden /> Delete
                </Button>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <Row title="Motor & voice" score={a.parkinson ? `${a.parkinson.overall}/100` : null} level={a.parkinson?.level} />
                <Row title="Cognitive" score={a.cognitive ? `${a.cognitive.overall}/100` : null} level={a.cognitive?.level} />
                <Row
                  title="Stroke risk"
                  score={a.stroke ? `${Math.round(a.stroke.probability * 100)}%` : null}
                  level={a.stroke?.level}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function Row({
  title,
  score,
  level,
}: {
  title: string;
  score: string | null;
  level: RiskLevel | undefined;
}) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-1 font-display text-xl font-bold">{score ?? "Not taken"}</p>
      {level ? (
        <div className="mt-2">
          <RiskBadge level={level} />
        </div>
      ) : null}
    </div>
  );
}
