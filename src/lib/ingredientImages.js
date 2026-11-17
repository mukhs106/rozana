// The app's ingredient photography, in one place. Every cutout was made the
// same way: one ingredient on the same white sweep, shot straight down, so a
// list reads as a single set and the white never fights the page.
// Swap photos and ingredient rows both come from here.

const B = "https://media.base44.com/images/public/6afc4c5847751139d9832e6d/";

export const INGREDIENT_PHOTOS = {
  // Single spices and aromatics
  amchur: B + "d0e875265_generated_image.png",
  asafoetida: B + "9d7c7608b_generated_image.png",
  mustard: B + "178da5dc2_generated_image.png",
  cumin: B + "7e713d45a_generated_image.png",
  curryLeaves: B + "651e720db_generated_image.png",
  corianderLeaves: B + "5838c10fa_generated_image.png",
  corianderPowder: B + "3b8f88590_generated_image.png",
  garamMasala: B + "99efa53da_generated_image.png",
  turmeric: B + "b0036d403_generated_image.png",
  chilliPowder: B + "f0d6602f5_generated_image.png",
  redChilli: B + "81e53e5f2_generated_image.png",
  greenChilli: B + "1cc9bf678_generated_image.png",
  salt: B + "7c14c222d_generated_image.png",
  garlic: B + "45b1073ec_generated_image.png",
  ginger: B + "df117249a_generated_image.png",
  onion: B + "7626ae4a4_generated_image.png",

  // Vegetables and produce
  spinach: B + "d3ae40e0a_generated_image.png",
  tomato: B + "18b3761dd_generated_image.png",
  potato: B + "0dd0f1c2f_generated_image.png",
  sweetPotato: B + "7c889cdb3_generated_image.png",
  cauliflower: B + "32e1bd995_generated_image.png",
  peas: B + "68f04af94_generated_image.png",
  chickpeas: B + "2246967cc_generated_image.png",

  // Protein and dairy
  paneer: B + "0457cf7be_generated_image.png",
  tofu: B + "bb1dabbc3_generated_image.png",
  soya: B + "35b5f06b3_generated_image.png",
  yogurt: B + "e5ec667b9_generated_image.png",
  cottage: B + "e4e6f7daa_generated_image.png",
  milk: B + "474b2c9f1_generated_image.png",
  cream: B + "0429bc108_generated_image.png",
  coconutCream: B + "75e979ddf_generated_image.png",

  // Fats, nuts, sweeteners
  ghee: B + "f625efa54_generated_image.png",
  oil: B + "a1f5dc44b_generated_image.png",
  coconutOil: B + "269ab3900_generated_image.png",
  cashew: B + "a7afcc6dd_generated_image.png",
  peanut: B + "5528e4770_generated_image.png",
  sunflower: B + "df3b4408e_generated_image.png",
  melon: B + "940ab9ac3_generated_image.png",
  coconut: B + "057bb4a15_generated_image.png",
  jaggery: B + "d02bdec5f_generated_image.png",
  dates: B + "d737c408c_generated_image.png",
  oat: B + "befadd6ae_generated_image.png",

  // Grains and pulses
  rice: B + "f49630b6d_generated_image.png",
  millet: B + "00c1af941_generated_image.png",
  toor: B + "b5892b1c8_generated_image.png",
  moong: B + "cf5034b9c_generated_image.png",
  masoor: B + "e801e9107_generated_image.png",
};

// Words an ingredient name may carry, longest first so "coconut cream" wins
// over "cream" and "sweet potato" over "potato".
const KEYWORDS = [
  ["kashmiri chilli powder", "chilliPowder"],
  ["red chilli powder", "chilliPowder"],
  ["chilli powder", "chilliPowder"],
  ["coconut cream", "coconutCream"],
  ["coconut oil", "coconutOil"],
  ["coriander leaves", "corianderLeaves"],
  ["coriander seeds", "corianderPowder"],
  ["coriander powder", "corianderPowder"],
  ["curry leaves", "curryLeaves"],
  ["green chilli", "greenChilli"],
  ["sweet potato", "sweetPotato"],
  ["mustard seeds", "mustard"],
  ["mustard", "mustard"],
  ["garam masala", "garamMasala"],
  ["chickpeas", "chickpeas"],
  ["chickpea", "chickpeas"],
  ["asafoetida", "asafoetida"],
  ["sunflower seeds", "sunflower"],
  ["melon seeds", "melon"],
  ["cottage cheese", "cottage"],
  ["amchur", "amchur"],
  ["spinach", "spinach"],
  ["palak", "spinach"],
  ["turmeric", "turmeric"],
  ["haldi", "turmeric"],
  ["tomato", "tomato"],
  ["potato", "potato"],
  ["cauliflower", "cauliflower"],
  ["paneer", "paneer"],
  ["yogurt", "yogurt"],
  ["curd", "yogurt"],
  ["cashew", "cashew"],
  ["peanut", "peanut"],
  ["jaggery", "jaggery"],
  ["garlic", "garlic"],
  ["ginger", "ginger"],
  ["onion", "onion"],
  ["shallot", "onion"],
  ["chilli", "redChilli"],
  ["coconut", "coconut"],
  ["dates", "dates"],
  ["millet", "millet"],
  ["masoor", "masoor"],
  ["moong", "moong"],
  ["toor", "toor"],
  ["arhar", "toor"],
  ["soya", "soya"],
  ["tofu", "tofu"],
  ["cream", "cream"],
  ["butter", "ghee"],
  ["ghee", "ghee"],
  ["oil", "oil"],
  ["milk", "milk"],
  ["rice", "rice"],
  ["oats", "oat"],
  ["oat", "oat"],
  ["peas", "peas"],
  ["salt", "salt"],
  ["cumin", "cumin"],
].sort((a, b) => b[0].length - a[0].length);

/** The photo for an ingredient name, or null when the app has none yet. */
export function ingredientImage(name = "") {
  const value = String(name).toLowerCase();
  if (!value) return null;
  const hit = KEYWORDS.find(([word]) => value.includes(word));
  return hit ? INGREDIENT_PHOTOS[hit[1]] : null;
}