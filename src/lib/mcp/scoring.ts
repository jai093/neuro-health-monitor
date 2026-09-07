/**
 * Pure scoring helpers shared by the MCP tools.
 * Mirrors the app's own screening maths; no env reads, no I/O.
 */
export const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

export function riskLevelFromScore(score: number) {
  if (score >= 85) return { level: "low", label: "Low Concern" };
  if (score >= 70) return { level: "monitor", label: "Monitor" };
  if (score >= 55) return { level: "elevated", label: "Elevated Concern" };
  return { level: "high", label: "High Concern" };
}

export function strokeRiskLevel(p: number) {
  if (p < 0.08) return { level: "low", label: "Low Concern" };
  if (p < 0.2) return { level: "monitor", label: "Monitor" };
  if (p < 0.35) return { level: "elevated", label: "Elevated Concern" };
  return { level: "high", label: "High Concern" };
}

export const DISCLAIMER =
  "NeuroShield AI provides preliminary screening information only. It is not a diagnosis and never replaces evaluation by a qualified healthcare professional. Call emergency services immediately for sudden stroke symptoms.";
