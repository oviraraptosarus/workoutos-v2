# When to use ADHD (and when not to)

[← back to README](../README.md)

## Use it for

- Architecture & design decisions (storage layer, sharding, auth model, queue topology, retry strategy)
- API / SDK / CLI surface design
- Fuzzy debugging — generate *hypothesis classes* you haven't considered
- Migration & refactor planning
- Naming — functions, products, services, env vars
- Code review widening — what could go wrong here, beyond the checklist
- Strategy, positioning, pricing — anywhere you'd say *"give me a few ways to…"*
- **Inside agent loops** at decision points where the cost of premature convergence is high

## Don't use it for

- Lookup questions
- Bug fixes with a known root cause
- Anything where the right answer is one Google away
- Inner-loop / tight latency / per-keystroke use
- Single-correct-answer problems

> One-sentence test: *If a junior would Google it and find the answer, baseline wins. If a senior would say "hm, let me think about this differently for a minute" — that's the moment ADHD replaces.*

## Why it shines on creative and interdisciplinary work

Creative and cross-domain work is exactly the regime where premature convergence costs the most.

- The right answer is often **not in any one domain's playbook** — you need to *transplant* a mechanism. ADHD's cross-domain frames (biology, logistics, game design, markets) do this on purpose.
- The textbook answer is usually a **trap** — it looks right because it's familiar. ADHD's separate critic pass flags traps with named reasons, not just "could be risky."
- The interesting ideas live in the **awkward middle** — past the first 3, before the absurd. Single-pass generation never gets there because each token is biased by the previous one. Parallel isolated branches do.
- You don't always know **what good looks like** yet. ADHD's cluster pass surfaces the *shape* of the design space so you can argue at the angle level, not idea-by-idea.

In one line: **ADHD is what to reach for the moment a single-pass agent would give you a competent, forgettable answer.**

## Cost & speed

Honest numbers. A default run is roughly:

- N parallel divergence calls (default 5; can be increased)
- 1 scoring call
- 1 clustering call
- K deepen calls (default 3)

That is ≈ **N + K + 2 calls** (≈10 at defaults). But **call count is the wrong unit** — token cost is what you pay, and it is dominated by *context that gets re-loaded on every branch*, not by the novel output.

### The honest cost formula

Each divergence branch is a fresh, isolated context (that isolation is the whole point — see [how it works](./how-it-works.md)). So the base substrate that prefixes every call — your `CLAUDE.md`, state files, and tool context inside a Claude Code session — is paid **once per branch**, before a single novel idea token is generated:

```
cost ≈ N × (base_context + branch_output)   ← divergence
     + critic_context                        ← score + cluster see all N×k ideas
     + K × deepen_context                    ← focus passes
```

The `N ×` multiplier on `base_context` is the part the simple "10 calls" framing hides. If the base substrate is ~26K tokens, five branches re-load ~130K tokens of substrate **before** any divergence — that is the real floor, and it scales with `N`, not with how much the model actually says.

### Substrate matters more than call count

- **Standalone library** (`adhd "..."`): minimal substrate. Each branch carries only the problem + frame prompt, so `base_context` is small and the premium is modest — close to the naive 5–10× figure.
- **Skill inside a Claude Code session**: large substrate. Every branch re-loads `CLAUDE.md` + tool context, so the premium is **meaningfully higher** than the library and grows with your session's base context. Budget for `N × base`, not `1 × base`.

### Rule of thumb

Frame it as: **a few cents to a few dollars to widen a high-stakes decision** — the exact figure depends on `N`, your base substrate, and current API pricing, so compute it for your own setup rather than trusting a single headline number. The mental model holds regardless: cheap relative to shipping the wrong obvious answer. Don't run it on every keystroke. Run it at decision points.
