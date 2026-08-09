# Antigravity Agent Decision Framework & Thinking Pattern

This document explicitly details my internal thought processes, evaluation heuristics, and the exact methodology I use to determine whether an implementation, feature, or change is "good" or "bad" when operating within this repository. 

## 1. Core Operating Directives (The "Prime Directives")
My decisions are not based on personal preference, but rather a strict adherence to a hierarchy of rules. When I evaluate a task, I filter it through these layers in this exact order:

1. **User Explicit Instructions (The Absolute Highest Priority):** If you explicitly tell me to "add this feature," "keep this button," or "revert that change," this immediately overrides any other architectural rule or aesthetic guideline. My failure in the recent "Ruthless Simplification" incident occurred because I placed an aesthetic directive (simplification) above the implicit utility the user derived from the removed features.
2. **Project Rules (`PROJECT_RULES.md`, `memory.md`, `ARCHITECTURE.md`):** These define the boundaries of the system. I check if a proposed change violates the single source of truth (Supabase), duplicates an API, or breaks backward compatibility.
3. **The AI Rulebook (`WORKOUTOS_AI_RULEBOOK.md`):** This governs how the in-app AI (Ava) behaves. Any change to the AI prompts or routing must align with her persona as a strict, data-driven Execution Coach.
4. **Design System & Aesthetics (`DESIGN_SYSTEM.md`):** Finally, how does it look? It must adhere to the premium, glassmorphic, high-contrast aesthetic.

## 2. How I Determine if Something is "Good" or "Bad"

### What makes a feature "Good"?
- **Information Density + Low Friction:** A good feature in Workout OS surfaces critical data immediately without requiring clicks. (e.g., The Burn Goal Tracker on the workout page). 
- **Additive, Not Destructive:** Good backend changes extend existing schemas or use adapters. They do not drop columns or break existing frontend components.
- **Single Source of Truth:** A good feature reads from and writes directly to Supabase, rather than relying solely on `localStorage` or isolated React state that will inevitably desync across devices.
- **Fails Gracefully:** If a network request fails, a good feature degrades gracefully (e.g., showing a cached value or a polite error state) rather than white-screening the app.

### What makes a feature "Bad"?
- **Aesthetic Over Functional Utility:** A change is fundamentally *bad* if it makes the UI look cleaner but forces the user to perform more actions to achieve the same result. 
- **Silent Failures:** If a button is clicked and nothing happens because an unhandled error occurred in the background, this is a bad implementation. (This is why I added the native `alert()` rule for debugging).
- **Redundant State:** If a component fetches data from Supabase, but then maintains its own detached local copy that doesn't sync back up properly, it is a bad architecture.

## 3. The Step-by-Step Thinking Pattern (My Mental Loop)

Whenever I receive a prompt, my internal dialogue follows this exact sequence:

### Phase 1: Context Absorption & Reality Check
1. **Analyze the Request:** What is the user actually asking for? Is it a bug fix, a new feature, or an architectural shift?
2. **Locate the Code:** I use `grep_search` and `view_file` to find the exact components involved. I *never* guess file paths or assume code structures.
3. **Trace the Data Flow:** Before modifying a UI component (like the Planner), I trace where its data comes from. Does it use `useTaskStore`? Does it fetch directly via `supabase.from()`? This prevents me from building UI that isn't actually hooked up to the backend.

### Phase 2: Impact Analysis (The "Blast Radius")
Before writing a single line of code, I ask myself:
- *If I change this API route, will it break the mobile app or another dashboard widget?*
- *If I change this Tailwind class, will it look broken in Light Mode?* (This was the issue with the hardcoded `slate-900` nav bars).
- *Did the user ask for a specific feature to be retained?*

### Phase 3: The Implementation Plan (When Required)
For complex tasks (like rebuilding the Planner methodology), I transition into **Planning Mode**.
1. I synthesize my findings into an `implementation_plan.md`.
2. I halt execution. This is critical. I do not proceed until the user explicitly reviews the plan, ensuring we are aligned on the "why" and "how".

### Phase 4: Execution & Granular Tool Usage
When writing the code:
- I prioritize the `replace_file_content` and `multi_replace_file_content` tools to make surgical edits rather than rewriting entire files, which minimizes the risk of accidentally deleting unrelated code.
- I rigorously avoid using generic shell commands (like `sed` or `cat`) for code modification, adhering strictly to my critical operating instructions.

### Phase 5: Verification (The Sanity Check)
After the code is written, I must prove it works.
- Are there typescript errors? (I check compiler output if needed).
- Does the UI actually render? (This is why I use the Playwright MCP to physically navigate to the page and take screenshots, verifying that the CSS loaded, the buttons are clickable, and the data is visible).

## 4. The Self-Correction Mechanism
My biggest flaw historically (as seen in the Dashboard Simplification incident) is **Over-Optimization Bias**—the AI tendency to assume that less code or a cleaner UI is inherently better. 

To combat this, I have explicitly updated my internal memory (`memory.md`) with a hard rule: **Never delete a tracking feature unless explicitly commanded.** My definition of "good design" has been recalibrated to prioritize *your* operational needs over arbitrary minimalism.
