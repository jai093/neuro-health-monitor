import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app-nav";
import { RiskBadge, ScoreRing } from "@/components/RiskBadge";
import { CameraTest, type MotionMetrics } from "@/components/camera-test";
import { FollowThePath, LeftVsRight, RapidTap, TapTheBalls, type GameScore } from "@/components/parkinson-games";
import { VoiceTest, type VoiceResult } from "@/components/voice-test";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function ParkinsonPage() {
  const { recordModule } = useNeuro();
  const [motor, setMotor] = useState<MotionMetrics | null>(null);
  const [voice, setVoice] = useState<VoiceResult | null>(null);
  const [games, setGames] = useState<GameScore[]>([]);

  const motorScore = motor ? Math.round(motor.stability * 0.6 + motor.symmetry * 0.4) : null;
  const voiceScore = voice ? voice.voiceScore : null;
  const gameScore = games.length ? Math.round(games.reduce((a, g) => a + g.score, 0) / games.length) : null;

  const parts = [motorScore, voiceScore, gameScore].filter((v): v is number => v != null);
  const overall = parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : null;

  const addGame = (s: GameScore) => setGames((prev) => [...prev.filter((g) => g.name !== s.name), s]);

  const save = () => {
    if (overall == null) return;
    recordModule(
      "parkinson",
      {
        motorScore: motorScore ?? overall,
        voiceScore: voiceScore ?? overall,
        gameScore,
        overall,
        level: levelFromScore(overall),
      },
      "motor-challenge",
    );
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Module 1"
        title="Parkinson Screening"
        description="Complete the motor, voice and game tasks. Signals are analysed in your browser to produce a preliminary screening score."
        action={overall != null ? <RiskBadge level={levelFromScore(overall)} /> : undefined}
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
          <ScoreRing value={motorScore ?? 0} caption="Motor" />
          <ScoreRing value={voiceScore ?? 0} caption="Voice" />
          <ScoreRing value={gameScore ?? 0} caption="Games" />
          <ScoreRing value={overall ?? 0} caption="Overall" />
          <div className="min-w-56 space-y-2 text-sm text-muted-foreground">
            {games.map((g) => (
              <p key={g.name}>
                <strong className="text-foreground">{g.name}:</strong> {g.details}
              </p>
            ))}
            {voice ? (
              <p>
                Jitter {voice.jitterPct.toFixed(2)}% · Shimmer {voice.shimmer.toFixed(2)} · HNR{" "}
                {voice.hnr.toFixed(1)} dB
              </p>
            ) : null}
            <button
              type="button"
              onClick={save}
              disabled={overall == null}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              Save to my profile
            </button>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
