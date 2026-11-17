import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import Pill from "@/components/Pill";
import { exportAllData } from "@/lib/enrich-fns";

/** Every entity in one file, so the data is never locked inside the app. */
export default function ExportPanel() {
  const runExport = useServerFn(exportAllData);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function download() {
    setBusy(true);
    setNote("");
    try {
      const result = await runExport();
      const blob = new Blob([JSON.stringify({ exported_at: result.exported_at, ...result.data }, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `rozana-export-${result.exported_at.slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setNote(
        Object.entries(result.counts)
          .map(([name, count]) => `${count} ${name}`)
          .join(" · "),
      );
    } catch {
      setNote("The export could not be built just now.");
    }
    setBusy(false);
  }

  return (
    <section className="mt-7 border-t border-border pt-5">
      <h2 className="text-[19px] leading-tight">Export</h2>
      <p className="mt-1 text-[12.5px] leading-relaxed text-ink-mid">
        Recipes, plans, groceries, households, saved versions, settings and user profiles in one JSON file.
      </p>
      <Pill className="mt-3 w-full" variant="outline" onClick={download} disabled={busy}>
        {busy ? "Building the file" : "Export all data"}
      </Pill>
      {note ? <p className="mt-2 text-[11.5px] leading-snug text-ink-faint">{note}</p> : null}
    </section>
  );
}