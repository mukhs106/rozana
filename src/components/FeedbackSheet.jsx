import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import Pill from "@/components/Pill";

const fieldClass =
  "mt-2 w-full rounded-2xl bg-sand px-4 py-3 text-body text-ink outline-none placeholder:text-ink-mid focus-visible:ring-2 focus-visible:ring-primary";

/**
 * Name, email (prefilled from the account) and a message.
 * TODO(supabase): store feedback in a `feedback` table. Until then Send goes
 * nowhere: it says so, closes the sheet and keeps nothing.
 */
export default function FeedbackSheet({ open, onOpenChange, user }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(user?.is_demo ? "" : user?.full_name || "");
    setEmail(user?.is_demo ? "" : user?.email || "");
  }, [open, user]);

  const send = (event) => {
    event.preventDefault();
    toast("Feedback isn't connected yet", { description: "Nothing was sent. Please tell us in person for now." });
    onOpenChange(false);
    setMessage("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto rounded-t-3xl border-border bg-background px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6"
      >
        <SheetTitle className="text-title font-semibold leading-7">Tell us what would help</SheetTitle>
        <SheetDescription className="mt-1 text-body leading-6 text-ink-mid">
          A bug, a dish that came out wrong for someone at your table, or something you wish Rozana did.
        </SheetDescription>

        <form onSubmit={send} className="mt-5 space-y-4">
          <label className="block">
            <span className="text-body font-medium text-ink">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={fieldClass} />
          </label>
          <label className="block">
            <span className="text-body font-medium text-ink">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="text-body font-medium text-ink">Message</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              required
              placeholder="What happened, and what did you expect?"
              className={`${fieldClass} resize-none`}
            />
          </label>
          <p className="text-body leading-5 text-ink-mid">
            Sending feedback from the app isn't connected yet, so nothing is sent or saved.
          </p>
          <Pill type="submit" className="w-full" disabled={!message.trim()}>
            Send
          </Pill>
        </form>
      </SheetContent>
    </Sheet>
  );
}
