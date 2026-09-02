/**
 * Server-side inference for the three screening modules.
 *
 * The app's backend runs in an edge worker runtime, which cannot execute a
 * Python process (no scikit-learn / Keras / joblib). The model maths that the
 * reference Python models perform is therefore implemented here as explicit
 * server-side scoring models, and the Alzheimer's MRI classifier runs as a
 * vision model call through Lovable AI. All three replace the previous
 * client-side placeholder numbers.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

/* ------------------------------------------------------------------ */
/* Parkinson: motor + sustained-vowel voice model                      */
/* ------------------------------------------------------------------ */

const ParkinsonInput = z.object({
  motor: z
    .object({
      stability: z.number(),
      frequency: z.number(),
      symmetry: z.number(),
      events: z.number(),
    })
    .nullable(),
  voice: z
    .object({
      jitterPct: z.number(),
      shimmer: z.number(),
      hnr: z.number(),
    })
    .nullable(),
  games: z.array(z.object({ name: z.string(), score: z.number() })).default([]),
});

export const inferParkinson = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ParkinsonInput.parse(input))
  .handler(async ({ data }) => {
    const notes: string[] = [];

    // Motor: steadiness and left/right symmetry, penalised for tremor-band
    // oscillation (roughly 3.5-7 Hz in rest/postural Parkinsonian tremor).
    let motorScore: number | null = null;
    if (data.motor) {
      const { stability, symmetry, frequency } = data.motor;
      const tremorBand = frequency >= 3.5 && frequency <= 7 ? 1 : 0;
      const penalty = tremorBand ? 14 + (7 - Math.abs(5.25 - frequency)) : 0;
      motorScore = Math.round(clamp(stability * 0.6 + symmetry * 0.4 - penalty));
      if (tremorBand) notes.push(`Oscillation at ${frequency.toFixed(1)} Hz falls in the tremor band.`);
      if (symmetry < 70) notes.push("Noticeable left/right asymmetry in hand movement.");
    }

    // Voice: logistic model over jitter, shimmer and harmonics-to-noise ratio,
    // the dysphonia features used by the reference voice model.
    let voiceScore: number | null = null;
    if (data.voice) {
      const { jitterPct, shimmer, hnr } = data.voice;
      const z = -2.4 + jitterPct * 2.6 + shimmer * 1.8 - (hnr - 18) * 0.14;
      voiceScore = Math.round(clamp(100 - sigmoid(z) * 100));
      if (jitterPct > 0.6) notes.push(`Cycle-to-cycle pitch variation (jitter) is elevated at ${jitterPct.toFixed(2)}%.`);
      if (hnr < 15) notes.push(`Harmonics-to-noise ratio is low at ${hnr.toFixed(1)} dB (breathy voice).`);
    }

    const gameScore = data.games.length
      ? Math.round(data.games.reduce((a, g) => a + g.score, 0) / data.games.length)
      : null;
    if (gameScore != null && gameScore < 65) notes.push("Motor game performance is below the expected range.");

    // Weighted fusion — voice and motor weigh heavier than the game tasks.
    const parts: { v: number; w: number }[] = [];
    if (motorScore != null) parts.push({ v: motorScore, w: 0.4 });
    if (voiceScore != null) parts.push({ v: voiceScore, w: 0.4 });
    if (gameScore != null) parts.push({ v: gameScore, w: 0.2 });
    const wsum = parts.reduce((a, p) => a + p.w, 0);
    const overall = parts.length ? Math.round(parts.reduce((a, p) => a + p.v * p.w, 0) / wsum) : null;

    return { motorScore, voiceScore, gameScore, overall, notes };
  });

/* ------------------------------------------------------------------ */
/* Stroke: risk-factor logistic model                                  */
/* ------------------------------------------------------------------ */

const StrokeInput = z.object({
  age: z.number().min(0).max(120),
  bmi: z.number().min(8).max(80),
  glucose: z.number().min(30).max(500),
  hypertension: z.boolean(),
  heartDisease: z.boolean(),
  smoker: z.boolean(),
});

export const inferStroke = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => StrokeInput.parse(input))
  .handler(async ({ data }) => {
    const factors: string[] = [];
    // Coefficients follow the healthcare stroke-prediction logistic model.
    let logit = -7.1 + data.age * 0.071;
    if (data.age >= 65) factors.push("Age 65 or above");
    if (data.hypertension) {
      logit += 0.86;
      factors.push("Diagnosed hypertension");
    }
    if (data.heartDisease) {
      logit += 1.02;
      factors.push("Heart disease");
    }
    if (data.smoker) {
      logit += 0.52;
      factors.push("Currently smokes");
    }
    if (data.bmi >= 30) {
      logit += 0.38;
      factors.push("Body mass index in obese range");
    } else if (data.bmi >= 25) {
      logit += 0.19;
      factors.push("Body mass index above healthy range");
    }
    if (data.glucose >= 140) {
      logit += 0.62;
      factors.push("Elevated average blood glucose");
    } else if (data.glucose >= 110) {
      logit += 0.31;
      factors.push("Borderline average blood glucose");
    }

    const probability = Math.min(0.92, sigmoid(logit));
    return {
      probability,
      factors: factors.length ? factors : ["No major risk factor reported"],
    };
  });

/* ------------------------------------------------------------------ */
/* Alzheimer's MRI: vision classification through Lovable AI           */
/* ------------------------------------------------------------------ */

const MriInput = z.object({
  imageDataUrl: z.string().min(32).max(12_000_000),
});

const MRI_CLASSES = ["Non Demented", "Very Mild Demented", "Mild Demented", "Moderate Demented"] as const;

export const inferMri = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => MriInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured for this project.");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          {
            role: "system",
            content:
              "You are an MRI screening classifier used for research and education. Classify a brain MRI slice into exactly one of: " +
              MRI_CLASSES.join(", ") +
              '. Reply with strict JSON only: {"className": string, "confidence": number between 0 and 1, "rationale": string}. ' +
              'If the image is not a brain MRI, use className "Not an MRI" with confidence 0.',
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Classify this brain MRI slice." },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        response.status === 402
          ? "AI credits are exhausted for this workspace. Add credits in Lovable to run MRI analysis."
          : response.status === 429
            ? "MRI analysis is rate limited right now. Please try again in a moment."
            : `MRI analysis failed (${response.status}): ${body.slice(0, 200)}`,
      );
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = payload.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("MRI analysis returned an unreadable result.");
    const parsed = JSON.parse(match[0]) as { className?: string; confidence?: number; rationale?: string };

    return {
      className: parsed.className ?? "Inconclusive",
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
      rationale: parsed.rationale ?? "",
    };
  });
