import { defineMcp } from "@lovable.dev/mcp-js";
import strokeRiskTool from "./tools/stroke-risk";
import parkinsonSignalsTool from "./tools/parkinson-signals";
import interpretScoreTool from "./tools/interpret-score";
import strokeWarningGuideTool from "./tools/stroke-warning-guide";

export default defineMcp({
  name: "neuro-health-monitor",
  title: "Neuro Health Monitor",
  version: "0.1.0",
  instructions:
    "Preliminary neurological screening tools from NeuroShield AI. Estimate stroke risk from health factors, score Parkinson motor/voice measurements, interpret screening scores into risk tiers, and retrieve the FAST stroke warning guide. Personal assessment records stay on the user's own device and are not available here. Results are screening information only, never a diagnosis.",
  tools: [strokeRiskTool, parkinsonSignalsTool, interpretScoreTool, strokeWarningGuideTool],
});
