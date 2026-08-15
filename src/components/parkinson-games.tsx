import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export type GameScore = { name: string; score: number; details: string };

function Frame({
  title,
  instruction,
  children,
  footer,
}: {
  title: string;
  instruction: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{instruction}</p>
      </div>
      <div className="p-5">{children}</div>
      {footer ? <div className="border-t border-border px-5 py-4 text-sm">{footer}</div> : null}
    </div>
  );
}

/** Game 1 — Tap the Balls: reaction time, accuracy, misses. */
export function TapTheBalls({ onDone }: { onDone: (s: GameScore) => void }) {
  const total = 12;
  const [index, setIndex] = useState(-1);
  const [pos, setPos] = useState({ x: 45, y: 45 });
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const shownAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const next = useCallback(
    (i: number) => {
      if (i >= total) {
        setIndex(total);
        return;
      }
      setIndex(i);
      setPos({ x: 8 + Math.random() * 78, y: 8 + Math.random() * 70 });
      shownAt.current = performance.now();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setMisses((m) => m + 1);
        next(i + 1);
      }, 1600);
    },
    [total],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  useEffect(() => {
    if (index !== total) return;
    const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 1600;
    const accuracy = (hits / total) * 100;
    const score = Math.max(10, Math.min(100, Math.round(accuracy * 0.6 + Math.max(0, 100 - (avg - 300) / 8) * 0.4)));
    onDone({
      name: "Tap the Balls",
      score,
      details: `${hits}/${total} hit · ${misses} missed · avg reaction ${Math.round(avg)} ms`,
    });
  }, [index, total, times, hits, misses, onDone]);

  return (
    <Frame title="Game 1 — Tap the Balls" instruction="Tap each ball as fast as you can. Missed balls disappear after 1.6 seconds.">
      <div className="relative h-72 overflow-hidden rounded-xl bg-secondary">
        {index >= 0 && index < total ? (
          <button
            type="button"
            aria-label="Tap target"
            onClick={() => {
              setHits((h) => h + 1);
              setTimes((t) => [...t, performance.now() - shownAt.current]);
              next(index + 1);
            }}
            className="absolute size-14 rounded-full bg-primary shadow-lg transition-transform active:scale-90"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          />
        ) : (
          <div className="grid h-full place-items-center">
            <Button onClick={() => { setHits(0); setMisses(0); setTimes([]); next(0); }}>
              {index === total ? "Play again" : "Start game"}
            </Button>
          </div>
        )}
      </div>
    </Frame>
  );
}

/** Game 2 — Follow the Path: tracking accuracy and smoothness. */
export function FollowThePath({ onDone }: { onDone: (s: GameScore) => void }) {
  const areaRef = useRef<HTMLDivElement | null>(null);
  const [running, setRunning] = useState(false);
  const [target, setTarget] = useState({ x: 50, y: 50 });
  const devRef = useRef<number[]>([]);
  const pointer = useRef({ x: 50, y: 50 });
  const startRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now();
    devRef.current = [];
    let raf = 0;
    const loop = (now: number) => {
      const t = (now - startRef.current) / 1000;
      const x = 50 + 34 * Math.sin(t * 1.1);
      const y = 50 + 26 * Math.sin(t * 1.7);
      setTarget({ x, y });
      devRef.current.push(Math.hypot(pointer.current.x - x, pointer.current.y - y));
      if (t >= 15) {
        setRunning(false);
        const devs = devRef.current;
        const mean = devs.reduce((a, b) => a + b, 0) / Math.max(devs.length, 1);
        let jerk = 0;
        for (let i = 1; i < devs.length; i++) jerk += Math.abs((devs[i] ?? 0) - (devs[i - 1] ?? 0));
        const smooth = jerk / Math.max(devs.length, 1);
        const score = Math.max(10, Math.min(100, Math.round(100 - mean * 2.6 - smooth * 8)));
        onDone({
          name: "Follow the Path",
          score,
          details: `avg deviation ${mean.toFixed(1)}% · smoothness index ${(10 - Math.min(10, smooth * 5)).toFixed(1)}/10`,
        });
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, onDone]);

  return (
    <Frame title="Game 2 — Follow the Path" instruction="Keep your cursor or finger on the moving dot for 15 seconds.">
      <div
        ref={areaRef}
        className="relative h-72 touch-none overflow-hidden rounded-xl bg-secondary"
        onPointerMove={(e) => {
          const rect = areaRef.current?.getBoundingClientRect();
          if (!rect) return;
          pointer.current = {
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100,
          };
        }}
      >
        <div
          className="pointer-events-none absolute size-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
          style={{ left: `${target.x}%`, top: `${target.y}%` }}
          aria-hidden
        />
        {!running ? (
          <div className="grid h-full place-items-center">
            <Button onClick={() => setRunning(true)}>Start tracking</Button>
          </div>
        ) : null}
      </div>
    </Frame>
  );
}

/** Game 3 — Rapid Tap: tap count, interval, rhythm, fatigue. */
export function RapidTap({
  onDone,
  hand,
  label,
}: {
  onDone: (s: GameScore) => void;
  hand?: "left" | "right";
  label?: string;
}) {
  const duration = 10;
  const [running, setRunning] = useState(false);
  const [taps, setTaps] = useState(0);
  const [left, setLeft] = useState(duration);
  const stamps = useRef<number[]>([]);

  useEffect(() => {
    if (!running) return;
    const started = performance.now();
    const id = setInterval(() => {
      const remaining = duration - (performance.now() - started) / 1000;
      setLeft(Math.max(0, Math.ceil(remaining)));
      if (remaining <= 0) {
        clearInterval(id);
        setRunning(false);
        const s = stamps.current;
        const intervals: number[] = [];
        for (let i = 1; i < s.length; i++) intervals.push((s[i] ?? 0) - (s[i - 1] ?? 0));
        const mean = intervals.reduce((a, b) => a + b, 0) / Math.max(intervals.length, 1);
        const sd = Math.sqrt(intervals.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(intervals.length, 1));
        const firstHalf = intervals.slice(0, Math.floor(intervals.length / 2));
        const secondHalf = intervals.slice(Math.floor(intervals.length / 2));
        const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / Math.max(arr.length, 1);
        const fatigue = ((avg(secondHalf) - avg(firstHalf)) / Math.max(avg(firstHalf), 1)) * 100;
        const score = Math.max(
          10,
          Math.min(100, Math.round(Math.min(100, s.length * 1.8) * 0.6 + Math.max(0, 100 - sd / 2) * 0.4 - Math.max(0, fatigue) * 0.2)),
        );
        onDone({
          name: label ?? "Rapid Tap",
          score,
          details: `${s.length} taps · avg interval ${Math.round(mean)} ms · rhythm SD ${Math.round(sd)} ms · fatigue ${fatigue.toFixed(1)}%`,
        });
      }
    }, 200);
    return () => clearInterval(id);
  }, [running, onDone, label]);

  return (
    <Frame
      title={label ?? "Game 3 — Rapid Tap"}
      instruction={`Tap the button as fast and as evenly as you can for ${duration} seconds${hand ? ` using your ${hand} hand only` : ""}.`}
    >
      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          disabled={!running}
          onClick={() => {
            stamps.current.push(performance.now());
            setTaps((t) => t + 1);
          }}
          className="size-40 rounded-full bg-primary text-lg font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-40"
        >
          TAP
        </button>
        <p className="text-sm font-medium text-muted-foreground">
          {running ? `${taps} taps · ${left}s left` : `${taps} taps recorded`}
        </p>
        {!running ? (
          <Button
            onClick={() => {
              stamps.current = [];
              setTaps(0);
              setLeft(duration);
              setRunning(true);
            }}
          >
            {taps > 0 ? "Run again" : "Start"}
          </Button>
        ) : null}
      </div>
    </Frame>
  );
}

/** Game 4 — Left vs Right comparison. */
export function LeftVsRight({ onDone }: { onDone: (s: GameScore) => void }) {
  const [leftScore, setLeftScore] = useState<GameScore | null>(null);
  const [rightScore, setRightScore] = useState<GameScore | null>(null);

  useEffect(() => {
    if (!leftScore || !rightScore) return;
    const diff = Math.abs(leftScore.score - rightScore.score);
    onDone({
      name: "Left vs Right",
      score: Math.max(10, Math.min(100, Math.round((leftScore.score + rightScore.score) / 2 - diff))),
      details: `left ${leftScore.score} · right ${rightScore.score} · asymmetry ${diff} points`,
    });
  }, [leftScore, rightScore, onDone]);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <RapidTap hand="left" label="Left hand task" onDone={setLeftScore} />
      <RapidTap hand="right" label="Right hand task" onDone={setRightScore} />
    </div>
  );
}
