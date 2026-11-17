import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import Pill from "@/components/Pill";
import ProgressList from "@/components/admin/ProgressList";
import { enrichRecipe, getEnrichState } from "@/lib/enrich-fns";

/** Reads every recipe that has no structured data yet, one model call each. */
export default function EnrichPanel() {
  const state = useServerFn(getEnrichState);
  const enrich = useServerFn(enrichRecipe);
  const { data, isLoading, refetch } = useQuery({ queryKey: ["admin-enrich"], queryFn: () => state() });
  const [rows, setRows] = useState([]);
  const [running, setRunning] = useState(false);
  const [note, setNote] = useState("");

  const pending = data?.pending || [];
  const setRow = (key, patch) => setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  async function start() {
    setRunning(true);
    setNote("");
    const queue = pending.map((item) => ({ key: item.id, label: item.title || "Untitled", state: "waiting" }));
    setRows(queue);

    for (const item of queue) {
      setRow(item.key, { state: "running" });
      let result;
      try {
        result = await enrich({ data: { id: item.key } });
      } catch {
        setRow(item.key, { state: "failed" });
        continue;
      }
      if (!result?.ok) {
        setRow(item.key, { state: result?.outOfCredits ? "stopped" : "failed" });
        if (result?.outOfCredits) {
          setRows((prev) => prev.map((row) => (row.state === "waiting" ? { ...row, state: "stopped" } : row)));
          setNote("AI credits ran out, so the run stopped. Start it again later and it continues with the recipes still missing data.");
          break;
        }
        continue;
      }
      setRow(item.key, { state: result.skipped ? "skipped" : result.needs_review ? "review" : "done" });
    }

    setRunning(false);
    refetch();
  }

  return (
    <section className="mt-7 border-t border-border pt-5">
      <h2 className="text-[19px] leading-tight">Existing recipes</h2>
      <p className="mt-1 text-[12.5px] leading-relaxed text-ink-mid">
        {isLoading
          ? "Checking the library"
          : `${pending.length} without structured ingredients · ${data?.enriched || 0} enriched${
              data?.flagged ? ` · ${data.flagged} flagged for review` : ""
            }`}
      </p>
      <Pill className="mt-3 w-full" onClick={start} disabled={running || isLoading || !pending.length}>
        {running ? "Reading recipes" : pending.length ? `Enrich ${pending.length} recipes` : "All recipes read"}
      </Pill>
      {note ? <p className="mt-2 text-[12px] leading-snug text-chili">{note}</p> : null}
      <ProgressList items={rows} />
    </section>
  );
}