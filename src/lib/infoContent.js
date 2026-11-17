// Copy for the settings screens. Policy pages are honest drafts: they say so
// until the household owner replaces them with reviewed text.
export const INFO_TOPICS = {
  "our-story": {
    title: "Our story",
    intro: "One pot of dal, four people, four different rules.",
    sections: [
      {
        heading: "Why Rozana exists",
        body: "In most South Asian homes one person cooks for a table that does not eat the same way: a parent who is Jain, a partner who went vegan, a child with a nut allergy, someone who wants more protein. The usual answer is cooking three times, or one person quietly going without.",
      },
      {
        heading: "One batch, adapted",
        body: "Rozana starts from the dishes you already cook and works out one batch for everyone: how much each person eats, which swaps they need, and one shared grocery list. Rajma for four, with tofu set aside for one plate, is still one pot.",
      },
      {
        heading: "Rozana means everyday",
        body: "This is for ordinary weeknights and tiffins, not special occasions. Familiar food, planned once, cooked once, eaten by everyone.",
      },
    ],
    missing: "This is a placeholder in Rozana's voice. Replace it with your own story.",
  },
  "how-checks-work": {
    title: "How swaps and allergy checks work",
    intro: "Every check is a rule you could follow with a pencil. No guessing.",
    sections: [
      {
        heading: "Each person, each dish",
        body: "Rozana compares every ingredient with each person's allergies, diet rules and ingredients they avoid. The result is one of four: fits, needs a swap, needs a check, or can't eat this.",
      },
      {
        heading: "Unknown is not the same as fine",
        body: "If nobody has recorded what an ingredient contains, Rozana treats it as unknown and marks the dish as needing a check for anyone with an allergy. It never assumes an ingredient is free of something.",
      },
      {
        heading: "Swaps you confirm",
        body: "When a swap fixes a rule, for example tofu for paneer, Rozana suggests it for that person's portion. Nothing is swapped without you choosing it.",
      },
      {
        heading: "Always check labels",
        body: "Packaged ingredients change and can carry traces. Rozana works from the recipe, not the packet in your kitchen. Always read the label before cooking for someone with an allergy.",
      },
    ],
  },
  "privacy-choices": {
    title: "Privacy choices",
    intro: "What Rozana keeps, and what stays on your phone.",
    sections: [
      {
        heading: "On this device",
        body: "Appearance, notification switches and the autoplay setting are stored in this browser only. Clearing site data removes them.",
      },
      {
        heading: "In your household record",
        body: "Allergies, diet presets, ingredient rules, spice tolerance and nutrition goals are saved to your household so every batch check uses them. Saved versions and planned meals are saved the same way.",
      },
      {
        heading: "What we do not do",
        body: "Rozana does not sell household data and does not use allergy information for advertising. There is no analytics or tracking script in this build.",
      },
      {
        heading: "Removing your data",
        body: "Ask for your household record to be deleted and it is removed with its saved versions and planned meals. A self-serve delete control is not built yet.",
      },
    ],
    missing:
      "Privacy requests need a destination. Add your support address (or a deletion flow) before inviting other households.",
  },
  "privacy-policy": {
    title: "Privacy policy",
    intro: "This page is a starter draft, not a reviewed legal policy.",
    sections: [
      {
        heading: "What is stored",
        body: "Your account email and name, the household members you add, their allergies and dietary rules, the recipes in your kitchen, planned meals, grocery items and saved versions.",
      },
      {
        heading: "Where it is stored",
        body: "Records live in the app’s hosted database. Ingredient and recipe photography is served from the app’s image host.",
      },
      {
        heading: "Who can see it",
        body: "Each household sees only its own records. Apps administrators of the published app can see all records.",
      },
    ],
    missing:
      "Replace this with a policy you have reviewed, including retention periods, the legal entity and a contact route.",
  },
  "community-guidelines": {
    title: "Community guidelines",
    intro: "Rozana is a personal kitchen tool, and shared recipes should stay usable for everyone at the table.",
    sections: [
      {
        heading: "Describe ingredients honestly",
        body: "Tag allergens on every ingredient you add. If you don’t know, leave the tag off: the app then shows “Check ingredients” instead of claiming the dish is safe.",
      },
      {
        heading: "Keep substitutions explicit",
        body: "When a swap changes what a dish contains, say so in the swap note so the next cook sees it.",
      },
      {
        heading: "Credit where a recipe came from",
        body: "Add the source link when you save a dish you learned elsewhere.",
      },
    ],
  },
  "user-terms": {
    title: "User terms",
    intro: "This page is a starter draft, not reviewed terms.",
    sections: [
      {
        heading: "Using Rozana",
        body: "Rozana helps you adapt recipes, portion batches and build a grocery list. Nutrition figures are estimates, not medical advice.",
      },
      {
        heading: "Allergen data",
        body: "Allergen information is only as complete as the ingredient records in your kitchen. Always check packaging and ingredients yourself before cooking for someone with an allergy.",
      },
      {
        heading: "Your content",
        body: "Recipes and notes you add stay yours. You are responsible for what you save and share.",
      },
    ],
    missing: "Replace this with terms you have reviewed before publishing the app.",
  },
  faq: {
    title: "FAQs",
    intro: "Short answers to the things people ask first.",
    sections: [
      {
        heading: "What is a version?",
        body: "A version is an authored way to cook the same dish, such as Palak Paneer or Palak Tofu. Each version carries its own ingredients, method and nutrition, and a batch always follows the version you pick.",
      },
      {
        heading: "Why does a card say Check ingredients?",
        body: "The dish has ingredients without an allergen record. That is not a safety claim. Open the recipe, check the list, and add the tag yourself.",
      },
      {
        heading: "How are portions calculated?",
        body: "Every quantity is recomputed from the base recipe at the number of portions you set, so changing servings never compounds rounding.",
      },
      {
        heading: "Are the calories exact?",
        body: "They are estimates for one serving of the version you picked. Where a number is missing it shows as unavailable rather than zero.",
      },
    ],
  },
  about: {
    title: "About Rozana",
    intro: "Familiar dishes, ready to adapt.",
    sections: [
      {
        heading: "What it does",
        body: "Rozana keeps the Indian dishes you already cook and adapts them to who is at the table: an allergy, a Jain rule, a tofu version, a bigger batch.",
      },
      {
        heading: "How it decides",
        body: "Allergies block a batch. Diet presets and ingredient rules shape what is suggested. Nothing is silently swapped: you confirm every change.",
      },
    ],
  },
  contact: {
    title: "Contact us",
    intro: "Tell us what went wrong or what you wish the app did.",
    sections: [
      {
        heading: "Support address",
        body: "No support address is configured in this build, so there is nowhere for a message to go yet.",
      },
      {
        heading: "While you wait",
        body: "Use Report a bug to collect the details, then send them to the person who shared the app with you.",
      },
    ],
    missing: "Add a support address or a contact form destination so this page can actually receive messages.",
  },
  "report-a-bug": {
    title: "Report a bug",
    intro: "A useful report says what you did, what you expected, and what happened instead.",
    sections: [
      {
        heading: "Where it goes",
        body: "Bug reports are not submitted anywhere from this build: there is no destination configured yet.",
      },
      {
        heading: "What to include",
        body: "The dish and version you were on, the number of portions, the device, and whether a household allergy or ingredient rule was involved.",
      },
    ],
    missing: "Connect this to a real inbox or issue tracker before launch.",
  },
};

export const INFO_TOPIC_LIST = Object.keys(INFO_TOPICS);