# User testing: known issues and what to avoid

For the person running the sessions. One page, so you can steer testers.

## Setup for each tester

- Open https://rozana-draft.base44.app on the phone. The login screen says **Try Rozana**: tap **Explore Rozana**.
- Between testers: tap the **Demo ↺** label at the top (or Profile → **Reset demo**) and confirm.
  Everything goes back to the sample family, their week and the grocery list.
- The demo lives only in that browser. Nothing a tester does reaches the backend.
- Sign-up is closed. "Team sign-in" (small link) is only for you; testers don't need it.

## The flow to test

1. Recipes → **Rajma masala**: see who it fits (Arjun needs a swap, Nani can't eat it).
2. Turn on Arjun's **Sunflower oil instead of ghee**.
3. **Split this batch across several meals** → tonight's dinner and tomorrow's lunch.
   After 8pm the screen starts at tomorrow's lunch and dinner instead; tap a meal and change its date if needed.
4. Tap a meal row to change portions (e.g. a bigger lunch for Arjun).
5. **Review batch** → **Save to plan**. Plan shows the rajma as "1 cook, 2 meals".
6. Groceries → **Add all** from your plan.

## Known issues (steer testers away, or warn them)

| Where | What happens | Say to testers |
| --- | --- | --- |
| Profile → Feedback | Not connected. Send shows "Feedback isn't connected yet" and keeps nothing. | Tell us out loud instead. |
| Rajma swap | The ghee swap changes the **whole pot**, not just Arjun's plate. Per-plate splits only exist on dishes with a split version. | Expected for now. |
| Plan (seeded meals) | Sample meals were planned without swaps, so some (e.g. Masoor dal for Arjun) may show a diet warning until opened and adjusted. | Ignore, or open and fix it as a task. |
| Ingredient pictures | Some ingredients (e.g. kidney beans) show an empty picture tile. | Cosmetic. |
| Groceries → Order groceries | No shop connection. It only copies or shares the list. | Expected. |
| Recipes → Add recipe from a link | Off in the demo (it needs the server). Add manually works. | Use "Add manually". |
| Recipe language | Choosing a language saves, but recipes aren't translated. | Skip. |
| Profile → Share your table | "Coming soon" card. | Skip. |
| Prep / lunchbox reminders | Need browser notification permission; unreliable on phones. | Skip. |
| "Edit with Base44" badge (bottom right) | Base44's badge on public apps. Tapping it leaves Rozana. | Close it with ×, or ignore. |
| Leave demo | Logs the tester out to the login screen (data removed). | Use Reset instead. |

## Access settings on Base44 (changed for testing)

- The app is set to "anyone can open, no login", so testers land straight on **Try Rozana**.
- Google, Microsoft, Facebook and Apple sign-in are off; the team signs in with email and password via "Team sign-in".
- Sign-up is closed in the app. To reopen it later: set `TESTING_MODE = false` in `src/lib/testing.js`.
- To go back to invite-only after testing: Base44 dashboard → app settings → visibility (needs a paid plan).
- The version that was live before is saved in Base44's version history as "Before redesign publish (original version)".
