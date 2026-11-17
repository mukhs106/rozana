import { Link } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { useState } from "react";
import Pill from "@/components/Pill";
import { Image } from "@/components/ui/image";
import { cookMinutesOf, heatOf, versionAddsInfo, versionChipLabel } from "@/lib/foodInfo";
import { slotPhrase } from "@/lib/slots";
import { cn } from "@/lib/utils";

/**
 * An open slot is a decision, not a poster: the dish, the versions someone can
 * preview, a repeat of the version they saved before, and one way in.
 */
export default function OpenSlotCard({ recipe, slot, saved = [] }) {
  const versions = recipe.variations || [];
  const [versionKey, setVersionKey] = useState(versions[0]?.key ?? null);
  const active = versions.find((version) => version.key === versionKey) || null;
  const hero = active?.image_url || recipe.image_url;
  const minutes = cookMinutesOf(recipe);
  const heat = heatOf(recipe, active?.key);
  const again = saved[0] || null;
  const againName = again ? versionAddsInfo(recipe.title, again.version_name) : null;

  return (
    <section>
      <div className="-mx-5 overflow-hidden bg-secondary">
        <Image
          key={hero}
          src={hero}
          alt={active?.name || recipe.title}
          className="h-[200px] w-full object-cover object-center sm:h-[250px]"
          fittingType="fill"
        />
      </div>

      <h1 className="mt-4 font-serif text-[34px] leading-[1.03]">{recipe.title}</h1>
      <p className="mt-1.5 text-[14px] leading-snug text-ink-soft">
        {slotPhrase(slot.date, slot.type)} is open
        {minutes ? ` · ${minutes} min` : ""}
        {` · ${heat.label}`}
      </p>

      {versions.length ? (
        <div className="mt-4">
          <div className="flex flex-wrap gap-1.5">
            {versions.map((version) => {
              const selected = version.key === versionKey;
              return (
                <button
                  key={version.key}
                  type="button"
                  onClick={() => setVersionKey(version.key)}
                  aria-pressed={selected}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                    selected ? "border-oxblood bg-oxblood text-field-paper" : "border-border text-ink-mid hover:border-ink-mid",
                  )}
                >
                  {versionChipLabel(recipe.title, version.name)}
                </button>
              );
            })}
          </div>
          {active?.summary ? (
            <p className="mt-2 text-[12.5px] leading-snug text-ink-mid">{active.summary}</p>
          ) : null}
        </div>
      ) : null}

      {again ? (
        <Link
          to="/make/$recipeId"
          params={{ recipeId: recipe.id }}
          search={{ from: again.id }}
          className="mt-4 flex items-center gap-2 border-t border-border py-3 text-[13.5px] font-medium text-chili"
        >
          <RotateCcw className="h-4 w-4" strokeWidth={2.2} />
          Make your {againName || recipe.title.toLowerCase()} again
        </Link>
      ) : null}

      <Pill
        as={Link}
        to="/make/$recipeId"
        params={{ recipeId: recipe.id }}
        search={active ? { version: active.key } : {}}
        className="mt-3 w-full"
      >
        Make it yours
      </Pill>

      <Link
        to="/recipes/$recipeId"
        params={{ recipeId: recipe.id }}
        search={active ? { version: active.key } : {}}
        className="mt-3 block text-center text-[13px] text-ink-mid"
      >
        See the recipe
      </Link>
    </section>
  );
}