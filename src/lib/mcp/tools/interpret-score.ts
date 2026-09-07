import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { DISCLAIMER, riskLevelFromScore, strokeRiskLevel } from "../scoring";

const ADVICE: Record<string, string> = {
  low: "No significant concern detected in this screening. Repeat the assessment next month to keep building a baseline.",
  monitor: "Results are within a watchful range. Keep to monthly screening and note any new symptoms.",
  elevated: "Several signals fell outside the usual range. Discussing the results with a healthcare professional is appropriate.",
  high: "Results suggest a professional neurological or cardiovascular evaluation should be arranged promptly.",
};

export default defineTool({
  name: "interpret_score",
  title: "Interpret a screening score",
  description:
    "Turn a NeuroShield screening score (0-100 for Parkinson/cognitive, or a 0-1 probability for stroke) into its risk tier and the guidance the app shows for that tier.",
  inputSchema: {
    kind: z.enum(["parkinson", "cognitive", "stroke"]).describe("Which module the value came from."),
    value: z
      .number()
      .describe("Score 0-100 for parkinson/cognitive, or stroke probability between 0 and 1."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ kind, value }) => {
    const tier = kind === "stroke" ? strokeRiskLevel(value) : riskLevelFromScore(value);
    const result = {
      kind,
      value,
      riskLevel: tier.level,
      riskLabel: tier.label,
      guidance: ADVICE[tier.level],
      disclaimer: DISCLAIMER,
    };
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});
