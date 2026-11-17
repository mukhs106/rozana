import { Check } from "lucide-react";
import { Image } from "@/components/ui/image";
import { versionChipLabel } from "@/lib/foodInfo";
import { cn } from "@/lib/utils";

/** Authored versions as compact photo tiles. The chosen one carries a checkmark and a border. */
export default function VersionTiles({ versions = [], value, onChange, title = "" }) {
  if (!versions.length) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      {versions.map((version) => {
        const active = version.key === value;
        return (
          <button
            key={version.key}
            type="button"
            onClick={() => onChange(version.key)}
            aria-pressed={active}
            className={cn(
              "overflow-hidden rounded-[8px] border bg-card text-left transition-colors duration-150 motion-reduce:transition-none",
              active ? "border-chili" : "border-border hover:border-ink-mid",
            )}
          >
            <span className="relative block bg-secondary">
              <Image src={version.image_url} alt={version.name} className="aspect-[4/3] w-full object-cover" />
              {active ? (
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-chili text-chili-foreground">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              ) : null}
            </span>
            <span className={cn("block px-2 py-1.5 text-[12px] font-medium leading-tight", active ? "text-chili" : "text-ink")}>
              {title ? versionChipLabel(title, version.name) : version.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}