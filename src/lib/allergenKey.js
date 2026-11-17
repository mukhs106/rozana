const MAP = {
  "tree nuts": "nuts",
  peanuts: "peanuts",
  peanut: "peanuts",
  wheat: "gluten",
  "wheat/gluten": "gluten",
  milk: "dairy",
  cream: "dairy",
  ghee: "dairy",
  butter: "dairy",
  paneer: "dairy",
  yoghurt: "dairy",
  yogurt: "dairy",
  "onion/garlic": "oniongarlic",
  "onion & garlic": "oniongarlic",
};

/** One spelling for allergen words, so ingredients, rules and icons agree. */
export function allergenKey(raw) {
  const text = String(raw || "").toLowerCase().trim();
  if (!text) return null;
  if (MAP[text]) return MAP[text];
  if (text.includes("onion") || text.includes("garlic")) return "oniongarlic";
  if (text.includes("peanut")) return "peanuts";
  if (text.includes("nut")) return "nuts";
  if (text.includes("wheat") || text.includes("gluten") || text.includes("semolina")) return "gluten";
  if (text.includes("dairy") || text.includes("milk") || text.includes("cheese")) return "dairy";
  if (text.includes("soy") || text.includes("tofu")) return "soy";
  return text;
}