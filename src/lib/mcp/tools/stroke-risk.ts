import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { DISCLAIMER, sigmoid, strokeRiskLevel } from "../scoring";

export default defineTool({
  name: "estimate_stroke_risk",
  title: "Estimate stroke risk",
  description:
    "Estimate a preliminary stroke risk probability and risk tier from general health risk factors, using the same logistic model as the app's stroke screening module.",
  inputSchema: {
    age: z.number().min(0).max(120).describe("Age in years."),
    bmi: z.number().min(8).max(80).describe("Body mass index."),
    glucose: z.number().min(30).max(500).describe("Average blood glucose level (mg/dL)."),
    hypertension: z.boolean().describe("Diagnosed with high blood pressure."),
    heartDisease: z.boolean().describe("Diagnosed with heart disease."),
    smoker: z.boolean().describe("Currently smokes."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ age, bmi, glucose, hypertension, heartDisease, smoker }) => {
    const factors: string[] = [];
    let logit = -7.1 + age * 0.071;
    if (age >= 65) factors.push("Age 65 or above");
    if (hypertension) {
      logit += 0.86;
      factors.push("Diagnosed hypertension");
    }
    if (heartDisease) {
      logit += 1.02;
      factors.push("Heart disease");
    }
    if (smoker) {
      logit += 0.52;
      factors.push("Currently smokes");
    }
    if (bmi >= 30) {
      logit += 0.38;
      factors.push("Body mass index in obese range");
    } else if (bmi >= 25) {
      logit += 0.19;
      factors.push("Body mass index above healthy range");
    }
    if (glucose >= 140) {
      logit += 0.62;
      factors.push("Elevated average blood glucose");
    } else if (glucose >= 110) {
      logit += 0.31;
      factors.push("Borderline average blood glucose");
    }

    const probability = Math.min(0.92, sigmoid(logit));
    const tier = strokeRiskLevel(probability);
    const result = {
      probabilityPercent: Number((probability * 100).toFixed(1)),
      riskLevel: tier.level,
      riskLabel: tier.label,
      factors: factors.length ? factors : ["No major risk factor reported"],
      disclaimer: DISCLAIMER,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});
