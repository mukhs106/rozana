import { ArrowRight } from "lucide-react";
import Pill from "@/components/Pill";
import { Image } from "@/components/ui/image";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { SwapIcon } from "@/components/icons/AppIcons";
import { cn } from "@/lib/utils";
import { swapImages } from "@/lib/swapLibrary";
import { allergenLabel } from "@/lib/foodInfo";

function Photo({ src, label, amount }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="overflow-hidden rounded-[4px] bg-black/[0.03]">
        {src ? (
          <Image src={src} alt={label} className="aspect-square w-full object-cover" />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center px-2 text-center text-[11.5px] font-medium leading-tight text-ink-mid">
            {label}
          </div>
        )}
      </div>
      <p className="mt-1.5 text-[12px] font-semibold leading-tight">{label}</p>
      <p className="num text-[11.5px] text-ink-mid">{amount}</p>
    </div>
  );
}

/** The comparison an ingredient opens: what it becomes, who gets it, what to set aside first. */
export default function SwapSheet({
  open,
  onOpenChange,
  swap,
  fromAmount,
  toAmount,
  applied = false,
  scopes = [],
  scope,
  onScope,
  options = [],
  value,
  onSelect,
  setAside,
  onApply,
  onUndo,
  warnings = [],
}) {
  if (!swap) return null;
  const images = swapImages(swap);
  const removes = (swap.removes || []).map(allergenLabel);
  const adds = (swap.adds || []).map(allergenLabel);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto rounded-t-2xl border-border bg-background px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5"
      >
        <SheetTitle className="text-[19px] font-semibold tracking-[-0.01em]">Swap {swap.from}</SheetTitle>
        <SheetDescription className="mt-1 text-[12px] leading-snug text-ink-mid">{swap.affects}</SheetDescription>

        <div className="mt-4 flex items-start gap-2">
          <Photo src={images.from} label={swap.from} amount={fromAmount} />
          <span className="mt-10 shrink-0 text-ink-faint">
            <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
          </span>
          <Photo src={images.to} label={swap.to} amount={toAmount} />
        </div>

        {options.length > 1 ? (
          <div className="mt-5 border-t border-border pt-3">
            <p className="eyebrow">Other ways</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {options.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onSelect(option.key)}
                  aria-pressed={option.key === value}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[11.5px] font-medium transition-colors duration-150 motion-reduce:transition-none",
                    option.key === value
                      ? "border-chili bg-chili text-chili-foreground"
                      : "border-border text-ink-soft hover:border-ink-mid",
                  )}
                >
                  {option.to}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {scopes.length ? (
          <div className="mt-5">
            <p className="eyebrow">Who gets this?</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {scopes.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onScope(option.value)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[11.5px] font-medium transition-colors duration-150 motion-reduce:transition-none",
                    scope === option.value
                      ? "border-chili bg-chili text-chili-foreground"
                      : "border-border text-ink-soft hover:border-ink-mid",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-4 rounded-[8px] bg-secondary p-3">
          <p className="text-[13px] font-medium">What changes</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">
            {swap.from} becomes {swap.to}
            {removes.length || adds.length
              ? `. ${removes.length ? `Leaves out ${removes.join(", ").toLowerCase()}` : ""}${
                  removes.length && adds.length ? "; " : ""
                }${adds.length ? `brings in ${adds.join(", ").toLowerCase()}` : ""}.`
              : "."}
          </p>
          {swap.method_change ? (
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-mid">{swap.method_change}</p>
          ) : null}
          {setAside ? <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-mid">{setAside}</p> : null}
          {warnings.length ? (
            <ul className="mt-2 space-y-1">
              {warnings.map((warning) => (
                <li key={warning} className="text-[12.5px] font-medium leading-snug text-oxblood">
                  Still unresolved: {warning}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="mt-5 flex items-center gap-2">
          {applied ? (
            <Pill variant="outline" className="flex-1" onClick={onUndo}>
              Undo
            </Pill>
          ) : null}
          <Pill className="flex-1" onClick={onApply}>
            <SwapIcon className="h-4 w-4" /> {applied ? "Keep swap" : "Apply swap"}
          </Pill>
        </div>
      </SheetContent>
    </Sheet>
  );
}