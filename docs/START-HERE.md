# Start here: Rozana for a vanilla HTML/CSS/JS person

This app is React, but most of what you know still applies. This page maps
the new things onto the ones you already know.

---

## 1. Running the app

Open the `rozana` folder in VS Code, then open the built-in terminal
(**View → Terminal**, or <kbd>Ctrl</kbd>+<kbd>`</kbd>).

**First time on a computer** (already done on this Mac):

```bash
npm ci
```

```bash
npx base44@latest login
```

```bash
npx base44@latest link
```

**Every day:**

```bash
npx base44@latest dev --remote
```

Then open the `http://localhost:…` address it prints (normally **http://localhost:5173**).
Save a file and the browser updates by itself. No refresh needed. Stop it with <kbd>Ctrl</kbd>+<kbd>C</kbd>.

- `--remote` = use your **real** Rozana data and logins from Base44.
- Without `--remote`, Base44 runs an empty practice database on your Mac instead.

**On your phone** (same Wi-Fi as the Mac):

```bash
npm run dev:phone
```

It prints a **Network:** address like `http://10.0.0.139:5173`. Type that into your
phone's browser. (Uses your real Base44 data, same as `--remote`.) It reads the app ID
from `.env.phone.local`, a small git-ignored file on this Mac.

> **Known limit: "Continue with Google" fails on the phone address** with
> *"Domain is not valid"*. Base44 only returns you from Google to `localhost` or
> `rozana-draft.base44.app`, not to your Mac's Wi-Fi address. Options:
> email + password sign-in (if your account has a password) may work, since it doesn't
> leave the page; or check the layout on your phone using the published
> site `https://rozana-draft.base44.app` (that shows the last *published* version,
> not your local edits). This goes away after the move to Supabase, where you control
> the allowed addresses.
>
> If a port is busy, Vite picks the next one (5174, 5175…). Always use the address it prints.

**Before you commit**, check for mistakes:

```bash
npm run lint
```

```bash
npm run build
```

> Why `npx base44@latest` and not just `base44`? `npx` downloads and runs the Base44
> tool on demand, so nothing had to be installed system-wide. If you'd like the
> shorter command, `npm install -g base44` installs it permanently.

---

## 2. Folder map (in vanilla terms)

```
rozana/
├── src/
│   ├── routes/            ← your PAGES. One file = one URL.
│   │   ├── __root.jsx     ← the <html><head><body> shell. Like the outer part of index.html
│   │   ├── _authed.jsx    ← the "must be logged in" bouncer for everything in _authed/
│   │   ├── _authed/
│   │   │   ├── index.jsx          → /            (Today)
│   │   │   ├── recipes.index.jsx  → /recipes     (Recipes)
│   │   │   ├── recipes.$recipeId.jsx → /recipes/123  ($ = a value from the URL)
│   │   │   ├── recipes.new.jsx    → /recipes/new
│   │   │   ├── make.$recipeId.jsx → /make/123
│   │   │   ├── plan.jsx           → /plan        (Plan)
│   │   │   ├── profile.jsx        → /profile     (Profile)
│   │   │   ├── info.$topic.jsx    → /info/…
│   │   │   └── admin/enrich.jsx   → /admin/enrich (admins only)
│   │   └── login.jsx, register.jsx, … → sign-in pages (outside the bouncer)
│   │
│   ├── components/        ← reusable HTML CHUNKS (like copy-pasted snippets, but defined once)
│   │   ├── AppShell.jsx   ← the header/bottom nav around every page
│   │   ├── today/, recipes/, plan/, profile/, make/ … ← chunks for each page
│   │   └── ui/            ← generic buttons, dialogs, inputs (shadcn/ui kit). Rarely edit these.
│   │
│   ├── index.css          ← YOUR CSS VARIABLES (colours, fonts) + global CSS
│   ├── hooks/             ← reusable JS functions that load data (e.g. useKitchen.js)
│   ├── lib/               ← plain JS helpers (maths, text, server code)
│   ├── assets/fonts/      ← the custom font files
│   └── api/
│       ├── base44Client.js ← connection to Base44 (don't move it)
│       └── db.js          ← THE way pages read/write data (Base44 or demo)
│
├── tailwind.config.js     ← turns your CSS variables into class names (bg-chili, text-ink …)
├── base44/entities/       ← database table definitions (one file per table)
├── docs/                  ← these notes
└── package.json           ← list of libraries + the npm commands (dev, build, lint, dev:phone)
```

**Leave alone:** `src/routeTree.gen.ts` (auto-generated), `src/server.js`,
`src/lib/error-capture*.js`, `src/start.js` (Base44 manages these), and `node_modules/`, `dist/`.

---

## 3. Where colours and fonts live

### Colours: `src/index.css`, inside `:root { … }` (starts around line 24)

```css
--chili: 9 76% 41%;
--paper: 38 48% 96%;
--turmeric: 43 71% 57%;
```

These are **HSL without the `hsl()`**: hue (0–360), saturation %, lightness %.
`9 76% 41%` is the same as `hsl(9, 76%, 41%)`. Change the numbers, save, and every place
using that colour updates. Dark-mode versions are in the `.dark { … }` block just below (line ~101).

To use a colour you'd normally write `color: var(--chili)`. In this project you
usually write a **Tailwind class** instead: `text-chili`, `bg-paper`, `border-turmeric`.
The names come from `tailwind.config.js` → `colors`. A new colour needs adding in both files.

### Fonts (redesign)

One family for the whole interface: **Instrument Sans** (linked in `src/routes/__root.jsx`).
Only the Rozana logo keeps its script face (Palmeria, `--font-display`). Text sizes are five
named classes from `tailwind.config.js`: `text-display` (28), `text-title` (22),
`text-heading` (18), `text-body` (16), `text-small` (14). Use these instead of `text-[13px]`.

### Fonts (older notes): also `src/index.css`

- Line 1: the Google Fonts `@import` (Inter, Instrument Serif)
- Lines 2–17: the custom fonts (Palmeria, Lastik Free) loaded from `src/assets/fonts/`
- Around line 85: which font does which job:
  ```css
  --font-heading: 'Lastik Free', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-display: 'Palmeria', sans-serif;
  --font-serif: 'Instrument Serif', Georgia, serif;
  ```
- More Google Fonts (Instrument Sans, IM Fell English) are linked from `src/routes/__root.jsx` (line ~25).

In class names: `font-heading`, `font-body`, `font-display`.

---

## 4. Tailwind in 30 seconds

Instead of writing a CSS rule and a class name, you put small ready-made classes straight on the element:

```html
<!-- vanilla -->
<p class="note">Hi</p>
<style>.note { padding: 1rem; color: var(--chili); font-weight: 600; }</style>

<!-- Tailwind -->
<p className="p-4 text-chili font-semibold">Hi</p>
```

Hover any class in VS Code to see the real CSS it means (the Tailwind extension does this).
`md:` = "on screens wider than 768px", `hover:` = on hover, `dark:` = in dark mode.
You can still write normal CSS in `src/index.css` whenever that's easier.

---

## 5. JSX vs HTML

JSX is HTML written inside JavaScript. The differences that trip people up:

| HTML | JSX | Why |
| --- | --- | --- |
| `class="box"` | `className="box"` | `class` is a reserved word in JS |
| `for="email"` | `htmlFor="email"` | same reason |
| `onclick="go()"` | `onClick={go}` | camelCase, and you pass the function itself |
| `style="color: red; font-size: 12px"` | `style={{ color: "red", fontSize: 12 }}` | a JS object, camelCase keys |
| `<img src="a.png">` | `<img src="a.png" />` | every tag must be closed |
| `<!-- comment -->` | `{/* comment */}` | |
| two elements side by side at the top | wrap them: `<>…</>` | a component returns one thing |

**Curly braces = "run some JavaScript here":**

```jsx
<h1>Hello {user.name}</h1>
<img src={recipe.image_url} alt={recipe.title} />
{isLoading ? <p>Loading…</p> : <RecipeList />}
{recipes.map((r) => <RecipeCard key={r.id} recipe={r} />)}
```

**Components are functions that return HTML.** A capitalised tag like `<Pill>` means
"insert the `Pill` chunk from `src/components/Pill.jsx` here". The bits after the
name (`<Pill tone="chili">`) are its inputs, called **props**: like function arguments.

**State** replaces "change the DOM by hand". Instead of
`document.querySelector(...).textContent = …`, you write
`const [count, setCount] = useState(0)` and call `setCount(5)`. React redraws that part for you.

---

## 6. Handy VS Code things (already set up)

- **Format on save** (Prettier) only tidies the lines you changed, so Base44's files don't get rewritten.
- **ESLint** underlines mistakes as you type.
- **Tailwind IntelliSense** autocompletes class names and shows colour swatches.
- **Edge DevTools** extension: inspect the running app inside VS Code (optional).
- <kbd>Cmd</kbd>+<kbd>P</kbd> then type a file name to jump to it. <kbd>Cmd</kbd>+click a component name to open its file.

## 7. More reading

- `docs/MIGRATION-INVENTORY.md`: everything tied to Base44, and the Supabase plan.
- `AGENTS.md`: Base44's rules for this project (aimed at AI assistants, but accurate).
