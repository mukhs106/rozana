// The demo stage's scenarios. Edit this file to add, reorder or reword them;
// the stage page (src/routes/index.jsx) only reads it.
//
// Each scenario:
//   id       short unique name, letters and dashes
//   title    the card's name
//   summary  one line under the name
//   start    the app screen the phone opens on, e.g. "/today", "/plan",
//            "/recipes/r-masoor-dal". Recipe ids are "r-" + the title in
//            lower case with dashes ("Moong dal khichdi" → "r-moong-dal-khichdi").
//   steps    2 to 4 short "Try this" steps. A step can be plain text, or
//            { text, go: "/groceries" } to make it a link that moves the phone.
//   setup    how the sample kitchen starts (leave out for the full sample):
//     meals      planned meals, replacing the sample week. Each one:
//                  recipe   the dish title
//                  when     "next" (the next meal to cook), "following" (the
//                           one after), or a day number (0 today, 1 tomorrow…)
//                  meal     "lunch" or "dinner" when `when` is a day number
//                  diners   names eating (leave out for everyone)
//                  swaps    { Name: ["swap-key"] } swaps on one person's plate
//                  batch    any word; meals with the same word are one cook
//     groceries  "pantry" to start with an empty shopping list
//     saved      saved versions: { recipe, diners, swaps, meals }
//
// The table is always Suhani, Arjun (vegan), Meera (nut allergy, small
// portions) and Nani (vegetarian, Jain).

export const SCENARIOS = [
  {
    id: "whole-table",
    title: "One dish, the whole table",
    summary: "Tonight's matar paneer suits three of four. Arjun needs one swap.",
    start: "/today",
    steps: [
      "Look at who's eating: three fit as it is, Arjun needs a swap.",
      "Tap the photo to open the dish.",
      "Under At the table, turn on tofu for paneer. Only Arjun's plate changes.",
    ],
    setup: {
      meals: [
        { recipe: "Matar paneer", when: "next" },
        { recipe: "Kerala coconut stew", when: 2, meal: "dinner", diners: ["Suhani", "Arjun", "Meera"] },
        { recipe: "Masoor dal", when: 3, meal: "dinner" },
      ],
    },
  },
  {
    id: "two-meals",
    title: "Tonight's dinner, tomorrow's lunch",
    summary: "One pot of rajma, split across two meals and different portions.",
    start: "/make/r-rajma-masala?diners=d-suhani,d-arjun,d-meera",
    steps: [
      "One batch covers tonight's dinner and tomorrow's lunch.",
      "Tap Edit on tomorrow's lunch and give Suhani a bigger portion.",
      "Tap Review batch, then add both meals to the plan.",
      { text: "See them as one cook on the Plan.", go: "/plan" },
    ],
    setup: {
      meals: [
        { recipe: "Masoor dal", when: 2, meal: "dinner" },
        { recipe: "Vegetable pulao", when: 3, meal: "dinner", diners: ["Suhani", "Arjun", "Meera"] },
      ],
    },
  },
  {
    id: "swap-or-version",
    title: "A small swap or a whole new version",
    summary: "Tofu in the roti dough, or palak paneer cooked as palak tofu.",
    start: "/make/r-soft-roti",
    steps: [
      "Tap Swap on Yogurt and apply silken tofu. Same roti, one ingredient changed.",
      { text: "Now open palak paneer.", go: "/make/r-palak-paneer" },
      "Tap Palak tofu: a whole version with its own ingredients and method.",
    ],
  },
  {
    id: "week-and-shop",
    title: "Plan the week and shop",
    summary: "Fill the empty nights, then one list with each person's extras.",
    start: "/today",
    steps: [
      "Tap Plan my week and keep the dishes it suggests.",
      { text: "Open Groceries.", go: "/groceries" },
      "Tap Add all. Arjun's tofu and Meera's melon seeds get their own lines.",
    ],
    setup: {
      groceries: "pantry",
      meals: [
        { recipe: "Moong dal khichdi", when: "next" },
        { recipe: "Matar paneer", when: 1, meal: "dinner", swaps: { Arjun: ["lib-paneer-tofu"] } },
        {
          recipe: "Vegetable pulao",
          when: 2,
          meal: "lunch",
          diners: ["Suhani", "Arjun", "Meera"],
          swaps: { Meera: ["lib-cashew-melon"] },
        },
      ],
    },
  },
  {
    id: "make-again",
    title: "Make it again",
    summary: "A saved version with everyone's usual portions, cooked again.",
    start: "/profile",
    steps: [
      "Tap Saved versions, then Again next to Masoor dal.",
      "Who's eating, usual portions and Arjun's oil swap are already filled in.",
      "Tap Review batch, then add it to the plan.",
    ],
    setup: {
      saved: [{ recipe: "Masoor dal", diners: ["Suhani", "Arjun", "Meera"], swaps: ["lib-ghee-oil"], meals: 2 }],
    },
  },
];

// "Explore freely": the full sample kitchen, opening on Today.
export const EXPLORE = {
  id: "explore",
  title: "Explore freely",
  summary: "The full sample kitchen, nothing set up.",
  start: "/today",
  steps: [],
};
