# Frontend UI/UX Blueprint

## 1. The "Premium Native iOS" Aesthetic
The goal is to build a web application that feels indistinguishable from a top-tier native iOS app (e.g., Apple Health, Snapchat, Instagram).

### Spatial Architecture & Layout
- **Mobile First, Desktop Scaled**: Build for the constraints of an iPhone first. Use a bottom tab navigation for mobile and shift to a side-nav or expanded top-nav for desktop.
- **Top Navigation for Utilities**: Do NOT use Floating Action Buttons (FABs) anchored to the bottom corners. They clip into content and look distinctly like Android wrappers. Global tools (AI Copilots, Profile, Settings) belong in the Top Nav.
- **Compactness**: Do not waste vertical space. Limit padding to `p-4` or `p-6` on mobile. Scale up to `p-8` only on `sm` (tablets/desktops).
- **Segmented Controls**: For tabs, use evenly distributed horizontal flexboxes. Avoid horizontal scrolling tabs as they break native conventions.

### Aesthetic Layering (Glassmorphism & Depth)
- **Base Layers**: The app background should be pure black (Dark Mode) or stark white/off-white (Light Mode).
- **Surface Containers**: Cards should use deep glassmorphism.
  - *Dark Mode Example*: `bg-white/5 backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]`
  - *Light Mode Example*: `bg-black/5 backdrop-blur-3xl border border-black/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)]`
- **Gradients**: Use subtle conic or radial background gradients to inject brand colors, heavily blurred (`filter: blur(100px)`), so the glass cards sit on top of them.

### Typography & Iconography
- **Font**: Use a premium sans-serif (Inter, SF Pro, Outfit).
- **Hierarchy**: Make headers distinctly heavier (`font-black`, `tracking-tight`). Keep body text highly readable (`text-on-surface-variant`, `leading-relaxed`).
- **Icons**: Use standard lightweight SVGs (e.g., Lucide). Avoid cliché icons (e.g., use an `Orbit` or `BrainCircuit` for AI, not a generic `Sparkle`). Size them appropriately (e.g., `w-5 h-5` inside a `w-10 h-10` container on mobile).

## 2. Micro-Animations & State Feedback
A native app feels alive. Every interaction must yield physical feedback.
- **Active States**: Every button or clickable card must have `active:scale-95 transition-transform duration-200`.
- **Hover States**: For desktop pointers, add subtle lifts: `hover:-translate-y-0.5`.
- **Enter Animations**: Pages and large components must NOT instantly appear. Use `animate-in fade-in slide-in-from-bottom-8 duration-700`.
- **Loading States**: Never freeze the UI. Always show a `Loader2 animate-spin` or a skeleton loader when awaiting network calls.

## 3. Component Hierarchy
1. **Layout Shell**: Contains the Background Gradients, TopNav, BottomNav, and the Global AI Copilot Provider.
2. **Page Views**: Handled by Next.js routing. Controls fetching top-level data.
3. **Smart Modules**: (e.g., `TaskBoard`, `ReflectionHub`). Manage local UI state and coordinate API calls.
4. **Dumb Components**: (e.g., `GlassCard`, `PrimaryButton`). Strictly presentational.

## 4. State Management Rules
- **Ephemeral UI State**: (Modals open/close, active tabs, form inputs) -> `useState` or `useReducer`.
- **Global App State**: (Language, Theme, Auth User) -> React Context (`useAuth`, `useTheme`).
- **Server State**: (Database records) -> Fetch directly via Hooks wrapping Supabase queries, or use `SWR`/`React Query`. Do NOT sync server state into Global App State (Context) as it causes massive re-render waterfalls.
