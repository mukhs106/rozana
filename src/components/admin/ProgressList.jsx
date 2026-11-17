import { cn } from "@/lib/utils";

const STATES = {
  waiting: { label: "Waiting", className: "text-ink-faint" },
  running: { label: "Reading", className: "text-ink-mid" },
  done: { label: "Done", className: "text-ink" },
  review: { label: "Needs review", className: "text-plum" },
  skipped: { label: "Already done", className: "text-ink-faint" },
  failed: { label: "Failed", className: "text-chili" },
  stopped: { label: "Stopped", className: "text-ink-faint" },
};

/** One line per item, so a long AI run can be watched rather than waited on. */
export default function ProgressList({ items = [] }) {
  if (!items.length) return null;
  return (
    <ul className="mt-3">
      {items.map((item) => {
        const state = STATES[item.state] || STATES.waiting;
        return (
          <li key={item.key} className="flex items-baseline gap-3 border-t border-border py-2">
            <span className="min-w-0 flex-1 truncate text-body leading-snug">{item.label}</span>
            <span className={cn("shrink-0 text-small font-medium", state.className)}>
              {item.state === "running" ? "Reading…" : state.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}