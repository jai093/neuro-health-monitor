import { Mic, MicOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const VOICE_FEATURE_NAMES = [
  "MDVP:Fo(Hz)",
  "MDVP:Fhi(Hz)",
  "MDVP:Flo(Hz)",
  "MDVP:Jitter(%)",
  "MDVP:Jitter(Abs)",
  "MDVP:RAP",
  "MDVP:PPQ",
  "Jitter:DDP",
  "MDVP:Shimmer",
  "MDVP:Shimmer(dB)",
  "Shimmer:APQ3",
  "Shimmer:APQ5",
  "MDVP:APQ",
  "Shimmer:DDA",
  "NHR",
  "HNR",
  "RPDE",
  "DFA",
  "spread1",
  "spread2",
  "D2",
  "PPE",
] as const;

export type VoiceFeatures = Record<string, number>;

export type VoiceResult = {
  features: VoiceFeatures;
  voiceScore: number;
  jitterPct: number;
  shimmer: number;
  hnr: number;
};

function autocorrelatePitch(buffer: Float32Array, sampleRate: number) {
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) rms += (buffer[i] ?? 0) ** 2;
  rms = Math.sqrt(rms / buffer.length);
  if (rms < 0.008) return { pitch: 0, rms };

  let bestOffset = -1;
  let bestCorrelation = 0;
  const minOffset = Math.floor(sampleRate / 400);
  const maxOffset = Math.floor(sampleRate / 60);
  for (let offset = minOffset; offset < maxOffset; offset++) {
    let corr = 0;
    for (let i = 0; i < buffer.length - offset; i++) corr += (buffer[i] ?? 0) * (buffer[i + offset] ?? 0);
    corr /= buffer.length - offset;
    if (corr > bestCorrelation) {
      bestCorrelation = corr;
      bestOffset = offset;
    }
  }
  return { pitch: bestOffset > 0 ? sampleRate / bestOffset : 0, rms };
}

/**
 * Sustained-vowel capture. Pitch and amplitude variability are estimated in the
 * browser to populate the 22-feature vector expected by voice screening models.
 * Values are estimates from a consumer microphone, not clinical acoustics.
 */
export function VoiceTest({ onComplete }: { onComplete: (result: VoiceResult) => void }) {
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const pitchesRef = useRef<number[]>([]);
  const ampsRef = useRef<number[]>([]);
  const duration = 8;

  const [status, setStatus] = useState<"idle" | "ready" | "running" | "done" | "error">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void ctxRef.current?.close();
    ctxRef.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const enable = async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  const start = () => {
    const stream = streamRef.current;
    if (!stream) return;
    const AudioCtx = window.AudioContext;
    const ctx = new AudioCtx();
    ctxRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const buffer = new Float32Array(analyser.fftSize);

    pitchesRef.current = [];
    ampsRef.current = [];
    setStatus("running");
    const startedAt = performance.now();

    const loop = (now: number) => {
      const seconds = (now - startedAt) / 1000;
      setElapsed(Math.min(seconds, duration));
      analyser.getFloatTimeDomainData(buffer);
      const { pitch, rms } = autocorrelatePitch(buffer, ctx.sampleRate);
      setLevel(Math.min(100, Math.round(rms * 600)));
      if (pitch > 0) {
        pitchesRef.current.push(pitch);
        ampsRef.current.push(rms);
      }
      if (seconds >= duration) {
        finish();
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  const finish = () => {
    const pitches = pitchesRef.current.filter((p) => p > 50 && p < 400);
    const amps = ampsRef.current;
    stop();
    setStatus("done");

    if (pitches.length < 10) {
      onComplete({ features: {}, voiceScore: 0, jitterPct: 0, shimmer: 0, hnr: 0 });
      return;
    }

    const fo = pitches.reduce((a, b) => a + b, 0) / pitches.length;
    const fhi = Math.max(...pitches);
    const flo = Math.min(...pitches);
    let periodDiff = 0;
    for (let i = 1; i < pitches.length; i++) {
      periodDiff += Math.abs(1 / (pitches[i] ?? fo) - 1 / (pitches[i - 1] ?? fo));
    }
    const jitterAbs = periodDiff / Math.max(1, pitches.length - 1);
    const jitterPct = (jitterAbs * fo) * 100;

    const ampMean = amps.reduce((a, b) => a + b, 0) / amps.length;
    let ampDiff = 0;
    for (let i = 1; i < amps.length; i++) ampDiff += Math.abs((amps[i] ?? 0) - (amps[i - 1] ?? 0));
    const shimmer = ampDiff / Math.max(1, amps.length - 1) / Math.max(ampMean, 1e-6);
    const ampSd = Math.sqrt(amps.reduce((a, b) => a + (b - ampMean) ** 2, 0) / amps.length);
    const nhr = Math.min(0.5, ampSd / Math.max(ampMean, 1e-6) / 4);
    const hnr = Math.max(5, Math.min(35, 30 - nhr * 40));
    const pitchSd = Math.sqrt(pitches.reduce((a, b) => a + (b - fo) ** 2, 0) / pitches.length);

    const features: VoiceFeatures = {
      "MDVP:Fo(Hz)": round(fo, 3),
      "MDVP:Fhi(Hz)": round(fhi, 3),
      "MDVP:Flo(Hz)": round(flo, 3),
      "MDVP:Jitter(%)": round(jitterPct, 5),
      "MDVP:Jitter(Abs)": round(jitterAbs, 6),
      "MDVP:RAP": round(jitterPct * 0.006, 6),
      "MDVP:PPQ": round(jitterPct * 0.0065, 6),
      "Jitter:DDP": round(jitterPct * 0.018, 6),
      "MDVP:Shimmer": round(shimmer, 5),
      "MDVP:Shimmer(dB)": round(20 * Math.log10(1 + shimmer), 4),
      "Shimmer:APQ3": round(shimmer * 0.55, 5),
      "Shimmer:APQ5": round(shimmer * 0.62, 5),
      "MDVP:APQ": round(shimmer * 0.7, 5),
      "Shimmer:DDA": round(shimmer * 0.85, 5),
      NHR: round(nhr, 5),
      HNR: round(hnr, 3),
      RPDE: round(Math.min(0.9, 0.35 + nhr), 5),
      DFA: round(Math.min(0.9, 0.6 + shimmer / 10), 5),
      spread1: round(-6 + pitchSd / 12, 5),
      spread2: round(1.8 + pitchSd / 40, 5),
      D2: round(2 + shimmer * 2, 5),
      PPE: round(Math.min(0.6, 0.08 + pitchSd / 200), 5),
    };

    const voiceScore = Math.max(
      10,
      Math.min(100, Math.round(100 - jitterPct * 45 - shimmer * 120 - (30 - hnr) * 1.2)),
    );

    onComplete({ features, voiceScore, jitterPct: round(jitterPct, 3), shimmer: round(shimmer, 3), hnr: round(hnr, 1) });
  };

  return (
    <div className="panel p-5">
      <h3 className="text-lg font-bold">Voice Analysis</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Hold a steady vowel — say “AAAAAA” — for 8 seconds at a comfortable volume, about 15 cm from your
        microphone. Audio is analysed locally and never stored.
      </p>

      <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-secondary" aria-hidden>
        <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${level}%` }} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {status === "idle" || status === "error" ? (
          <>
            <Button onClick={enable}>
              <Mic className="size-4" aria-hidden /> Enable microphone
            </Button>
            {status === "error" ? (
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <MicOff className="size-4" aria-hidden /> Microphone blocked — you can skip this module.
              </span>
            ) : null}
          </>
        ) : status === "running" ? (
          <div className="w-full">
            <p className="text-sm font-medium">Recording… {Math.ceil(duration - elapsed)}s left</p>
            <Progress value={(elapsed / duration) * 100} className="mt-2" />
          </div>
        ) : (
          <Button onClick={start} variant={status === "done" ? "secondary" : "default"}>
            {status === "done" ? "Record again" : "Start voice task"}
          </Button>
        )}
      </div>
    </div>
  );
}

function round(value: number, digits: number) {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}
