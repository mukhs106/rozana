import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import AppShell from "@/components/AppShell";
import { INFO_TOPICS } from "@/lib/infoContent";

export const Route = createFileRoute("/_authed/info/$topic")({
  ssr: false,
  head: ({ params }) => ({
    meta: [{ title: `${INFO_TOPICS[params.topic]?.title || "Info"} · Rozana` }],
  }),
  component: InfoPage,
});

function InfoPage() {
  const { topic } = Route.useParams();
  const page = INFO_TOPICS[topic];

  return (
    <AppShell nav={false}>
      <Link
        to="/profile"
        className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint"
      >
        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.4} /> Profile
      </Link>

      {!page ? (
        <>
          <h1 className="mt-3 font-heading text-[28px] leading-tight">This page doesn’t exist.</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-mid">
            It may have been renamed. Everything else is in Profile.
          </p>
        </>
      ) : (
        <>
          <h1 className="mt-3 font-heading text-[30px] leading-[1.04] tracking-[-0.03em]">{page.title}</h1>
          <p className="mt-2 font-serif text-[17px] leading-snug text-ink-soft">{page.intro}</p>

          {page.missing ? (
            <p className="mt-4 border-l-2 border-oxblood pl-3 text-[11.5px] leading-snug text-oxblood">
              Needs your input: {page.missing}
            </p>
          ) : null}

          <div className="mt-6">
            {page.sections.map((section) => (
              <section key={section.heading} className="border-t border-border py-3">
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-ink">{section.heading}</h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{section.body}</p>
              </section>
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
}