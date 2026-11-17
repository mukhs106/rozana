// Sample kitchen for "Explore Rozana": a four-person table with different rules,
// a planned week, a grocery list, a pantry and a few collections. Built fresh
// each time demo mode starts, so dates are always around today.
import { RECIPE_SEED } from "@/lib/recipeSeed";
import { plannedMealFor } from "@/lib/planWrite";
import { addDays, todayISO } from "@/lib/slots";
import { DIET_PRESETS } from "@/lib/diet";

const JAIN_AVOID = DIET_PRESETS.find((preset) => preset.key === "jain")?.avoid || [];

export const DEMO_MEMBERS = [
  {
    id: "d-suhani",
    name: "Suhani",
    is_self: true,
    allergies: [],
    diet: [],
    avoid: [],
    dislikes: [],
    spice: "hot",
    portion: 1.5,
    goals: { high_protein: true },
  },
  {
    id: "d-arjun",
    name: "Arjun",
    is_self: false,
    allergies: [],
    diet: ["vegan", "dairy-free"],
    avoid: [],
    dislikes: ["karela"],
    spice: "medium",
    portion: 1,
    goals: {},
  },
  {
    id: "d-meera",
    name: "Meera",
    is_self: false,
    allergies: ["nuts"],
    diet: [],
    avoid: [],
    dislikes: ["okra"],
    spice: "mild",
    portion: 0.5,
    goals: {},
  },
  {
    id: "d-nani",
    name: "Nani",
    is_self: false,
    allergies: [],
    diet: ["vegetarian", "jain"],
    avoid: JAIN_AVOID,
    dislikes: [],
    spice: "mild",
    portion: 0.75,
    goals: {},
  },
];

const slug = (title) =>
  String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// Hands-on cooking time for the sample library (soaking not counted).
const COOK_MINUTES = {
  "Rajma masala": 75,
  "Paneer bhurji": 20,
  "Baingan bharta": 40,
  "Bhindi masala": 25,
  "Soya chunk curry": 35,
  "Masoor dal": 25,
  "Kadhi pakora": 50,
  "Vegetable pulao": 35,
  "Moong dal khichdi": 30,
  "Home-style chicken curry": 60,
  "Egg curry": 30,
  "Aloo matar": 30,
  "Tandoori roast gobi": 55,
  "Kerala coconut stew": 35,
};

function recipesWithIds() {
  return RECIPE_SEED.map((recipe, index) => ({
    ...recipe,
    cook_minutes: recipe.cook_minutes ?? COOK_MINUTES[recipe.title] ?? null,
    id: `r-${slug(recipe.title)}`,
    status: "published",
    created_date: new Date(Date.UTC(2026, 9, 1 + index)).toISOString(),
  }));
}

function plannedMeal(recipe, date, type, members, stamp) {
  return { id: `m-${recipe.id}-${date}-${type}`, ...plannedMealFor(recipe, members, date, type, { stamp }) };
}

function grocery(id, display_name, quantity, unit, status, extra = {}) {
  return { id, name: display_name.toLowerCase(), display_name, quantity, unit, status, note: "", ...extra };
}

export function buildDemoData() {
  const today = todayISO();
  const recipes = recipesWithIds();
  const byTitle = (title) => recipes.find((recipe) => recipe.title === title);
  const everyone = DEMO_MEMBERS;
  const notNani = DEMO_MEMBERS.filter((member) => member.id !== "d-nani");
  const stamp = (n) => new Date(Date.UTC(2026, 10, 10, 9, n)).toISOString();

  const meals = [
    // Rajma tonight, eaten again at lunch tomorrow: one batch, two meals.
    plannedMeal(byTitle("Rajma masala"), today, "dinner", notNani, stamp(1)),
    plannedMeal(byTitle("Rajma masala"), addDays(today, 1), "lunch", notNani, stamp(1)),
    plannedMeal(byTitle("Masoor dal"), addDays(today, 1), "dinner", everyone, stamp(2)),
    plannedMeal(byTitle("Vegetable pulao"), addDays(today, 2), "dinner", everyone, stamp(3)),
    plannedMeal(byTitle("Kerala coconut stew"), addDays(today, 4), "dinner", everyone, stamp(4)),
    plannedMeal(byTitle("Bhindi masala"), addDays(today, 5), "dinner", notNani, stamp(5)),
  ].filter((meal) => meal.recipe_id);

  const groceries = [
    grocery("g-basmati", "Basmati rice", 1, "kg", "to_buy"),
    grocery("g-tomato", "Tomatoes", 1, "kg", "to_buy"),
    grocery("g-coriander", "Coriander leaves", 1, "bunch", "to_buy"),
    grocery("g-coconut-milk", "Coconut milk", 400, "ml", "to_buy"),
    grocery("g-tofu", "Firm tofu", 200, "g", "to_buy", { note: "For Arjun's portion" }),
    grocery("g-okra", "Okra", 500, "g", "to_buy"),
    grocery("g-onion", "Onions", 1, "kg", "have", { use_soon: true }),
    grocery("g-spinach", "Spinach", 250, "g", "have", { use_soon: true, use_by: addDays(today, 1) }),
    grocery("g-rice-left", "Cooked rice", 2, "cups", "have", { leftover: true, use_by: addDays(today, 1) }),
    grocery("g-moong", "Moong dal", 500, "g", "have"),
    grocery("g-masoor", "Masoor dal", 500, "g", "have"),
  ];

  const ids = (...titles) => titles.map((title) => byTitle(title)?.id).filter(Boolean);
  const collections = [
    { id: "c-arjun", name: "Arjun's favourites", recipe_ids: ids("Baingan bharta", "Kerala coconut stew", "Aloo matar") },
    { id: "c-sunday", name: "Sunday lunch", recipe_ids: ids("Home-style chicken curry", "Tandoori roast gobi", "Vegetable pulao") },
    { id: "c-quick", name: "When we're tired", recipe_ids: ids("Masoor dal", "Moong dal khichdi", "Paneer bhurji") },
  ];

  const cookLog = [3, 2, 1].map((daysAgo) => ({
    id: `k-${daysAgo}`,
    recipe_id: recipes[daysAgo].id,
    cooked_on: addDays(today, -daysAgo),
  }));

  return {
    Recipe: recipes,
    Household: [
      { id: "h-demo", name: "The Mukherjee table", default_servings: 4, members: DEMO_MEMBERS },
    ],
    PlannedMeal: meals,
    SavedVersion: [],
    GroceryItem: groceries,
    AppSetting: [],
    Collection: collections,
    CookLog: cookLog,
    UserSettings: [
      {
        id: "s-demo",
        units: "metric",
        default_servings: 4,
        auto_scale: true,
        recipe_language: "en",
        staples: ["salt", "sunflower oil", "cumin seeds", "turmeric", "red chilli powder", "garam masala"],
      },
    ],
  };
}
