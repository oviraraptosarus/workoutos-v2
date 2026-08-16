---
name: Vitality OS
colors:
  surface: '#f9f9fe'
  surface-dim: '#d9dade'
  surface-bright: '#f9f9fe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f8'
  surface-container: '#ededf2'
  surface-container-high: '#e8e8ed'
  surface-container-highest: '#e2e2e7'
  on-surface: '#1a1c1f'
  on-surface-variant: '#45464c'
  inverse-surface: '#2e3034'
  inverse-on-surface: '#f0f0f5'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#575e70'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#141b2b'
  on-primary-container: '#7d8497'
  inverse-primary: '#c0c6db'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002113'
  on-tertiary-container: '#009668'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce2f7'
  primary-fixed-dim: '#c0c6db'
  on-primary-fixed: '#141b2b'
  on-primary-fixed-variant: '#404758'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f9f9fe'
  on-background: '#1a1c1f'
  surface-variant: '#e2e2e7'
  activity-red: '#EF4444'
  activity-green: '#22C55E'
  activity-blue: '#3B82F6'
  surface-glass: rgba(255, 255, 255, 0.7)
  card-white: '#FFFFFF'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  margin-mobile: 16px
  margin-desktop: 40px
  gutter: 20px
  bento-gap: 24px
---

## Brand & Style

This design system embodies a premium, high-performance fitness philosophy centered on clarity, focus, and intentionality. Inspired by modern operating systems, the aesthetic is "Precision Wellness"—a blend of high-end minimalism and functional data visualization.

The style leverages **Corporate Modern** foundations with a heavy influence of **Glassmorphism**. It prioritizes a "Native App" feel through:
- **Spatial Depth:** Using translucent layers and background blurs to maintain context.
- **Bento Logic:** Organizing complex health metrics into clean, modular containers.
- **Visual Breath:** Extremely generous whitespace to reduce cognitive load during intense data review.
- **Dynamic Energy:** Using vibrant, purposeful color hits against a stark, neutral backdrop to highlight progress and activity.

## Colors

The palette is rooted in the high-contrast tension between deep charcoal (`#111827`) and pure clinical whites. The secondary and tertiary colors are reserved for functional feedback—tracking streaks, completion rings, and performance spikes.

- **Primary:** Used for high-emphasis typography and core structural elements.
- **Secondary:** The "Action" color, used for buttons and primary interactive states.
- **Activity Palette:** A specific trio of Red, Green, and Blue used exclusively for health metrics (Move, Exercise, Stand) to maintain immediate mental association with fitness progress.
- **Backgrounds:** The system uses `#F2F2F7` as a canvas to allow white cards and glass containers to "pop" via subtle tonal shifts.

## Typography

The typography system mimics the legibility of SF Pro by pairing **Hanken Grotesk** for headlines and **Inter** for UI and body text. 

- **Headlines:** Use tighter letter spacing and heavier weights to create a sense of authority and strength.
- **Numbers:** Data points in dashboards should utilize `Hanken Grotesk` with tabular figures enabled if possible, ensuring numbers align perfectly in lists.
- **Labels:** Small labels use a slightly increased letter spacing and medium weight to ensure legibility against semi-transparent backgrounds.

## Layout & Spacing

The layout employs a **Fluid Bento Grid** model. Content is organized into modular "cells" that adapt based on the screen size, maintaining a consistent rhythm of 24px gaps.

- **Desktop:** A 12-column grid with wide 40px outer margins to create an expansive, "premium" feel.
- **Tablet:** An 8-column grid focused on side-by-side metric tracking.
- **Mobile:** A single-column vertical stack with 16px margins, prioritizing high-level summaries.
- **Rhythm:** All padding and margins are multiples of 8px. Internal card padding should be a minimum of 24px to ensure content doesn't feel cramped.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Backdrop Blurs** rather than traditional heavy shadows.

- **Level 0 (Base):** The background color (`#F2F2F7`).
- **Level 1 (Bento Cells):** Pure white surfaces (`#FFFFFF`) with a very soft, high-spread shadow (Offset 0, 4px; Blur 24px; 4% Black) to lift them slightly from the base.
- **Level 2 (Overlays/Modals):** Glassmorphic surfaces using `surface-glass` with a 20px-40px backdrop blur filter and a 1px semi-transparent white border to define the edge.
- **Interaction:** On hover, bento cells should subtly scale (1.02x) and increase shadow depth slightly to signify interactivity.

## Shapes

The design system uses a **Large Rounded** language to evoke friendliness and modern hardware aesthetics (reminiscent of iPadOS).

- **Standard Containers:** Use `rounded-lg` (16px) for all primary bento boxes and cards.
- **Interactive Elements:** Buttons and input fields use `rounded-md` (8px) for a slightly more precise, functional look.
- **Special Elements:** Progress rings and status pills use a full `rounded-full` (pill-shape) treatment to contrast against the structured grid.

## Components

### Buttons
- **Primary:** Solid `#3B82F6` with white text. High-contrast, bold, and slightly taller (48px) for ease of touch.
- **Secondary:** Semi-transparent light grey background with `#111827` text, used for less critical actions.

### Bento Cards
Every data visualization component must be housed in a Bento Card. Cards should have a fixed internal padding (24px) and use `headline-md` for titles located in the top-left corner.

### Activity Rings
The signature component. Use concentric circles with `activity-red`, `activity-green`, and `activity-blue`. Lines should have rounded caps and a subtle inner glow of the same color to simulate light.

### Input Fields
Minimalist "ghost" style. A 1px border (`#E5E7EB`) that turns `primary_color` on focus. Backgrounds should be slightly off-white to distinguish from the card surface.

### Progress Bars
Thin, 6px tracks with a neutral background and a vibrant colored fill. Use `activity-green` for positive progress and `secondary_color` for general status.

### Lists
Clean rows separated by 1px dividers. Each row should have a subtle hover state (5% opacity black) to indicate selection. Icons within lists should use a 1.5pt stroke weight.