import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-nav";
import { RiskBadge } from "@/components/RiskBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { inferStroke } from "@/lib/inference.functions";
import { strokeLevel, useNeuro } from "@/lib/neuro-store";

export const Route = createFileRoute("/stroke")({
  head: () => ({
    meta: [
      { title: "Stroke Risk Screening — NeuroShield AI" },
      {
        name: "description",
        content:
          "Estimate stroke risk from modifiable and non-modifiable health factors, with FAST warning-sign guidance.",
      },
      { property: "og:title", content: "Stroke Risk Screening — NeuroShield AI" },
      {
        property: "og:description",
        content: "Health-factor based stroke risk estimation with clear emergency guidance.",
      },
    ],
  }),
  component: StrokePage,
});

const FAST = [
  ["F — Face", "Sudden drooping on one side of the face."],
  ["A — Arms", "Sudden weakness or numbness in one arm."],
  ["S — Speech", "Slurred, confused or absent speech."],
  ["T — Time", "Call emergency services immediately — time is critical."],
] as const;

function StrokePage() {
  const { recordModule } = useNeuro();
  const runInference = useServerFn(inferStroke);
  const [age, setAge] = useState("55");
  const [bmi, setBmi] = useState("26");
  const [glucose, setGlucose] = useState("105");
  const [hypertension, setHypertension] = useState(false);
  const [heart, setHeart] = useState(false);
  const [smoker, setSmoker] = useState(false);
  const [result, setResult] = useState<{ probability: number; factors: string[] } | null>(null);

  const [busy, setBusy] = useState(false);

  const compute = async () => {
    setBusy(true);
    try {
      const scored = await runInference({
        data: {
          age: Number(age) || 0,
          bmi: Number(bmi) || 0,
          glucose: Number(glucose) || 0,
          hypertension,
          heartDisease: heart,
          smoker,
        },
      });
      setResult(scored);
      recordModule("stroke", {
        probability: scored.probability,
        level: strokeLevel(scored.probability),
        factors: scored.factors,
      });
      toast.success("Stroke risk estimate saved", {
        description: `${Math.round(scored.probability * 100)}% risk indicator — dashboard and history updated.`,
      });
    } catch (error) {
      toast.error("Couldn't estimate stroke risk", {
        description:
          error instanceof Error ? error.message : "Check that age, BMI and glucose are valid numbers.",
        action: { label: "Retry", onClick: () => void compute() },
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Module 3"
        title="Stroke Risk Screening"
        description="A risk-factor based estimate. It cannot predict whether or when a stroke will occur."
        action={result ? <RiskBadge level={strokeLevel(result.probability)} /> : undefined}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Health factors</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="age">Age</Label>
              <Input id="age" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bmi">Body mass index</Label>
              <Input id="bmi" inputMode="decimal" value={bmi} onChange={(e) => setBmi(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="glucose">Average blood glucose (mg/dL)</Label>
              <Input id="glucose" inputMode="numeric" value={glucose} onChange={(e) => setGlucose(e.target.value)} />
            </div>
            {[
              { id: "htn", label: "Diagnosed hypertension", value: hypertension, set: setHypertension },
              { id: "heart", label: "Heart disease", value: heart, set: setHeart },
              { id: "smoke", label: "Currently smokes", value: smoker, set: setSmoker },
            ].map(({ id, label, value, set }) => (
              <div key={id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
                <Label htmlFor={id}>{label}</Label>
                <Switch id={id} checked={value} onCheckedChange={set} />
              </div>
            ))}
            <div className="sm:col-span-2">
              <Button onClick={() => void compute()} disabled={busy}>
                {busy ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> : null}
                {busy ? "Scoring…" : "Estimate risk"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result ? (
                <>
                  <p className="font-display text-4xl font-extrabold">{Math.round(result.probability * 100)}%</p>
                  <p className="text-sm text-muted-foreground">
                    Estimated relative stroke risk indicator based on the factors you reported.
                  </p>
                  <ul className="list-inside list-disc text-sm text-muted-foreground">
                    {result.factors.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Enter your factors and estimate to see a result.</p>
              )}
            </CardContent>
          </Card>

          <Alert>
            <AlertTitle>Recognise a stroke — FAST</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-1">
                {FAST.map(([k, v]) => (
                  <li key={k}>
                    <strong>{k}:</strong> {v}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </AppShell>
  );
}
