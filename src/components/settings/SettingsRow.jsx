import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const rowClass = "flex items-center gap-3 border-t border-border py-3 text-[14px] text-ink first:border-t-0";

export default function SettingsRow({ icon: Icon, label, hint, to, params, onClick, children, tone }) {
  const body = (
    <>
      <span className="flex min-w-0 items-center gap-2.5">
        {Icon ? <Icon className={cn("h-4 w-4 shrink-0", tone === "danger" ? "text-oxblood" : "text-ink-mid")} /> : null}
        <span className="min-w-0">
          <span className={cn("block leading-snug", tone === "danger" && "text-oxblood")}>{label}</span>
          {hint ? <span className="mt-0.5 block text-[12px] leading-snug text-ink-mid">{hint}</span> : null}
        </span>
      </span>
      <span className="ml-auto flex shrink-0 items-center pl-2">
        {children ?? <ChevronRight className="h-4 w-4 text-ink-mid" strokeWidth={2} />}
      </span>
    </>
  );

  if (to) {
    return (
      <Link to={to} params={params} className={rowClass}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(rowClass, "w-full text-left")}>
        {body}
      </button>
    );
  }
  return <div className={rowClass}>{body}</div>;
}