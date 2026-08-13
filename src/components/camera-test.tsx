import { Camera, CameraOff, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export type MotionMetrics = {
  /** 0-100, higher = steadier */
  stability: number;
  /** dominant oscillation frequency estimate in Hz */
  frequency: number;
  /** 0-100, higher = more symmetric left/right */
  symmetry: number;
  /** detected rhythmic events (used for tapping/steps) */
  events: number;
};

/**
 * Guided camera task. Movement is estimated from frame-to-frame pixel change of
 * the downscaled video — a coarse motion signal, not a clinical measurement.
 */
export function CameraTest({
  title,
  instruction,
  duration = 10,
  onComplete,
}: {
  title: string;
  instruction: string;
  duration?: number;
  onComplete: (metrics: MotionMetrics) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const prevRef = useRef<Float32Array | null>(null);
  const samplesRef = useRef<number[]>([]);
  const leftRef = useRef<number[]>([]);
  const rightRef = useRef<number[]>([]);

  const [status, setStatus] = useState<"idle" | "ready" | "running" | "done" | "error">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const enable = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus("ready");
      setError(null);
    } catch {
      setStatus("error");
      setError("Camera access was blocked. You can skip this test and continue with the rest of the screening.");
    }
  };

  const analyse = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = 48;
    const h = 36;
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(video, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    const gray = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const r = data[i * 4] ?? 0;
      const g = data[i * 4 + 1] ?? 0;
      const b = data[i * 4 + 2] ?? 0;
      gray[i] = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    }
    const prev = prevRef.current;
    if (prev) {
      let total = 0;
      let left = 0;
      let right = 0;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          const d = Math.abs((gray[idx] ?? 0) - (prev[idx] ?? 0));
          total += d;
          if (x < w / 2) left += d;
          else right += d;
        }
      }
      samplesRef.current.push(total / (w * h));
      leftRef.current.push(left);
      rightRef.current.push(right);
    }
    prevRef.current = gray;
  };

  const start = () => {
    samplesRef.current = [];
    leftRef.current = [];
    rightRef.current = [];
    prevRef.current = null;
    setElapsed(0);
    setStatus("running");
    const startedAt = performance.now();
    let lastSample = 0;

    const loop = (now: number) => {
      const seconds = (now - startedAt) / 1000;
      setElapsed(Math.min(seconds, duration));
      if (now - lastSample > 60) {
        analyse();
        lastSample = now;
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
    const samples = samplesRef.current;
    const n = samples.length || 1;
    const mean = samples.reduce((a, b) => a + b, 0) / n;
    const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    const sd = Math.sqrt(variance);

    // zero-crossings around the mean ≈ oscillation events
    let crossings = 0;
    for (let i = 1; i < samples.length; i++) {
      const a = samples[i - 1] ?? 0;
      const b = samples[i] ?? 0;
      if ((a - mean) * (b - mean) < 0) crossings++;
    }
    const frequency = crossings / 2 / duration;

    const leftSum = leftRef.current.reduce((a, b) => a + b, 0) || 1;
    const rightSum = rightRef.current.reduce((a, b) => a + b, 0) || 1;
    const symmetry = 100 - (Math.abs(leftSum - rightSum) / (leftSum + rightSum)) * 200;

    const stability = Math.max(5, Math.min(100, Math.round(100 - mean * 900 - sd * 400)));

    stop();
    setStatus("done");
    onComplete({
      stability,
      frequency: Math.round(frequency * 10) / 10,
      symmetry: Math.max(0, Math.min(100, Math.round(symmetry))),
      events: Math.round(crossings / 2),
    });
  };

  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{instruction}</p>
      </div>
      <div className="relative aspect-video bg-secondary">
        <video ref={videoRef} muted playsInline className="size-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        {status === "idle" || status === "error" ? (
          <div className="absolute inset-0 grid place-items-center gap-3 p-6 text-center">
            <div>
              {status === "error" ? (
                <CameraOff className="mx-auto size-8 text-muted-foreground" aria-hidden />
              ) : (
                <Camera className="mx-auto size-8 text-muted-foreground" aria-hidden />
              )}
              <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                {error ?? "Camera stays on your device. Nothing is recorded or uploaded."}
              </p>
              <Button className="mt-4" onClick={enable}>
                Enable camera
              </Button>
            </div>
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        {status === "running" ? (
          <>
            <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
            <span className="text-sm font-medium">Recording task… {Math.ceil(duration - elapsed)}s left</span>
            <Progress value={(elapsed / duration) * 100} className="mt-2 w-full" />
          </>
        ) : (
          <Button onClick={start} disabled={status !== "ready" && status !== "done"} variant={status === "done" ? "secondary" : "default"}>
            {status === "done" ? "Repeat test" : `Start ${duration}s task`}
          </Button>
        )}
        {status === "done" ? <span className="text-sm font-medium text-risk-low">Task recorded</span> : null}
      </div>
    </div>
  );
}
