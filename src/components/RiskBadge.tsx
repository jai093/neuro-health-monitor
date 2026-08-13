import { AlertTriangle, CheckCircle2, Eye, ShieldAlert } from "lucide-react";
import { RISK_META, type RiskLevel } from "@/lib/neuro-store";
import { cn } from "@/lib/utils";

const styles: Record<RiskLevel, string> = {
  low: "bg-risk-low-soft text-risk-low border-risk-low/30",
  monitor: "bg-risk-monitor-soft text-risk-monitor border-risk-monitor/30",
  elevated: "bg-risk-elevated-soft text-risk-elevated border-risk-elevated/30",
  high: "bg-risk-high-soft text-risk-high border-risk-high/30",
};

const icons: Record<RiskLevel, typeof CheckCircle2> = {
  low: CheckCircle2,
  monitor: Eye,
  elevated: AlertTriangle,
  high: ShieldAlert,
};

export function RiskBadge({
  level,
  label,
  className,
}: {
  level: RiskLevel;
  label?: string;
  className?: string;
}) {
  const Icon = icons[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold",
        styles[level],
        className,
      )}
    >
      <Icon className="size-4" aria-hidden />
      {label ?? RISK_META[level].label}
    </span>
  );
}

export function ScoreRing({ value, caption }: { value: number; caption?: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="grid size-24 place-items-center rounded-full border-4 border-primary/25 bg-primary/5"
        role="img"
        aria-label={`${caption ?? "Score"} ${value} out of 100`}
      >
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground">{value}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">/100</div>
        </div>
      </div>
      {caption ? <p className="mt-2 text-sm font-medium text-muted-foreground">{caption}</p> : null}
    </div>
  );
}
