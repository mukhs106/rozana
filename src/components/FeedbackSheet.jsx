import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import Pill from "@/components/Pill";
import { CONTACT_EMAIL } from "@/lib/contact";

const fieldClass =
  "mt-2 w-full rounded-2xl bg-sand px-4 py-3 text-body text-ink outline-none placeholder:text-ink-mid focus-visible:ring-2 focus-visible:ring-primary";

/**
 * Name, email (prefilled from the account) and a message. For now Send opens
 * the person's email app with everything filled in; nothing is stored.
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
    const body = `${message.trim()}\n\nFrom: ${name.trim() || "(no name)"} <${email.trim() || "no email"}>`;
    const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Rozana feedback")}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
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
            Send opens your email app with this filled in. Nothing is sent until you send it there.
          </p>
          <Pill type="submit" className="w-full" disabled={!message.trim()}>
            Send
          </Pill>
        </form>
      </SheetContent>
    </Sheet>
  );
}
