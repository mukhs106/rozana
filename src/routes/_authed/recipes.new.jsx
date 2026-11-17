import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ChevronLeft, Loader2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import Pill from "@/components/Pill";
import { db } from "@/api/db";
import { importRecipeFromUrl } from "@/lib/recipe-import";
import { useIsDemo } from "@/hooks/useDemo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authed/recipes/new")({
  ssr: false,
  validateSearch: (search) => ({
    mode: search.mode === "manual" ? "manual" : "link",
  }),
  head: () => ({ meta: [{ title: "Add a recipe · Rozana" }] }),
  component: NewRecipePage,
});

const UNITS = ["g", "kg", "ml", "l", "tsp", "tbsp", "cup", "clove", "cloves", "can", "cans", "bunch", "bunches", "sprig", "sprigs", "piece", "pieces", "slice", "slices", "pinch"];

function parseAmount(raw) {
  if (!raw) return 0;
  if (raw.includes("/")) {
    const [top, bottom] = raw.split("/").map(Number);
    return bottom ? top / bottom : Number(top) || 0;
  }
  return Number(raw) || 0;
}

function parseIngredient(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^([\d./]+)\s*([a-zA-Z]+)?\s*(.*)$/);
  // No allergen field at all: the app reads that as "unknown", never as allergen-free.
  if (!match || !match[3]) return { name: trimmed, qty: 0, unit: "" };
  const [, qtyRaw, unitRaw, rest] = match;
  const unit = unitRaw && UNITS.includes(unitRaw.toLowerCase()) ? unitRaw.toLowerCase() : "";
  const name = unit ? rest : [unitRaw, rest].filter(Boolean).join(" ");
  return { name: name.trim(), qty: parseAmount(qtyRaw), unit };
}

const EMPTY_FORM = {
  title: "",
  image_url: "",
  servings: "",
  cook_minutes: "",
  description: "",
  ingredients: "",
  instructions: "",
};

/** The gaps someone has to close before this becomes a recipe they can cook. */
function gapsFor(form) {
  return [
    !form.title.trim() && "Dish name",
    !form.servings && "Servings",
    !form.cook_minutes && "Cook time",
    !form.ingredients.trim() && "Ingredients",
    !form.instructions.trim() && "Method",
  ].filter(Boolean);
}

function Field({ label, hint, children }) {
  return (
    <label className="block border-t border-border pt-3">
      <span className="text-small font-medium text-ink-mid">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-small leading-snug text-ink-mid">{hint}</span> : null}
    </label>
  );
}

function NewRecipePage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const runImport = useServerFn(importRecipeFromUrl);
  const demo = useIsDemo();

  const [step, setStep] = useState(search.mode === "manual" ? "manual" : "link");
  const [link, setLink] = useState("");
  const [importing, setImporting] = useState(false);
  const [note, setNote] = useState(null);
  const [source, setSource] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const gaps = gapsFor(form);
  const blocking = gaps.filter((gap) => ["Dish name", "Ingredients", "Method"].includes(gap));

  const readLink = async () => {
    // Link import uses AI on the server; the demo never calls the server.
    if (demo) return;
    const url = link.trim();
    if (!url) {
      setNote({ tone: "error", text: "Paste the recipe link first." });
      return;
    }
    setImporting(true);
    setNote(null);
    try {
      const result = await runImport({ data: { url } });
      setSource({ url: result.source_url || url, name: result.source_name || "" });

      if (!result.ok) {
        setForm((current) => ({ ...current, image_url: result.image_url || current.image_url }));
        setStep("manual");
        setNote({ tone: "error", text: result.error });
        return;
      }

      const recipe = result.recipe;
      const next = {
        title: recipe.title || "",
        image_url: recipe.image_url || "",
        servings: recipe.base_servings ? String(recipe.base_servings) : "",
        cook_minutes: recipe.cook_minutes ? String(recipe.cook_minutes) : "",
        description: recipe.description || "",
        ingredients: recipe.ingredients
          .map((item) => [item.qty || "", item.unit || "", item.name].filter(Boolean).join(" "))
          .join("\n"),
        instructions: recipe.instructions.join("\n"),
      };
      setForm(next);
      setStep("preview");
      setNote({
        tone: "ok",
        text: `Read ${recipe.ingredients.length} ingredients from ${result.source_name}. Check anything that looks off, then fill the gaps.`,
      });
    } catch {
      setSource({ url });
      setStep("manual");
      setNote({ tone: "error", text: "That link could not be read. Fill the recipe in by hand; the link is kept." });
    } finally {
      setImporting(false);
    }
  };

  const save = async () => {
    if (blocking.length) {
      toast.error(`Fill in ${blocking.join(", ").toLowerCase()} first`);
      return;
    }
    setSaving(true);
    try {
      const created = await db.Recipe.create({
        title: form.title.trim(),
        description: form.description.trim(),
        image_url: form.image_url.trim(),
        base_servings: Number(form.servings) || 4,
        cook_minutes: Number(form.cook_minutes) || 0,
        source_url: source?.url || "",
        base_ingredients: form.ingredients.split("\n").map(parseIngredient).filter(Boolean),
        base_instructions: form.instructions
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        variations: [],
        swaps: [],
        tags: [],
        is_seeded: false,
        sort_order: 50,
      });
      toast.success(source ? "Recipe saved with its source" : "Recipe saved");
      navigate({ to: "/recipes/$recipeId", params: { recipeId: created.id } });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <Link to="/recipes" className="inline-flex items-center gap-1 text-body text-ink-mid">
        <ChevronLeft className="h-4 w-4" strokeWidth={2.2} /> Recipes
      </Link>

      <h1 className="mt-3 text-display leading-tight">Add a recipe</h1>
      <p className="mt-1.5 text-body leading-relaxed text-ink-soft">
        Start from a link you already cook from, or write it yourself. Everything stays editable.
      </p>

      <div className="mt-5 flex gap-1.5">
        {[
          { key: "link", label: "Paste a link" },
          { key: "manual", label: "Add manually" },
        ].map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => {
              setStep(option.key === "link" && form.title ? "preview" : option.key);
              setNote(null);
            }}
            aria-pressed={step === option.key || (option.key === "link" && step === "preview")}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-small font-medium",
              step === option.key || (option.key === "link" && step === "preview")
                ? "border-oxblood bg-oxblood text-field-paper"
                : "border-border text-ink-mid",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {step === "link" ? (
        <div className="mt-5 border-t border-border pt-4">
          <label className="block">
            <span className="text-small font-medium text-ink-mid">Recipe link</span>
            <input
              value={link}
              onChange={(event) => setLink(event.target.value)}
              inputMode="url"
              placeholder="https://"
              className="mt-1 w-full bg-transparent pb-1 text-body outline-none placeholder:text-ink-mid"
            />
          </label>
          {demo ? (
            <p className="mt-4 rounded-[8px] bg-secondary p-3 text-body leading-snug text-ink-soft">
              Reading a recipe from a link is switched off in the demo. Choose Add manually to try writing one in.
            </p>
          ) : null}
          <Pill onClick={readLink} disabled={importing || demo} className="mt-4 w-full">
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Reading the page
              </>
            ) : (
              "Read the recipe"
            )}
          </Pill>
          <p className="mt-2 text-small leading-snug text-ink-mid">
            We keep the link with the recipe and only read what the page publishes. If it cannot be read, you can still
            write it in and the link stays attached.
          </p>
        </div>
      ) : null}

      {note ? (
        <p
          className={cn(
            "mt-4 rounded-[8px] p-3 text-small leading-snug",
            note.tone === "error" ? "bg-chili/[0.08] text-chili" : "bg-secondary text-ink-soft",
          )}
        >
          {note.text}
        </p>
      ) : null}

      {source ? (
        <p className="mt-3 break-words text-small leading-snug text-ink-mid">
          Source kept: {source.name ? `${source.name} · ` : ""}
          {source.url}
        </p>
      ) : null}

      {step !== "link" ? (
        <>
          {gaps.length ? (
            <div className="mt-4 border-t border-border pt-3">
              <p className="text-body font-medium">Fill in before saving</p>
              <p className="mt-1 text-small leading-snug text-ink-mid">{gaps.join(" · ")}</p>
            </div>
          ) : null}

          <div className="mt-5 space-y-4">
            <Field label="Dish name">
              <input
                value={form.title}
                onChange={(event) => set("title", event.target.value)}
                placeholder="Rajma"
                className="mt-1 w-full bg-transparent text-heading outline-none placeholder:text-ink-mid"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Servings">
                <input
                  type="number"
                  min="1"
                  value={form.servings}
                  onChange={(event) => set("servings", event.target.value)}
                  placeholder="4"
                  className="num mt-1 w-full bg-transparent text-body outline-none placeholder:text-ink-mid"
                />
              </Field>
              <Field label="Cook time (minutes)">
                <input
                  type="number"
                  min="0"
                  value={form.cook_minutes}
                  onChange={(event) => set("cook_minutes", event.target.value)}
                  placeholder="35"
                  className="num mt-1 w-full bg-transparent text-body outline-none placeholder:text-ink-mid"
                />
              </Field>
            </div>

            <Field label="Photo link" hint="Optional. Paste an image address.">
              <input
                value={form.image_url}
                onChange={(event) => set("image_url", event.target.value)}
                placeholder="https://"
                className="mt-1 w-full bg-transparent text-body outline-none placeholder:text-ink-mid"
              />
            </Field>

            <Field label="Description" hint="Optional. One line about the dish.">
              <textarea
                value={form.description}
                onChange={(event) => set("description", event.target.value)}
                rows={2}
                className="mt-1 w-full resize-none bg-transparent text-body leading-relaxed outline-none placeholder:text-ink-mid"
                placeholder="Slow-simmered kidney beans with ginger."
              />
            </Field>

            <Field label="Ingredients" hint="One per line, e.g. 400 g paneer or 2 onions.">
              <textarea
                value={form.ingredients}
                onChange={(event) => set("ingredients", event.target.value)}
                rows={7}
                className="mt-1 w-full resize-none bg-transparent text-body leading-relaxed outline-none placeholder:text-ink-mid"
                placeholder={"400 g paneer\n700 g spinach\n2 tbsp ghee"}
              />
            </Field>

            <Field label="Method" hint="One step per line.">
              <textarea
                value={form.instructions}
                onChange={(event) => set("instructions", event.target.value)}
                rows={7}
                className="mt-1 w-full resize-none bg-transparent text-body leading-relaxed outline-none placeholder:text-ink-mid"
                placeholder={"Wilt the spinach and blend.\nFry the paneer until golden."}
              />
            </Field>
          </div>

          <Pill onClick={save} disabled={saving} className="mt-6 w-full">
            {saving ? "Saving" : "Save recipe"}
          </Pill>
          <p className="mt-3 pb-4 text-small leading-relaxed text-ink-mid">
            Ingredients added this way have no allergen record, so the recipe will ask anyone with an allergy to check
            them before cooking.
          </p>
        </>
      ) : null}
    </AppShell>
  );
}