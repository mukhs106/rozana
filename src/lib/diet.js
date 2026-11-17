export const ALLERGENS = ["dairy", "nuts", "gluten", "soy", "egg", "fish", "shellfish", "sesame"];

export const DIETS = ["vegetarian", "vegan", "dairy-free", "gluten-free", "nut-free"];

export const SPICE_LEVELS = ["mild", "medium", "hot"];

// Editable presets. Jain is stored as ingredient rules, not as a hidden rule set:
// applying it writes the avoid list the household can then edit.
export const DIET_PRESETS = [
  {
    key: "vegetarian",
    label: "Vegetarian",
    diet: ["vegetarian"],
    avoid: [],
    note: "No meat, fish or egg.",
  },
  {
    key: "eggetarian",
    label: "Eggetarian",
    diet: ["vegetarian", "egg"],
    avoid: [],
    note: "Vegetarian plus eggs.",
  },
  {
    key: "vegan",
    label: "Vegan",
    diet: ["vegan", "dairy-free"],
    avoid: [],
    note: "No dairy or egg either.",
  },
  {
    key: "jain",
    label: "Jain",
    diet: ["vegetarian", "jain"],
    avoid: ["onion", "garlic", "potato", "carrot", "beetroot", "radish", "yam"],
    note: "Adds onion, garlic and root vegetables as ingredient rules you can edit.",
  },
  {
    key: "gluten-free",
    label: "Gluten-Free",
    diet: ["gluten-free"],
    avoid: [],
    note: "Flags wheat, barley and semolina.",
  },
];

export const NUTRITION_GOALS = [
  { key: "high_protein", label: "High-Protein" },
  { key: "fibre", label: "More fibre" },
  { key: "lighter", label: "Lighter meals" },
];

export const presetByKey = (key) => DIET_PRESETS.find((preset) => preset.key === key) || null;