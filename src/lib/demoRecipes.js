// Two extra dishes for the demo only, so the stage can show the difference
// between a small swap (tofu in the roti dough) and a whole version of a dish
// (palak paneer cooked as palak tofu). They join the sample library in demo
// mode and never reach Base44.
import { INGREDIENT_PHOTOS as CUTOUTS } from "@/lib/ingredientImages";
import { SAMPLE_DISH } from "@/lib/sample";

const ing = (name, qty, unit, note = "", allergens = []) => ({ name, qty, unit, note, allergens });

const PALAK_PANEER_INGREDIENTS = [
  ing("Spinach", 500, "g", "Washed, thick stems trimmed"),
  ing("Paneer", 250, "g", "Cut into cubes", ["dairy"]),
  ing("Onion", 150, "g", "Finely chopped"),
  ing("Tomato", 150, "g", "Chopped"),
  ing("Ginger garlic paste", 15, "g"),
  ing("Green chilli", 2, "piece"),
  ing("Ghee", 30, "g", "", ["dairy"]),
  ing("Cumin seeds", 1, "tsp"),
  ing("Garam masala", 1, "tsp"),
  ing("Kasuri methi", 1, "tsp", "Crushed between your palms"),
  ing("Cream", 30, "ml", "To finish", ["dairy"]),
  ing("Salt", 1, "tsp"),
];

const PALAK_TOFU_INGREDIENTS = [
  ing("Spinach", 500, "g", "Washed, thick stems trimmed"),
  ing("Firm tofu", 300, "g", "Pressed 15 minutes, cut into cubes", ["soy"]),
  ing("Onion", 150, "g", "Finely chopped"),
  ing("Tomato", 150, "g", "Chopped"),
  ing("Ginger garlic paste", 15, "g"),
  ing("Green chilli", 2, "piece"),
  ing("Sunflower oil", 30, "ml"),
  ing("Cumin seeds", 1, "tsp"),
  ing("Garam masala", 1, "tsp"),
  ing("Kasuri methi", 1, "tsp", "Crushed between your palms"),
  ing("Lemon juice", 1, "tbsp", "To finish"),
  ing("Salt", 1, "tsp"),
];

export const DEMO_RECIPES = [
  {
    title: "Matar paneer",
    subtitle: "Paneer and peas in a tomato gravy, no onion or garlic",
    description:
      "Made the Jain way, with hing and tomato doing the work onion usually does, so the whole table can share one pot. Cook the paneer separately and it splits easily by plate.",
    image_url: CUTOUTS.paneer,
    cuisine: "Indian",
    tags: ["vegetarian", "jain", "high protein", "everyday"],
    base_servings: 4,
    sort_order: 0,
    is_seeded: true,
    cook_minutes: 30,
    variations: [],
    swaps: [],
    base_ingredients: [
      ing("Paneer", 250, "g", "Cut into cubes", ["dairy"]),
      ing("Green peas", 200, "g", "Fresh or frozen"),
      ing("Tomato", 300, "g", "Puréed"),
      ing("Sunflower oil", 30, "ml"),
      ing("Cumin seeds", 1, "tsp"),
      ing("Asafoetida", 0.25, "tsp"),
      ing("Turmeric", 0.5, "tsp"),
      ing("Kashmiri chilli powder", 1, "tsp"),
      ing("Coriander powder", 2, "tsp"),
      ing("Garam masala", 1, "tsp"),
      ing("Kasuri methi", 1, "tsp"),
      ing("Salt", 1, "tsp"),
      ing("Water", 300, "ml"),
      ing("Coriander leaves", 10, "g", "Chopped"),
    ],
    base_instructions: [
      "Sear the paneer cubes in a spoon of the oil until golden. Set aside.",
      "Heat the rest of the oil, add the cumin and hing, then the tomato purée and the powdered spices. Cook until the oil separates.",
      "Add the peas, salt and water and simmer ten minutes.",
      "Add the paneer and kasuri methi, simmer two minutes, and finish with garam masala and coriander.",
    ],
    nutrition: { kcal: 300, protein: 16, carbs: 14, fat: 20 },
  },
  {
    title: "Palak paneer",
    subtitle: "Paneer in a smooth, bright spinach gravy",
    description:
      "Blanch the spinach for a minute, no more, and cool it fast so the gravy stays green. The paneer goes in at the end so it stays soft.",
    image_url: SAMPLE_DISH.image_url,
    cuisine: "Indian",
    tags: ["vegetarian", "high protein", "everyday"],
    base_servings: 4,
    sort_order: 1,
    is_seeded: true,
    cook_minutes: 35,
    variations: [
      {
        key: "palak-paneer",
        name: "Palak paneer",
        image_url: SAMPLE_DISH.image_url,
        ingredients: PALAK_PANEER_INGREDIENTS,
      },
      {
        key: "palak-tofu",
        name: "Palak tofu",
        image_url: SAMPLE_DISH.image_url,
        ingredients: PALAK_TOFU_INGREDIENTS,
        instructions: [
          "Press the tofu, cut it into cubes and pan-fry in half the oil until golden on two sides. Set aside.",
          "Blanch the spinach for one minute, cool it in cold water and blend smooth with the green chilli.",
          "Heat the rest of the oil, add the cumin, then the onion. Cook until soft and gold.",
          "Add the ginger garlic paste and tomato and cook until the tomato breaks down.",
          "Stir in the spinach, salt, garam masala and kasuri methi. Simmer five minutes.",
          "Fold in the tofu, warm through, and finish with lemon juice off the heat.",
        ],
        nutrition: { kcal: 250, protein: 17, carbs: 12, fat: 15 },
      },
    ],
    swaps: [],
    base_ingredients: PALAK_PANEER_INGREDIENTS,
    base_instructions: [
      "Blanch the spinach for one minute, cool it in cold water and blend smooth with the green chilli.",
      "Heat the ghee, add the cumin, then the onion. Cook until soft and gold.",
      "Add the ginger garlic paste and tomato and cook until the tomato breaks down.",
      "Stir in the spinach, salt, garam masala and kasuri methi. Simmer five minutes.",
      "Add the paneer and cream, warm through for two minutes, and take it off the heat.",
    ],
    nutrition: { kcal: 290, protein: 14, carbs: 11, fat: 21 },
  },
  {
    title: "Soft roti",
    subtitle: "Whole wheat flatbread with a little yogurt in the dough",
    description:
      "A spoon of yogurt keeps the dough soft, so the roti stay tender after they cool. Rest the dough before rolling.",
    image_url: "",
    cuisine: "Indian",
    tags: ["vegetarian", "everyday", "side"],
    base_servings: 4,
    sort_order: 2,
    is_seeded: true,
    cook_minutes: 30,
    variations: [],
    swaps: [
      {
        key: "roti-yogurt-tofu",
        from: "Yogurt",
        to: "Silken tofu",
        from_image_url: CUTOUTS.yogurt,
        to_image_url: CUTOUTS.tofu,
        ratio: 1,
        affects: "Dairy-free, more protein",
        method_change:
          "Blend the silken tofu smooth and knead it into the flour where the yogurt goes. Add the water a spoon at a time, since tofu brings its own moisture.",
        removes: ["dairy"],
        adds: ["soy"],
      },
    ],
    base_ingredients: [
      ing("Whole wheat flour (atta)", 300, "g", "", ["gluten"]),
      ing("Yogurt", 60, "g", "", ["dairy"]),
      ing("Warm water", 150, "ml", "Add slowly"),
      ing("Salt", 0.5, "tsp"),
      ing("Sunflower oil", 1, "tsp", "For the dough"),
    ],
    base_instructions: [
      "Mix the flour and salt, rub in the yogurt and oil, then add the water slowly until the dough is soft but not sticky.",
      "Knead for five minutes, cover and rest for 20 minutes.",
      "Divide into eight balls and roll each thin on a floured board.",
      "Cook on a hot tawa until spotted underneath, flip, then puff over the flame or press with a cloth.",
    ],
    nutrition: { kcal: 180, protein: 6, carbs: 34, fat: 3 },
  },
];
