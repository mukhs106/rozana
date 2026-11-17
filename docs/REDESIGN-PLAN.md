# Rozana redesign plan (Phase 0)

> Status: **plan only, waiting for approval.** No app code has changed.
> Written 17 Nov 2026. Read with `docs/MIGRATION-INVENTORY.md` and `docs/START-HERE.md`.

**The rule behind every decision below:** Rozana cooks *one batch of a familiar South Asian
dish* and adapts it for *everyone at the table*: their own portion, their own swaps, one
shared grocery list. Whenever a screen has to choose what goes first, the table goes first.

**The second rule:** nothing new uses AI. Every suggestion, check, shortcut and plan is a
rule or a score you could work out with a pencil from the diners, recipes, pantry, plan and
history. The only AI left in the app is the existing "import from a link", and it is off in
demo mode.

---

## 1. Clove teardown

I studied all 41 screenshots in `~/Downloads/clove kitchen app`. They cover sign-in,
onboarding, the "My kitchen" profile, settings sheets, preferences, household, the
library, the plan, a plan-meal sheet, groceries, feedback, and Clove's marketing pages
(which show their recipe page and grocery list inside phone mockups).

**What Clove gets right, in general:** one confident sans, big bold headings, plain grey
"soft" pills for secondary choices, one dark filled pill for the main action, white space
instead of lines and boxes, and every setting opened as a bottom sheet with a single
Save button. Photos carry all the colour.

| Clove screen | What it does | We borrow | We change |
| --- | --- | --- | --- |
| Sign-in (8016) | Google, Apple, email; terms line | One screen, big soft pills, one dark primary | Add **Explore Rozana** (demo) as a full-width secondary option. Keep our own auth pages and wording. |
| Onboarding quiz (8017–8020) | 4 one-question screens with progress bar | One question per screen, a progress line, back + Continue | **Not in this redesign.** If we add it later, the questions are about *the table* (who eats, allergies, diets), not goals. Noted as a later idea. |
| Import tutorial (8021–8022) | Teaches "share from Instagram" | — | Not borrowed. Our import is link-only and AI; it stays as it is. |
| My kitchen (8023–8025) | Profile card, Preferences + Household tiles, upgrade banner, recipe settings list, cooking streak calendar, help links, red Log out, version | Profile is reached from the avatar. A streak calendar. Help links with arrow icons. Version number at the bottom. | Our profile opens on **Your table** (the diners), not on "me". No upgrade banner. Settings grouped by *table / kitchen / rhythm / household / about / account* (section 6). Log out is a quiet text button, not a red pill. |
| Settings sheets (8038–8042) | Measurements, Unit system, Recipe translation, Servings: radio list + Save | Radio list with a one-line explainer under each option; Save at the bottom | We merge "unit system" and "measurements" into **one** "Units" sheet (Clove splits a single idea in two). Servings lives next to *the table*, since portions come from diners. |
| Preferences (8043–8050) | Dietaries chips, macros steppers, ingredients-to-avoid search with photo chips | Chips for diets; searchable ingredient chips with photos (we already have cutouts) | Preferences are **per diner**, not per account. Diets are South Asian rules (Jain, eggetarian, no onion-garlic, satvik later) not keto/Whole30. Macro steppers are not borrowed for now: per-person portions already set how much each person eats. |
| Household (8051, 8055) | Name, members, invite link, QR | Member list with avatars | In Rozana a "member" is a **diner with rules**, invite is *coming soon* until Supabase gives us shared accounts. |
| Library (8052) | Search, avatar, Recipes / Collections tabs, sort, filter, Import tile, 2-column photo grid with time badge | Tabs, sort, add tile, 2-column grid, time badge on the photo | Every card also shows a **"fits 3 of 4"** table indicator. Sort includes **Fits my table**. Filter by *diner* ("what can Arjun eat?"). |
| Plan (8053) | Week switcher, Any day, a "+" per day | Week switcher, "Any day this week" bucket, "+" per day | Meals show **who's eating** (avatars) and are grouped into **batches** (one cook, several meals). |
| Plan meal sheet (8054) | View recipe, chat, meal, who's eating, note, change day, swap, add to groceries, remove | One sheet for every action on a planned meal | No chat. Our sheet leads with **who's eating and their portions**, then swaps, then the rest. |
| Groceries (8028, 8056) | By category / By recipe, add item, overflow menu with Pantry, Copy list, Clear all | Aisle vs recipe sort, add by hand, Pantry, Copy, Clear | Per-person extras from swaps are shown in their own line ("+100 g tofu for Arjun"). "Order groceries" sheet with providers marked *coming soon*. |
| Recipe page (8029 mockup) | Title, prep/cook chips, Collection / Plan / Groceries action row, nutrition rings, AI tip | Title + time chips, a horizontal action row of soft pills | **At the table** section goes *above* ingredients. No AI tip. Nutrition as plain numbers per serving, not rings. |
| Feedback (8037, floating button) | Name + email prefilled + message, Send | Same three fields, prefilled | A small button in the profile and the top-bar menu, not floating over every screen (a floating pill covers content and tab bar on 390px). Sends via an email for now. |
| FAQ, About, Privacy (8032–8036, 8037) | Accordion FAQ, founder story, long-form legal | Accordion FAQ; a story page | Our story is about cooking for a mixed table; we write it in our own words. |

**What we do *not* copy from Clove:** their dark green, their purple gradient "pro" styling,
illustrations, emoji-led lists, wording ("My kitchen", "Dietaries", "Chat with Clove", "Try
Clove free"), category names, their settings layout, or the floating sparkle button.

---

## 2. Information architecture

```
Login ─┬─ Sign in / Register / Google  ──────────────┐
       └─ Explore Rozana (demo, no details) ─────────┤
                                                     ▼
┌──────────── TOP BAR (every app screen) ────────────────────────────┐
│ Rozana mark        [Search]  [Our story ⓘ]  [Avatar → Profile]     │
└────────────────────────────────────────────────────────────────────┘
   │ Search      → full-screen search sheet → recipe page
   │ Our story   → /info/our-story
   │ Avatar      → /profile

┌──────────── BOTTOM TABS ───────────────────────────────────────────┐
│  Today (/)    Recipes (/recipes)    Plan (/plan)    Groceries (/groceries)  │
└────────────────────────────────────────────────────────────────────┘

Today  /
  ├ Tonight's table → "Cook for this table" → /make/$recipeId (adapted batch)
  ├ Shortcuts → each opens a results sheet → recipe page or "add to plan"
  │    Plan my week → draft-week sheet → Accept → /plan
  ├ Category shelves → recipe page; "See all" → /recipes?shelf=…
  ├ This week strip → /plan (scrolls to day)
  └ Story teaser → /info/our-story

Recipes  /recipes
  ├ tab Recipes (search, sort, filters, "Add a recipe" tile → /recipes/new)
  ├ tab Collections → /collections/$id   (mine + automatic: Favourites, Cooked recently)
  └ /recipes/$id  recipe page
        ├ action row: Add to plan (day sheet) · Add to groceries · Save (collection sheet) · Cook
        ├ At the table (per-diner portions and swaps) → "Cook for this table" → /make/$id
        └ Cooked it → streak

Plan  /plan
  ├ week switcher, Any day this week, one row per day with "+"
  └ meal → meal sheet (who's eating, portions, swap dish, change day,
                       add to groceries, note, cooked it, remove)

Groceries  /groceries
  ├ sort: By aisle / By recipe; add item by hand
  ├ overflow: Pantry (sheet) · Copy list · Share · Clear all
  └ Order groceries → provider sheet (all "coming soon") + Copy / Share

Profile  /profile   (from avatar)
  ├ Your table → diner sheet (allergies, diet rules, portion size, dislikes)
  ├ In the kitchen → Units sheet, Servings sheet, Recipe language sheet, Pantry staples
  ├ Your rhythm → streak calendar, reminders
  ├ Household → coming soon
  ├ About Rozana → /info/our-story, /info/how-checks-work, /info/faq, Feedback sheet,
  │                /info/contact, /info/privacy, /info/terms
  └ Account → sign out (or "Leave demo"), version, admin tools (admins only)

Global: Feedback sheet (from Profile and About); "Demo" label in the top bar in demo mode.
```

Routes that are **new**: `/groceries`, `/collections/$id`, `/info/our-story`,
`/info/how-checks-work`. `/info/$topic` already exists; new topics are just new entries in
`src/lib/infoContent.js`. `/make/$recipeId` stays as the "cook for this table" screen.

---

## 3. Design tokens

### Type: one family, five sizes

**Instrument Sans** (Google Fonts, variable weight 400–700) for everything. It is already
linked in `__root.jsx`, it is warmer and narrower than Inter, and it does not look like
Clove's face. Inter, Lastik and Instrument Serif are removed from the interface.
The **Rozana script mark (Palmeria R / wordmark) stays for the logo only.**

| Token | Size / line height | Weight | Used for |
| --- | --- | --- | --- |
| `text-display` | 28 / 34 | 600 | Screen title, recipe title |
| `text-title` | 22 / 28 | 600 | Section headings ("Tonight's table", "At the table") |
| `text-heading` | 18 / 24 | 600 | Card titles, sheet titles |
| `text-body` | 16 / 24 | 400 (500 for labels, 600 for buttons) | All reading text, list rows, buttons |
| `text-small` | 14 / 20 | 400 or 500 | Meta (time, "fits 3 of 4"), tab labels, captions |

Nothing smaller than 14 px, except legal fine print on the privacy/terms pages (12 px).
Letter spacing: −0.01em on 22 and 28, normal elsewhere. No forced uppercase (kept from today).

### Colour: one action colour, one accent, neutrals

| Token | Hex | Job | Contrast |
| --- | --- | --- | --- |
| `primary` (Oxblood) | `#64172A` | Filled buttons, active tab, links | white on it 12.4:1 |
| `accent` (Turmeric) | `#E6AA33` | Small highlights: streak day, "new", selected chip ring. **Never text on white** (2.1:1) | ink on it 8.7:1 |
| `ink` | `#1A1614` | Text | 18:1 on white |
| `muted` | `#635954` | Secondary text | 6.8:1 on white, 6.0:1 on sand |
| `sand` | `#F4F1EB` | Soft pills, cards, input fields | — |
| `border` | `#E2DED9` | Hairlines (used sparingly) | — |
| `background` | `#FFFFFF` | Page | — |

**Status colours** are separate from brand colours, and always come with an icon and a word,
never colour alone:

| Status | Text | Tint | Icon |
| --- | --- | --- | --- |
| Fits | `#22593F` (8.2:1) | `#E7F3EB` | check |
| Needs a swap | `#844B0B` (7.0:1) | `#FAEFD6` | swap arrows |
| Needs a check | `#844B0B` | `#FAEFD6` | question mark |
| Can't eat this | `#AF301D` (6.4:1) | `#FAE8E5` | no-entry |

Dark mode keeps working (existing Appearance setting); each token gets a dark value checked
to the same AA bar.

### Spacing and radii

- Spacing scale (px): **4, 8, 12, 16, 20, 24, 32, 40, 56**. Page gutter 20. Gap between
  sections 32–40.
- Radii: **8** (chips, small badges), **16** (cards, inputs, photo cards), **24** (bottom
  sheets, hero photo), **full** (pills, avatars, icon buttons).
- Shadows: none on cards; a single soft shadow on sheets and the tab bar only.

### Buttons and tap targets

| Style | Look | Size |
| --- | --- | --- |
| **Primary pill** | Oxblood fill, white 16/600 text | 52 px tall full-width; 44 px compact |
| **Secondary pill** | Sand fill, ink 16/600 text | same heights |
| **Icon button** | 44×44 circle, sand fill (or clear on photos with a white disc), 22 px icon | 44×44 |
| **Text button** | Ink 16/500, underline on focus | min 44 px tall hit area |

- Every tap target **≥ 44×44 px** (small visuals get padding to reach it).
- Focus ring: 2 px oxblood outline, 2 px offset, visible on keyboard focus.
- **Reduced motion:** the five components that already honour `prefers-reduced-motion`
  keep doing so; new animation (sheets, shelves) uses the same check.

---

## 4. Recipe shelves (pick the ones you want)

Each shelf is a **rule over existing recipe fields** (tags, cook time, ingredients, fit).
A shelf only shows when it has at least 3 recipes, so with today's 13 recipes some will
stay hidden until the library grows.

| # | Name | Rule |
| --- | --- | --- |
| 1 | **Weeknight dal-chawal** | tag `everyday` and cooks in ≤ 40 min, with a dal, rice or lentil ingredient |
| 2 | **Tiffin-ready** | tag `lunchbox`, or dry-style dishes (no `stew`/`gravy`) that keep a day |
| 3 | **Better on day two** | tags `comfort` or `one pot`, cook ≥ 30 min: dishes that reheat well from one batch |
| 4 | **One pot, every plate** | fits every diner at your table with zero swaps |
| 5 | **Sabzi on the side** | vegetable-led dishes (tag `vegan`/`vegetarian`, no dal/meat as main) ≤ 30 min |
| 6 | **Twenty-minute tadka** | cook time ≤ 20 min |
| 7 | **Protein for the whole table** | tag `high protein` and fits ≥ all-but-one diner |
| 8 | **Sunday slow cooks** | tag `weekend`, or cook time ≥ 60 min |
| 9 | **Down south** | tag `south indian` or cuisine Kerala / Tamil / Udupi / Andhra |
| 10 | **Festive and mithai** | tag `festive` or `sweet` (hidden today: no recipes yet) |

---

## 5. Shortcut logic (all rules, no AI)

### The "fit" engine everything uses

For one recipe and one diner, Rozana works out a status. Diners are matched by **id**, never
by name.

1. Look at each ingredient's allergen tags and name.
2. **Hard rules** = the diner's allergies plus diet rules (vegan, vegetarian, eggetarian,
   Jain, dairy-free, gluten-free, nut-free, no onion-garlic) plus "avoid" ingredients.
   **Soft rules** = dislikes.
3. Name matching is **whole-word**: "egg" matches "egg", "eggs", "boiled egg", never
   "eggplant"; "nut" never matches "nutmeg" or "coconut" (coconut is not a tree-nut rule
   unless the diner adds it).
4. An ingredient whose allergens were **never recorded is "unknown", never clear.** A
   small built-in list of plain ingredients (water, salt, rice, most whole spices, onion,
   tomato…) counts as recorded "contains none". Anything else without tags is unknown.
5. Status:
   - **Fits**: no hard rule broken, nothing unknown that matters to this diner.
   - **Needs a swap**: hard rules broken, but every one is fixed by the recipe's versions, its
     own swaps or the swap library, and the replacement doesn't break another rule.
   - **Needs a check**: nothing broken, but at least one ingredient is unknown for a rule this
     diner has (e.g. an allergy). Shown with "always check labels".
   - **Can't eat this**: a hard rule broken with no swap that fixes it.
   - Dislikes never change the status; they show as a note ("Meera dislikes okra").

For a recipe and a whole table: `fits` = number of diners who fit, `swaps` = number of
distinct swaps needed, `checks` = diners who need a check, `blocked` = diners who can't eat it.
Cards show **"Fits 3 of 4"**.

### Shortcuts

| Shortcut (our name) | Rule |
| --- | --- |
| **Plan my week** | For each empty dinner slot this week (and lunch if you use lunch): candidates are recipes with `blocked = 0` for that day's diners. Score = 100 − 15×swaps − 10×checks − time penalty (weekdays only: −1 per 3 min over 40 min) − 40 if cooked or planned in the last 7 days − 20 if the same main ingredient is already this week − 10 if the same shelf is already this week + 5 if the pantry covers ≥ 50%. Pick the best per day, in order, so variety updates as it fills. Ties break by the library order, then by title, so the same inputs always give the same week. Shows a **draft week** you accept, change per day, or discard. Nothing is written until you accept. *(Built in Phase 2: also −5 per person who dislikes something in it; a dish is never picked twice in one draft; when nothing suits everyone, −50 per person who can't eat it, and the card says who.)* |
| **Cook from my pantry** | Pantry = staples from settings + grocery items marked "have". Match = matched ingredients ÷ ingredients that matter (water and salt don't count). Rank by match %, then fewest missing, then fit. Card shows "You have 8 of 10 · need paneer, cream". *(Built in Phase 2: dishes one person can't eat are included after the rest, labelled "Nani can't eat this", because a strict diet like Jain otherwise empties the list.)* |
| **Feeds everyone** | Recipes with `blocked = 0`. Sort by swaps (0 first), then checks, then cook time. Card says "Fits all 4" or "Fits all 4 with 1 swap". |
| **Use it up** | Pantry items you've marked **leftover** or **use soon** (with an optional date). Score = sum over those items used by the recipe: 2 if its date is within 2 days, else 1. Ties by fit, then cook time. Same one-person allowance as the pantry list, ranked after the rest and labelled. Empty state explains how to mark items. |

### Tonight's table

- Tonight = the next meal slot (existing `nextSlot()`).
- If a meal is planned: show its diners (avatars), dish photo, and a status chip per person.
  Primary button **"Cook for this table"** opens `/make/$recipeId` pre-filled with those
  diners, portions and swaps.
- If nothing is planned: show the top **Feeds everyone** pick for all diners, with
  **"Plan it for tonight"** as the button and "Show another" (next in the same ranked list).

---

## 6. Settings structure (organised around the table)

1. **Your table** (first, because it *is* the product): each diner as a row with avatar,
   name and a one-line summary ("No nuts · Jain · 1.5 portions"). Tap → diner sheet:
   allergies, diet rules, portion size (0.5 / 0.75 / 1 / 1.5 / 2), dislikes, spice.
   "Add someone" at the end.
2. **In the kitchen**
   - **Units**: Metric (g, ml) · Metric with cups · US / Imperial · Keep each recipe's units.
     Converts only within the same kind of measure (weight↔weight, volume↔volume); counts
     like "2 onions" or "1 tsp" stay as they are. No guessing of densities.
   - **Servings**: default servings for a new batch, and a "Scale recipes to my table
     automatically" switch.
   - **Recipe language**: the choice is saved; translation shows *coming soon* (needs a
     service).
   - **Pantry staples**: the things you always have (salt, oil, cumin…), used by "Cook from
     my pantry" and never added to the grocery list.
3. **Your rhythm**: cooking streak calendar (fed by "Cooked it" on recipes and plan meals),
   prep reminder, lunchbox reminder (existing). Appearance (light/dark/system) stays here.
4. **Household**: members and invite, shown as *coming soon* until Supabase.
5. **About Rozana**: Our story · How swaps and allergy checks work (with "always check
   labels") · FAQ · Feedback · Contact · Privacy · Terms.
6. **Account**: sign out (or "Leave demo" in demo), app version, admin tools for admins.

---

## 7. Conflicts, risks and decisions I need from you

1. **Most current recipes will show "Needs a check".** The seeded recipes give every
   ingredient an empty allergen list, which today counts as "no allergens". Under the new
   rule (empty = unknown) the USP would look broken. My fix: the built-in list of plain
   ingredients (section 5, point 4) plus a deterministic allergen dictionary (paneer → dairy,
   atta → gluten, peanuts → peanuts…). Ingredients it doesn't know stay unknown, honestly.
   *No AI enrichment.*
2. **Allergy logic moves earlier.** Today (Phase 2) shows fit status, so the fit engine and
   the safety fixes (unknown ≠ clear, id matching, whole-word matching, never "safe") must
   land in **Phase 2**, not Phase 3. Phase 3 then adds the recipe-page UI.
3. **New data needs a home.** Collections, streak (cook log), settings, pantry flags
   ("leftover", "use by") and diner **ids** on planned-meal portions are new fields.
   Two options:
   - **A (recommended):** add Base44 entities/fields (`Collection`, `CookLog`,
     `UserSettings`, extra `GroceryItem` fields, `diner_id` in `PlannedMeal.portions`) and
     push them with the Base44 CLI. Changes your live Base44 schema (additive only, nothing
     removed), works across devices, maps 1:1 onto the Supabase draft.
   - **B:** keep them in browser storage for signed-in users too. No live schema change,
     but they don't follow you between phone and laptop.
   Either way it goes through `src/api/db.js` and `MIGRATION-INVENTORY.md` gets updated.
4. **Existing plans store diner names, not ids.** Old planned meals will be matched by name
   once, as a fallback, and get ids written when edited. New meals store ids.
5. **Status colours vs. one-colour rule.** You asked for one action colour and one accent.
   Fit status needs green/amber/red to be readable at a glance; I've kept them as a
   separate, small "status" set with icons and words. Say if you'd rather they be neutral.
6. **Demo mode on the live site** means anyone can open the app without an account. Demo
   data lives only in their browser, never writes to Base44, link import is off, admin
   tools are hidden. The login gate (`_authed.jsx`) gets a "demo" pass; the gate component
   itself is unchanged.
7. **Feedback email.** There is no contact address in the app yet (`infoContent.js` says
   so). **I need the address** the Feedback sheet should open an email to.
8. **Our story text.** I'll write a placeholder in Rozana's voice; **you should give me
   the real story** (why you built it, who you cook for).
9. **Small library.** 13 recipes means several shelves (section 4) will be hidden and "Plan
   my week" will repeat sooner. Adding recipes by hand fixes it; I won't generate any.
10. **Reminders** only fire while Rozana is open in a browser tab (existing limitation,
    real push needs a server). Kept and labelled honestly.
11. **Ordering groceries** shows Instacart (US), Noon and Carrefour (UAE) as *coming soon*
    only; Copy and Share list work for real.
12. **Unit conversion** only converts structured quantities within one kind of measure;
    "a handful", "1 tsp" etc. are left as written.
13. **GitHub baseline is blocked on this Mac**: the GitHub CLI (`gh`) isn't installed, so I
    couldn't create the private `rozana-app` repo yet (see the report).

---

## 8. Phase map

| Phase | Branch | Contents | Stop? |
| --- | --- | --- | --- |
| 0 | `claude/rozana-redesign-8ecf18` | This document | **Stop for approval** |
| 1 | `phase-1-foundations` | Demo entry + seeded demo data, `src/api/db.js` adapter (Base44 + local), pages moved onto it, tokens, new shell (top bar, tab bar with Groceries, feedback sheet) | — |
| 2 | `phase-2-today` | Fit engine + allergy safety rules, Today: tonight's table, shortcuts, shelves, this week, story teaser | **Stop with 390×844 screenshots** |
| 3 | `phase-3-recipes` | Library (tabs, search, sort, filters, add tile, collections), recipe page with At the table | — |
| 4 | `phase-4-plan-groceries` | Week view, meal sheet, Groceries tab, pantry, order sheet, list bug fixes (single batch, no 6-item cap, one heading) | — |
| 5 | `phase-5-profile` | Table-first profile, units, servings, language, staples, streak, reminders, household (soon), about, account | Final report |

Each phase ends with `npm run lint` and `npm run build`, then merges to `main`.
Untouched throughout: `src/routeTree.gen.ts`, `src/server.js`, `src/lib/error-capture*.js`.
