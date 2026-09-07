import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { DISCLAIMER, clamp, riskLevelFromScore, sigmoid } from "../scoring";

export default defineTool({
  name: "score_parkinson_signals",
  title: "Score Parkinson motor and voice signals",
  description:
    "Score motor-stability and sustained-vowel voice measurements into a preliminary Parkinson screening score, with notes on tremor-band oscillation and dysphonia features.",
  inputSchema: {
    stability: z.number().min(0).max(100).optional().describe("Hand steadiness score 0-100."),
    symmetry: z.number().min(0).max(100).optional().describe("Left/right movement symmetry 0-100."),
    frequency: z.number().min(0).max(20).optional().describe("Dominant oscillation frequency in Hz."),
    jitterPct: z.number().min(0).max(10).optional().describe("Voice jitter as a percentage."),
    shimmer: z.number().min(0).max(10).optional().describe("Voice shimmer (amplitude variation)."),
    hnr: z.number().min(0).max(50).optional().describe("Harmonics-to-noise ratio in dB."),
    gameScore: z.number().min(0).max(100).optional().describe("Average motor game score 0-100."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: (input) => {
    const notes: string[] = [];
    let motorScore: number | null = null;
    if (input.stability != null && input.symmetry != null && input.frequency != null) {
      const tremorBand = input.frequency >= 3.5 && input.frequency <= 7;
      const penalty = tremorBand ? 14 + (7 - Math.abs(5.25 - input.frequency)) : 0;
      motorScore = Math.round(clamp(input.stability * 0.6 + input.symmetry * 0.4 - penalty));
      if (tremorBand) notes.push(`Oscillation at ${input.frequency.toFixed(1)} Hz falls in the tremor band.`);
      if (input.symmetry < 70) notes.push("Noticeable left/right asymmetry in hand movement.");
    }

    let voiceScore: number | null = null;
    if (input.jitterPct != null && input.shimmer != null && input.hnr != null) {
      const z = -2.4 + input.jitterPct * 2.6 + input.shimmer * 1.8 - (input.hnr - 18) * 0.14;
      voiceScore = Math.round(clamp(100 - sigmoid(z) * 100));
      if (input.jitterPct > 0.6) notes.push(`Jitter is elevated at ${input.jitterPct.toFixed(2)}%.`);
      if (input.hnr < 15) notes.push(`Harmonics-to-noise ratio is low at ${input.hnr.toFixed(1)} dB.`);
    }

    const gameScore = input.gameScore ?? null;
    if (gameScore != null && gameScore < 65) notes.push("Motor game performance is below the expected range.");

    const parts: { v: number; w: number }[] = [];
    if (motorScore != null) parts.push({ v: motorScore, w: 0.4 });
    if (voiceScore != null) parts.push({ v: voiceScore, w: 0.4 });
    if (gameScore != null) parts.push({ v: gameScore, w: 0.2 });
    if (!parts.length) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Provide either the motor set (stability, symmetry, frequency), the voice set (jitterPct, shimmer, hnr), or a gameScore.",
          },
        ],
        isError: true,
      };
    }
    const wsum = parts.reduce((a, p) => a + p.w, 0);
    const overall = Math.round(parts.reduce((a, p) => a + p.v * p.w, 0) / wsum);
    const tier = riskLevelFromScore(overall);

    const result = {
      motorScore,
      voiceScore,
      gameScore,
      overall,
      riskLevel: tier.level,
      riskLabel: tier.label,
      notes,
      disclaimer: DISCLAIMER,
    };
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});
