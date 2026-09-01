import { createFileRoute } from "@tanstack/react-router";
import { FileSpreadsheet, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-nav";
import { ListSkeleton, LoadErrorCard } from "@/components/page-skeletons";
import { RiskBadge } from "@/components/RiskBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { assessmentsToCsv, downloadTextFile, openPrintableReport } from "@/lib/export";
import { formatDate, useNeuro, type RiskLevel } from "@/lib/neuro-store";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Assessment History — NeuroShield AI" },
      {
        name: "description",
        content:
          "Review every completed NeuroShield AI screening session, export your records as CSV or PDF, or delete individual assessments.",
      },
      { property: "og:title", content: "Assessment History — NeuroShield AI" },
      {
        property: "og:description",
        content: "All of your past neurological screening sessions, exportable for your clinician.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { state, hydrated, loadError, retry, deleteAssessment } = useNeuro();
  const list = [...state.assessments].reverse();
  const empty = state.assessments.length === 0;

  const exportCsv = () => {
    if (empty) {
      toast.error("Nothing to export yet", { description: "Complete a screening session first." });
      return;
    }
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      downloadTextFile(`neuroshield-assessments-${stamp}.csv`, assessmentsToCsv(state), "text/csv;charset=utf-8");
      toast.success("CSV downloaded", {
        description: `${state.assessments.length} session${state.assessments.length === 1 ? "" : "s"} exported for your clinician.`,
      });
    } catch {
      toast.error("CSV export failed", {
        description: "Your browser blocked the download.",
        action: { label: "Try again", onClick: exportCsv },
      });
    }
  };

  const exportPdf = () => {
    if (empty) {
      toast.error("Nothing to export yet", { description: "Complete a screening session first." });
      return;
    }
    try {
      openPrintableReport(state);
      toast.success("Clinician report ready", {
        description: "Choose “Save as PDF” in the print dialog that just opened.",
      });
    } catch (err) {
      toast.error("PDF export failed", {
        description:
          err instanceof Error && err.message === "popup-blocked"
            ? "Allow pop-ups for this site, then try again."
            : "We couldn't open the printable report.",
        action: { label: "Try again", onClick: exportPdf },
      });
    }
  };

  const remove = (id: string, date: string) => {
    try {
      deleteAssessment(id);
      toast.success("Assessment deleted", { description: `Session from ${formatDate(date)} removed from this device.` });
    } catch {
      toast.error("Couldn't delete that assessment", {
        action: { label: "Retry", onClick: () => remove(id, date) },
      });
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Records"
        title="Assessment History"
        description="Every screening session stored on this device, updating live as you finish modules. Nothing is uploaded to a server."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportCsv} disabled={!hydrated || loadError}>
              <FileSpreadsheet className="size-4" aria-hidden /> Export CSV
            </Button>
            <Button onClick={exportPdf} disabled={!hydrated || loadError}>
              <FileText className="size-4" aria-hidden /> Export PDF
            </Button>
          </div>
        }
      />

      {loadError ? (
        <LoadErrorCard onRetry={retry} />
      ) : !hydrated ? (
        <ListSkeleton rows={3} />
      ) : empty ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No assessments recorded yet. Start with a screening module from the navigation — results appear here
            automatically.
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
                  onClick={() => remove(a.id, a.date)}
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
