// Unit display that follows Settings → Units. Converts only within one kind of
// measure (weight to weight, volume to volume); counts ("2 onions", "1 piece")
// and spoons stay as written. No densities are guessed, so 200 g of flour is
// never turned into cups.

export const UNIT_SYSTEMS = [
  { key: "metric", label: "Metric", hint: "Grams, kilos, millilitres, litres" },
  { key: "metric-cups", label: "Metric with cups", hint: "Grams for weight, cups for liquids" },
  { key: "us", label: "US / Imperial", hint: "Ounces, pounds, cups" },
  { key: "recipe", label: "Keep each recipe's units", hint: "Nothing is converted" },
];

const WEIGHT_G = { g: 1, gram: 1, grams: 1, kg: 1000, oz: 28.3495, lb: 453.592, lbs: 453.592 };
const VOLUME_ML = { ml: 1, l: 1000, litre: 1000, liter: 1000, cup: 240, cups: 240, "fl oz": 29.5735 };

function round(value, places = 0) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

/** Nearest quarter, for cups and pounds people actually measure. */
function quarter(value) {
  return Math.max(0.25, Math.round(value * 4) / 4);
}

/**
 * { qty, unit } in the chosen system. Unknown units, spoons and counts come
 * back unchanged.
 */
export function convertAmount(qty, unit, system = "recipe") {
  const amount = Number(qty);
  const key = String(unit || "").toLowerCase().trim();
  if (!Number.isFinite(amount) || amount <= 0 || system === "recipe") return { qty, unit };

  if (WEIGHT_G[key]) {
    const grams = amount * WEIGHT_G[key];
    if (system === "us") {
      if (grams >= 454) return { qty: quarter(grams / 453.592), unit: "lb" };
      return { qty: Math.max(0.5, round(grams / 28.3495 * 2) / 2), unit: "oz" };
    }
    if (grams >= 1000) return { qty: round(grams / 1000, 2), unit: "kg" };
    return { qty: grams >= 50 ? round(grams / 5) * 5 : round(grams), unit: "g" };
  }

  if (VOLUME_ML[key]) {
    const ml = amount * VOLUME_ML[key];
    if (system === "metric") {
      if (ml >= 1000) return { qty: round(ml / 1000, 2), unit: "l" };
      return { qty: ml >= 50 ? round(ml / 5) * 5 : round(ml), unit: "ml" };
    }
    // Cups for anything a cup measures sensibly; small amounts stay in ml.
    if (ml >= 60) return { qty: quarter(ml / 240), unit: "cup" };
    return system === "us" ? { qty: round(ml / 29.5735, 1), unit: "fl oz" } : { qty: round(ml), unit: "ml" };
  }

  return { qty, unit };
}

/** Converts a list of ingredient rows, keeping everything else on each row. */
export function convertRows(rows = [], system = "recipe") {
  return rows.map((row) => ({ ...row, ...convertAmount(row.qty, row.unit, system) }));
}
