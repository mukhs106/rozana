import { createFileRoute, useRouter } from "@tanstack/react-router";
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
  const router = useRouter();
  const goBack = () => (router.history.canGoBack() ? router.history.back() : router.navigate({ to: "/profile" }));

  return (
    <AppShell nav={false}>
      <button
        type="button"
        onClick={goBack}
        className="-ml-2 inline-flex h-11 items-center gap-1 rounded-full pl-1 pr-3 text-body font-medium text-ink"
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={2.2} /> Back
      </button>

      {!page ? (
        <>
          <h1 className="mt-3 text-display">This page doesn’t exist.</h1>
          <p className="mt-2 text-body text-ink-mid">
            It may have been renamed. Everything else is in Profile.
          </p>
        </>
      ) : (
        <>
          <h1 className="mt-3 text-display">{page.title}</h1>
          <p className="mt-2 text-heading font-normal text-ink-soft">{page.intro}</p>

          {page.missing ? (
            <p className="mt-4 border-l-2 border-primary pl-3 text-small text-primary">
              Needs your input: {page.missing}
            </p>
          ) : null}

          <div className="mt-6">
            {page.sections.map((section) => (
              <section key={section.heading} className="border-t border-border py-4">
                <h2 className="text-heading">{section.heading}</h2>
                <p className="mt-1.5 text-body text-ink-soft">{section.body}</p>
              </section>
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
}