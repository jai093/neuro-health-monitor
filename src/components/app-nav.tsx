import { Link } from "@tanstack/react-router";
import {
  Activity,
  Brain,
  CalendarClock,
  Heart,
  History,
  LayoutDashboard,
  Lightbulb,
  Menu,
  ShieldAlert,
  User,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/parkinson", label: "Parkinson Screening", icon: Activity },
  { to: "/cognitive", label: "Cognitive Assessment", icon: Brain },
  { to: "/stroke", label: "Stroke Risk", icon: Heart },
  { to: "/progress", label: "Monthly Progress", icon: CalendarClock },
  { to: "/history", label: "Assessment History", icon: History },
  { to: "/recommendations", label: "Recommendations", icon: Lightbulb },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/emergency", label: "Emergency & Disclaimer", icon: ShieldAlert },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {links.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: to === "/" }}
          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
        >
          <Icon className="size-4.5 shrink-0" aria-hidden />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

function Wordmark() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
        <Brain className="size-5" aria-hidden />
      </span>
      <span>
        <span className="block font-display text-base font-extrabold tracking-tight">NeuroShield AI</span>
        <span className="block text-[11px] text-muted-foreground">Screen. Monitor. Understand.</span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-72 shrink-0 border-r border-border bg-sidebar px-4 py-6 lg:flex lg:flex-col">
        <Wordmark />
        <div className="mt-8 flex-1">
          <NavLinks />
        </div>
        <p className="mt-6 rounded-xl bg-secondary p-3 text-[11px] leading-relaxed text-secondary-foreground">
          Preliminary screening only. Not a medical diagnosis.
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
          <Wordmark />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle navigation"
            className="grid size-10 place-items-center rounded-xl border border-border"
          >
            <Menu className="size-5" aria-hidden />
          </button>
        </header>
        {open ? (
          <div className="border-b border-border bg-sidebar px-4 py-3 lg:hidden">
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        ) : null}

        <main className={cn("flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10")}>
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>

        <footer className="border-t border-border px-4 py-6 text-xs leading-relaxed text-muted-foreground sm:px-6 lg:px-10">
          NeuroShield AI is an educational and preliminary screening platform. It does not diagnose, treat,
          cure, or prevent neurological diseases. AI results are not a substitute for professional medical
          evaluation. If you have concerning or emergency symptoms, seek appropriate medical care.
        </footer>
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
