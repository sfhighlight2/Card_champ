import { Check, Scan, FolderPlus, Zap, UserPlus, MessageSquare, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimateIn } from "../shared/AnimateIn";

export interface AchievementState {
  code: string;
  label: string;
  earned: boolean;
}

/**
 * First-run checklist.
 *
 * Driven by the `achievement_definitions` rows the server already evaluates, so
 * there is no second hardcoded list of "things a new user should do" to drift out
 * of sync — a step is complete precisely when its achievement has been earned.
 * Only the first-time steps appear; the count milestones (10, 50, 100 cards) are
 * goals rather than onboarding.
 */
const STEPS: { code: string; title: string; blurb: string; icon: LucideIcon }[] = [
  { code: "first-card",   title: "Add your first card",     blurb: "Scan a slab or enter one by hand.",          icon: Scan },
  { code: "first-folder", title: "Create a folder",         blurb: "Group cards by set, player, or anything.",    icon: FolderPlus },
  { code: "first-chase",  title: "Name a card you're after", blurb: "Your chases are visible to connections.",    icon: Zap },
  { code: "first-follow", title: "Connect with a collector", blurb: "Follow someone to see what they're hunting.", icon: UserPlus },
  { code: "first-post",   title: "Say hello in Community",   blurb: "Introduce yourself or show off a pickup.",    icon: MessageSquare },
];

interface GettingStartedProps {
  achievements: AchievementState[];
  onDismiss: () => void;
  /** Jumps to the surface where a step happens. */
  onGo: (code: string) => void;
}

export function GettingStarted({ achievements, onDismiss, onGo }: GettingStartedProps) {
  const earned = new Set(achievements.filter(a => a.earned).map(a => a.code));
  const steps = STEPS.filter(s => achievements.some(a => a.code === s.code));
  const done = steps.filter(s => earned.has(s.code)).length;

  // Nothing to nudge once every first-time step is behind them.
  if (steps.length === 0 || done === steps.length) return null;

  const next = steps.find(s => !earned.has(s.code));

  return (
    <AnimateIn>
      <div className="rounded-3xl border border-gray-100 bg-white p-4 mb-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-gray-900">Getting started</p>
            <p className="text-xs text-gray-400 mt-0.5">{done} of {steps.length} done</p>
          </div>
          <button onClick={onDismiss} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 flex-shrink-0" aria-label="Hide getting started">
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>

        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mb-4">
          <div
            className="h-full rounded-full bg-gray-950"
            style={{ width: `${(done / steps.length) * 100}%`, transition: "width 600ms cubic-bezier(0.22,1,0.36,1)" }}
          />
        </div>

        <div className="flex flex-col gap-1">
          {steps.map(step => {
            const complete = earned.has(step.code);
            const isNext = step.code === next?.code;
            const Icon = step.icon;
            return (
              <button
                key={step.code}
                onClick={() => !complete && onGo(step.code)}
                disabled={complete}
                className="flex items-center gap-3 py-2 text-left rounded-xl transition-colors disabled:cursor-default"
                style={{ opacity: complete ? 0.55 : 1 }}
              >
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: complete ? "#111111" : isNext ? "#f0fdf4" : "#f4f4f5" }}
                >
                  {complete
                    ? <Check className="w-3.5 h-3.5 text-white" />
                    : <Icon className="w-3.5 h-3.5" style={{ color: isNext ? "#16a34a" : "#9ca3af" }} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm ${complete ? "text-gray-400 line-through" : "font-semibold text-gray-900"}`}>
                    {step.title}
                  </span>
                  {!complete && <span className="block text-xs text-gray-400">{step.blurb}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </AnimateIn>
  );
}
