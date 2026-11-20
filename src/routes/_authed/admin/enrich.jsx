import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import AppShell from "@/components/AppShell";
import EnrichPanel from "@/components/admin/EnrichPanel";
import LibraryPanel from "@/components/admin/LibraryPanel";
import ExportPanel from "@/components/admin/ExportPanel";

export const Route = createFileRoute("/_authed/admin/enrich")({
  ssr: false,
  // Owner only: anyone else is sent home without seeing this screen exists.
  beforeLoad: ({ context }) => {
    if (context.user?.role !== "admin") throw redirect({ to: "/today" });
  },
  head: () => ({ meta: [{ title: "Library tools · Rozana" }] }),
  component: AdminEnrichPage,
});

function AdminEnrichPage() {
  return (
    <AppShell>
      <Link to="/today" className="text-small font-medium text-ink-mid">
        Back to Today
      </Link>
      <h1 className="mt-2 text-display leading-[1.05]">Library tools</h1>
      <p className="mt-2 text-small leading-relaxed text-ink-mid">
        Reads each recipe once into structured ingredients and nutrition, drafts the dishes still missing, and takes the
        whole database out as a file. Nothing already written in a recipe is changed.
      </p>

      <EnrichPanel />
      <LibraryPanel />
      <ExportPanel />
    </AppShell>
  );
}