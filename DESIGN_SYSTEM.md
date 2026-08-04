# Workout OS — Design System v1.0

## Mission

Workout OS is not another fitness app.

It is an intelligent operating system for personal performance.

Every screen should communicate:

- Premium
- Calm
- Intelligent
- Fast
- Minimal
- Powerful

Never look playful.

Never look cluttered.

Never look like a dashboard made from random components.

Every page should feel like it belongs to the same operating system.

---

# Design Philosophy

Think:

Apple
×

Linear
×

Notion
×

Arc Browser
×

Whoop
×

Stripe Dashboard

NOT

Generic Material UI

NOT

Bootstrap

NOT

Template dashboards

NOT

Random Dribbble concepts

---

# Core Principles

Every screen must satisfy:

Clarity

↓

Hierarchy

↓

Consistency

↓

Speed

↓

Delight

Never sacrifice usability for aesthetics.

---

# Visual Language

Use:

Large whitespace

Rounded cards

Soft shadows

Glass where appropriate

Muted colors

Minimal borders

High typography contrast

Never overcrowd a screen.

One primary action.

Everything else secondary.

---

# Layout System

Desktop

12-column grid

Max width:
1440px

Content Width

1280px

Card Padding

24px

Section Gap

32px

Widget Gap

20px

Mobile

Single column

16px padding

20px spacing

Touch friendly

Tablet

Adaptive 8-column grid.

---

# Spacing System

Only use:

4

8

12

16

20

24

32

40

48

64

96

Never invent random spacing.

---

# Border Radius

Small

10px

Medium

16px

Large

24px

Floating

32px

Never mix dozens of different radii.

---

# Shadows

Level 1

Cards

Level 2

Hover

Level 3

Floating elements

Level 4

Dialogs

No harsh shadows.

---

# Colors

Use semantic tokens.

Never hardcode colors.

Primary

Secondary

Success

Warning

Danger

Surface

Background

Border

Muted

Accent

Dark and Light mode must share the same hierarchy.

---

# Typography

Maximum two font families.

Hierarchy

Display

Heading

Title

Body

Caption

Label

Use weight before color.

Never use color to create hierarchy.

---

# Icons

One icon family only.

24px default.

20px inside buttons.

16px inline.

Icons always reinforce meaning.

Never decorate.

---

# Buttons

Primary

Secondary

Ghost

Danger

Icon

Loading

Disabled

Buttons should have:

Hover

Pressed

Loading

Disabled

Focus

Never create custom button styles per page.

---

# Inputs

Every input supports:

Hover

Focus

Error

Success

Disabled

Loading

Required

Optional

Password

Search

Textarea

Select

Never redesign inputs per page.

---

# Cards

Cards are the core component.

Every card has:

Title

Optional subtitle

Body

Actions

Consistent spacing

Consistent elevation

Never create random card layouts.

---

# Navigation

Left navigation

Persistent

Collapsible

Current page highlighted

Icons aligned

Top bar

Minimal

Notifications

Search

Profile

Quick AI

---

# Motion

Animations exist to explain.

Never animate for decoration.

Durations

150ms

250ms

350ms

Easing

Ease Out

Spring only where appropriate.

---

# Loading States

Every async component must have:

Skeleton

Spinner

Empty state

Retry state

Timeout state

Never leave blank spaces.

---

# Empty States

Every empty screen should explain:

Why

What happened

What to do next

Primary CTA

Optional AI suggestion

---

# Error States

Errors should:

Explain

Offer recovery

Offer retry

Never expose raw stack traces.

---

# Accessibility

Keyboard navigation

ARIA labels

Visible focus

Minimum touch target 44x44

Color contrast AA

Reduced motion support

---

# Responsiveness

Desktop

Tablet

Mobile

Every page must work perfectly on all three.

No horizontal scrolling.

---

# Dark Mode

Dark mode is first-class.

Do not invert colors.

Design separately.

---

# AI Components

The AI should feel like a system assistant.

Not a chatbot.

Every AI interaction should include:

Context

Suggested actions

Quick buttons

Memory awareness

Language awareness

Progress awareness

---

# Dashboard

Must feel like a mission control center.

Widgets should answer:

What happened?

What matters?

What should I do next?

No decorative widgets.

Everything must provide value.

---

# Planner

Should feel like:

Second Brain

+

Mission Planner

Not a todo app.

---

# Workout

Should feel like:

Professional athlete software.

Not a gym tracker.

---

# Diet

Should feel like:

Nutrition intelligence.

Not calorie counting.

---

# Progress

Should tell a story.

Not show charts.

Use:

Timeline

Achievements

Milestones

Predictions

AI insights

---

# Settings

Every feature that introduces:

permissions

notifications

language

AI

privacy

appearance

storage

must automatically expose corresponding settings.

No hidden behavior.

---

# Localization

Workout OS supports:

English

Telugu

Every UI element

Every dialog

Every toast

Every notification

Every AI response

must support localization.

No hardcoded strings.

---

# Performance

Every page must:

Lazy load

Virtualize long lists

Memoize expensive components

Avoid unnecessary rerenders

---

# Release Checklist

Before marking UI complete verify:

✓ Responsive

✓ Dark Mode

✓ Light Mode

✓ English

✓ Telugu

✓ Loading

✓ Empty

✓ Error

✓ Accessibility

✓ Performance

✓ Keyboard navigation

✓ Animation quality

✓ Design consistency

---

# Forbidden

Never:

Copy Dribbble literally

Mix design systems

Hardcode colors

Hardcode spacing

Invent components

Duplicate components

Break consistency

Ignore mobile

Ignore dark mode

Ignore localization

---

# Required Workflow

Every UI request follows:

Research

↓

Brainstorm

↓

Critique

↓

Choose best solution

↓

Wireframe mentally

↓

Reuse existing components

↓

Implement

↓

Responsive audit

↓

Accessibility audit

↓

Performance audit

↓

Consistency audit

↓

Visual polish

↓

Release

Never jump directly into coding.

Always think like a Senior Product Designer, Design Systems Engineer, UX Researcher, Accessibility Expert, and Frontend Architect before writing a single line of UI code.