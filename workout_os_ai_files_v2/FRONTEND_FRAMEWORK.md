# Frontend Framework

## Purpose
Keep the UI clean, consistent, and connected to real data.

## Rules
- Reuse existing components.
- Do not redesign unrelated screens.
- Keep spacing, typography, and theme consistent.
- Do not invent new visual systems.
- Ensure loading, empty, and error states exist.
- Keep all save actions connected to real backend state.

## UI Data Rules
- Never trust UI-only state for persisted data.
- Refresh from backend after save.
- Keep source of truth clear.
- Fix overflow and clipping without changing the identity of the UI.

## Localization
- Keep the app language consistent.
- Do not leave mixed-language UI.
- Ensure AI output matches the app language.
