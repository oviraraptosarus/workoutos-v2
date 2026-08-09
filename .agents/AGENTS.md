# Debugging Rules

- **Native UI Alerts for Debugging:** Whenever we debug a client-side issue or add temporary runtime instrumentation to catch an error, we MUST use native browser `alert()` pop-ups to surface the error directly on the screen (e.g., `alert("Error: " + error.message)`). This ensures the user can see the exact error message immediately in the UI without needing to open the browser console.

- **Apple Design Philosophy:** Ask yourself: Is this something Apple, a multi-trillion dollar company, would do in terms of UI organization? If a feature's UI is unorganized, clumsy, or overly complicated, nobody will use it. It will just look like a bunch of digital junk. Prioritize premium, clean, spaced-out formatting and intuitive organization over cramming elements together.

- **Strict iOS UI Guidelines:** When creating or modifying widgets/cards, you MUST consult the `premium-ios-design` skill. Specifically, ensure that widget headers FLOAT OUTSIDE the glass-card-premium background, buttons use the native iOS blue (#0a84ff) for active actions, typography is extremely restrained (small, tightly tracked), and every glass card has the standard top/inner gradient washes to simulate glass.
