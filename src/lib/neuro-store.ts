/**
 * NeuroShield AI — local assessment store.
 * All data stays in the browser (localStorage). No medical data leaves the device.
 */
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export type RiskLevel = "low" | "monitor" | "elevated" | "high";

export const RISK_META: Record<RiskLevel, { label: string; short: string }> = {
  low: { label: "Low Concern", short: "Low" },
  monitor: { label: "Monitor", short: "Monitor" },
  elevated: { label: "Elevated Concern", short: "Elevated" },
  high: { label: "High Concern", short: "High" },
};

export type Profile = {
  fullName: string;
  age: string;
  gender: string;
  email: string;
  phone: string;
  dob: string;
  emergencyContact: string;
  conditions: string;
  medications: string;
  notes: string;
  disclaimerAccepted: boolean;
  consentMedia: boolean;
  registered: boolean;
};

export type ParkinsonResult = {
  motorScore: number;
  voiceScore: number;
  gameScore: number | null;
  overall: number;
  level: RiskLevel;
};

export type CognitiveResult = {
  memory: number;
  attention: number;
  recall: number;
  reaction: number;
  pattern: number;
  consistency: number;
  overall: number;
  level: RiskLevel;
  mri?: { className: string; confidence: number } | null;
};

export type StrokeResult = {
  probability: number;
  level: RiskLevel;
  factors: string[];
};

export type Assessment = {
  id: string;
  date: string; // ISO
  label: string;
  parkinson?: ParkinsonResult;
  cognitive?: CognitiveResult;
  stroke?: StrokeResult;
};

export type Badge =
  | "first-assessment"
  | "cognitive-challenge"
  | "motor-challenge"
  | "monthly-monitoring"
  | "consistency";

export type NeuroState = {
  profile: Profile;
  assessments: Assessment[];
  badges: Badge[];
  seeded: boolean;
};

const KEY = "neuroshield-ai-v1";
const EVT = "neuroshield-update";

export const emptyProfile: Profile = {
  fullName: "",
  age: "",
  gender: "",
  email: "",
  phone: "",
  dob: "",
  emergencyContact: "",
  conditions: "",
  medications: "",
  notes: "",
  disclaimerAccepted: false,
  consentMedia: false,
  registered: false,
};

// No seeded demo rows: every number in the app comes from a real completed
// assessment recorded on this device, so scores are always live user data.
const initialState = (): NeuroState => ({
  profile: emptyProfile,
  assessments: [],
  badges: [],
  seeded: true,
});

export function levelFromScore(score: number): RiskLevel {
  if (score >= 85) return "low";
  if (score >= 70) return "monitor";
  if (score >= 55) return "elevated";
  return "high";
}

export function strokeLevel(p: number): RiskLevel {
  if (p < 0.08) return "low";
  if (p < 0.2) return "monitor";
  if (p < 0.35) return "elevated";
  return "high";
}

function readSafe(): { state: NeuroState; error: boolean } {
  if (typeof window === "undefined") return { state: initialState(), error: false };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { state: initialState(), error: false };
    const parsed = JSON.parse(raw) as NeuroState;
    return {
      state: { ...initialState(), ...parsed, profile: { ...emptyProfile, ...parsed.profile } },
      error: false,
    };
  } catch {
    return { state: initialState(), error: true };
  }
}

function write(state: NeuroState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(EVT));
}

export function useNeuro() {
  const [state, setState] = useState<NeuroState>(() => initialState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(read());
    setHydrated(true);
    const onUpdate = () => setState(read());
    window.addEventListener(EVT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(EVT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const update = useCallback((fn: (s: NeuroState) => NeuroState) => {
    const next = fn(read());
    write(next);
    setState(next);
  }, []);

  const saveProfile = useCallback(
    (profile: Partial<Profile>) => update((s) => ({ ...s, profile: { ...s.profile, ...profile } })),
    [update],
  );

  const recordModule = useCallback(
    (
      key: "parkinson" | "cognitive" | "stroke",
      value: ParkinsonResult | CognitiveResult | StrokeResult,
      badge?: Badge,
    ) =>
      update((s) => {
        const today = new Date();
        const list = [...s.assessments];
        const latest = list[list.length - 1];
        const sameMonth =
          latest &&
          new Date(latest.date).getMonth() === today.getMonth() &&
          new Date(latest.date).getFullYear() === today.getFullYear();

        if (sameMonth && latest) {
          list[list.length - 1] = { ...latest, [key]: value, date: today.toISOString() };
        } else {

          list.push({
            id: `a-${today.getTime()}`,
            date: today.toISOString(),
            label: list.length === 0 ? "Initial Screening" : "Monthly Assessment",
            [key]: value,
          } as Assessment);
        }

        const badges = new Set(s.badges);
        if (badge) badges.add(badge);
        if (list.length >= 3) badges.add("consistency");
        if (list.length >= 1) badges.add("first-assessment");
        return { ...s, assessments: list, badges: [...badges] };
      }),
    [update],
  );

  const deleteAssessment = useCallback(
    (id: string) => update((s) => ({ ...s, assessments: s.assessments.filter((a) => a.id !== id) })),
    [update],
  );

  const clearAll = useCallback(
    () => update(() => ({ profile: emptyProfile, assessments: [], badges: [], seeded: true })),
    [update],
  );

  return { state, hydrated, saveProfile, recordModule, deleteAssessment, clearAll };
}

export function latestOf(assessments: Assessment[], key: "parkinson" | "cognitive" | "stroke") {
  for (let i = assessments.length - 1; i >= 0; i--) {
    const a = assessments[i];
    if (a && a[key]) return a;
  }
  return undefined;
}

export function previousOf(assessments: Assessment[], key: "parkinson" | "cognitive" | "stroke") {
  const withKey = assessments.filter((a) => a[key]);
  return withKey.length >= 2 ? withKey[withKey.length - 2] : undefined;
}

export function trendLabel(current?: number, previous?: number) {
  if (current == null || previous == null) return { text: "No comparison yet", delta: 0 };
  const delta = ((current - previous) / Math.max(previous, 1)) * 100;
  if (delta > 3) return { text: "Improving", delta };
  if (delta < -3) return { text: "Needs Monitoring", delta };
  return { text: "Stable", delta };
}

export function nextAssessmentDate(assessments: Assessment[]) {
  const last = assessments[assessments.length - 1];
  const base = last ? new Date(last.date) : new Date();
  base.setDate(base.getDate() + 30);
  return base;
}

export function formatDate(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** Rule-based recommendation layer (never prescribes medication). */
export function buildRecommendations(assessments: Assessment[]) {
  const recs: { title: string; body: string; tone: RiskLevel }[] = [];
  const p = latestOf(assessments, "parkinson")?.parkinson;
  const c = latestOf(assessments, "cognitive")?.cognitive;
  const cPrev = previousOf(assessments, "cognitive")?.cognitive;
  const s = latestOf(assessments, "stroke")?.stroke;

  if (p && (p.level === "elevated" || p.level === "high")) {
    recs.push({
      title: "Discuss motor findings with a healthcare professional",
      body: "Several motor and voice assessment signals were outside your usual range. A professional neurological evaluation may be appropriate.",
      tone: p.level,
    });
  } else if (p) {
    recs.push({
      title: "Continue monthly motor assessment",
      body: "No significant abnormality was detected in this screening. Repeat the motor and voice tasks next month to keep building your baseline.",
      tone: "low",
    });
  }

  if (c && cPrev && c.overall < cPrev.overall - 5) {
    recs.push({
      title: "Cognitive performance is trending down",
      body: "Your assessment performance decreased compared with your previous session. Consider discussing the results with a healthcare professional.",
      tone: "elevated",
    });
  }
  if (c) {
    const areas: { name: string; score: number }[] = [
      { name: "memory", score: c.memory },
      { name: "attention", score: c.attention },
      { name: "recall", score: c.recall },
      { name: "reaction", score: c.reaction },
      { name: "pattern", score: c.pattern },
    ];
    areas.sort((a, b) => a.score - b.score);
    const weakest = areas[0]!.name;
    recs.push({
      title: `Cognitive exercises for ${weakest}`,
      body:
        weakest === "memory"
          ? "Practise number recall, card matching and sequence games."
          : weakest === "attention"
            ? "Practise symbol matching, target selection and focus games."
            : weakest === "reaction"
              ? "Practise reaction games and visual response exercises."
              : weakest === "recall"
                ? "Practise object recall and delayed-recall exercises."
                : "Practise pattern recognition sequences.",
      tone: "monitor",
    });
  }

  if (s && (s.level === "elevated" || s.level === "high")) {
    recs.push({
      title: "Review your stroke risk factors with a healthcare professional",
      body: "Check blood pressure and blood glucose, review cardiovascular risk factors, and seek professional medical evaluation. This screening cannot confirm whether a stroke will occur.",
      tone: s.level,
    });
  } else if (s) {
    recs.push({
      title: "Keep monitoring general health metrics",
      body: "Regular activity appropriate for you, a healthy diet, avoiding smoking, and periodic blood pressure and glucose checks.",
      tone: "low",
    });
  }

  recs.push({
    title: "Complete your next assessment in 30 days",
    body: `Your next scheduled screening is ${formatDate(nextAssessmentDate(assessments))}.`,
    tone: "monitor",
  });

  return recs;
}

export function overallStatus(assessments: Assessment[]): { level: RiskLevel; text: string } {
  const levels: RiskLevel[] = [];
  const p = latestOf(assessments, "parkinson")?.parkinson;
  const c = latestOf(assessments, "cognitive")?.cognitive;
  const s = latestOf(assessments, "stroke")?.stroke;
  [p?.level, c?.level, s?.level].forEach((l) => l && levels.push(l));
  if (levels.length === 0) return { level: "monitor", text: "No assessment yet" };
  const order: RiskLevel[] = ["low", "monitor", "elevated", "high"];
  const worst = levels.reduce((acc, l) => (order.indexOf(l) > order.indexOf(acc) ? l : acc), "low" as RiskLevel);
  return {
    level: worst,
    text: worst === "low" ? "On Track" : worst === "monitor" ? "Keep Monitoring" : worst === "elevated" ? "Needs Attention" : "Seek Professional Evaluation",
  };
}
