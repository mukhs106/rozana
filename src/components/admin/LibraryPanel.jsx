import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import Pill from "@/components/Pill";
import ProgressList from "@/components/admin/ProgressList";
import { createDraftRecipe, getEnrichState } from "@/lib/enrich-fns";
import { DRAFT_LIBRARY, alreadyInLibrary } from "@/lib/enrich-schema";

/** One draft dish per call, saved as a draft nobody but the owner sees. */
export default function LibraryPanel() {
  const state = useServerFn(getEnrichState);
  const createDraft = useServerFn(createDraftRecipe);
  const { data, refetch } = useQuery({ queryKey: ["admin-enrich"], queryFn: () => state() });
  const [rows, setRows] = useState([]);
  const [running, setRunning] = useState(false);
  const [note, setNote] = useState("");

  const titles = data?.titles || [];
  const missing = DRAFT_LIBRARY.filter((name) => !alreadyInLibrary(name, titles));
  const setRow = (key, patch) => setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  async function start() {
    setRunning(true);
    setNote("");
    const queue = missing.map((name) => ({ key: name, label: name.replace(/^\w/, (c) => c.toUpperCase()), state: "waiting" }));
    setRows(queue);

    for (const item of queue) {
      setRow(item.key, { state: "running" });
      let result;
      try {
        result = await createDraft({ data: { name: item.key } });
      } catch {
        setRow(item.key, { state: "failed" });
        continue;
      }
      if (!result?.ok) {
        setRow(item.key, { state: result?.outOfCredits ? "stopped" : "failed" });
        if (result?.outOfCredits) {
          setRows((prev) => prev.map((row) => (row.state === "waiting" ? { ...row, state: "stopped" } : row)));
          setNote("AI credits ran out, so the run stopped. Start it again later and it continues with the dishes still missing.");
          break;
        }
        continue;
      }
      setRow(item.key, { state: result.skipped ? "skipped" : "done" });
    }

    setRunning(false);
    refetch();
  }

  return (
    <section className="mt-7 border-t border-border pt-5">
      <h2 className="text-[19px] leading-tight">Grow the library</h2>
      <p className="mt-1 text-[12.5px] leading-relaxed text-ink-mid">
        {missing.length
          ? `${missing.length} of ${DRAFT_LIBRARY.length} dishes still to draft · ${data?.drafts?.length || 0} drafts waiting for review`
          : `All ${DRAFT_LIBRARY.length} dishes are drafted · ${data?.drafts?.length || 0} drafts waiting for review`}
      </p>
      <Pill className="mt-3 w-full" variant="outline" onClick={start} disabled={running || !missing.length}>
        {running ? "Writing drafts" : "Draft the missing dishes"}
      </Pill>
      <p className="mt-2 text-[11.5px] leading-snug text-ink-faint">
        Drafts stay hidden from the library until you publish them.
      </p>
      {note ? <p className="mt-2 text-[12px] leading-snug text-chili">{note}</p> : null}
      <ProgressList items={rows} />
    </section>
  );
}