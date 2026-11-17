import { Link } from "@tanstack/react-router";
import { RotateCcw, Trash2 } from "lucide-react";
import { versionAddsInfo } from "@/lib/foodInfo";

export default function SavedVersionList({ versions = [], onRemove }) {
  if (!versions.length) {
    return (
      <p className="mt-1 border-t border-border py-3 text-[13px] leading-relaxed text-ink-mid">
        No saved versions yet. Save my version in the batch editor and it will show up here.
      </p>
    );
  }

  return (
    <ul className="mt-1">
      {versions.map((version) => {
        const extra = versionAddsInfo(version.recipe_title, version.version_name);
        return (
          <li key={version.id} className="flex items-start gap-3 border-t border-border py-3">
            <div className="min-w-0 flex-1">
              <p className="font-serif text-[17px] leading-tight">{version.recipe_title}</p>
              <p className="mt-0.5 text-[12.5px] text-ink-mid">
                {extra ? `${extra} · ` : ""}
                {version.total_portions} portions across {version.meal_count}{" "}
                {version.meal_count === 1 ? "meal" : "meals"}
              </p>
              {version.diner_names?.length ? (
                <p className="text-[12.5px] text-ink-mid">For {version.diner_names.join(", ")}</p>
              ) : null}
            </div>
            <Link
              to="/make/$recipeId"
              params={{ recipeId: version.recipe_id }}
              search={{ from: version.id }}
              className="mt-0.5 inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1.5 text-[12px] font-medium text-ink"
            >
              <RotateCcw className="h-3 w-3" strokeWidth={2.2} /> Again
            </Link>
            <button
              type="button"
              onClick={() => onRemove(version)}
              aria-label="Delete saved version"
              className="mt-1.5 p-1 text-ink-mid transition-colors hover:text-chili"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}