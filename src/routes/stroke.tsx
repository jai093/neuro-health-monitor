import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app-nav";
import { RiskBadge } from "@/components/RiskBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  const [age, setAge] = useState("55");
  const [bmi, setBmi] = useState("26");
  const [glucose, setGlucose] = useState("105");
  const [hypertension, setHypertension] = useState(false);
  const [heart, setHeart] = useState(false);
  const [smoker, setSmoker] = useState(false);
  const [result, setResult] = useState<{ probability: number; factors: string[] } | null>(null);

  const compute = () => {
    const a = Number(age) || 0;
    const b = Number(bmi) || 0;
    const g = Number(glucose) || 0;
    const factors: string[] = [];
    let logit = -5.2 + a * 0.055;
    if (hypertension) {
      logit += 0.9;
      factors.push("Hypertension");
    }
    if (heart) {
      logit += 1.0;
      factors.push("Heart disease");
    }
    if (smoker) {
      logit += 0.55;
      factors.push("Smoking");
    }
    if (b >= 30) {
      logit += 0.4;
      factors.push("Body mass index in obese range");
    } else if (b >= 25) {
      logit += 0.2;
      factors.push("Body mass index above healthy range");
    }
    if (g >= 140) {
      logit += 0.6;
      factors.push("Elevated blood glucose");
    } else if (g >= 110) {
      logit += 0.3;
      factors.push("Borderline blood glucose");
    }
    if (a >= 65) factors.push("Age 65 or above");
    const probability = Math.min(0.9, 1 / (1 + Math.exp(-logit)));
    setResult({ probability, factors: factors.length ? factors : ["No major risk factor reported"] });
    recordModule("stroke", { probability, level: strokeLevel(probability), factors });
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
              <Button onClick={compute}>Estimate risk</Button>
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
