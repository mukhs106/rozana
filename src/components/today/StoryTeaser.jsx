import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export default function StoryTeaser() {
  return (
    <Link
      to="/info/$topic"
      params={{ topic: "our-story" }}
      className="mt-10 block rounded-3xl bg-primary p-6 text-primary-foreground"
    >
      <p className="text-small font-medium opacity-80">Our story</p>
      <p className="mt-2 text-title">One pot of dal, four people, four different rules.</p>
      <p className="mt-2 text-body opacity-90">Why Rozana cooks one batch for everyone at the table.</p>
      <span className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-background px-5 text-body font-semibold text-ink">
        Read our story <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </Link>
  );
}
