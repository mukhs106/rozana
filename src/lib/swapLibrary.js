// Ingredient replacements the app can offer on any recipe, including imported ones,
// where the ingredient name matches a defined entry. Several entries may share a
// `from`: they become the choices shown when that ingredient's swap is opened.
// The photos are the same cutouts the ingredient list uses.

import { INGREDIENT_PHOTOS as CUTOUTS } from "@/lib/ingredientImages";

// Cream never only offers cashew cream: the dairy-free ways also carry protein,
// and the coconut version keeps its own cream rather than a dairy substitute.
const CREAM = "cream";
const CREAM_EXCLUDE = ["coconut"];

export const SWAP_LIBRARY = [
  {
    key: "lib-cream-cottage",
    from: CREAM,
    exclude: CREAM_EXCLUDE,
    to: "Blended cottage cheese",
    from_image_url: CUTOUTS.cream,
    to_image_url: CUTOUTS.cottage,
    ratio: 1,
    affects: "More protein, still dairy",
    method_change:
      "Blend the cottage cheese with a splash of water until it pours like cream, then stir it in off the heat. It is tangier than cream, so taste before the last pinch of salt.",
    removes: [],
    adds: ["dairy"],
  },
  {
    key: "lib-cream-paneer",
    from: CREAM,
    exclude: CREAM_EXCLUDE,
    to: "Paneer and water cream",
    from_image_url: CUTOUTS.cream,
    to_image_url: CUTOUTS.paneer,
    ratio: 1,
    affects: "More protein, still dairy",
    method_change:
      "Blend the paneer with an equal splash of warm water until glossy and pourable. Loosen with a spoon of the gravy before it goes in so it does not seize.",
    removes: [],
    adds: ["dairy"],
  },
  {
    key: "lib-cream-cashew-tofu",
    from: CREAM,
    exclude: CREAM_EXCLUDE,
    to: "Cashew and tofu cream",
    from_image_url: CUTOUTS.cream,
    to_image_url: CUTOUTS.tofu,
    ratio: 1,
    affects: "Dairy-free, more protein",
    method_change:
      "Soak a few cashews in hot water for ten minutes, then blend with silken tofu until shiny. Nutty and protein-rich, and it holds up in the heat without splitting.",
    removes: ["dairy"],
    adds: ["nuts", "soy"],
  },
  {
    key: "lib-cream-peas",
    from: CREAM,
    exclude: CREAM_EXCLUDE,
    to: "Blended green peas",
    from_image_url: CUTOUTS.cream,
    to_image_url: CUTOUTS.peas,
    ratio: 1,
    affects: "Dairy-free, extra fibre",
    method_change:
      "Simmer the peas until soft, blend smooth and press through a sieve. It thickens the gravy and keeps it pale green, with protein and fibre in place of the cream.",
    removes: ["dairy"],
    adds: [],
  },
  {
    key: "lib-paneer-tofu",
    from: "paneer",
    to: "Firm tofu",
    from_image_url: CUTOUTS.paneer,
    to_image_url: CUTOUTS.tofu,
    ratio: 1,
    affects: "Anyone avoiding dairy",
    method_change: "Press the tofu 15 minutes, pan-fry until golden on two sides, and add it where the paneer goes.",
    removes: ["dairy"],
    adds: ["soy"],
  },
  {
    key: "lib-ghee-oil",
    from: "ghee",
    to: "Sunflower oil",
    from_image_url: CUTOUTS.ghee,
    to_image_url: CUTOUTS.oil,
    ratio: 1,
    affects: "Everyone at the table",
    method_change: "Use sunflower oil and add the tempering spices a little later so they do not scorch.",
    removes: ["dairy"],
    adds: [],
  },
  {
    key: "lib-yogurt-coconut",
    from: "yogurt",
    exclude: ["coconut"],
    to: "Coconut yogurt",
    from_image_url: CUTOUTS.yogurt,
    ratio: 1,
    affects: "Anyone avoiding dairy",
    method_change: "Whisk the coconut yogurt with a teaspoon of gram flour so it holds together in the heat.",
    removes: ["dairy"],
    adds: [],
  },
  {
    key: "lib-butter-oil",
    from: "butter",
    to: "Olive oil",
    from_image_url: CUTOUTS.ghee,
    to_image_url: CUTOUTS.oil,
    ratio: 1,
    affects: "Anyone avoiding dairy",
    method_change: "Use olive oil and keep the heat lower when you toast the whole spices.",
    removes: ["dairy"],
    adds: [],
  },
  {
    key: "lib-potato-sweet",
    from: "potato",
    to: "Sweet potato",
    from_image_url: CUTOUTS.potato,
    to_image_url: CUTOUTS.sweetPotato,
    ratio: 1,
    affects: "Anyone watching starch",
    method_change: "Cut the sweet potato the same size and give it five extra minutes to soften.",
    removes: [],
    adds: [],
  },
  {
    key: "lib-toor-moong",
    from: "toor dal",
    to: "Moong dal",
    from_image_url: CUTOUTS.toor,
    to_image_url: CUTOUTS.moong,
    ratio: 1,
    affects: "Anyone who finds toor heavy",
    method_change: "Moong cooks faster: simmer 12 minutes instead of 20, and mash less.",
    removes: [],
    adds: [],
  },
  {
    key: "lib-chickpea-black",
    from: "chickpeas",
    to: "Black chickpeas",
    from_image_url: CUTOUTS.chickpeas,
    ratio: 1,
    affects: "Anyone preferring a firmer bite",
    method_change: "Soak overnight and simmer 10 minutes longer before the masala goes in.",
    removes: [],
    adds: [],
  },
  {
    key: "lib-paneer-soya",
    from: "paneer",
    to: "Soya chunks",
    from_image_url: CUTOUTS.paneer,
    to_image_url: CUTOUTS.soya,
    ratio: 1,
    affects: "Dairy-free, more protein",
    method_change:
      "Boil the chunks 6 minutes, squeeze them dry in a cloth and fry until the edges catch, then add them where the paneer goes.",
    removes: ["dairy"],
    adds: ["soy"],
  },
  {
    key: "lib-cashew-melon",
    from: "cashew",
    to: "Melon seeds (magaz)",
    from_image_url: CUTOUTS.cashew,
    to_image_url: CUTOUTS.melon,
    ratio: 1,
    affects: "Nut-free, still creamy",
    method_change:
      "Soak the melon seeds in hot water 15 minutes, then blend smooth. They whiten and thicken a gravy the way cashews do, without the nut.",
    removes: ["nuts"],
    adds: [],
  },
  {
    key: "lib-yogurt-cashew",
    from: "yogurt",
    exclude: ["coconut"],
    to: "Cashew yogurt",
    from_image_url: CUTOUTS.yogurt,
    to_image_url: CUTOUTS.cashew,
    ratio: 1,
    affects: "Anyone avoiding dairy",
    method_change:
      "Whisk a teaspoon of gram flour into the cashew yogurt first, and stir it in off the heat so it does not split.",
    removes: ["dairy"],
    adds: ["nuts"],
  },
  {
    key: "lib-milk-oat",
    from: "milk",
    exclude: ["coconut"],
    to: "Oat milk",
    from_image_url: CUTOUTS.milk,
    to_image_url: CUTOUTS.oat,
    ratio: 1,
    affects: "Anyone avoiding dairy",
    method_change:
      "Add the oat milk at the same point and keep the heat low. It thickens a little faster than dairy milk.",
    removes: ["dairy"],
    adds: [],
  },
  {
    key: "lib-peanut-sunflower",
    from: "peanut",
    to: "Sunflower seeds",
    from_image_url: CUTOUTS.peanut,
    to_image_url: CUTOUTS.sunflower,
    ratio: 1,
    affects: "Anyone avoiding nuts",
    method_change:
      "Toast the seeds in a dry pan until they smell nutty, then grind or leave them whole to match what the peanuts were doing.",
    removes: ["nuts"],
    adds: [],
  },
  {
    key: "lib-jaggery-dates",
    from: "jaggery",
    to: "Dates",
    from_image_url: CUTOUTS.jaggery,
    to_image_url: CUTOUTS.dates,
    ratio: 1,
    affects: "Less refined sugar, more fibre",
    method_change:
      "Soak the dates in hot water 10 minutes, mash to a paste and stir it in where the jaggery would melt. Keep the heat lower so it does not catch.",
    removes: [],
    adds: [],
  },
  {
    key: "lib-potato-cauliflower",
    from: "potato",
    to: "Cauliflower",
    from_image_url: CUTOUTS.potato,
    to_image_url: CUTOUTS.cauliflower,
    ratio: 1,
    affects: "Lower starch",
    method_change:
      "Cut the cauliflower to the same size and cook it hotter and shorter, so it browns before it softens and does not collapse.",
    removes: [],
    adds: [],
  },
  {
    key: "lib-rice-millet",
    from: "rice",
    to: "Foxtail millet",
    from_image_url: CUTOUTS.rice,
    to_image_url: CUTOUTS.millet,
    ratio: 1,
    affects: "Lower glycaemic load",
    method_change:
      "Rinse the millet like rice, cook it with a quarter more water for two extra minutes, then rest it covered off the heat before forking through.",
    removes: [],
    adds: [],
  },
  {
    key: "lib-toor-masoor",
    from: "toor dal",
    to: "Masoor dal",
    from_image_url: CUTOUTS.toor,
    to_image_url: CUTOUTS.masoor,
    ratio: 1,
    affects: "A faster, lighter dal",
    method_change:
      "Masoor needs no soaking and breaks down in 15 minutes. Simmer it until it falls apart rather than holding its shape.",
    removes: [],
    adds: [],
  },
  {
    key: "lib-ghee-coconut-oil",
    from: "ghee",
    to: "Coconut oil",
    from_image_url: CUTOUTS.ghee,
    to_image_url: CUTOUTS.coconut,
    ratio: 1,
    affects: "Anyone avoiding dairy",
    method_change:
      "Use coconut oil at the same quantity and lower the heat for the tempering. It carries a faint coconut note into the dish.",
    removes: ["dairy"],
    adds: [],
  },
];

/** Does this swap apply to an ingredient of that name? An entry can rule a name out. */
export function matchesSwap(swap, ingredientName = "") {
  const name = String(ingredientName).toLowerCase();
  const from = String(swap?.from || "").toLowerCase();
  if (!from || !name) return false;
  if ((swap.exclude || []).some((word) => name.includes(word))) return false;
  return name === from || name.includes(from);
}

/** The two photos a swap comparison needs, from the swap or from the library entry. */
export function swapImages(swap) {
  if (!swap) return { from: null, to: null };
  const library = SWAP_LIBRARY.find(
    (entry) =>
      entry.from === String(swap.from || "").toLowerCase() &&
      entry.to.toLowerCase() === String(swap.to || "").toLowerCase(),
  );
  return {
    from: swap.from_image_url || library?.from_image_url || null,
    to: swap.to_image_url || library?.to_image_url || null,
  };
}

/** Every library replacement an ingredient list supports, including each alternative. */
export function librarySwapsFor(ingredients = []) {
  const found = [];
  ingredients.forEach((ing) => {
    SWAP_LIBRARY.forEach((swap) => {
      if (matchesSwap(swap, ing.name) && !found.some((item) => item.key === swap.key)) found.push(swap);
    });
  });
  return found;
}