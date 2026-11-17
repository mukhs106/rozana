import { Link } from "@tanstack/react-router";
import { ClipboardPaste, PenLine } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

/** Two ways in, so adding a recipe is never a blank page. */
export default function AddRecipeSheet({ open, onOpenChange }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[14px]">
        <SheetHeader className="text-left">
          <SheetTitle className="font-serif text-[24px] font-normal">Add a recipe</SheetTitle>
          <SheetDescription className="text-[13px] leading-relaxed">
            Bring a link from a site you cook from, or write the recipe yourself.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-2 pb-2">
          <Link
            to="/recipes/new"
            search={{ mode: "link" }}
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-3 rounded-[10px] border border-border p-3"
          >
            <ClipboardPaste className="h-5 w-5 shrink-0 text-ink" />
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium">Paste a link</span>
              <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-mid">
                We read what the page offers, then you fill the gaps.
              </span>
            </span>
          </Link>

          <Link
            to="/recipes/new"
            search={{ mode: "manual" }}
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-3 rounded-[10px] border border-border p-3"
          >
            <PenLine className="h-5 w-5 shrink-0 text-ink" />
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium">Add manually</span>
              <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-mid">
                Ingredients and method in your own words.
              </span>
            </span>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}