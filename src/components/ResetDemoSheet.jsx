import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import Pill from "@/components/Pill";
import { resetDemo } from "@/lib/demo";

/** Asks before putting the demo back to its starting data. Used from Profile and the Demo label. */
export default function ResetDemoSheet({ open, onOpenChange }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-border bg-background px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6"
      >
        <SheetTitle className="pr-12 text-title font-semibold">Start the demo again?</SheetTitle>
        <SheetDescription className="mt-1 text-body leading-6 text-ink-mid">
          Puts back the sample family, their week and the grocery list. Anything you changed in the demo is cleared.
        </SheetDescription>
        <div className="mt-5 flex flex-col gap-2">
          <Pill className="w-full" onClick={resetDemo}>
            Reset demo
          </Pill>
          <Pill variant="soft" className="w-full" onClick={() => onOpenChange(false)}>
            Keep my changes
          </Pill>
        </div>
      </SheetContent>
    </Sheet>
  );
}
