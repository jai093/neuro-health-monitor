import { createFileRoute } from "@tanstack/react-router";
import { PhoneCall, ShieldAlert } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-nav";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNeuro } from "@/lib/neuro-store";

export const Route = createFileRoute("/emergency")({
  head: () => ({
    meta: [
      { title: "Emergency & Disclaimer — NeuroShield AI" },
      {
        name: "description",
        content:
          "Stroke warning signs (FAST), when to seek urgent care, your emergency contact, and the NeuroShield AI medical disclaimer.",
      },
      { property: "og:title", content: "Emergency & Disclaimer — NeuroShield AI" },
      {
        property: "og:description",
        content: "FAST stroke warning signs, urgent-care guidance and the full medical disclaimer.",
      },
    ],
  }),
  component: EmergencyPage,
});

const FAST = [
  ["F — Face", "Sudden drooping or numbness on one side of the face. Ask the person to smile."],
  ["A — Arms", "Sudden weakness in one arm. Ask the person to raise both arms."],
  ["S — Speech", "Slurred, confused or absent speech. Ask them to repeat a simple sentence."],
  ["T — Time", "Call emergency services immediately. Note when symptoms started."],
] as const;

const urgent = [
  "Sudden severe headache with no known cause",
  "Sudden loss of vision in one or both eyes",
  "Sudden loss of balance, coordination or the ability to walk",
  "Sudden confusion or difficulty understanding others",
  "New seizure, fainting or unresponsiveness",
];

function EmergencyPage() {
  const { state } = useNeuro();
  const contact = state.profile.emergencyContact;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Safety"
        title="Emergency & Disclaimer"
        description="What to do if warning signs appear, and the limits of this application."
      />

      <Alert variant="destructive" className="mb-6">
        <ShieldAlert className="size-4" aria-hidden />
        <AlertTitle>If you suspect a stroke, call emergency services now</AlertTitle>
        <AlertDescription>
          Do not wait for symptoms to pass and do not use this app to decide whether to seek care. Stroke treatment is
          time-critical.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recognise a stroke — FAST</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {FAST.map(([k, v]) => (
              <div key={k} className="rounded-xl border border-border p-3">
                <p className="font-semibold">{k}</p>
                <p className="text-sm text-muted-foreground">{v}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
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
              {contact ? (
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
                Scores are produced by heuristic and statistical models from tasks completed on a consumer device. They
                can be affected by lighting, microphone quality, fatigue and practice effects.
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
