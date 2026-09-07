import { defineTool } from "@lovable.dev/mcp-js";
import { defineTool as _unused } from "@lovable.dev/mcp-js";
import { DISCLAIMER } from "../scoring";

void _unused;

const FAST = [
  { step: 1, letter: "F", name: "Face", check: "Ask the person to smile. Does one side of the face droop?" },
  { step: 2, letter: "A", name: "Arms", check: "Ask them to raise both arms. Does one arm drift downward?" },
  { step: 3, letter: "S", name: "Speech", check: "Ask them to repeat a simple sentence. Is speech slurred or strange?" },
  { step: 4, letter: "T", name: "Time", check: "If any sign is present, call emergency services immediately and note the time symptoms started." },
];

const URGENT = [
  "Sudden numbness or weakness on one side of the body",
  "Sudden confusion or trouble understanding speech",
  "Sudden loss of vision in one or both eyes",
  "Sudden severe headache with no known cause",
  "Sudden dizziness, loss of balance or coordination",
];

export default defineTool({
  name: "stroke_warning_guide",
  title: "Stroke warning guide (FAST)",
  description:
    "Return the step-by-step FAST stroke check, the list of urgent warning symptoms, and the app's emergency guidance.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const result = {
      fast: FAST,
      urgentSymptoms: URGENT,
      emergencyAdvice:
        "Any sudden FAST sign is a medical emergency. Call your local emergency number right away, do not drive yourself, and record the time symptoms began.",
      disclaimer: DISCLAIMER,
    };
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});
