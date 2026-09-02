import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-nav";
import { RiskBadge, ScoreRing } from "@/components/RiskBadge";
import { CameraTest, type MotionMetrics } from "@/components/camera-test";
import { FollowThePath, LeftVsRight, RapidTap, TapTheBalls, type GameScore } from "@/components/parkinson-games";
import { VoiceTest, type VoiceResult } from "@/components/voice-test";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { inferParkinson } from "@/lib/inference.functions";
import { levelFromScore, useNeuro } from "@/lib/neuro-store";

export const Route = createFileRoute("/parkinson")({
  head: () => ({
    meta: [
      { title: "Parkinson Screening — NeuroShield AI" },
      {
        name: "description",
        content:
          "Multimodal Parkinson screening with guided camera motor tasks, sustained-vowel voice analysis and motor skill games.",
      },
      { property: "og:title", content: "Parkinson Screening — NeuroShield AI" },
      {
        property: "og:description",
        content: "Motor, voice and game-based preliminary Parkinson screening in your browser.",
      },
    ],
  }),
  component: ParkinsonPage,
});

type Inference = {
  motorScore: number | null;
  voiceScore: number | null;
  gameScore: number | null;
  overall: number | null;
  notes: string[];
};

function ParkinsonPage() {
  const { recordModule } = useNeuro();
  const runInference = useServerFn(inferParkinson);
  const [motor, setMotor] = useState<MotionMetrics | null>(null);
  const [voice, setVoice] = useState<VoiceResult | null>(null);
  const [games, setGames] = useState<GameScore[]>([]);
  const [result, setResult] = useState<Inference | null>(null);
  const [busy, setBusy] = useState(false);

  const hasInput = motor != null || voice != null || games.length > 0;

  const addGame = (s: GameScore) => setGames((prev) => [...prev.filter((g) => g.name !== s.name), s]);

  const analyseAndSave = async () => {
    if (!hasInput) return;
    setBusy(true);
    try {
      const scored = await runInference({
        data: {
          motor: motor
            ? {
                stability: motor.stability,
                frequency: motor.frequency,
                symmetry: motor.symmetry,
                events: motor.events,
              }
            : null,
          voice: voice
            ? { jitterPct: voice.jitterPct, shimmer: voice.shimmer, hnr: voice.hnr }
            : null,
          games: games.map((g) => ({ name: g.name, score: g.score })),
        },
      });
      setResult(scored);
      if (scored.overall == null) throw new Error("No task produced a usable signal.");
      recordModule(
        "parkinson",
        {
          motorScore: scored.motorScore ?? scored.overall,
          voiceScore: scored.voiceScore ?? scored.overall,
          gameScore: scored.gameScore,
          overall: scored.overall,
          level: levelFromScore(scored.overall),
        },
        "motor-challenge",
      );
      toast.success("Motor & voice screening saved", {
        description: `Model score ${scored.overall}/100 — your dashboard and progress charts have updated.`,
      });
    } catch (error) {
      toast.error("Couldn't analyse this session", {
        description: error instanceof Error ? error.message : "Please try again.",
        action: { label: "Retry", onClick: () => void analyseAndSave() },
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Module 1"
        title="Parkinson Screening"
        description="Complete the motor, voice and game tasks, then run the analysis. Signals are scored by the server-side motor and dysphonia models."
        action={result?.overall != null ? <RiskBadge level={levelFromScore(result.overall)} /> : undefined}
      />

      <Alert className="mb-6">
        <AlertTitle>Preliminary screening only</AlertTitle>
        <AlertDescription>
          These tasks estimate motor and voice variability from consumer camera and microphone signals. They cannot
          confirm or rule out Parkinson's disease.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        <CameraTest
          title="Motor task — hand tremor & posture"
          instruction="Hold both hands out in front of the camera, palms down, as still as you can."
          duration={10}
          onComplete={setMotor}
        />
        <VoiceTest onComplete={setVoice} />
        <TapTheBalls onDone={addGame} />
        <FollowThePath onDone={addGame} />
        <RapidTap onDone={addGame} label="Rapid tap — dominant hand" />
        <LeftVsRight onDone={addGame} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Screening summary</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-8">
          <ScoreRing value={result?.motorScore ?? 0} caption="Motor" />
          <ScoreRing value={result?.voiceScore ?? 0} caption="Voice" />
          <ScoreRing value={result?.gameScore ?? 0} caption="Games" />
          <ScoreRing value={result?.overall ?? 0} caption="Overall" />
          <div className="min-w-56 space-y-2 text-sm text-muted-foreground">
            <p>
              Tasks captured: {motor ? "motor ✓" : "motor —"} · {voice ? "voice ✓" : "voice —"} · games {games.length}/4
            </p>
            {games.map((g) => (
              <p key={g.name}>
                <strong className="text-foreground">{g.name}:</strong> {g.details}
              </p>
            ))}
            {voice ? (
              <p>
                Jitter {voice.jitterPct.toFixed(2)}% · Shimmer {voice.shimmer.toFixed(2)} · HNR {voice.hnr.toFixed(1)} dB
              </p>
            ) : null}
            {result?.notes.length ? (
              <ul className="list-inside list-disc">
                {result.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            ) : null}
            <Button onClick={() => void analyseAndSave()} disabled={!hasInput || busy}>
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {busy ? "Analysing…" : "Run analysis & save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
