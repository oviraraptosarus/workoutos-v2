<div align="center">
  
  <img src="https://img.shields.io/badge/Workout_OS-000000?style=for-the-badge&logo=apple&logoColor=white" alt="Workout OS Logo" />
  
  <h1 align="center">Workout OS</h1>
  
  <p align="center">
    <strong>The Ultimate AI-Powered Life & Fitness Operating System.</strong>
    <br />
    A premium, voice-first ecosystem to manage your tasks, diet, sleep, finances, and journaling.
  </p>

  <p align="center">
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#installation">Installation</a> •
    <a href="#architecture">Architecture</a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" />
  </p>

  <br />

  <!-- Placeholder for a beautiful dashboard preview GIF/Image -->
  <a href="#">
    <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" alt="Rainbow Line" width="100%" />
  </a>
</div>

---

## ✨ Features

Workout OS isn't just a tracker—it's an intelligent assistant designed with absolute precision. We employ a premium Apple iOS design philosophy (glassmorphism, micro-animations, and flawless dark/light modes) combined with voice-first interactions.

### 🎙️ Voice-First AI Architecture
- **Brain Dump:** Speak your chaotic thoughts into the void. Ava (our AI Copilot) instantly extracts them into a structured, actionable checklist.
- **Daily Journal (Reflect Hub):** End your day with a voice reflection. Features a custom CSS-animated real-time audio waveform. AI automatically summarizes your raw transcript.
- **Platform-Aware Dictation:** Bulletproof speech recognition that utilizes a custom State Machine to bypass native Android/iOS browser dictation bugs, ensuring flawless 1:1 transcription without compounding echoes.

### 🍱 Intelligent Health & Diet
- **Gemini Food Assistant:** Log your meals instantly using your camera (Vision AI) or voice dictation.
- **Macro & Water Tracking:** Beautiful animated gauge charts for your daily intake and hydration.
- **Sleep Trends:** Data-driven historical charts with localized pagination for reviewing your rest.

### ⚡ Execution & Productivity
- **Content Vault:** A premium, tabbed hub to save and consume YouTube videos, articles, and links. Automatically scrapes metadata.
- **Daily Quests & Macro Goals:** Gamified task execution with custom lightning and trophy icons.
- **Budget Tracker:** Keep your finances and spending habits aligned with your life goals.

---

## 🛠️ Tech Stack

- **Frontend:** [Next.js](https://nextjs.org/) (App Router), React, TypeScript.
- **Styling:** Tailwind CSS (Premium Glassmorphism & Custom CSS variables for flawless Dark/Light mode integration).
- **Backend/Database:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Edge Functions).
- **AI Orchestrator:** Cascading multi-provider architecture (OpenRouter & Native Gemini) to prevent rate-limiting. Armed with strict Anti-Hallucination prompting (Factual Grounding & Task Adherence).

---

## 🚀 Installation & Local Setup

Ready to deploy your own Execution OS? Follow these instructions to run Workout OS locally.

### Prerequisites
- Node.js (v18 or higher)
- A [Supabase](https://supabase.com/) account
- AI Provider API Keys (OpenRouter, Gemini)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/workoutos-v2.git
cd workoutos-v2
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory and add your keys:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Provider Keys
OPENAI_API_KEY=your_openrouter_or_openai_key
GEMINI_API_KEY=your_gemini_key
```

### 4. Database Setup
Ensure you have run all database migrations located in the `supabase/migrations/` folder within your Supabase SQL editor. This sets up critical tables like `tasks`, `daily_logs`, `content_vault`, and `profiles` with the correct Row Level Security (RLS) policies.

### 5. Run the Development Server
```bash
npm run dev
# or
yarn dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to experience Workout OS.

---

## 🏗️ Architecture & Philosophy

Workout OS strictly adheres to a **Premium Apple iOS Design Philosophy**:
- **Zero Clutter:** Unorganized UI is rejected. We prioritize clean, spaced-out formatting and tight tracking.
- **Interactive Widgets:** Every dashboard widget acts as a launchpad hyperlink to a dedicated module. No dead ends.
- **State Machine Reliability:** Voice dictates the app, meaning edge cases like Android audio buffer replays are intercepted at the lowest event layer.

> **Note for Contributors:** For detailed development rules and architectural constraints, please read the `.agents/AGENTS.md` and `.agents/architecture.md` blueprints included in the repository before making PRs.

---

## 📦 Data Management
- **Universal Export:** You completely own your data. Built-in JSON data export/import capabilities for all tables (sleep, workouts, tasks, etc.) right from the Profile settings.

---

<div align="center">
  <br />
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" alt="Rainbow Line" width="100%" />
  <br /><br />
  <i>Built with absolute cutthroat precision.</i><br /><br />
  <strong>Built by <a href="https://github.com/oviraraptosarus">OVIRARAPTOSARUS</a></strong>
</div>
