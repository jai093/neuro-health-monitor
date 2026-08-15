import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type TestScore = { key: string; label: string; score: number; detail: string };

function Frame({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Digit-span style memory test. */
export function MemorySpanTest({ onDone }: { onDone: (s: TestScore) => void }) {
  const [phase, setPhase] = useState<"idle" | "show" | "input" | "done">("idle");
  const [digits, setDigits] = useState("");
  const [answer, setAnswer] = useState("");
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);

  const start = (r: number) => {
    const len = 4 + r;
    const d = Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join("");
    setDigits(d);
    setAnswer("");
    setRound(r);
    setPhase("show");
    window.setTimeout(() => setPhase("input"), 1200 + len * 400);
  };

  const submit = () => {
    const ok = answer.trim() === digits;
    const nextCorrect = correct + (ok ? 1 : 0);
    if (round >= 2) {
      const score = clamp((nextCorrect / 3) * 100);
      setPhase("done");
      onDone({ key: "memory", label: "Memory span", score, detail: `${nextCorrect}/3 sequences recalled` });
    } else {
      setCorrect(nextCorrect);
      start(round + 1);
    }
  };

  return (
    <Frame title="Memory — Digit Span" hint="Memorise the number, then type it from memory. Three rounds.">
      {phase === "idle" ? (
        <Button onClick={() => start(0)}>Start test</Button>
      ) : phase === "show" ? (
        <p className="font-display text-4xl font-extrabold tracking-[0.3em]">{digits}</p>
      ) : phase === "input" ? (
        <div className="flex flex-wrap gap-2">
          <Input
            value={answer}
            inputMode="numeric"
            aria-label="Type the digits you remember"
            onChange={(e) => setAnswer(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={submit}>Submit</Button>
        </div>
      ) : (
        <p className="text-sm font-medium text-risk-low">Completed.</p>
      )}
    </Frame>
  );
}

/** Sustained-attention symbol matching. */
export function AttentionTest({ onDone }: { onDone: (s: TestScore) => void }) {
  const symbols = useMemo(() => ["△", "○", "□", "◇", "☆"], []);
  const [running, setRunning] = useState(false);
  const [target, setTarget] = useState("△");
  const [current, setCurrent] = useState("○");
  const [left, setLeft] = useState(20);
  const stats = useRef({ hits: 0, misses: 0, shown: 0 });

  useEffect(() => {
    if (!running) return;
    const tick = window.setInterval(() => setLeft((v) => v - 1), 1000);
    const flip = window.setInterval(() => {
      const s = symbols[Math.floor(Math.random() * symbols.length)]!;
      setCurrent(s);
      stats.current.shown += s === target ? 1 : 0;
    }, 900);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(flip);
    };
  }, [running, symbols, target]);

  useEffect(() => {
    if (!running || left > 0) return;
    setRunning(false);
    const { hits, misses, shown } = stats.current;
    const accuracy = shown === 0 ? 0 : hits / shown;
    const score = clamp(accuracy * 100 - misses * 4);
    onDone({ key: "attention", label: "Attention", score, detail: `${hits} correct hits, ${misses} false taps` });
  }, [left, running, onDone]);

  return (
    <Frame title="Attention — Symbol Match" hint="Tap only when the symbol matches the target. 20 seconds.">
      {!running && left === 20 ? (
        <Button
          onClick={() => {
            setTarget(symbols[Math.floor(Math.random() * symbols.length)]!);
            stats.current = { hits: 0, misses: 0, shown: 0 };
            setRunning(true);
          }}
        >
          Start test
        </Button>
      ) : running ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Target <span className="text-2xl text-foreground">{target}</span> — {left}s left
          </p>
          <button
            type="button"
            aria-label="Tap when symbol matches target"
            onClick={() => {
              if (current === target) stats.current.hits += 1;
              else stats.current.misses += 1;
            }}
            className="grid h-32 w-full place-items-center rounded-2xl border border-border bg-secondary text-6xl"
          >
            {current}
          </button>
        </div>
      ) : (
        <p className="text-sm font-medium text-risk-low">Completed.</p>
      )}
    </Frame>
  );
}

/** Delayed word recall. */
export function RecallTest({ onDone }: { onDone: (s: TestScore) => void }) {
  const words = useMemo(() => ["river", "candle", "orange", "window", "guitar"], []);
  const [phase, setPhase] = useState<"idle" | "show" | "input" | "done">("idle");
  const [text, setText] = useState("");

  return (
    <Frame title="Recall — Word List" hint="Read five words, wait, then type as many as you remember.">
      {phase === "idle" ? (
        <Button
          onClick={() => {
            setPhase("show");
            window.setTimeout(() => setPhase("input"), 6000);
          }}
        >
          Start test
        </Button>
      ) : phase === "show" ? (
        <p className="font-display text-2xl font-bold">{words.join(" · ")}</p>
      ) : phase === "input" ? (
        <div className="flex flex-wrap gap-2">
          <Input
            value={text}
            aria-label="Words you remember, separated by spaces"
            placeholder="e.g. river candle ..."
            onChange={(e) => setText(e.target.value)}
            className="max-w-md"
          />
          <Button
            onClick={() => {
              const given = text.toLowerCase().split(/[^a-z]+/).filter(Boolean);
              const hits = words.filter((w) => given.includes(w)).length;
              setPhase("done");
              onDone({
                key: "recall",
                label: "Delayed recall",
                score: clamp((hits / words.length) * 100),
                detail: `${hits}/${words.length} words recalled`,
              });
            }}
          >
            Submit
          </Button>
        </div>
      ) : (
        <p className="text-sm font-medium text-risk-low">Completed.</p>
      )}
    </Frame>
  );
}

/** Simple visual reaction time. */
export function ReactionTest({ onDone }: { onDone: (s: TestScore) => void }) {
  const [state, setState] = useState<"idle" | "wait" | "go" | "done">("idle");
  const times = useRef<number[]>([]);
  const startedAt = useRef(0);

  const schedule = () => {
    setState("wait");
    window.setTimeout(
      () => {
        startedAt.current = performance.now();
        setState("go");
      },
      800 + Math.random() * 1800,
    );
  };

  return (
    <Frame title="Reaction Time" hint="Tap as soon as the panel turns green. Five attempts.">
      {state === "idle" ? (
        <Button
          onClick={() => {
            times.current = [];
            schedule();
          }}
        >
          Start test
        </Button>
      ) : state === "done" ? (
        <p className="text-sm font-medium text-risk-low">Completed.</p>
      ) : (
        <button
          type="button"
          aria-label="Tap when green"
          onClick={() => {
            if (state !== "go") return;
            times.current.push(performance.now() - startedAt.current);
            if (times.current.length >= 5) {
              const avg = times.current.reduce((a, b) => a + b, 0) / times.current.length;
              setState("done");
              onDone({
                key: "reaction",
                label: "Reaction time",
                score: clamp(120 - (avg - 200) / 5),
                detail: `${Math.round(avg)} ms average`,
              });
            } else schedule();
          }}
          className={
            "grid h-32 w-full place-items-center rounded-2xl text-lg font-semibold text-white " +
            (state === "go" ? "bg-risk-low" : "bg-muted-foreground")
          }
        >
          {state === "go" ? "TAP NOW" : "Wait…"}
        </button>
      )}
    </Frame>
  );
}

/** Pattern continuation. */
export function PatternTest({ onDone }: { onDone: (s: TestScore) => void }) {
  const rounds = useMemo(
    () => [
      { seq: [2, 4, 8, 16], answer: 32 },
      { seq: [3, 6, 9, 12], answer: 15 },
      { seq: [1, 1, 2, 3, 5], answer: 8 },
    ],
    [],
  );
  const [i, setI] = useState(0);
  const [value, setValue] = useState("");
  const [hits, setHits] = useState(0);
  const [done, setDone] = useState(false);
  const round = rounds[i]!;

  if (done) {
    return (
      <Frame title="Pattern Recognition" hint="Sequence continuation.">
        <p className="text-sm font-medium text-risk-low">Completed.</p>
      </Frame>
    );
  }

  return (
    <Frame title="Pattern Recognition" hint="Type the next number in the sequence. Three rounds.">
      <p className="font-display text-2xl font-bold">{round.seq.join(", ")}, ?</p>
      <div className="flex flex-wrap gap-2">
        <Input
          value={value}
          inputMode="numeric"
          aria-label="Next number in the sequence"
          onChange={(e) => setValue(e.target.value)}
          className="max-w-[10rem]"
        />
        <Button
          onClick={() => {
            const ok = Number(value) === round.answer;
            const next = hits + (ok ? 1 : 0);
            setValue("");
            if (i >= rounds.length - 1) {
              setDone(true);
              onDone({
                key: "pattern",
                label: "Pattern recognition",
                score: clamp((next / rounds.length) * 100),
                detail: `${next}/${rounds.length} sequences solved`,
              });
            } else {
              setHits(next);
              setI(i + 1);
            }
          }}
        >
          Submit
        </Button>
      </div>
    </Frame>
  );
}
