/**
 * Export helpers: CSV downloads and a printable clinician summary
 * (the browser's print dialog lets the user save it as a PDF).
 * Everything is generated on-device from the local store.
 */
import { formatDate, latestOf, overallStatus, RISK_META, type NeuroState } from "./neuro-store";

const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function assessmentsToCsv(state: NeuroState): string {
  const header = [
    "Date",
    "Session",
    "Motor & Voice (/100)",
    "Motor Risk Level",
    "Cognitive (/100)",
    "Cognitive Risk Level",
    "Memory",
    "Attention",
    "Recall",
    "Reaction",
    "Pattern",
    "Stroke Risk (%)",
    "Stroke Risk Level",
  ];
  const rows = state.assessments.map((a) => [
    formatDate(a.date),
    a.label,
    a.parkinson?.overall ?? "",
    a.parkinson ? RISK_META[a.parkinson.level].label : "",
    a.cognitive?.overall ?? "",
    a.cognitive ? RISK_META[a.cognitive.level].label : "",
    a.cognitive?.memory ?? "",
    a.cognitive?.attention ?? "",
    a.cognitive?.recall ?? "",
    a.cognitive?.reaction ?? "",
    a.cognitive?.pattern ?? "",
    a.stroke ? Math.round(a.stroke.probability * 100) : "",
    a.stroke ? RISK_META[a.stroke.level].label : "",
  ]);
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
}

export function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Plain-text referral summary of the most recent results. */
export function referralSummaryText(state: NeuroState): string {
  const { assessments, profile } = state;
  const status = overallStatus(assessments);
  const p = latestOf(assessments, "parkinson")?.parkinson;
  const c = latestOf(assessments, "cognitive")?.cognitive;
  const s = latestOf(assessments, "stroke")?.stroke;

  const lines: string[] = [
    "NEUROSHIELD AI — DOCTOR REFERRAL SUMMARY",
    `Generated: ${formatDate(new Date())}`,
    "",
    "PATIENT",
    `Name: ${profile.fullName || "—"}    Age: ${profile.age || "—"}    Gender: ${profile.gender || "—"}`,
    `Existing conditions: ${profile.conditions || "—"}`,
    `Current medications: ${profile.medications || "—"}`,
    "",
    `OVERALL SCREENING STATUS: ${status.text} (${RISK_META[status.level].label})`,
    `Sessions completed: ${assessments.length}`,
    "",
    "LATEST RESULTS",
    p
      ? `- Motor & voice: ${p.overall}/100 (${RISK_META[p.level].label}) — motor ${p.motorScore}, voice ${p.voiceScore}`
      : "- Motor & voice: not assessed",
    c
      ? `- Cognitive: ${c.overall}/100 (${RISK_META[c.level].label}) — memory ${c.memory}, attention ${c.attention}, recall ${c.recall}, reaction ${c.reaction}, pattern ${c.pattern}`
      : "- Cognitive: not assessed",
    s
      ? `- Stroke risk estimate: ${Math.round(s.probability * 100)}% (${RISK_META[s.level].label}) — factors: ${s.factors.join(", ") || "none flagged"}`
      : "- Stroke risk: not assessed",
    "",
    "NOTE: NeuroShield AI is an educational screening tool. These results are preliminary",
    "indicators only and do not constitute a medical diagnosis.",
  ];
  return lines.join("\n");
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function buildReportHtml(state: NeuroState, title: string): string {
  const { assessments, profile } = state;
  const status = overallStatus(assessments);
  const rows = [...assessments]
    .reverse()
    .map(
      (a) => `<tr>
        <td>${formatDate(a.date)}</td>
        <td>${escapeHtml(a.label)}</td>
        <td>${a.parkinson ? `${a.parkinson.overall}/100 (${RISK_META[a.parkinson.level].short})` : "—"}</td>
        <td>${a.cognitive ? `${a.cognitive.overall}/100 (${RISK_META[a.cognitive.level].short})` : "—"}</td>
        <td>${a.stroke ? `${Math.round(a.stroke.probability * 100)}% (${RISK_META[a.stroke.level].short})` : "—"}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; color: #111; margin: 40px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 14px; margin: 24px 0 8px; text-transform: uppercase; letter-spacing: .08em; color: #444; }
  p, td, th { font-size: 13px; }
  .muted { color: #666; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border: 1px solid #ccc; padding: 8px 10px; text-align: left; }
  th { background: #f2f4f6; }
  .banner { border: 1px solid #ccc; border-radius: 8px; padding: 12px 16px; margin-top: 16px; }
  .foot { margin-top: 28px; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 12px; }
</style></head><body>
  <h1>NeuroShield AI — Clinician Summary</h1>
  <p class="muted">Generated ${formatDate(new Date())} · Preliminary screening report, not a diagnosis</p>

  <h2>Patient</h2>
  <p>Name: ${escapeHtml(profile.fullName || "—")} · Age: ${escapeHtml(profile.age || "—")} · Gender: ${escapeHtml(profile.gender || "—")}</p>
  <p>Existing conditions: ${escapeHtml(profile.conditions || "—")}</p>
  <p>Current medications: ${escapeHtml(profile.medications || "—")}</p>

  <h2>Current status</h2>
  <div class="banner"><strong>${status.text}</strong> — risk tier: ${RISK_META[status.level].label}. Sessions completed: ${assessments.length}.</div>

  <h2>Assessment history</h2>
  <table>
    <thead><tr><th>Date</th><th>Session</th><th>Motor &amp; voice</th><th>Cognitive</th><th>Stroke risk</th></tr></thead>
    <tbody>${rows || `<tr><td colspan="5">No assessments recorded.</td></tr>`}</tbody>
  </table>

  <p class="foot">NeuroShield AI is an educational and preliminary screening tool. Scores are produced by heuristic
  models from tasks completed on a consumer device and can be affected by environment, fatigue and practice effects.
  They do not diagnose, treat, cure or prevent any disease. Please interpret alongside a clinical evaluation.</p>
</body></html>`;
}

/** Opens a printable report window; the user picks "Save as PDF" in the print dialog. */
export function openPrintableReport(state: NeuroState, title = "NeuroShield AI — Clinician Summary") {
  const html = buildReportHtml(state, title);
  const w = window.open("", "_blank", "width=860,height=1000");
  if (!w) throw new Error("popup-blocked");
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}
