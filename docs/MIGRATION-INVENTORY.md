# Migration inventory: Base44 → Supabase

> Status: **inventory only**. No code has been changed. This lists every place the app
> depends on Base44, so the Supabase move can be planned piece by piece.
> Written 17 Nov 2026 against the Base44 ZIP export.

---

## 0. Update (Phase 1 of the redesign): the data adapter

Pages no longer call `base44.entities` directly. They call **`db.X.method`** from
`src/api/db.js`, which has the same methods (`list`, `filter`, `get`, `create`,
`bulkCreate`, `update`, `delete`, `deleteMany`) and picks a backend per call:

| Backend | When | Where data lives |
| --- | --- | --- |
| `base44` | signed in | Base44, exactly as before |
| `local` | demo mode ("Explore Rozana") | browser storage key `rozana.demo.db`; never reaches Base44 (SDK analytics is off too) |
| `local` (signed-in) | tables Base44 doesn't have yet: `Collection`, `CookLog`, `UserSettings` | browser storage key `rozana.local.db` (TODO: real tables) |

**For Supabase:** add a third backend in `src/api/db.js`; the pages stay as they are. In the
tables below, "File / Line" now points at `db.X` calls in the same files.

### New data introduced by the redesign

| Table / field | Shape | Today | Supabase |
| --- | --- | --- | --- |
| `Collection` | `{ name, recipe_ids[], system? }` (`system: "favourites"` marks Favourites) | browser only (signed in), demo store | `collections (owner_id, name)` + `collection_recipes` |
| `CookLog` | `{ recipe_id, planned_meal_id?, cooked_on }` (feeds the streak) | browser only | `cook_log (owner_id, recipe_id, cooked_on date)` |
| `UserSettings` | `{ units, default_servings, auto_scale, recipe_language, staples[] }` | browser only | `user_settings (owner_id unique, …)` |
| `PlannedMeal.portions[].diner_id` | diner id next to `diner_name` | written by new plans | keep in `portions` jsonb |
| `Household.members[].portion` | usual portion size (0.5–2) | demo only so far | in `members` jsonb |
| `GroceryItem.use_soon`, `.leftover`, `.use_by` | pantry flags for "Use it up" | demo only so far | columns on `grocery_items` |
| `GroceryItem.recipe_id`, `.recipe_title`, `.for_diners[]` | where an item came from, and who a per-person extra is for ("+100 g tofu for Arjun") | written by new adds | columns on `grocery_items` (`for_diners text[]`) |
| `PlannedMeal.portions[].swap_keys` | each person's own swaps | written by new plans | in `portions` jsonb |
| `PlannedMeal.any_day`, `.note`, `.cooked_on` | "Any day this week" bucket (date = that Monday), a note, cooked date | written by Plan | columns on `planned_meals` |

**Base44 schema.** The new fields on `Household`, `PlannedMeal` and `GroceryItem` are now in
`base44/entities/*.jsonc` (additive only; nothing removed). They are **not live** until pushed from
the linked main checkout with:

```bash
npx base44@latest entities push
```

Until then Base44 may drop fields it doesn't know (diner ids, per-person swaps, usual portions, pantry
flags), so signed-in plans fall back to matching diners by name. `Collection`, `CookLog` and
`UserSettings` have no Base44 table and stay in the browser (`rozana.local.db`) until Supabase.

---

## 1. Data calls: `entities.X.method`

Every read/write of the database goes through `base44.entities.<Table>.<method>`.
In the browser that's the client in `src/api/base44Client.js`; on the server it's
`context.getBase44()` (acting as the visitor) or `context.getBase44().asServiceRole`
(acting as Base44 itself, **bypassing all access rules**).

### Browser-side (runs as the signed-in user, access rules apply)

| File | Line | Call | What it does |
| --- | --- | --- | --- |
| `src/hooks/useKitchen.js` | 17 | `Recipe.filter({})` | Loads **every** recipe; drafts are hidden in JS afterwards, not by the database |
| `src/hooks/useKitchen.js` | 30 | `Household.list()` | Loads the user's household (uses the first row) |
| `src/hooks/useKitchen.js` | 39 | `PlannedMeal.filter({})` | User's planned meals |
| `src/hooks/useKitchen.js` | 46 | `SavedVersion.filter({})` | User's saved recipe versions |
| `src/hooks/useKitchen.js` | 53 | `GroceryItem.filter({})` | User's grocery list |
| `src/hooks/useKitchen.js` | 58, 60 | `Household.list()` / `Household.create()` | `ensureHousehold()`: create one on first use |
| `src/hooks/useAppName.js` | 13 | `AppSetting.filter({ key })` | Reads the app display name |
| `src/routes/_authed/make.$recipeId.jsx` | 245 / 247 | `Household.update` / `Household.create` | Saves diner changes from the Make screen |
| `src/routes/_authed/make.$recipeId.jsx` | 324 | `SavedVersion.create` | Save a version |
| `src/routes/_authed/make.$recipeId.jsx` | 338 | `PlannedMeal.bulkCreate` | Add several meals to the plan at once |
| `src/routes/_authed/plan.jsx` | 65 | `GroceryItem.create` | Add grocery item |
| `src/routes/_authed/plan.jsx` | 80 | `PlannedMeal.delete` | Remove a planned meal |
| `src/routes/_authed/plan.jsx` | 85 | `GroceryItem.update` | Tick / change grocery item |
| `src/routes/_authed/plan.jsx` | 90 | `GroceryItem.delete` | Remove grocery item |
| `src/routes/_authed/plan.jsx` | 95 | `GroceryItem.deleteMany` | Clear grocery items |
| `src/routes/_authed/profile.jsx` | 45 / 50 | `Household.update` / `Household.create` | Edit household members |
| `src/routes/_authed/profile.jsx` | 71 | `SavedVersion.delete` | Delete a saved version |
| `src/routes/_authed/profile.jsx` | 80, 82, 84 | `AppSetting.filter` / `.update` / `.create` | Admin renames the app |
| `src/routes/_authed/recipes.new.jsx` | 145 | `Recipe.create` | A user adds their own recipe |

### Server-side (`createServerFn`, all behind `requireUser`)

| File | Line | Call | Runs as |
| --- | --- | --- | --- |
| `src/lib/enrich-fns.js` | 33 | `Recipe.filter({})` | service role (admin-checked by `assertOwner`) |
| `src/lib/enrich-fns.js` | 52 / 88 | `Recipe.get` / `Recipe.update` | service role (admin-checked) |
| `src/lib/enrich-fns.js` | 105 | `Recipe.filter({})` | service role (admin-checked) |
| `src/lib/enrich-fns.js` | 132 | `Recipe.create` | **visitor** (admin) |
| `src/lib/enrich-fns.js` | 160–166 | `filter({})` on Recipe, PlannedMeal, GroceryItem, Household, SavedVersion, AppSetting + `User.list()` | service role (admin-checked): the "export all data" button |

Server functions and who calls them:

| Server function | Defined in | Called from |
| --- | --- | --- |
| `getEnrichState`, `enrichRecipe` | `src/lib/enrich-fns.js` | `src/components/admin/EnrichPanel.jsx` |
| `createDraftRecipe`, `getEnrichState` | `src/lib/enrich-fns.js` | `src/components/admin/LibraryPanel.jsx` |
| `exportAllData` | `src/lib/enrich-fns.js` | `src/components/admin/ExportPanel.jsx` |
| `importRecipeFromUrl` | `src/lib/recipe-import.js` | `src/routes/_authed/recipes.new.jsx` |

Methods used overall: `filter`, `list`, `get`, `create`, `bulkCreate`, `update`,
`delete`, `deleteMany`. All of them map directly to Supabase's
`select / insert / update / delete`.

---

## 2. AI calls

| File | Line | Call | Notes |
| --- | --- | --- | --- |
| `src/lib/enrich-fns.js` | 66 | `asServiceRole.integrations.Core.InvokeLLM` | Enrich one recipe (structured JSON). Admin only. |
| `src/lib/enrich-fns.js` | 112 | `asServiceRole.integrations.Core.InvokeLLM` | Draft a new recipe from a name. Admin only. |
| `src/lib/recipe-import.js` | 10 | `asServiceRole.integrations.Core.InvokeLLM` | Helper used by import |
| `src/lib/recipe-import.js` | 193 | `asServiceRole.integrations.Core.InvokeLLM` | Extract a recipe from a web page. **Any signed-in user** can call it |
| `src/lib/ai.server.js` | 8–9 | `gatewayModel()` → `asServiceRole.aiGateway.connection()` | Defined (Base44 starter) but **not used anywhere** yet |

After the move these need a different AI provider + API key, stored as a server secret
(Supabase Edge Function secret or Cloudflare secret). All are billed to Base44 AI credits today.

---

## 3. Auth pieces

| Piece | File(s) | What it does |
| --- | --- | --- |
| Browser SDK client | `src/api/base44Client.js`, `src/lib/app-params.js` | Creates the Base44 client from `VITE_BASE44_APP_ID` + token in the URL/storage |
| Session context | `src/lib/AuthContext.jsx` | `useAuth()`; calls `base44.auth.hasToken / me / logout / redirectToLogin` |
| Login gate | `src/routes/_authed.jsx` → `src/components/auth/AuthGate.jsx` | `requireSignedIn` before any page under `_authed/` loads |
| Auth pages | `src/routes/login.jsx`, `register.jsx`, `forgot-password.jsx`, `reset-password.jsx`, `mfa.jsx` → `src/components/auth/*Page.jsx` | `base44.auth.register / verifyOtp / setToken / resendOtp / resetPasswordRequest / resetPassword` |
| MFA + Google/SSO | `src/lib/authMfa.js`, `src/lib/authMfaFlow.js`, `src/components/auth/Mfa*.jsx` | Talk to `/api/apps/{appId}/auth/...` directly; `loginWithProvider` |
| Return-to handling | `src/lib/authReturnTo.js` | Strips Base44 URL params (`access_token`, `app_id`, …) |
| Not-registered screen | `src/components/auth/UserNotRegistered.jsx` | Shown to Base44 users who aren't users of this app |
| MCP consent | `src/components/auth/ConsentPage.jsx` | Base44 MCP OAuth (no route wired to it currently) |
| Server auth | `src/lib/auth-middleware.js`, applied in `src/start.js` | `createClientFromRequest`, `getBase44()`, `requireUser`, `requireUserRoute` |
| Admin checks | `src/routes/_authed/admin/enrich.jsx:11`, `src/routes/_authed/profile.jsx:140`, `assertOwner` in `src/lib/enrich-fns.js:17` | `user.role === "admin"` |
| Logout | `src/routes/_authed/profile.jsx:28` | `useAuth().logout` |

---

## 4. Packages, build plugin, platform glue

| Item | Where |
| --- | --- |
| `@base44/sdk` | `package.json`; imported in `base44Client.js`, `app-params.js`, `auth-middleware.js`, `ConsentPage.jsx` |
| `@base44/vite-plugin` | `package.json`; `vite.config.js` line 2 and the `base44({...})` plugin entry |
| `base44:document` virtual module (`<Base44Scripts />`) | `src/routes/__root.jsx` line 6 |
| `base44:runtime` (`secrets.get`) | not used yet |
| CLI config | `base44/config.jsonc`, `base44/entities/*.jsonc`, `base44/.app.jsonc` (created by `base44 link`, git-ignored) |
| `.npmrc` | 7-day release cooldown with `@base44/*` exempt. Worth keeping as-is. |
| Hosted media | Images and videos on `media.base44.com`: `src/lib/ingredientImages.js`, `src/lib/recipeSeed.js`, `src/lib/clips.js`, `src/lib/sample.js`, `src/routes/_authed/plan.jsx:26`, plus `image_url` values stored in the database. These need copying to Supabase Storage (or similar) **before** the Base44 app is shut down. `src/components/ui/image-helpers.js` has a resize rule specific to this host. |
| Image replace event | `src/components/ui/use-responsive-image.jsx` (`base44:image-replace`, used by the Base44 editor) |

### Base44-managed files (do **not** edit, leave until the very end)

- `src/server.js`: Worker entry, reports errors to Base44
- `src/lib/error-capture.js`, `src/lib/error-capture.server.js`: error reporting
- `src/start.js`: keeps the two error-capture middlewares first
- `wrangler.jsonc`: `main` must stay `src/server.js`

These get replaced or removed only as the very last migration step, when hosting moves off Base44.

---

## 5. Draft Supabase schema

Conventions used below:
- Every table gets `id uuid primary key default gen_random_uuid()`, `created_at timestamptz default now()`,
  `updated_at timestamptz default now()`.
- Base44's `created_by_id` becomes `owner_id uuid references auth.users(id) default auth.uid()`.
- Nested objects/arrays that the app always reads and writes as a whole stay as `jsonb`.
  That keeps the frontend code nearly unchanged. They can be split into proper tables later.
- Base44 string ids (e.g. `recipe_id` stored as text) become real foreign keys.

### `profiles` (replaces Base44 `User`)
| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | `references auth.users(id) on delete cascade` |
| email | text | copied from auth |
| full_name | text | |
| role | text not null default 'user' | check `role in ('admin','user')` |

**Owner:** the user themselves. Supabase Auth keeps the login part in `auth.users`.

### `households`
| Column | Type | Notes |
| --- | --- | --- |
| owner_id | uuid → auth.users | |
| name | text | |
| default_servings | numeric | |
| members | jsonb | array of `{ id, name, is_self, allergies[], diet[], avoid[], dislikes[], spice, goals{kcal, protein, high_protein, fibre, lighter} }` |

**Owner:** one user. Today a "household" is *not* shared between accounts: the
other members are just entries in `members`. Add `unique (owner_id)` since the app
only ever uses the first row. (If real shared households are wanted later, that's a
new `household_members` table. It's a product decision, not part of this migration.)

### `recipes`
| Column | Type | Notes |
| --- | --- | --- |
| owner_id | uuid → auth.users, nullable | null for the seeded/library recipes |
| title, subtitle, description, image_url, cuisine | text | |
| status | text default 'published' | check `in ('published','draft')` |
| tags | text[] | |
| base_servings, cook_minutes, heat_level, sort_order | numeric | |
| base_ingredients | jsonb | `[{ name, qty, unit, note, allergens[] }]` |
| base_instructions | text[] | |
| variations | jsonb | `[{ key, name, summary, image_url, ingredients[], instructions[], nutrition{}, split{} }]` |
| swaps | jsonb | `[{ key, from, to, from_image_url, to_image_url, ratio, unit, affects, method_change, removes[], adds[] }]` |
| nutrition | jsonb | `{ kcal, protein, carbs, fat, fiber }` |
| ingredients_structured | jsonb | `[{ name, qty, unit, prep, allergens[], diet{...}, confidence }]` |
| nutrition_per_serving | jsonb | `{ kcal, protein, carbs, fat, fibre }` (note: `fibre` here vs `fiber` above, as in the current data) |
| adapts_note | text | |
| enriched_at | timestamptz | |
| needs_review | boolean | |
| source_url | text | |
| is_seeded | boolean | |
| is_public | boolean default false | **new**: see RLS below |

**Owner:** library recipes belong to the admin/app (`is_seeded = true` or `is_public = true`);
user-added recipes (`recipes.new.jsx`) belong to their creator.

### `planned_meals`
| Column | Type | Notes |
| --- | --- | --- |
| owner_id | uuid → auth.users | |
| recipe_id | uuid → recipes(id) on delete set null | |
| recipe_title, image_url, version_key, version_name | text | denormalised copies (keep: the plan still shows if the recipe changes) |
| scheduled_date | date | stored as a string today. Convert on import |
| meal_type | text | check `in ('lunch','dinner')` |
| servings | numeric | |
| diner_names | text[] | |
| portions | jsonb | `[{ diner_name, servings }]` |
| swap_keys, swap_names | text[] | |
| ingredients | jsonb | `[{ name, qty, unit, allergens[] }]` |
| nutrition | jsonb | `{ kcal, protein, carbs, fat }` |

**Owner:** one user. Index on `(owner_id, scheduled_date)`.

### `saved_versions`
| Column | Type | Notes |
| --- | --- | --- |
| owner_id | uuid → auth.users | |
| recipe_id | uuid → recipes(id) on delete cascade | |
| recipe_title, image_url, version_key, version_name | text | |
| servings, meal_count, total_portions | numeric | |
| swap_keys, diner_names | text[] | |

**Owner:** one user.

### `grocery_items`
| Column | Type | Notes |
| --- | --- | --- |
| owner_id | uuid → auth.users | |
| name, display_name, unit, note | text | |
| quantity | numeric | |
| status | text | check `in ('to_buy','have','dismissed')` |

**Owner:** one user.

### `app_settings`
| Column | Type | Notes |
| --- | --- | --- |
| key | text unique not null | e.g. the app-name key |
| value | text | |
| label | text | |

**Owner:** the app (admins edit).

---

## 6. Suggested row-level security (RLS)

Turn RLS **on** for every table. Helper:

```sql
create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin')
$$;
```

| Table | select | insert | update | delete |
| --- | --- | --- | --- | --- |
| profiles | own row, or admin | via trigger on signup only | own row but **not** `role` (use a column grant or trigger); admin may change role | admin |
| households | `owner_id = auth.uid()` or admin | `owner_id = auth.uid()` | owner or admin | owner or admin |
| planned_meals | owner or admin | `owner_id = auth.uid()` | owner or admin | owner or admin |
| saved_versions | owner or admin | `owner_id = auth.uid()` | owner or admin | owner or admin |
| grocery_items | owner or admin | `owner_id = auth.uid()` | owner or admin | owner or admin |
| recipes | `(status = 'published' and (is_public or is_seeded)) or owner_id = auth.uid() or is_admin()` | `owner_id = auth.uid()` (and only admin may set `is_public`/`is_seeded`) | owner or admin | owner or admin |
| app_settings | everyone (including signed-out, for the app name) | admin | admin | admin |

These mirror today's Base44 rules (`created_by_id = user.id` or admin), with the recipe
read rule tightened (see below).

### ⚠️ Known issue: recipes are readable by every user

`base44/entities/Recipe.jsonc` has `"read": {}`, which means **any signed-in user can read
every recipe row**, including:
- recipes other users added themselves through **Recipes → New** (`recipes.new.jsx`), which may be personal, and
- **drafts** (`status: "draft"`) written by the admin tools.

The app hides drafts only in browser JavaScript (`useKitchen.js:19`), so they still arrive in
the network response. The Supabase policy above fixes this at the database level. The same fix
could be applied in Base44 now if wanted; it's a one-line rule change, not done here because
this session changes no behaviour.

### Other security notes for the move
- `importRecipeFromUrl` (`src/lib/recipe-import.js`) lets any signed-in user make the server
  fetch any URL and spend AI credits. Consider a per-user rate limit and blocking private/internal
  addresses when it is rebuilt.
- `exportAllData` returns every user's email and data. It is admin-checked, so keep that check.
- Never ship the Supabase **service role** key to the browser. Only the *anon* key belongs in `VITE_*`.

---

## 7. Suggested migration order (for later)

1. Create the Supabase project + tables + RLS above; import a Base44 data export (`exportAllData`).
2. Copy `media.base44.com` files to Supabase Storage and rewrite URLs.
3. Swap auth (`AuthContext`, auth pages, gate, `auth-middleware`) to Supabase Auth.
4. Swap data calls (`useKitchen.js` first, it covers most reads) to a small data module.
5. Move AI calls to a new provider behind server functions.
6. Last: hosting (Cloudflare Workers directly), then remove `@base44/*`, the Vite plugin,
   `<Base44Scripts />` and the managed error-capture files.
