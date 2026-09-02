import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCopy, Loader2, PhoneCall, Printer, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-nav";
import { ListSkeleton, LoadErrorCard, StatCardsSkeleton } from "@/components/page-skeletons";
import { RiskBadge } from "@/components/RiskBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { openPrintableReport, referralSummaryText } from "@/lib/export";
import { latestOf, overallStatus, RISK_META, useNeuro } from "@/lib/neuro-store";

export const Route = createFileRoute("/emergency")({
  head: () => ({
    meta: [
      { title: "Emergency & Disclaimer — NeuroShield AI" },
      {
        name: "description",
        content:
          "Stroke warning signs (FAST), when to seek urgent care, your emergency contact, a one-tap doctor referral summary and the NeuroShield AI medical disclaimer.",
      },
      { property: "og:title", content: "Emergency & Disclaimer — NeuroShield AI" },
      {
        property: "og:description",
        content: "FAST stroke warning signs, urgent-care guidance and a printable doctor referral summary.",
      },
    ],
  }),
  component: EmergencyPage,
});

const FAST = [
  ["F — Face", "Ask the person to smile. Look for sudden drooping or numbness on one side of the face."],
  ["A — Arms", "Ask them to raise both arms. Watch for one arm drifting down or sudden weakness."],
  ["S — Speech", "Ask them to repeat a simple sentence. Listen for slurred, confused or absent speech."],
  ["T — Time", "Call emergency services immediately and note the time symptoms started."],
] as const;

const urgent = [
  "Sudden severe headache with no known cause",
  "Sudden loss of vision in one or both eyes",
  "Sudden loss of balance, coordination or the ability to walk",
  "Sudden confusion or difficulty understanding others",
  "New seizure, fainting or unresponsiveness",
];

function EmergencyPage() {
  const { state, hydrated, loadError, retry } = useNeuro();
  const [copying, setCopying] = useState(false);
  const contact = state.profile.emergencyContact;
  const status = overallStatus(state.assessments);
  const stroke = latestOf(state.assessments, "stroke")?.stroke;
  const parkinson = latestOf(state.assessments, "parkinson")?.parkinson;
  const cognitive = latestOf(state.assessments, "cognitive")?.cognitive;
  const hasData = state.assessments.length > 0;

  const copySummary = async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(referralSummaryText(state));
      toast.success("Referral summary copied to your clipboard");
    } catch {
      toast.error("Couldn't copy the summary", {
        description: "Your browser blocked clipboard access. Use Print instead.",
        action: { label: "Retry", onClick: () => void copySummary() },
      });
    } finally {
      setCopying(false);
    }
  };

  const printSummary = () => {
    try {
      openPrintableReport(state);
    } catch {
      toast.error("Couldn't open the printable summary", {
        description: "Allow pop-ups for this site and try again.",
        action: { label: "Retry", onClick: printSummary },
      });
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Safety"
        title="Emergency & Disclaimer"
        description="What to do if warning signs appear, your current risk tiers, and the limits of this application."
        action={hydrated && hasData ? <RiskBadge level={status.level} /> : undefined}
      />

      <Alert variant="destructive" className="mb-6">
        <ShieldAlert className="size-4" aria-hidden />
        <AlertTitle>If you suspect a stroke, call emergency services now</AlertTitle>
        <AlertDescription>
          Do not wait for symptoms to pass and do not use this app to decide whether to seek care. Stroke treatment is
          time-critical.
        </AlertDescription>
      </Alert>

      {loadError ? <LoadErrorCard onRetry={retry} /> : null}

      {!hydrated ? (
        <StatCardsSkeleton count={3} />
      ) : (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Stroke risk",
              value: stroke ? `${Math.round(stroke.probability * 100)}%` : "Not assessed",
              level: stroke?.level,
            },
            {
              label: "Motor & voice",
              value: parkinson ? `${parkinson.overall}/100` : "Not assessed",
              level: parkinson?.level,
            },
            {
              label: "Cognitive",
              value: cognitive ? `${cognitive.overall}/100` : "Not assessed",
              level: cognitive?.level,
            },
          ].map((tier) => (
            <Card key={tier.label}>
              <CardContent className="space-y-2 pt-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{tier.label}</p>
                <p className="font-display text-3xl font-extrabold">{tier.value}</p>
                {tier.level ? (
                  <RiskBadge level={tier.level} />
                ) : (
                  <p className="text-sm text-muted-foreground">Complete the module to see your tier.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {hydrated && (stroke?.level === "elevated" || stroke?.level === "high") ? (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Your latest stroke risk tier is {RISK_META[stroke.level].label}</AlertTitle>
          <AlertDescription>
            Book a review with a healthcare professional and have your blood pressure and blood glucose checked. Learn
            the FAST signs below and share the referral summary at your appointment.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recognise a stroke — FAST, step by step</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {FAST.map(([k, v], i) => (
                <li key={k} className="flex gap-3 rounded-xl border border-border p-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block font-semibold">{k}</span>
                    <span className="text-sm text-muted-foreground">{v}</span>
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">One-tap doctor referral summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!hydrated ? (
                <ListSkeleton rows={2} />
              ) : hasData ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    A plain-language summary of your latest results across all three modules, ready to hand to a
                    clinician.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={printSummary}>
                      <Printer className="mr-2 size-4" aria-hidden /> Print / save as PDF
                    </Button>
                    <Button variant="secondary" onClick={() => void copySummary()} disabled={copying}>
                      {copying ? (
                        <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                      ) : (
                        <ClipboardCopy className="mr-2 size-4" aria-hidden />
                      )}
                      Copy summary
                    </Button>
                  </div>
                  <pre className="max-h-56 overflow-auto rounded-xl border border-border bg-muted/40 p-3 text-xs leading-relaxed whitespace-pre-wrap">
                    {referralSummaryText(state)}
                  </pre>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Complete at least one screening module to generate a referral summary.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Other symptoms needing urgent care</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {urgent.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PhoneCall className="size-4 text-primary" aria-hidden /> Your emergency contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!hydrated ? (
                <ListSkeleton rows={1} />
              ) : contact ? (
                <p className="font-display text-xl font-bold">{contact}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No emergency contact saved yet. Add one from your profile page.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Medical disclaimer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                NeuroShield AI is an educational and preliminary screening tool. It does not diagnose, treat, cure or
                prevent any disease, and its results are not a medical opinion.
              </p>
              <p>
                Scores are produced by statistical models from tasks completed on a consumer device. They can be
                affected by lighting, microphone quality, fatigue and practice effects.
              </p>
              <p>
                Always consult a qualified healthcare professional about symptoms or before changing any treatment. All
                data stays in this browser.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
