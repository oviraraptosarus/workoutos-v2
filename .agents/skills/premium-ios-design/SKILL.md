---
name: premium-ios-design
description: Design principles and architecture guidelines for creating premium, native-feeling iOS style applications. Applies to styling, micro-animations, layouts, and UX patterns.
---

# Premium iOS Design & Architecture Guidelines

When building or modifying applications to achieve a "Premium iOS / Apple-like" aesthetic, adhere strictly to the following architectural and design rules. These rules ensure the web app feels like a high-end native mobile app rather than a clunky web wrapper.

## 1. Spatial Architecture & Layout
- **No Floating Action Buttons (FABs):** FABs are an Android Material Design pattern. On mobile web, they often clip into content, obscure bottoms of cards, and conflict with keyboards. 
- **Action Placement:** Place global utility actions (like AI Copilots or Settings) in the Top Navigation Bar (e.g., as a right-aligned icon) or seamlessly integrated into a Bottom Tab Bar.
- **Compactness over Padding:** Do not use excessively large paddings (`p-8` or `p-10`) or huge headings (`text-3xl` or `text-4xl`) on mobile screens. True native apps value information density while maintaining breathing room. Scale down to `p-5` or `p-6` on mobile, and use `text-xl` or `text-2xl` for section headers.
- **Scrolling Behavior:** Avoid horizontally scrolling segmented controls or tabs on mobile unless absolutely necessary. Compress them into a single row (`flex-1` evenly distributed) or use a native-style `<select>` if there are too many.

## 2. Aesthetic Layering (Glassmorphism & Depth)
- **Glassmorphism:** Use semi-transparent backgrounds with backdrop blur to create depth (`bg-white/10 dark:bg-black/30 backdrop-blur-3xl`).
- **Borders as Light Catchers:** Always pair glass elements with a subtle, low-opacity border to act as a "light catcher" (`border border-white/20 dark:border-white/10`).
- **Shadows:** Avoid flat, hard shadows. Use deep, colored, or highly diffused drop shadows (`shadow-[0_8px_32px_rgba(0,0,0,0.25)]`).
- **Gradients:** Use subtle conic or radial gradients for backgrounds, or text-clipping gradients for headers to add a premium touch without overwhelming the content.

## 3. Micro-Animations & State Feedback
- **Active States:** Every interactive element MUST have an active state that provides immediate physical feedback. The standard iOS behavior is a slight scale down: `active:scale-95 transition-transform`.
- **Hover States:** For desktop usage, include subtle hover states (`hover:-translate-y-0.5`, `group-hover:opacity-100`).
- **Enter/Exit Animations:** Use `animate-in fade-in slide-in-from-bottom-8 duration-700` for cards entering the viewport. Nothing should just "appear" instantly.

## 4. Typography & Iconography
- **Typography:** Use modern, geometric sans-serif fonts (e.g., Inter, SF Pro, Outfit). Use heavy weights (`font-black`, `font-bold`) for headers and structured tracking (`tracking-tight`) to make text punchy.
- **Icons:** Avoid cliché icons (e.g., generic Sparkles for AI). Use thoughtful, unique iconography (e.g., Orbit, Aperture, BrainCircuit) from libraries like Lucide.
- **Icon Sizing:** Keep icons proportionate. On mobile, `w-5 h-5` or `w-6 h-6` inside a `w-10 h-10` rounded wrapper is the sweet spot.

## 5. Execution Workflow for Agents
When prompted to "make it look good" or "use Apple design":
1. Check the DOM for overlapping elements (especially `fixed bottom-*`). Move them to the TopNav.
2. Check for overly large text or padding on mobile breakpoints (`sm:p-8` instead of raw `p-8`).
3. Apply glassmorphism and `active:scale-95` to all buttons.
4. Ensure dark mode and light mode contrast is handled via opacity layers (e.g., `bg-black/20` in light mode, `bg-white/10` in dark mode) rather than hardcoded hex colors.
