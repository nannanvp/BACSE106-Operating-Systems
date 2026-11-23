# `skill-FAT.md` — Universal Exam-Sprint Reference Manual & Interactive Lab Blueprint

> **Purpose**: Hand this file together with **any university, engineering, science, medical, business, or humanities course** (syllabus, lecture slides, textbook list, exam schedule, and/or past question papers) to a fresh **Gemini 4 Neon Max** instance in Google AI Studio Build mode. Following this specification end-to-end produces a complete, offline-capable, zero-backend, production-grade **Final Assessment Test (FAT) / Final Exam Sprint Manual & Interactive Laboratory** tailored to that subject.
>
> **Subject-Agnostic Guarantee**: Every architectural pattern, visual token, TypeScript schema, mathematical engine, and workflow below is completely generalized. Never leave placeholder subject names or sample domain content in the generated app—synthesize 100% authentic, technically rigorous content exclusively for the user's target course.

---

## 0. Course Intake & Normalization Protocol

Before writing any code, extract and normalize the user's supplied course materials into a structured mental inventory:

| Input Item | Required? | What to Extract / Smart Fallback if Omitted |
| :--- | :--- | :--- |
| **Course Identity** | Required | `<COURSE_CODE>` (e.g., `CS301`, `PHYS204`, `ECON102`), `<COURSE_TITLE>`, `<INSTITUTION>`, `<COURSE_SLUG>` (lowercase alphanumeric for `localStorage` prefixes, e.g., `cs301`), `<EXAM_NAME>` (e.g., `FAT`, `Final Exam`, `End-Sem`). |
| **Modules & Syllabus** | Required | Ordered list of `N` modules (`m1`..`mN`, typically 4–7 modules), each with exact title, lecture hours, Course Outcomes (`CO1..COk`), and 4–7 granular topics (aim for `20–35` total syllabus topics). If the user supplies only a course title, derive the standard accredited university syllabus for that course. |
| **Exam Format & Date** | Optional | Exact exam date, start/end time, timezone offset, exam duration (default `3 hours`), total marks (default `100M`), and paper blueprint (e.g., `7×10M + 2×15M`, or `10×2M Part A + 5×16M Part B` with internal `OR` choices). If no date is provided, default the target exam timestamp to **48 hours from build time** (or configurable in-app) and label the sprint window cleanly. |
| **Lecture Slides / Textbook** | Optional | Map slide deck titles/URLs and textbook chapters to each module (`professorMaterials.ts`). If no links are supplied, synthesize a structured **Recommended Study Pack & Reference Chapters** list per module without broken URLs. |
| **Past Exam Papers / Earlier Slots** | Optional | If the user supplies 1+ past papers (e.g., Slot A / Slot B / Previous Year), transcribe **every single question** verbatim with full marking rubrics and worked solutions, run **Source Forensics**, and drive the **Prediction Engine** from real empirical coverage. If no past papers are supplied, generate **2 full-length realistic 100M Model Exam Papers** matching the institution's format + a **Historical High-Yield Forecast** in the Prediction view. |
| **Deterministic Computation & Visuals** | Required | Identify **6+ deterministic calculation/derivation archetypes** for the Procedural Numerical Drill Arena, **1–3 interactive step-by-step simulators per module** (minimum 5 total labs), and **20–35 bespoke inline SVG concept plates** covering every diagrammable structure in the course. |

---

## 1. Tech Stack, Runtime & Zero-Backend Offline Architecture

### 1.1 Dependencies & Tooling
- **Runtime**: React 19 (`react`, `react-dom`) + TypeScript (`~5.x`, strict typing, standard enums/unions only) + Vite (`vite --port=3000 --host=0.0.0.0`, `@vitejs/plugin-react`).
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite` + `tailwindcss`). Loaded via `@import "tailwindcss";` in `src/index.css`. Zero external CSS component libraries, zero inline style clutter, zero runtime CSS-in-JS.
- **Icons & Motion**:
  - `lucide-react` for crisp geometric UI icons (`12px–20px`).
  - `motion` (`motion/react` — `motion`, `AnimatePresence`) for tactile view transitions, animated radar polygons, modal/drawer reveals, and spring feedback.
- **Zero-Backend / 100% Client-Side Offline First**:
  - All syllabus notes, SVG plates, interactive simulators, diagnostic banks, past papers, SM-2 flashcards, and progress ledgers run **100% client-side in the browser** with `localStorage` persistence.
  - Zero LLM API calls, zero chatbots, zero backend servers, zero external audio/image dependencies (even the Pomodoro completion chime is synthesized cleanly via Web Audio API).
  - Never use `window.alert`, `window.confirm`, or `window.prompt` (breaks sandboxed iframes); use crisp inline confirmation buttons or accessible modals.
- **Verification Tooling**:
  - Built-in Node.js test runner (`node --import tsx --test src/utils/*.test.ts src/data/*.test.ts`) for all pure-logic engines and data integrity tests.
  - `npm run lint` (`tsc --noEmit`) + `npm run build` (`vite build`).
  - Headless browser verification (`playwright-cli`) across Desktop (`1440×900`) and Mobile (`390×844`) in Light & Dark modes.

### 1.2 `metadata.json` & `index.html` Sync
- Set `<COURSE_CODE> — <COURSE_TITLE> Exam Sprint` in `metadata.json` (`name` and `description`) on the very first turn and never rename it afterward.
- Mirror the exact `<title>`, `<meta name="description">`, `og:title`, and `og:description` in `index.html`.
- Load Google Fonts in `index.html`:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,500;0,600;0,700;0,800;1,600&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap"
    rel="stylesheet"
  />
  ```
- Inject a **synchronous anti-FOUC dark mode bootstrap script** inside `<head>` of `index.html` before any stylesheet or React bundle runs:
  ```html
  <script>
    (function () {
      try {
        var stored = localStorage.getItem('<course_slug>_dark_mode_v1');
        var isDark =
          stored === 'true' ||
          (stored === null &&
            window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) document.documentElement.classList.add('dark');
      } catch (e) {}
    })();
  </script>
  ```

---

## 2. Visual Design Constitution (`rw-manual-acetate-tab-board`)

### 2.1 Physical Metaphor
Design the entire application as an **open late-1980s boxed-software technical reference manual** resting on an oiled-charcoal binder desk mat:
1. **Left Margin (`xl:flex`, 44px `w-11`)**: Punched ring-binder spine strip with 3 circular binder holes (`.binder-hole`) and a rotated vertical folio stamp (`writing-mode: vertical-rl; transform: rotate(180deg)`).
2. **Main Manual Sheet**: Archival cream paperboard canvas (`#EAE4D7`), milk-acetate module leaves (`#F4EFE4`), and primary reading sheets (`#FAF7F0`) separated by crisp `1px solid` rules rather than blurry drop shadows.
3. **Right Margin (`xl:flex`, 36px `w-9`)**: **Stepped Fore-Edge Division Tab Rail** — die-cut `rounded-r-[6px]` colored tabs with punched eyelet dots and vertical labels for every syllabus module (`M1`..`MN`), `LABS`, and `100M EXAM`, with tab heights scaled proportionally to each module's lecture hours (`h-24`, `h-28`, `h-32`).

### 2.2 Light Mode Tokens (`:root`)
```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --font-display: 'Archivo', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-sans: 'Archivo', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-serif: 'EB Garamond', Georgia, 'Times New Roman', serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
}

:root {
  /* Paper & Binder Surfaces */
  --surface-binder: #26231E;   /* Oiled charcoal binder desk mat */
  --surface-board: #EAE4D7;    /* Archival cream paperboard body */
  --surface-leaf: #F4EFE4;     /* Milk-acetate section leaf */
  --surface-sheet: #FAF7F0;    /* Primary reading sheet */
  --surface-well: #E2DBCC;     /* Recessed control / code well */

  /* Technical Inks */
  --ink-primary: #1C1B18;      /* Carbon ink (never pure #000000) */
  --ink-secondary: #434038;    /* Body secondary */
  --ink-muted: #6E695D;        /* Folio / metadata ink */

  /* Hairlines & Structural Rules */
  --rule-hairline: #C5BEB0;
  --rule-heavy: #1C1B18;

  /* Dynamic Active Division Accent (set at runtime by solveLeafAlpha) */
  --division-accent: #E5B82E;
  --leaf-alpha: 0.14;
}
```

### 2.3 Generalized Division Color Wheel (`DIVISION_WHEEL`)
Assign distinct archival ink-inspired hues to every syllabus module (`m1..mN`), plus fixed colors for `labs`, `mock`, `standing`, and `danger`. If a course has more than 5 modules, cycle/interpolate cleanly while maintaining ink contrast (`ink` is `#1C1B18` on high-luminance yellows/oranges and `#FAF7F0` on deeper tones):

| Division ID | Color Name | Hex | Foreground Ink | Primary Role |
| :--- | :--- | :--- | :--- | :--- |
| `m1` | Chrome Yellow | `#E5B82E` | `#1C1B18` | Module 1 + Primary Exam CTA (`Start Mock →`) |
| `m2` | Oxide Orange | `#E06D2B` | `#1C1B18` | Module 2 + High-Yield Warnings |
| `m3` | Grass Green | `#4F8A3D` | `#FAF7F0` | Module 3 + Verified Mastery / Correct |
| `m4` | Teal | `#147E7B` | `#FAF7F0` | Module 4 + Secondary Interactive Accents |
| `m5` | Ultramarine | `#22559C` | `#FAF7F0` | Module 5 + Technical Citations |
| `m6` *(if needed)* | Terracotta | `#B8533A` | `#FAF7F0` | Module 6 (optional overflow) |
| `m7` *(if needed)* | Slate Indigo | `#3B5998` | `#FAF7F0` | Module 7 (optional overflow) |
| `labs` | Violet | `#6F539B` | `#FAF7F0` | Interactive Labs & Procedural Drills |
| `mock` | Sienna | `#854D2B` | `#FAF7F0` | 100M Mock Papers & Forensics |
| `standing` | Royal Plum | `#6B21A8` | `#FAF7F0` | Standing Diagnostic & Radar |
| `danger` | Carmine | `#A62B2B` | `#FAF7F0` | Wrong Answers, Overdue Alerts, `-2M` Traps |

### 2.4 Runtime Acetate Contrast Solver (`solveLeafAlpha`)
Whenever the active division changes, compute `--leaf-alpha` in TypeScript using a **12-iteration binary search** over sRGB relative luminance so that `#FAF7F0` composited with `rgba(divisionHex, alpha)` always achieves target relative luminance `0.91` (guaranteeing WCAG AAA ≥ 9.5:1 contrast under `#1C1B18` ink):
1. Parse hex `(r, g, b)` for the active division and paper sheet `#FAF7F0` `(250, 247, 240)`.
2. For candidate `alpha ∈ [0.04, 0.35]`, alpha-composite `c = alpha * div_c + (1 - alpha) * paper_c`.
3. Linearize sRGB channel `v = c / 255`: `lin = v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)`.
4. Compute relative luminance `L = 0.2126 * R_lin + 0.7152 * G_lin + 0.0722 * B_lin`.
5. Binary search `12` steps: if `L < 0.91`, move `hi = mid`; else `lo = mid`.
6. Publish `document.documentElement.style.setProperty('--division-accent', hex)` and `setProperty('--leaf-alpha', mid.toFixed(3))`.

### 2.5 OKLCH Warm-Obsidian Dark Mode (`html.dark`)
Dark mode is **not** a cold blue-gray inversion—it is a warm obsidian desk lamp reading palette anchored at hue `72°` with chroma `≤ 0.011`:
- **Progressive Lightness Elevation Ladder** (higher surfaces = subtly lighter, never pure `#000000`):
  - `--surface-binder`: `oklch(15.5% 0.007 72)` (deepest desk mat)
  - `--surface-board`: `oklch(19% 0.008 72)` (canvas)
  - `--surface-sheet`: `oklch(23% 0.009 72)` (primary reading sheet)
  - `--surface-leaf`: `oklch(26.5% 0.010 72)` (elevated leaf / card)
  - `--surface-well`: `oklch(15% 0.006 72)` (recessed code/input wells)
  - Frosted glass modal/FAB backdrop: `oklch(24% 0.009 72 / 0.86)` with `backdrop-filter: blur(12px)`.
- **Warm Off-White Ink Ramp** (never pure `#FFFFFF` glare) + slight optical tracking compensation (`letter-spacing: +0.008em` on body text):
  - `--ink-primary`: `oklch(91% 0.010 78)`
  - `--ink-secondary`: `oklch(76% 0.010 76)`
  - `--ink-muted`: `oklch(62% 0.009 74)`
  - `--rule-hairline`: `oklch(34% 0.009 72)`
  - `--rule-heavy`: `oklch(52% 0.010 74)`
- **Tempered Fore-Edge Tabs**: In `html.dark`, apply `filter: saturate(0.84) brightness(0.92)` on `.fore-edge-tab` so colored tabs stay rich without neon eye-strain.
- **Technical Diagram Protection (`.diagram-canvas-plate`)**: Every inline SVG diagram sits inside `.diagram-canvas-plate` which renders `#FAF7F0` in light mode and a muted archival paper plate `oklch(92% 0.012 82)` in dark mode, keeping technical schematics razor-sharp without unreadable inverted strokes.
- **Tailwind Utility Overrides**: Add clean scoped overrides in `src/index.css` under `html.dark` for any utility classes (`bg-[#FAF7F0]`, `bg-[#F4EFE4]`, `bg-[#EAE4D7]`, `bg-white`, `text-[#1C1B18]`, `border-[#1C1B18]`, `border-[#C5BEB0]`) so every component transitions seamlessly without visual seams.

### 2.6 Typography, Shapes, Motion & Print Rules
- **Type Hierarchy**:
  - **Display & UI (`Archivo`)**: Headings `font-bold`/`font-extrabold`, tight tracking `tracking-[-0.025em]`.
  - **Long-Form Reading Notes (`.prose-manual`, `EB Garamond`)**: `font-size: 1.08rem; line-height: 1.62; max-width: 68ch;` so dense conceptual explanations read like a typeset textbook.
  - **Technical Data (`JetBrains Mono`)**: Every score, countdown digit, formula, code block, folio stamp, and table metric MUST carry `font-mono tabular-nums` (`font-variant-numeric: tabular-nums`) to prevent horizontal jitter during live countdowns.
- **Die-Cut Geometry & Elevation**:
  - Primary sheets & buttons: `rounded-[4px]` with `1px solid var(--rule-heavy)` or `1px solid var(--rule-hairline)`.
  - Folio stamps & inline badges: `rounded-[2px]`.
  - Binder punch holes & mastery rings: `rounded-full`.
  - No puffy `rounded-2xl` / `rounded-3xl` cards, no soft SaaS `shadow-xl` glow halos. Use crisp `1px` structural ink rules and `2px` hard offset paper edges where emphasis is needed.
- **Motion & Tactile Feedback**:
  - `.step-hinge`: `transition: transform 90ms steps(2, end), background-color 90ms steps(2, end), color 90ms steps(2, end);` — snappy 2-frame mechanical click feel.
  - Confetti animations (`@keyframes confetti-burst`, `@keyframes confetti-ring`, `@keyframes confetti-check-pop`): Strictly GPU compositor-only (`transform`, `opacity`).
  - **Reduced Motion**: Wrap all custom animations inside `@media (prefers-reduced-motion: reduce)` turning durations to `0.01ms`, and check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` in JS before spawning confetti particles (still showing the accessible status toast).
- **Print Stylesheet (`@media print`)**:
  - Hide `header, nav, aside, footer, .no-print { display: none !important; }`.
  - Force `#FFFFFF` paper background and `#000000` ink.
  - Apply `break-inside: avoid; page-break-inside: avoid;` on `.print-card`.

### 2.7 Strict Craft Constitution (Do's & Don'ts)
1. **Heading-First Rule**: Every heading (`h1`–`h4`) MUST lead its container. Metadata, module codes, lecture hours, and tags go **below** or inline-right of the heading—NEVER stack tiny uppercase eyebrow kickers above headings.
2. **Zero Pill Bloat**: Maximum 1–2 concise rectangular `[2px]` folio tags per card. Never scatter floating rounded-full pill arrays across headers or cards.
3. **Zero Decorative Grid Numbering**: Never stamp fake `01.` / `02.` / `03.` marketing indices onto UI feature cards (real syllabus codes like `M1`, `T1.2`, `Q4(a)` are functional and encouraged).
4. **No Cards-Inside-Cards Nesting**: Use `1px` hairline dividers (`divide-y`, `border-t`) inside sheets instead of nesting bordered boxes inside bordered boxes 3 levels deep.
5. **High Information Density with Breathing Room**: Pack real exam substance (formulas, worked steps, marking schemes, pitfalls) while keeping generous horizontal reading margins and `max-w-[1440px]` centered binder framing.
6. **Zero Telemetry / Meta-Clutter**: Never show fake system status dots, "AI-powered" badges, or build logs in the UI.

---

## 3. Global App Shell & Persistent Chrome (`src/App.tsx`)

The top-level shell wraps all 7 views in a unified physical binder frame:

1. **Skip-to-Content Link**: Visually hidden `sr-only focus:not-sr-only` anchor targeting `#main-content`.
2. **Strict 3-Zone Sticky Header (`h-14`, `sticky top-0 z-40`)**:
   - **Zone 1 (Left)**: Brand wordmark button (`<COURSE_CODE> Sprint`) — resets/jumps to `standing`.
   - **Zone 2 (Center, `hidden md:flex`)**: Single-line uppercase `font-mono text-[11px] tracking-wider` text navigation links for the **7 Top-Level Views**:
     1. `Standing` (`#6B21A8` Royal Plum accent + `Gauge` icon — **default initial view**)
     2. `48h Plan`
     3. `Syllabus`
     4. `Reference`
     5. `Prediction`
     6. `Labs`
     7. `FAT Mock` (`ClipboardCheck` icon + live unresolved weak-topics count badge in Carmine `#A62B2B` when `unresolvedCount > 0`)
   - **Zone 3 (Right)**:
     - Dark Mode toggle (`Sun` / `Moon` icon, accessible `aria-label`, synced with `darkModeEngine`).
     - Primary Chrome Yellow CTA button (`#E5B82E`, `#1C1B18` ink): `Start <EXAM_NAME> Mock →` (jumps directly to `mock` view).
3. **Mobile Navigation Bar (`md:hidden`)**: Static horizontal scrollable single-row tab strip immediately below the header (never a heavy bottom tab bar that eats viewport height on phones/tablets).
4. **3-Column Physical Binder Frame**:
   - **Left Column (`hidden xl:flex w-11 shrink-0`)**: Punched ring-binder spine (`border-r` heavy rule) with 3 evenly spaced `.binder-hole` circles (`w-4 h-4 rounded-full bg-[var(--surface-binder)] ring-1 ring-[var(--rule-heavy)]`) and vertical rotated folio metadata (`<COURSE_CODE> · <EXAM_NAME> MANUAL · REV 1.0`).
   - **Center Column (`flex-1 min-w-0`)**: `<main id="main-content">` rendering:
     - **Global Compact Exam Countdown Strip**: Visible at top of `<main>` on all views *except* `48h Plan` (which renders the full `hero` countdown), with a 1-click `← 48h Plan` jump link.
     - Active View component (switched via `activeTab` state, with deep-link props like `focusModuleId`, `focusTopicId`, `focusLabId`, `focusPaperId`, `focusQuestionId` so any view can jump cleanly to an exact topic, lab, or mock question).
   - **Right Column (`hidden xl:flex w-9 shrink-0 flex-col gap-1.5 py-6`)**: **Stepped Fore-Edge Division Tab Rail**.
     - Renders one die-cut `rounded-r-[6px]` vertical tab per syllabus module (`M1..MN`), plus `LABS` and `100M`.
     - Active tab protrudes slightly (`translate-x-1`, bold border) and triggers `solveLeafAlpha` for its division color.
     - Clicking `M1..MN` opens `Syllabus` focused on that module; clicking `LABS` opens `Labs`; clicking `100M` opens `FAT Mock`.
     - Each tab displays a small punched eyelet dot + vertical label (`writing-mode: vertical-rl`) and height scaled to syllabus lecture weight (`h-24` / `h-28` / `h-32`).
5. **Global Floating Formula Quick-Reference Drawer (`FormulaQuickRef.tsx`)**:
   - Fixed bottom-right frosted-glass FAB (`📐 Formulas` + `⌘K` / `Ctrl+K` hint).
   - Global `keydown` listener: `Ctrl+K` or `Cmd+K` toggles the slide-up modal; `Escape` closes it.
   - Auto-focuses search input on open; runs multi-token substring filtering (`formulaQuickRefEngine.ts`) across module codes, module titles, rule labels, and formula strings; displays collapsible module groups color-coded by `DIVISION_WHEEL` with `font-mono` formula blocks and instant match count.
6. **Manual Footer**: Single crisp colophon bar displaying `<COURSE_CODE> · <COURSE_TITLE>`, `<INSTITUTION>`, target exam window, and `100% Client-Side Offline Manual`.

---

## 4. Complete Specification of Views 1–4

### View 1: Standing Diagnostic (`StandingView.tsx` + Subcomponents)
**Purpose**: The default landing view ("Start Here First") that diagnoses exactly where the student stands across every module before they burn hours studying topics they already know.

- **Question Bank Architecture**:
  - **30 questions per module** (`30 × N` total; e.g., `150` questions for a 5-module course), stored in modular files (`standingM1.ts..standingMN.ts`) aggregated by `standingData.ts`.
  - Split evenly into **3 Cognitive Tiers** (`10` questions per tier per module):
    1. **Tier 1 — Foundation (`★☆☆`, Emerald `#10B981`)**: *"Do you remember it?"* — definitions, core invariants, nomenclature, fundamental laws.
    2. **Tier 2 — Application (`★★☆`, Amber `#F59E0B`)**: *"Can you use it?"* — direct formula application, tracing a standard algorithm/method, classifying cases.
    3. **Tier 3 — Analysis (`★★★`, Rose `#F43F5E`)**: *"Can you reason about it?"* — edge cases, multi-step exam traps, comparative trade-offs, debugging flawed derivations.
- **Sub-Flow A — Standing Landing Dashboard**:
  - Header banner with total assessed progress (`X / N modules assessed`), 1-click **"Assess Next Module →"** CTA, and 3-tier color key.
  - **Cross-Module SVG Radar Chart (`RadarChart.tsx`)**:
    - Unlocks once `≥ 2` modules have completed diagnostics (shows an encouraging locked preview state before `2` modules).
    - `N`-axis polygon (1 axis per module) with 3 concentric reference rings (`33%`, `66%`, `100%`), 3 animated translucent tier polygons (Foundation emerald, Application amber, Analysis rose) via `motion`, axis labels, aggregate score (`X / (30×N)`), and overall Readiness Band (`≥ 80%` Strong, `≥ 53%` Decent, `≥ 27%` Significant Gaps, `< 27%` Start from Scratch).
  - **Module Diagnostic Card Grid**: One card per module showing division color bar, saved Grade (`A ≥ 25/30`, `B ≥ 18/30`, `C ≥ 10/30`, `D < 10/30`), per-tier mini bars (`F: x/10`, `A: y/10`, `An: z/10`), and action button (`Start Diagnostic` / `View Results` / `Retake`).
- **Sub-Flow B — Step 1: 5-Minute Quick Refresher (`StandingRefresher.tsx`)**:
  - Skippable pre-quiz warm-up sheet (`Skip to Quiz →` button in top-right) containing:
    - Core Concept Map (5–7 crisp bullets).
    - Highlighted Exam Formulas & Golden Rules box (`font-mono`).
    - 3 High-Yield Worked Patterns rendered via `MarkdownBlock`.
    - Bottom primary CTA: `I'm Ready — Start 30-Question Diagnostic →`.
- **Sub-Flow C — Step 2: 30-Question Tiered Quiz (`StandingQuiz.tsx`)**:
  - 3-tier segmented progress bar (10 emerald + 10 amber + 10 rose cells) showing answered/correct/wrong status.
  - Immediate answer lock on selection with rich worked explanation panel.
  - **Tier Transition Interstitial Banner** after Q10 (Foundation → Application) and Q20 (Application → Analysis) summarizing tier score before advancing.
  - Every wrong answer automatically records/increments an entry in global `weakTopics` (`source: 'standing'`).
- **Sub-Flow D — Step 3: Results & Prescriptive Coach (`StandingResults.tsx`)**:
  - Animated score count-up (`requestAnimationFrame` cubic ease-out `1 - (1 - t)^3`) + Grade badge (`A`/`B`/`C`/`D`).
  - Per-tier traffic-light progress bars (`≥ 7` green, `≥ 5` amber, `< 5` red).
  - **Prescriptive Recommendation Engine (`getPrescriptiveRecommendations`)**:
    - `foundation < 7` → Prioritize **Syllabus Concept Notes** for this module.
    - `application < 6` → Run the module's **Interactive Simulator & Numerical Drills**.
    - `analysis < 6` → Practice **Mock Part B / Long-Answer Rubrics** for this module.
    - All three `≥ 7` → Module is **Exam-Ready**; maintain via SM-2 Flashcards.
  - Direct 1-click navigation CTAs (`Open M# Notes`, `Launch Recommended Lab`, `Jump to M# Mock Questions`, `Review Weak Topics`) + embedded `WeakTopicsPanel` filtered to this module.

---

### View 2: 48-Hour Sprint Planner & Readiness Coach (`SprintPlannerView.tsx`)
**Purpose**: High-urgency tactical command center organizing the final 48 hours (or custom pre-exam sprint window) into concrete, checkable time blocks with live readiness telemetry.

- **Architectural Masthead (7:5 Asymmetric Grid)**:
  - **Left 7 Cols**: Display `<h1>`, `.prose-manual` executive mission lead, course metadata strip, **Hero Exam Countdown (`ExamCountdown.tsx`, `variant="hero"`)**, and primary CTA row (`Take 100M Mock`, `Open Syllabus Manual`, inline two-step `Reset Sprint Progress` confirmation).
  - **Right 5 Cols**:
    - **Sprint Execution Ledger**: Completion `%`, completed hours / total sprint hours, blocks done, and a 10-segment mechanical bar meter.
    - **Syllabus Topic Mastery Summary**: `X / Total` mastered topics, progress bar, and clickable `M1..MN` mini mastery tiles.
    - **3-Row Exam Window Schedule**: Exam Date & Slot, Paper Blueprint, Venue/Reporting Rule.
- **Hero & Compact Exam Countdown (`ExamCountdown.tsx` + `countdownEngine.ts`)**:
  - Timezone-independent UTC epoch math supporting **6 automatic phases**:
    1. `prep` (`> 48h` remaining)
    2. `sprint_48h` (`24h < rem ≤ 48h`)
    3. `final_24h` (`6h < rem ≤ 24h`)
    4. `exam_morning` (`0 < rem ≤ 6h`)
    5. `in_progress` (during the 3-hour exam window)
    6. `completed` (after exam end time)
  - Live 1-second tick with `tabular-nums` (`DD : HH : MM : SS`) and phase-appropriate urgency callout.
- **Compact Non-Blocking Pomodoro Focus Timer (`PomodoroTimer.tsx` + `pomodoroEngine.ts`)**:
  - Compact horizontal bar card with SVG circular progress ring colored to the active module's `DIVISION_WHEEL` hex.
  - 3 modes: `Focus (25m)`, `Short Break (5m)`, `Long Break (15m)`.
  - Auto-advances every 4th completed focus block to `Long Break`; displays 4-dot cycle tracker + daily target (`Focus #X of 8`).
  - Synthesized Web Audio API harmonic completion chime (two clean sine tones, zero audio files) with Mute toggle; state persisted in `localStorage` (`pomodoro_v1`).
- **Module Index Strip**: Horizontal responsive strip of all `N` modules with division color stripe, lecture hours, and `mastered / total` ratio; clicking any card jumps straight into that module in `Syllabus`.
- **95+ Exam Readiness Command Panel & Smart Next-Action Coach (`readinessEngine.ts`)**:
  - Displays composite `0–100` Readiness Score, projected exam mark band (`95–100`, `85–94`, `72–84`, `55–71`, `< 55`), 5 transparent sub-pillar progress bars, weakest module alert, and **Top 3 Prioritized 1-Click Next Actions** (`CRITICAL`, `HIGH`, `POLISH`) that deep-link directly to the exact module, lab, flashcard queue, or mock paper needed next.
- **48-Hour Timetable Ledger**:
  - Day filter tabs (`All 48 Hours`, `Day 1`, `Day 2`, `Exam Morning`).
  - **80/20 High-Yield Triage Mode** toggle: Filters timetable down to high-ROI core blocks (`isHighYield: true`) designed to lock in a guaranteed 65–70% passing/strong baseline when time is tight.
  - `Hide completed blocks` toggle.
  - Each sprint block features a punched circular completion checkbox, time window (`tabular-nums`), duration badge, division color tag, concrete sub-task checklist, and 1-click action link (`Open Notes` / `Open Lab` / `Open Mock`).

---

### View 3: Full-Width Syllabus & Topic Notes Manual (`SyllabusView.tsx`)
**Purpose**: Distraction-free, deeply technical reference manual covering every single syllabus topic with textbook rigor, vector diagrams, past-exam solving methods, and persisted self-checks.

- **Layout**: Full-width reading sheet (100% of `<main>` width — zero cluttered right sidebars).
- **Deep Full-Text Search Bar**:
  - Global `/` shortcut focuses the input; `Escape` clears/blurs.
  - Searches across ALL modules and topics: title, detail, summary, key points, deep-dive headings/bodies/bullets/tables/code blocks, worked examples, FAT solving methods, self-check prompts, and exam tips.
  - Renders instant contextual jump snippets with inline `<mark>` highlighting; clicking a result switches to that module, expands the topic, and smooth-scrolls directly to it.
- **Cross-Topic Missed Self-Check Queue**:
  - Aggregates every incorrectly answered question across all persisted per-topic Self-Checks (`~60–80` total MCQs across the syllabus).
  - Lets the student drill only missed self-checks inline; answering correctly immediately clears the item from the queue.
- **Module Switcher & Topic Accordion Controls**:
  - Color-coded `M1..MN` switcher strip + `Expand All` / `Collapse All` buttons + module mastery counter.
- **Anatomy of Each `TopicNote` Card**:
  1. **Header**: Topic ID (`T1.1`), Title (`h3` leads block), `Mark Mastered` toggle button (triggers confetti on unmastered → mastered), `Full-Screen Reader` button, and Expand/Collapse chevron.
  2. **Executive Summary**: Typeset in `.prose-manual` (`EB Garamond`) + source slide/chapter folio citations (`sourceDecks`).
  3. **Key Points Grid**: 3-column hairline-ruled specification grid (distilled invariants, rules, and edge cases).
  4. **Deep-Dive Sections (`deepDiveSections`)**: Modular technical blocks supporting prose paragraphs, structured bullet lists, crisp comparison tables (with `tabular-nums` alignment), inline vector `ConceptDiagram` plates, `MarkdownBlock` formatted derivations, and syntax-labeled dark code/equation blocks (`bg-[#1C1B18] text-[#FAF7F0]`).
  5. **Concrete Worked Example**: Named worked walkthrough (`exampleTitle`, optional `exampleDiagramId`, step-by-step `exampleBody`).
  6. **Past-Exam / FAT Solving Methods (`fatQuestionMethods`)**: Real or blueprint-matched exam question prompt, paper/slot citation, numbered step-by-step solving blueprint, optional code/diagram block, and highlighted **SCORING & PITFALL WATCH** callout.
  7. **Persisted Topic Self-Checks (`selfChecks`)**: 2–3 targeted MCQs per topic persisted in `self_checks_v1`, with immediate explanations and per-topic `Reset Checks` button.
  8. **Exam Tip Footer**: Single crisp high-yield rule highlighted with the active module's division accent.
- **Full-Screen Distraction-Free Note Reader**:
  - Modal overlay (`data-testid="fullscreen-note-reader"`) locking body scroll, with sticky header showing Topic ID + Title, `← Prev Topic` / `Next Topic →` stepping across the entire syllabus, `Mastered` toggle, and `Escape` key exit.
- **Acetate-Tab Mastery Confetti Celebration (`confettiEngine.ts` + `MasteryConfettiOverlay.tsx`)**:
  - Fires ONLY when toggling a topic from **unmastered → mastered** (never on unchecking).
  - Reads exact viewport coordinates of the clicked mastery button via `getBoundingClientRect()`, selects upward or downward burst arc (flips downward if button is within `140px` of viewport top), and generates deterministic particles via Mulberry32 PRNG shaped as paper punches, die-cut acetate tabs, and diamonds colored in the module's division hex + archival inks.
  - Plays a crisp radial shock-ring + check-pop + non-blocking bottom-center milestone toast distinguishing **Topic Mastered**, **Module Complete!** (all topics in `mK` mastered), and **Full Syllabus Mastered!** (100% of topics mastered).

---

### View 4: Reference Appendix, Printable Cheat Sheet, SM-2 Flashcards & Examiner Playbook (`ReferenceView.tsx`)
**Purpose**: Rapid-access consolidation tools for final-day memorization, printing, and exam-hall mark maximization. Organized into **4 Sub-Modes**:

1. **Sub-Mode 1 — Module Reference Appendix**:
   - Module selector strip (`M1..MN`) + `Print 2-Page A4 Cheat Sheet` button.
   - 2-column layout:
     - **Course Materials & Slide Packs** (`professorMaterials.ts`): Module lecture decks / textbook chapters with View/Download links (or clean chapter study cards if no external links exist).
     - **Critical Rules & Formulas**: Dense monospace formula/theorem ledger.
     - **Module Comparison Matrix**: High-yield side-by-side table contrasting frequently confused concepts in that module.
     - **Expected Exam Prompts**: Top 4–6 recurring exam questions for that module.
2. **Sub-Mode 2 — All-Module Printable Cheat Sheet (`cheatSheetPrintEngine.ts`)**:
   - Consolidated on-screen preview of all modules' critical rules, formulas, and comparison highlights.
   - `Print 2-Page A4 Cheat Sheet` executes `openPrintableCheatSheet()` which compiles a standalone **2-page A4 Portrait** HTML document (`@page { size: A4 portrait; margin: 10mm; }`, running header/footer, 2-column ultra-dense typography, modules split cleanly across Page 1 and Page 2 with `page-break-before: always`, color-coded module banners matching `DIVISION_WHEEL`) and triggers `window.print()` via a popup with an automatic hidden `<iframe>` fallback for sandboxed iframes.
3. **Sub-Mode 3 — SM-2 Spaced Repetition Flashcards (`RapidFlashcardDeck.tsx` + `srsEngine.ts`)**:
   - 35–60 high-yield flashcards spanning every module (front: crisp exam trigger/formula prompt; back: concise answer + marking hook).
   - **Dual Scheduling Profiles**:
     - `48h Exam Sprint` (`fat48h`): Compressed minute/hour intervals built for cramming (`Again: 2m`, `Hard: 20m`, `Good: 1h → 6h → interval×EF`, `Easy: 4h → 18h → interval×EF×1.3`).
     - `Long-Term Retention` (`longterm`): Classic SuperMemo-2 day-based intervals (`Again: 10m`, `Hard: 12h`, `Good: 1d → 6d → interval×EF`, `Easy: 4d → 10d → interval×EF×1.3`).
   - Queue filters (`Due Now`, `All Cards`, `Weak / Low EF`) + Module filter (`All` or `M1..MN`).
   - Priority queue sorting: overdue cards first (oldest `dueAt`, lowest `easeFactor`), then new cards, then learning, then mastered.
   - Live **4-Bucket Retention Forecast Strip**: `Due / New Now`, `Next 6h`, `6h–24h`, `2+ Days`.
   - Each of the 4 rating buttons (`1 Again`, `2 Hard`, `3 Good`, `4 Easy`) displays its exact computed next-review interval preview (`2m`, `1h`, `6h`, `4d`, etc.).
   - Keyboard shortcuts: `Space` / `Enter` to flip, `1`–`4` to rate (when flipped), `←` / `→` to step cards.
4. **Sub-Mode 4 — 95+ Examiner Playbook (`ExaminerPlaybookView.tsx`)**:
   - **Tab A — Full-Marks Question Blueprints (`Q1..QK`)**: Exact mark breakdown for every paper slot, mandatory steps examiners check first, `95+ TOPPER MOVE`, and `COMMON -2M TRAP`, filterable by module.
   - **Tab B — 20 Classic `-2M` Deduction Trap Busters**: Checkable ledger of the 20 most frequent careless mistakes students lose marks on in this subject; persisted in `traps_locked_v1` and feeds the Readiness Coach.
   - **Tab C — 3-Hour Exam Hall Minute-by-Minute Pacing Plan**: Concrete timeline (e.g., `00:00–00:08` OR-choice scan & trap check, per-question time budget mapped to mark weights, `02:45–03:00` final audit buffer for units/boundary checks/diagram labels).


---

## 5. Complete Specification of Views 5–7

### View 5: Exam Slot Prediction & Coverage Gap Matrix (`PredictionView.tsx` + `predictionEngine.ts`)
**Purpose**: Turns syllabus coverage and past/earlier-slot question papers into a structured, transparent exam-forecast workbench. Works both when multiple real exam slots are provided (e.g., Slot A vs. Slot B → predict Slot C) AND gracefully adapts when only 1 past paper or a bare syllabus is provided (modeling **Historical High-Yield vs. Under-Tested Gap Forecast**).

Organize the view into **4 Analytical Lenses** selectable via top segmented tabs:
1. **Lens 1 — Ordered Topic Coverage Matrix (`M1..MN`)**:
   - Lists every single syllabus topic in exact module order (`T1.1..TN.K`).
   - Status badge per topic relative to the Primary Reference Paper: `untested` (high gap probability), `partial` (sub-topic gap), or `tested` (already appeared).
   - Optional Secondary Precedent Paper tag (e.g., `Also in Prev Year / Slot A`).
   - Displays explicit `untestedGaps`, `likelyQuestionType`, and expandable inline past-paper question cards (showing full prompt, marks, and toggleable worked solution).
   - 1-click deep-link buttons: `Open in Syllabus` and `Open in Full Paper`.
   - Top summary KPI strip: `Untested Topics`, `Partial Gaps`, `Tested Topics`, `Gap Coverage %`, plus module filter and status filter.
2. **Lens 2 — Alpha Forecast (Pure Gap / Complement Model)**:
   - A complete **100-mark predicted exam paper** in exact target exam format (`Q1..QK`, respecting mark weights and any internal `OR` branches).
   - Strictly targets **untested and half-tested syllabus topics** to guarantee 100% syllabus complement coverage.
   - Every predicted question includes marks, module badge, gap rationale, step-by-step solving rubric, and 1-click syllabus jump.
3. **Lens 3 — Beta Forecast (Empirical Pattern / Sibling-Rotation Model)**:
   - Models realistic exam-setter behavior observed across slots:
     - **Anchor Repeat**: Foundational high-weight calculation/design archetypes that appear in *every* slot with new numbers/scenarios.
     - **Sibling Rotation**: When Slot A tested concept X from a topic family, Slot B rotates to its sibling concept Y (e.g., in OS: SJF → Priority/RR; in Physics: Gauss's Law sphere → cylinder; in Algorithms: Kruskal → Prim; in Circuits: Thevenin → Norton; in Finance: NPV → IRR).
   - Includes an **Empirical Shift Proof Table** mapping Precedent Slot Question → Observed/Expected Rotation → Predicted Target Slot Question, followed by the full 100M Beta paper.
4. **Lens 4 — Gamma Consensus Forecast (100M Arbitrated Synthesis)**:
   - Synthesizes Alpha and Beta into a single highest-probability 100M exam paper.
   - Tags every question with its consensus verdict (`Unanimous Lock`, `Consensus + Split`, `Arbitrated Anchor`), confidence percentage (`75%–96%`), and a concise **Arbitration Rationale Table** explaining why each slot entry won.

---

### View 6: Interactive Practice Labs & Procedural Numerical Drill Arena (`InteractiveLabsView.tsx`)
**Purpose**: Active, hands-on mastery. Passive reading alone fails technical exams—students must *execute* algorithms, derivations, and calculations under time pressure and verify every intermediate step.

- **Navigation Header**: Responsive grid of color-coded Lab Tabs (each tagged with its module `M1..MN` or `ALL` in Violet `#6F539B`).
- **Lab 0 (Always First) — 95+ Procedural Numerical Drill Arena (`NumericalDrillLab.tsx` + `numericalDrillEngine.ts`)**:
  - **Deterministic Seeded Generator**: Generates unlimited fresh exam-style numerical/symbolic problems across **at least 6 distinct calculation archetypes** spanning all modules (never repeating the same 5 hardcoded problems).
  - **Live Pacing Timer**: Tracks elapsed seconds vs. each archetype's target exam-hall solve time (`targetSeconds`, e.g., `60s`–`150s`), displaying `ON PACE` (green) or `OVER TARGET` (amber) in `tabular-nums`.
  - **Strict Tolerance/Parser Grading**: Supports numeric answers (with sensible rounding tolerance like `±0.01` or `±0.5%`), integer answers, canonical formula/set/string normalization, and multiple-choice sub-modes where appropriate.
  - **Step-by-Step Marking Rubric Reveal**: After submission (or `Show Solution`), reveals the exact numbered derivation steps and mark allocation.
  - **Streak & Telemetry**: Tracks `Solved`, `Current Streak`, `Best Streak` persisted in `drill_stats_v1` (feeds the 95+ Readiness Coach) + 1-click button to jump straight to the matching full interactive simulator.
- **Labs 1..K — Module-Mapped Interactive Simulators (1–3 per module, minimum 5 total)**:
  - **Asymmetric 7:5 Workbench Layout**:
    - **Left 7 Columns (Stage)**: Live interactive visual canvas (SVG diagram, state table, step-by-step trace matrix, timeline/Gantt, graph/plot, or derivation tree) that visibly proves *why* the answer is right.
    - **Right 5 Columns (Controls & Presets)**: Interactive parameter inputs, step-forward/step-back/auto-run controls, and **2–4 one-click Real Exam Presets** loaded directly from past/model paper questions.
  - **Pure Engine Rule**: Every simulator's core logic MUST live in a pure, side-effect-free TypeScript module in `src/utils/` with its own `node:test` unit test suite. Never bury algorithmic logic inside React `useEffect` blocks.

#### Cross-Subject Interactive Lab Adaptation Guide
When adapting this blueprint to a new course, design **5–8 domain-authentic deterministic simulators** matching the subject's core exam workflows:

| Subject Domain | Example Interactive Simulators (1–2 per module) | Example Procedural Drill Archetypes |
| :--- | :--- | :--- |
| **Operating Systems** | CPU Scheduler Gantt & Turnaround Simulator; Banker's Algorithm Safety-Sequence Tracer; Page Replacement (FIFO/LRU/Optimal) Frame Matrix; Disk Scheduling Head-Seek Plotter; Virtual Address Paging Translator | Avg Waiting Time, Effective Access Time (TLB), Page Fault Count, Need Matrix Check, Seek Cylinders, Inode Max File Size |
| **Algorithms & Data Structures** | Graph Shortest-Path / MST Stepper (Dijkstra, Bellman-Ford, Prim, Kruskal); DP Table Fill & Backtrack Tracer (Knapsack, LCS, MCM); Red-Black / AVL / B-Tree Insertion Animator; Master Theorem & Recurrence Tree Solver; Network Flow Augmenting-Path Visualizer | Recurrence Complexity, MST Weight, DP Optimal Value, Hash Probe Sequence, Huffman Bits, Topological Order |
| **Computer Networks** | Subnetting & CIDR Block Splitter; Sliding Window (GBN / SR) Packet Sequence Diagram; Dijkstra Link-State vs. Distance-Vector Routing Table Convergence; TCP Congestion Window (Slow Start / AIMD) Graph; CRC / Checksum Bitwise Stepper | Subnet Masks & Host Counts, Transmission vs. Propagation Delay, Throughput/Efficiency, CRC Remainder, Framing Overhead, IPv4 Fragment Offsets |
| **Physics / Electromagnetics / Circuits** | Mesh & Nodal KVL/KCL Circuit Solver + Thevenin Equivalent Visualizer; RLC AC Phasor & Resonance Bode Plotter; Optics Ray-Tracing Bench (Lenses/Mirrors); Wave Interference & Standing-Wave Animator; Projectile / Rigid-Body Free-Body Force Decomposer | Equivalent Resistance/Impedance, Resonant Frequency & Q-Factor, Gauss/Ampere Flux, Lens Magnification, RC/RL Time Constant, Work-Energy Impulse |
| **Calculus / Linear Algebra / Probability** | Gaussian Elimination & RREF Step-by-Step Matrix Reducer; Eigenvalue / Diagonalization & 2D Linear Transformation Canvas; Taylor Series Approximation Overlay Plotter; Bayes' Theorem & Conditional Probability Tree; Hypothesis Testing & p-Value Tail Visualizer | Determinant/Inverse, Eigenvalues, Partial Derivatives/Jacobian, Definite Integrals, Bayes Posterior, Binomial/Normal Z-Score |
| **Chemistry / Organic / Biochemistry** | ICE Equilibrium & Le Chatelier Shift Simulator; Acid-Base Titration pH Curve & Buffer Zone Plotter; Reaction Mechanism Electron-Push Stepper; Molecular Orbital / Hybridization Geometry Viewer; Michaelis-Menten Enzyme Kinetics Curve Fitter | Molarity/Limiting Reagent, Henderson-Hasselbalch pH, Gibbs Free Energy `ΔG`, Rate Law Order & Half-Life, Nernst Cell Potential, Km/Vmax |
| **Economics / Finance / Accounting** | Supply-Demand Equilibrium + Tax/Subsidy Deadweight-Loss Grapher; DCF / NPV / IRR Cash-Flow Waterfall & Sensitivity Grid; Game Theory Normal-Form Nash & Dominant-Strategy Matrix; Option Payoff (Call/Put/Straddle) Diagram; Balance Sheet / Journal Entry Trial-Balance Balancer | Price Elasticity, Consumer/Producer Surplus, WACC, Bond Yield-to-Maturity, Marginal Cost/Profit Max, Financial Ratios (ROE/Current/D-E) |

---

### View 7: 100-Mark Exam Mock Simulator, Source Forensics, Rapid MCQ & Weak Topics (`FatMockView.tsx`)
**Purpose**: Realistic exam rehearsal, forensic mapping of past papers, rapid-fire MCQ drilling, and centralized spaced-review remediation of every wrong answer. Organized into **4 Sub-Views**:

1. **Sub-View 1 — Full 100-Mark Exam Papers (Past Slots + Generated Parallel 100M Paper)**:
   - Paper selector tabs (e.g., `Past Paper 1 (100M)`, `Past Paper 2 (100M)`, `Parallel Practice Paper (100M)`).
   - Supports both **compulsory structured sections** (e.g., `Part A 7×10M + Part B 2×15M`) AND **internal `OR` Choice Toggles** (`Option (a)` vs. `Option (b)` — selecting an option highlights which branch counts toward the 100M total).
   - **3-Hour Full Exam Mode**:
     - Clicking `Start 3-Hour Exam Mode` initializes a live `03:00:00` countdown (`tabular-nums`), **automatically collapses all worked solutions** for genuine blind simulation, and offers Pause / Resume / Reset / Print Paper controls.
   - **Inline Per-Sub-Part Rubric Self-Grader**:
     - Every question sub-part displays its exact mark cap (e.g., `6M`, `4M`) with a `0.5`-step numeric score input + 1-click `Full` button.
     - Persisted in `rubric_scores_v1`; computes live paper total `X / 100M` (respecting `OR` choices so double-counting is impossible) and feeds the 95+ Readiness Coach's 20% Best-Paper pillar.
   - **Worked Step-by-Step Solutions**: Expandable per question with `MarkdownBlock` derivations, custom vector `ConceptDiagram` plates, mark-allocation bullets, module/topic badges, and 1-click `Open Topic in Syllabus`.
2. **Sub-View 2 — Paper Source Forensics**:
   - Filterable by Paper Slot and Module (`M1..MN`).
   - Maps every past paper question to: Question ID, Marks, Course Outcome (`CO`), Bloom's Taxonomy Level (`K2` Understand / `K3` Apply / `K4` Analyze / `K5` Evaluate), exact Syllabus Topic ID, Lecture Slide Deck / Textbook Chapter source, and Setter Pattern Note, plus a 1-click `Inspect Question →` button that opens the full prompt & solution in Sub-View 1.
3. **Sub-View 3 — Rapid MCQ Drill (Part A 2M Short + Part B 10M Analytical)**:
   - **40–60 rich MCQs** spanning all modules, split into `Part A (Quick Recall / 2M)` and `Part B (Analytical / Numerical / 10M)`.
   - Filters: Module (`All` / `M1..MN`), Part (`All` / `Part A` / `Part B`), `Missed Only` toggle, and an optional **30-Minute Timed Sprint Mode**.
   - Selecting an answer locks it, displays immediate worked rationale, persists in `mock_answers_v1`, and **automatically records wrong answers into global `weakTopics` (`source: 'mock'`)**.
4. **Sub-View 4 — Unified Weak Topics SRS Tracker (`WeakTopicsPanel.tsx` + `weakTopicsEngine.ts`)**:
   - Captures every wrong answer across **both Standing Diagnostics and FAT Mock MCQs** in one prioritized remediation ledger.
   - **Overdue SRS Rules**:
     - Any unresolved topic with `wrongCount >= 3` AND (`lastReviewedAt === null` OR `now - lastReviewedAt >= 2 hours`) is flagged with a Carmine **"Review overdue!"** alert and **automatically pinned to the top**.
     - Items reviewed within `< 1 hour` display a muted Emerald **"Recently reviewed ✓"** pill.
   - Controls: Filter by source (`All`, `Standing`, `Mock`), sort by `Most Missed` (`wrongCount`) or `Most Recent` (`lastWrongAt`), group by Module (modules with overdue items float to the top), inline expandable `Review Now` drawer (shows exact question prompt + correct answer + explanation and stamps `lastReviewedAt`), `Mark Resolved` / `Reopen` toggle, and `Clear All Resolved`.

---

## 6. Complete Generalized TypeScript Data Schemas

Place shared note/diagram types in `src/data/noteTypes.ts` and core course structures in `src/data/courseData.ts` (or `<courseSlug>Data.ts`). Keep all interfaces strictly typed with zero `any`.

```ts
// ─── src/data/noteTypes.ts ──────────────────────────────────────────────────

// Enumerate every custom SVG diagram ID created for the target course (aim for 20–35 plates)
export type DiagramId =
  | 'm1-overview-architecture'
  | 'm1-core-model'
  // ... add all course-specific diagram IDs across M1..MN
  | 'mn-final-plate';

export interface NoteTable {
  headers: string[];
  rows: string[][];
}

export interface NoteSubSection {
  heading: string;
  body: string;                  // Supports MarkdownBlock inline formatting
  bullets?: string[];
  table?: NoteTable;
  diagramId?: DiagramId;
  codeBlock?: {
    label: string;               // e.g. "Pseudocode", "Derivation", "Python", "KVL Equations"
    code: string;
  };
}

export interface FatSolvedMethod {
  questionTitle: string;         // Exact past-paper or blueprint question title
  sourceTag: string;             // e.g. "Slot A Q3(a) · 10M" or "Model FAT Q5 · 10M"
  prompt: string;
  methodSteps: string[];         // Numbered exam-hall solving steps
  codeOrFormula?: {
    label: string;
    content: string;
  };
  diagramId?: DiagramId;
  scoringWatch: string;          // Explicit examiner rubric & -2M trap warning
}

export interface TopicSelfCheck {
  id: string;                    // e.g. "sc-m1-t1-1"
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
}

export interface TopicNote {
  topicId: string;               // Matches SyllabusTopic.id (e.g. "m1-t1")
  summary: string;               // Serif .prose-manual executive overview
  sourceDecks: string[];         // Slide deck or textbook chapter citations
  keyPoints: string[];           // 3–6 crisp bullet invariants for 3-col spec grid
  deepDiveSections: NoteSubSection[];
  exampleTitle: string;
  exampleDiagramId?: DiagramId;
  exampleBody: string;
  fatQuestionMethods: FatSolvedMethod[];
  selfChecks: TopicSelfCheck[];  // 2–3 persisted MCQs per topic
  examTip: string;
}
```

```ts
// ─── src/data/courseData.ts ─────────────────────────────────────────────────

export type DivisionId = 'm1' | 'm2' | 'm3' | 'm4' | 'm5' | 'labs' | 'mock';
// Extend 'm6' | 'm7' if the target course has >5 modules.

export interface CourseMeta {
  code: string;                  // e.g. "CS301"
  slug: string;                  // e.g. "cs301" (used for localStorage key prefix)
  title: string;                 // e.g. "Operating Systems"
  institution: string;
  examName: string;              // e.g. "FAT" or "Final Exam"
  examDateLabel: string;         // e.g. "14 May 2026 · 09:00–12:00 IST"
  examStartIso: string;          // ISO-8601 with explicit offset: "2026-05-14T09:00:00+05:30"
  examDurationMinutes: number;   // Default 180
  totalMarks: number;            // Default 100
  paperBlueprintSummary: string; // e.g. "7 × 10M + 2 × 15M (Internal OR in Q8/Q9)"
  reportingRule: string;
}

export interface SyllabusTopic {
  id: string;                    // "m1-t1", "m1-t2", ...
  code: string;                  // "T1.1", "T1.2", ...
  title: string;
  detail: string;                // Concise syllabus sub-items line
  highYield?: boolean;
}

export interface ModuleData {
  id: string;                    // "m1" .. "mN"
  code: string;                  // "M1" .. "MN"
  title: string;
  hours: number;                 // Syllabus lecture hours (scales fore-edge tab height & tie-breaks)
  courseOutcomes: string[];      // e.g. ["CO1", "CO2"]
  topics: SyllabusTopic[];
  criticalRules: Array<{ label: string; formula: string }>;
  comparisonTable: {
    title: string;
    headers: string[];
    rows: string[][];
  };
  expectedPrompts: string[];
}

export interface SprintBlock {
  id: string;                    // "d1-b1", ...
  day: 'day1' | 'day2' | 'morning';
  dayLabel: string;
  timeRange: string;             // e.g. "08:00 – 10:30"
  durationHours: number;
  title: string;
  moduleId: DivisionId;
  isHighYield: boolean;          // True for 80/20 Triage Mode core blocks
  tasks: string[];
  targetAction: {
    label: string;
    tab: 'syllabus' | 'labs' | 'mock' | 'reference' | 'prediction' | 'standing';
    focusModuleId?: string;
    focusLabId?: string;
  };
}

export interface FlashcardItem {
  id: string;
  moduleId: string;
  front: string;
  back: string;
  examHook: string;
}

export interface MockMcqQuestion {
  id: string;
  moduleId: string;
  part: 'A' | 'B';               // 'A' = 2M rapid recall, 'B' = 10M analytical/numerical
  topicId: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
}

export interface ExaminerBlueprint {
  questionNo: string;            // "Q1" .. "Q10"
  moduleId: string;
  marks: number;
  archetype: string;
  markSplit: string;
  mandatorySteps: string[];
  topperMove: string;
  commonTrap: string;
}

export interface ExaminerTrap {
  id: string;
  moduleId: string;
  title: string;
  wrongHabit: string;
  correctFix: string;
  marksSaved: string;            // e.g. "-2M saved"
}
```

```ts
// ─── src/data/standingData.ts ───────────────────────────────────────────────

export type StandingTier = 'foundation' | 'application' | 'analysis';

export interface StandingQuestion {
  id: string;                    // e.g. "st-m1-f01"
  moduleId: string;
  tier: StandingTier;
  topicTag: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
}

export interface ModuleRefresher {
  moduleId: string;
  estimatedMinutes: number;      // ~5 min
  conceptMap: string[];
  goldenFormulas: Array<{ label: string; expression: string }>;
  workedPatterns: Array<{ title: string; markdown: string }>;
}

export interface StandingModuleScore {
  moduleId: string;
  foundation: number;            // 0..10
  application: number;           // 0..10
  analysis: number;              // 0..10
  total: number;                 // 0..30
  grade: 'A' | 'B' | 'C' | 'D';
  completedAt: number;
}
```

```ts
// ─── src/data/slotPaperAnalysis.ts ──────────────────────────────────────────

export interface PaperSubPart {
  id: string;                    // e.g. "p1-q1-a" (used as rubric_scores_v1 key)
  label: string;                 // "(a)", "(b)", or "Full"
  marks: number;
  prompt: string;
  solutionMarkdown: string;
  diagramId?: DiagramId;
}

export interface FullPaperQuestion {
  id: string;
  number: string;                // "Q1" .. "Q10"
  section: string;               // e.g. "Part A (10 Marks)" or "Part B (15 Marks)"
  moduleId: string;
  topicId: string;
  marks: number;
  orGroupId?: string;            // Shared ID for mutually exclusive Option (a) / Option (b)
  orChoiceLabel?: 'Option A' | 'Option B';
  title: string;
  subParts: PaperSubPart[];
}

export interface ExamPaper {
  id: string;
  label: string;                 // e.g. "Slot A (Real Past Paper)" or "Parallel Practice 100M"
  subtitle: string;
  totalMarks: number;
  durationMinutes: number;
  questions: FullPaperQuestion[];
}

export interface SlotForensicItem {
  id: string;
  paperId: string;
  questionNo: string;
  marks: number;
  moduleId: string;
  topicId: string;
  co: string;                    // "CO1".."CO5"
  bloomsLevel: 'K2' | 'K3' | 'K4' | 'K5';
  sourceSlideOrChapter: string;
  setterPattern: string;
  targetQuestionId: string;
}
```

---

## 7. Exact Mathematical Formulas & Pure-Logic Engine Specifications

Every computation MUST be isolated in a pure, framework-free TypeScript file under `src/utils/` with deterministic inputs (accept `nowMs` or `seed` as parameters rather than hardcoding `Date.now()` / `Math.random()` inside core logic) and covered by a co-located `*.test.ts` file.

### 7.1 `readinessEngine.ts` — 95+ Exam Readiness Score & Next-Action Coach
- **Composite Weighted Score (`0–100`, rounded to integer)**:
  $$\text{Readiness} = 0.25 \cdot P_{\text{topics}} + 0.15 \cdot P_{\text{sprint}} + 0.25 \cdot P_{\text{recall}} + 0.20 \cdot P_{\text{paper}} + 0.15 \cdot P_{\text{masteryTools}}$$
  where each sub-pillar is clamped to `[0, 100]`:
  - $P_{\text{topics}} = \frac{\text{masteredTopicIds.length}}{\text{totalSyllabusTopics}} \times 100$
  - $P_{\text{sprint}} = \frac{\text{completedSprintBlocks.length}}{\text{totalSprintBlocks}} \times 100$
  - $P_{\text{recall}}$ = accuracy/coverage across persisted Topic Self-Checks + Rapid FAT MCQs: $\frac{\text{correctSelfChecks} + \text{correctMockMcqs}}{\text{totalSelfChecks} + \text{totalMockMcqs}} \times 100$
  - $P_{\text{paper}} = \min(100, \max_{\text{paper}}(\text{selfGradedScore}(\text{paper})))$ (best 100M rubric self-graded score across all papers)
  - $P_{\text{masteryTools}} = 0.50 \cdot \min(100, \frac{\text{drillsSolved}}{15} \times 100) + 0.30 \cdot \frac{\text{srsRetainedCards}}{\text{totalFlashcards}} \times 100 + 0.20 \cdot \frac{\text{lockedTraps}}{\text{totalTraps}} \times 100$
- **Projected Exam Mark Band**:
  - `≥ 88` → `95–100 (Topper Zone)`
  - `≥ 74` → `85–94 (S-Grade Target)`
  - `≥ 58` → `72–84 (Solid A-Grade)`
  - `≥ 40` → `55–71 (Pass / Building)`
  - `< 40` → `< 55 (High-Risk — Activate 80/20 Triage)`
- **Weakest Module Selector**: Compute mastery ratio per module; pick lowest ratio, breaking ties by **highest syllabus lecture hours (`module.hours`)**.
- **Top 3 Prioritized Next Actions**: Generate candidate actions tagged `CRITICAL`, `HIGH`, or `POLISH` (e.g., overdue weak topics `CRITICAL`, unmastered weakest module `CRITICAL`, zero 100M papers self-graded `HIGH`, due SM-2 flashcards `HIGH`, unlocked `-2M` traps `POLISH`, numerical drills `< 10` `POLISH`) and return the top 3 sorted by severity with direct deep-link payloads.

### 7.2 `srsEngine.ts` — Dual-Profile SuperMemo-2 Spaced Repetition
- **Card State**: `{ cardId, reps, intervalMinutes, easeFactor (default 2.5), dueAt, lastReviewedAt, lapses }`.
- **Rating Quality Mapping**: `again -> q=1`, `hard -> q=3`, `good -> q=4`, `easy -> q=5`.
- **SM-2 Ease Factor Update**:
  $$\text{EF}' = \max\left(1.30,\; \text{EF} + \left(0.1 - (5 - q)\cdot(0.08 + (5 - q)\cdot 0.02)\right)\right)$$
  (Reset `reps = 0` and increment `lapses` on `again`.)
- **Interval Schedule**:
  - **`fat48h` (Exam-Sprint Compressed Mode)**:
    - `again`: `2 min` (`reps = 0`)
    - `hard`: `20 min` (if `reps === 0`) else `max(20, round(intervalMinutes * 1.2))`
    - `good`: `reps 0 → 60 min (1h)`, `reps 1 → 360 min (6h)`, `reps ≥ 2 → round(intervalMinutes * EF')`
    - `easy`: `reps 0 → 240 min (4h)`, `reps 1 → 1080 min (18h)`, `reps ≥ 2 → round(intervalMinutes * EF' * 1.3)`
  - **`longterm` (Classic SM-2 Mode)**:
    - `again`: `10 min` (`reps = 0`)
    - `hard`: `720 min (12h)` (if `reps === 0`) else `max(720, round(intervalMinutes * 1.2))`
    - `good`: `reps 0 → 1440 min (1d)`, `reps 1 → 8640 min (6d)`, `reps ≥ 2 → round(intervalMinutes * EF')`
    - `easy`: `reps 0 → 5760 min (4d)`, `reps 1 → 14400 min (10d)`, `reps ≥ 2 → round(intervalMinutes * EF' * 1.3)`
- **Queue Sorting Priority**:
  1. Overdue cards (`dueAt <= nowMs`), sorted by oldest `dueAt` ascending, then lowest `easeFactor` ascending.
  2. Never-reviewed new cards (`lastReviewedAt === null`).
  3. Learning cards (`intervalMinutes < 1440` in longterm or `< 360` in fat48h).
  4. Mastered future cards sorted by soonest `dueAt`.
- **4-Bucket Forecast**: `dueOrNew` (`!lastReviewedAt || dueAt <= nowMs`), `next6h` (`0 < delta <= 6h`), `hours6To24` (`6h < delta <= 24h`), `days2Plus` (`delta > 24h`).
- **Retained Count (for Readiness Engine)**: Cards with `reps >= 1 && lastReviewedAt !== null && lapses === 0 || (reps >= 2)`.

### 7.3 `standingEngine.ts` — Tiered Diagnostic Grading & Prescriptive Coach
- **Per-Module Scoring**: Count correct answers in `foundation` (`0–10`), `application` (`0–10`), `analysis` (`0–10`), `total` (`0–30`).
- **Grade Thresholds**: `A` (`≥ 25`), `B` (`≥ 18`), `C` (`≥ 10`), `D` (`< 10`).
- **Aggregate Band (across `N` modules, max `30 × N`)**:
  - `≥ 80%` → `Strong`
  - `≥ 53.3%` → `Decent`
  - `≥ 26.7%` → `Gaps`
  - `< 26.7%` → `Start`
- **Prescriptive Recommendation Rules**:
  - `foundation < 7` → Recommend **Syllabus Concept Notes** (gaps in fundamental definitions/laws).
  - `application < 6` → Recommend **Interactive Simulator & Procedural Drills** (knows theory, slips on execution).
  - `analysis < 6` → Recommend **FAT Mock Part B & Examiner Playbook** (needs multi-step/edge-case reasoning).
  - All three `≥ 7` → Recommend **Exam-Ready Maintenance** (SM-2 flashcards + 100M timed mock).

### 7.4 `weakTopicsEngine.ts` — Unified Wrong-Answer SRS Ledger
- **Record Entry (`WeakTopicEntry`)**: `{ id, questionId, source: 'standing' | 'mock', moduleId, topicTag, prompt, correctAnswer, explanation, wrongCount, lastWrongAt, lastReviewedAt, resolved }`.
- **Upsert on Wrong Answer (`recordWrongAnswer`)**: If `questionId` exists, increment `wrongCount`, set `lastWrongAt = nowMs`, and force `resolved = false`. Otherwise insert with `wrongCount: 1, lastReviewedAt: null, resolved: false`.
- **Overdue SRS Check (`isReviewOverdue`)**: `!entry.resolved && entry.wrongCount >= 3 && (entry.lastReviewedAt === null || nowMs - entry.lastReviewedAt >= 2 * 60 * 60 * 1000)`.
- **Recently Reviewed Check (`isRecentlyReviewed`)**: `entry.lastReviewedAt !== null && nowMs - entry.lastReviewedAt < 60 * 60 * 1000`.
- **Sorting & Grouping**: Overdue items ALWAYS sort first (highest `wrongCount`, then oldest `lastWrongAt`); when grouping by module, modules containing `≥ 1` overdue item float to the top.

### 7.5 `countdownEngine.ts`, `pomodoroEngine.ts`, `confettiEngine.ts`, `darkModeEngine.ts`, `formulaQuickRefEngine.ts`, `cheatSheetPrintEngine.ts`
- **`countdownEngine.ts`**:
  - Parses `examStartIso` to UTC epoch `startMs` and `endMs = startMs + examDurationMinutes * 60_000`.
  - Computes `{ phase, days, hours, minutes, seconds, totalRemainingMs, urgencyCopy }` cleanly across all 6 phases (`prep`, `sprint_48h`, `final_24h`, `exam_morning`, `in_progress`, `completed`).
- **`pomodoroEngine.ts`**:
  - Modes: `focus` (`25 * 60`s), `shortBreak` (`5 * 60`s), `longBreak` (`15 * 60`s).
  - Pure `completePomodoroPhase(state)`: on `focus` completion, increments `completedFocusToday` and `cycleCount`; if `cycleCount % 4 === 0`, transitions to `longBreak`, else `shortBreak`. On break completion, transitions back to `focus`.
  - Pure `resetDailyIfNewDate(state, todayKey)` resets `completedFocusToday = 0` when local date string `YYYY-MM-DD` changes.
- **`confettiEngine.ts`**:
  - Deterministic **Mulberry32 PRNG** seeded by `(topicId hash ^ timestamp)` so particle bursts are smooth, reproducible in tests, and visually balanced.
  - Emits `22–38` particles (scaled up for Module Complete / Full Syllabus Mastered milestones) with shapes `punch` (circle), `tab` (die-cut rectangle), `diamond`, velocity vector `(dx, dy)` arcing upward (or downward if `originY < 140`), rotation `rotDeg`, scale, delay, and division accent palette.
- **`darkModeEngine.ts`**:
  - Pure `parseStoredDarkMode(raw)`, `resolveDarkMode(stored, systemPrefersDark)`, `serializeDarkMode(isDark)`.
  - Only tracks OS `prefers-color-scheme` changes dynamically if `localStorage.getItem(KEY) === null` (user's manual click always takes precedence).
- **`formulaQuickRefEngine.ts`**:
  - Flattens all `MODULES[].criticalRules` (and optional extra formula constants) into searchable items; splits query on whitespace into lowercase tokens; requires EVERY token to match across `moduleCode + moduleTitle + label + formula` (`AND` multi-token matching).
- **`cheatSheetPrintEngine.ts`**:
  - Pure `buildCheatSheetHtml(courseMeta, modules, divisionWheel)` returning a self-contained printable 2-page A4 Portrait HTML string (`@page { size: A4 portrait; margin: 9mm; }`, 2-column CSS grid per page, module page split at `Math.ceil(modules.length / 2)` with `page-break-before: always`, running header/footer).
  - `openPrintableCheatSheet(html)`: tries `window.open` first; if blocked by popup/iframe sandbox, seamlessly creates a hidden `<iframe>`, injects `html`, calls `iframe.contentWindow.print()`, and cleans up on `afterprint`.

---

## 8. Custom Vector SVG Diagram System (`src/components/diagrams/`)

Never fall back to raw ASCII box-drawing art for technical concepts, architectures, circuits, trees, plots, or state transitions. Build a modular, crisp, dark-mode-safe vector plate library (**aim for 20–35 bespoke SVG diagrams** covering all modules and past-paper solutions).

### 8.1 Shared Primitives (`DiagramPrimitives.tsx`)
1. **`TONE_MAP`**: Consistent archival palette for SVG shapes matching the manual aesthetic:
   - `neutral`: `{ fill: '#FAF7F0', stroke: '#1C1B18', text: '#1C1B18', sub: '#6E695D' }`
   - `sky` (Ultramarine): `{ fill: '#EBF1F9', stroke: '#22559C', text: '#173A6B', sub: '#22559C' }`
   - `emerald` (Grass Green): `{ fill: '#ECF4EA', stroke: '#4F8A3D', text: '#2B5120', sub: '#4F8A3D' }`
   - `amber` (Chrome/Oxide): `{ fill: '#FDF4DC', stroke: '#B87A14', text: '#5C3B05', sub: '#965F0A' }`
   - `rose` (Carmine): `{ fill: '#FAECEC', stroke: '#A62B2B', text: '#6D1818', sub: '#A62B2B' }`
   - `dark`: `{ fill: '#1C1B18', stroke: '#1C1B18', text: '#FAF7F0', sub: '#C5BEB0' }`
2. **`DiagramFrame` Component**:
   - Outer `<figure>` styled as a milk-acetate technical plate (`bg-[#F4EFE4] border border-[#1C1B18] rounded-[4px] p-3`).
   - Top header strip: `PLATE · <TITLE>` in `font-mono text-[10px] uppercase tracking-wider`.
   - Inner SVG wrapper with class `.diagram-canvas-plate` (`bg-[#FAF7F0] border border-[#C5BEB0] rounded-[2px] overflow-x-auto`) — in Dark Mode, `.diagram-canvas-plate` holds a calm muted paper tone (`oklch(92% 0.012 82)`) so black/colored technical ink lines remain 100% legible.
   - `<svg viewBox="0 0 W H" className="w-full h-auto block" role="img" aria-label={title}>` with `<SvgMarkers />` (`arrow-neutral`, `arrow-sky`, `arrow-emerald`, `arrow-amber`, `arrow-rose`).
   - Optional `<figcaption>` below the plate explaining the key exam takeaway.
3. **Reusable Geometric Primitives**:
   - Generic: `SvgBox` (labeled rect with optional subtitle), `SvgArrow` (straight/curved path with marker + midpoint label pill), `SvgBadge`, `SvgGridTable`.
   - **Subject-Specific Primitives** (add 3–5 domain primitives tailored to the user's course, e.g., `SvgStateNode` + `SvgTransitionArc` for automata/OS; `SvgResistor` / `SvgCapacitor` / `SvgVoltageSource` for circuits; `SvgTreeNode` / `SvgGraphEdge` for algorithms/data structures; `SvgAxes` + `SvgCurve` for calculus/economics/physics; `SvgMoleculeBond` / `SvgOrbital` for chemistry).
4. **Modular Organization**:
   - Split SVG components by module: `Module1Diagrams.tsx` .. `ModuleNDiagrams.tsx`.
   - Export a single `ConceptDiagram({ id }: { id: DiagramId })` switch router in `ConceptDiagrams.tsx` so any Syllabus section, Worked Example, FAT Solving Method, or Mock Solution can embed a crisp vector plate with `<ConceptDiagram id="..." />`.
5. **Visual Quality Rules for Every SVG**:
   - Always use generous `viewBox` padding (`>= 18px` margins) so no text ever clips at edges.
   - Maintain minimum `10px`–`12px` font size in `viewBox` units (`Archivo` / `JetBrains Mono`) and verify zero overlapping labels between boxes, arrows, and annotations.
   - Keep `max-w-full` responsive scaling so diagrams look sharp on both 1440px desktops and 390px mobile screens.


---

## 9. Persistence Map (`localStorage`), Keyboard Shortcuts & Accessibility

### 9.1 Complete `localStorage` Persistence Schema
Namespace EVERY key with `<course_slug>` (lowercase alphanumeric, e.g., `cs301_...` or `phys204_...`) so multiple exam-sprint apps hosted on the same origin never collide. Always wrap `localStorage.getItem` / `setItem` in `try/catch` with schema validation so corrupted or private-mode storage never crashes React.

| Key Pattern | Value Type | Purpose & Consumers |
| :--- | :--- | :--- |
| `<slug>_completed_blocks_v1` | `string[]` | Checked 48h sprint timetable block IDs (`SprintPlannerView`, `readinessEngine`). |
| `<slug>_mastered_topics_v1` | `string[]` | Mastered syllabus topic IDs (`SyllabusView`, `SprintPlannerView`, `readinessEngine`, `confettiEngine`). |
| `<slug>_self_checks_v1` | `Record<string, number>` | Selected option index per syllabus topic self-check (`SyllabusView`, Missed Queue, `readinessEngine`). |
| `<slug>_mock_answers_v1` | `Record<string, number>` | Selected option index per Rapid FAT MCQ (`FatMockView`, `readinessEngine`). |
| `<slug>_rubric_scores_v1` | `Record<string, number>` | Per-sub-part self-graded marks on 100M papers (`FatMockView`, `readinessEngine`). |
| `<slug>_flashcard_srs_v1` | `Record<string, CardSrsState>` | SM-2 scheduling state (`reps`, `intervalMinutes`, `easeFactor`, `dueAt`, `lastReviewedAt`, `lapses`). |
| `<slug>_flashcard_srs_mode_v1` | `'fat48h' \| 'longterm'` | Active spaced-repetition scheduling profile (`RapidFlashcardDeck`). |
| `<slug>_drill_stats_v1` | `{ solved: number; currentStreak: number; bestStreak: number }` | Procedural Numerical Drill Arena stats (`NumericalDrillLab`, `readinessEngine`). |
| `<slug>_traps_locked_v1` | `string[]` | Checked Examiner `-2M` Trap Buster IDs (`ExaminerPlaybookView`, `readinessEngine`). |
| `<slug>_standing_answers_v1` | `Record<string, number>` | Selected option index per Standing Diagnostic question (`StandingQuiz`). |
| `<slug>_standing_scores_v1` | `Record<string, StandingModuleScore>` | Per-module Standing Diagnostic tier scores & grades (`StandingView`, `RadarChart`). |
| `<slug>_weak_topics_v1` | `WeakTopicEntry[]` | Unified wrong-answer SRS ledger across Standing + Mock (`WeakTopicsPanel`, Top Nav badge). |
| `<slug>_pomodoro_v1` | `PomodoroPersistedState` | Active mode, remaining seconds, cycle count, daily count, date key, mute state (`PomodoroTimer`). |
| `<slug>_dark_mode_v1` | `'true' \| 'false'` | Explicit user Light/Dark preference (`index.html` anti-FOUC bootstrap + `darkModeEngine`). |

- **Reset Controls**: Provide a clean, inline two-step confirmation button (`Reset Sprint Progress` → `Confirm Reset?`) in `SprintPlannerView` that clears progress keys without touching `_dark_mode_v1`. Never use `window.confirm()`.

### 9.2 Global & Contextual Keyboard Shortcuts
| Shortcut | Scope | Action |
| :--- | :--- | :--- |
| `Ctrl+K` / `Cmd+K` | Global (any view) | Toggle the floating Formula Quick-Reference drawer and focus its search input. |
| `Escape` | Global / Modals | Close Formula Quick-Ref drawer, Full-Screen Note Reader, or blur/clear Syllabus search. |
| `/` | Syllabus View (outside inputs) | Focus the Deep Full-Text Syllabus search input. |
| `Space` / `Enter` | Flashcards (`RapidFlashcardDeck`) | Flip the active flashcard front ↔ back. |
| `1`, `2`, `3`, `4` | Flashcards (when flipped) | Rate active card: `1 = Again`, `2 = Hard`, `3 = Good`, `4 = Easy`. |
| `←` / `→` | Flashcards & Full-Screen Reader | Step to Previous / Next card or Syllabus topic. |

### 9.3 Accessibility (`a11y`) & Responsive Contract
- **WCAG Contrast**: Light mode acetate leaf contrast enforced mathematically at runtime (`≥ 9.5:1` via `solveLeafAlpha`); dark mode ink ramp (`L=91% / 76% / 62%`) on obsidian (`L=19%–26.5%`) maintains `≥ 7:1` primary contrast.
- **Landmarks & Semantics**: Skip-to-content link targeting `#main-content`, proper `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`, `role="dialog" aria-modal="true"` on Full-Screen Reader and Formula Drawer, `role="img" aria-label="..."` on every SVG plate, `aria-live="polite"` on mastery confetti milestone toast and timer alerts.
- **Responsive Breakpoints**:
  - Desktop (`≥ 1280px` / `xl`): Full 3-column binder frame (44px punched spine + main reading sheet + 36px stepped fore-edge tab rail).
  - Tablet (`768px–1279px` / `md..lg`): Clean centered manual sheet with full 7-tab top nav (binder spine and fore-edge rail hidden cleanly to preserve reading width).
  - Mobile (`< 768px`, tested at `390×844`): Single-row scrollable horizontal mobile nav bar, stacked asymmetric grids (`grid-cols-1`), responsive SVG plates, zero horizontal page overflow (`document.documentElement.scrollWidth <= window.innerWidth`).

---

## 10. Complete Reference File Tree

Structure the generated codebase cleanly into modular layers so no single file becomes an unmaintainable monolith:

```text
/
├── index.html                              # Google Fonts + anti-FOUC dark mode script + meta tags
├── metadata.json                           # Course code/title name & description
├── package.json                            # React 19, Vite, Tailwind v4, lucide-react, motion, tsx
├── src/
│   ├── main.tsx                            # React root mount
│   ├── index.css                           # Tailwind v4, Light tokens, OKLCH Dark Mode, print & confetti CSS
│   ├── App.tsx                             # 3-zone header, binder shell, fore-edge tabs, state + localStorage sync
│   ├── data/
│   │   ├── noteTypes.ts                    # DiagramId union, TopicNote, NoteSubSection, FatSolvedMethod, SelfCheck
│   │   ├── courseData.ts                   # COURSE_META, DIVISION_WHEEL, MODULES, SPRINT_BLOCKS, FLASHCARDS,
│   │   │                                   # MOCK_MCQS, EXAMINER_BLUEPRINTS, EXAMINER_TRAPS, PACING_PLAN
│   │   ├── module1Notes.ts                 # Deep textbook-grade TopicNote records for Module 1
│   │   ├── module2Notes.ts                 # ... Module 2
│   │   ├── module3Notes.ts                 # ... Module 3
│   │   ├── module4Notes.ts                 # ... Module 4
│   │   ├── module5Notes.ts                 # ... Module 5 (add module6Notes.ts..moduleNNotes.ts as needed)
│   │   ├── topicNotes.ts                   # Barrel export TOPIC_NOTES + lookup helpers
│   │   ├── professorMaterials.ts           # Per-module slide packs, textbook chapters & reference links
│   │   ├── slotPaperAnalysis.ts            # Full 100M past/parallel papers (ExamPaper[]) + SlotForensicItem[]
│   │   ├── standingM1.ts .. standingMN.ts  # 30 tiered questions/module (10 Foundation + 10 Application + 10 Analysis)
│   │   ├── standingData.ts                 # Aggregated STANDING_QUESTIONS + MODULE_REFRESHERS
│   │   └── courseIntegrity.test.ts         # Data integrity tests (unique IDs, valid topicIds, 100M sums, 30 Qs/mod)
│   ├── utils/
│   │   ├── readinessEngine.ts              # + readinessEngine.test.ts
│   │   ├── srsEngine.ts                    # + srsEngine.test.ts
│   │   ├── standingEngine.ts               # + standingEngine.test.ts
│   │   ├── weakTopicsEngine.ts             # + weakTopicsEngine.test.ts
│   │   ├── predictionEngine.ts             # + predictionEngine.test.ts
│   │   ├── countdownEngine.ts              # + countdownEngine.test.ts
│   │   ├── pomodoroEngine.ts               # + pomodoroEngine.test.ts
│   │   ├── confettiEngine.ts               # + confettiEngine.test.ts
│   │   ├── darkModeEngine.ts               # + darkModeEngine.test.ts
│   │   ├── formulaQuickRefEngine.ts        # + formulaQuickRefEngine.test.ts
│   │   ├── cheatSheetPrintEngine.ts        # + cheatSheetPrintEngine.test.ts
│   │   ├── numericalDrillEngine.ts         # + numericalDrillEngine.test.ts (6+ seeded procedural archetypes)
│   │   └── <domainLab1..K>Engine.ts        # + <domainLab1..K>Engine.test.ts (1 pure engine per interactive simulator)
│   └── components/
│       ├── MarkdownBlock.tsx               # Safe zero-HTML-injection markdown renderer (bold, code, lists, formulas)
│       ├── ExamCountdown.tsx               # Hero & Compact live countdown banner
│       ├── PomodoroTimer.tsx               # Compact circular SVG focus timer + Web Audio chime
│       ├── FormulaQuickRef.tsx             # Floating FAB + Ctrl+K searchable formula modal
│       ├── MasteryConfettiOverlay.tsx      # Compositor-only confetti burst + milestone toast
│       ├── RadarChart.tsx                  # N-axis 3-tier animated SVG radar chart
│       ├── WeakTopicsPanel.tsx             # Unified overdue-pinned SRS wrong-answer panel
│       ├── StandingView.tsx                # View 1 orchestrator (Landing -> Refresher -> Quiz -> Results)
│       ├── StandingRefresher.tsx           # 5-min pre-quiz cheat sheet
│       ├── StandingQuiz.tsx                # 30-Q 3-tier quiz with tier transition interstitials
│       ├── StandingResults.tsx             # Animated score count-up + prescriptive coach
│       ├── SprintPlannerView.tsx           # View 2: Masthead, Readiness Coach, Pomodoro, 48h Ledger + 80/20 Triage
│       ├── SyllabusView.tsx                # View 3: Deep search, Missed Queue, Topic Notes, Full-Screen Reader
│       ├── ReferenceView.tsx               # View 4: Appendix, 2-Page A4 Print, Flashcards, Playbook tabs
│       ├── RapidFlashcardDeck.tsx          # SM-2 dual-profile flashcard engine UI
│       ├── ExaminerPlaybookView.tsx        # Q1..QK blueprints, 20 -2M traps, 3h pacing timeline
│       ├── PredictionView.tsx              # View 5: Matrix, Alpha Gap, Beta Rotation, Gamma Consensus
│       ├── InteractiveLabsView.tsx         # View 6: Lab tab strip + simulator host
│       ├── NumericalDrillLab.tsx           # Procedural numerical drill arena UI
│       ├── <DomainLab1..K>.tsx             # 5–8 domain-specific 7:5 interactive simulator workbenches
│       ├── FatMockView.tsx                 # View 7: 100M Papers + 3h Mode + Rubric + Forensics + MCQ + Weak Topics
│       └── diagrams/
│           ├── DiagramPrimitives.tsx       # DiagramFrame, TONE_MAP, SvgMarkers, SvgBox + subject primitives
│           ├── Module1Diagrams.tsx .. ModuleNDiagrams.tsx
│           └── ConceptDiagrams.tsx         # Centralized DiagramId -> SVG router
```

---

## 11. Step-by-Step Phased Build Execution Plan & Content Depth Targets

Execute the build in strict phases so every layer compiles cleanly and receives full technical depth rather than thin placeholders.

### Quantitative Content Depth Floor (Non-Negotiable Quality Bars)
Never ship stub arrays, `"TODO"`, or 3-item demo lists. Meet these minimums for every target course:
- **Syllabus Topics**: `20–35` granular topics spanning all `N` modules, **every single topic** having a complete `TopicNote` (summary, 3–6 key points, 2–4 deep-dive sections with tables/code/diagrams, concrete worked example, 1–2 `fatQuestionMethods`, 2–3 `selfChecks`, and an `examTip`).
- **Standing Diagnostic Bank**: **Exactly 30 questions per module** (`10` Foundation + `10` Application + `10` Analysis) + 1 rich `ModuleRefresher` per module (`150` Qs for a 5-module course).
- **Custom Vector SVG Plates**: **20–35 bespoke inline SVG diagrams** across `Module1..NDiagrams.tsx` — zero ASCII art where a vector diagram belongs.
- **Interactive Labs**: **1 Procedural Numerical Drill Arena** (minimum `6` distinct deterministic calculation archetypes) + **5–8 Interactive Module Simulators** (minimum `1` simulator per module, each with `2–4` one-click exam presets).
- **100-Mark Mock Papers**: Minimum **2 complete 100M papers** (real supplied past papers + 1 generated parallel 100M paper) with full per-sub-part rubric caps summing cleanly to `100M` (respecting `OR` choices) and complete worked solutions + Forensics table.
- **Rapid MCQ Drill Bank**: **40–60 MCQs** (split across Part A 2M & Part B 10M, balanced across all modules).
- **SM-2 Flashcards**: **40–60 flashcards** balanced across all modules.
- **Examiner Playbook**: Full blueprints for every exam question slot (`Q1..QK`), **20 checkable `-2M` Trap Busters**, and a complete **3-hour minute-by-minute pacing plan**.
- **48-Hour Sprint Timetable**: **12–18 realistic time blocks** covering Day 1, Day 2, and Exam Morning, with ~40–50% marked `isHighYield: true` for 80/20 Triage Mode.

### Phased Build Sequence
- **Phase 0 — Course Normalization & Dependency Setup**:
  - Parse all user-supplied syllabus, slides, exam rules, and past papers.
  - Install `lucide-react`, `motion`, and `tsx` (if not already present) in a single batched package install.
  - Update `metadata.json` and `index.html` (Google Fonts + anti-FOUC dark mode script + meta tags).
- **Phase 1 — Visual Foundation (`src/index.css`)**:
  - Implement all Light Mode paper/ink tokens, `DIVISION_WHEEL` helpers, `solveLeafAlpha`, OKLCH Warm-Obsidian Dark Mode ladder, `.prose-manual`, `.tabular-nums`, `.step-hinge`, `.diagram-canvas-plate`, confetti keyframes, `prefers-reduced-motion`, and `@media print`.
- **Phase 2 — Core Data & Syllabus Notes (`src/data/`)**:
  - Author `noteTypes.ts`, `courseData.ts`, `professorMaterials.ts`, `module1Notes.ts..moduleNNotes.ts`, `topicNotes.ts`, `slotPaperAnalysis.ts`, and `standingM1.ts..standingMN.ts` + `standingData.ts`.
  - Write `courseIntegrity.test.ts` validating that every `topicId` resolves, every module has exactly 30 standing questions (`10/10/10`), every 100M paper sums accurately, and every `DiagramId` is valid.
- **Phase 3 — Pure-Logic Engines & Unit Tests (`src/utils/`)**:
  - Implement all 12 core pure engines + all domain simulator engines, each paired with a `*.test.ts` suite using `node:test` + `node:assert/strict`.
  - Run `node --import tsx --test src/utils/*.test.ts src/data/*.test.ts` and ensure **100% pass** before building UI views.
- **Phase 4 — Custom Vector Diagram Plates & Shared Primitives (`src/components/`)**:
  - Build `MarkdownBlock.tsx`, `DiagramPrimitives.tsx`, `Module1..NDiagrams.tsx`, `ConceptDiagrams.tsx`, `ExamCountdown.tsx`, `PomodoroTimer.tsx`, `FormulaQuickRef.tsx`, `MasteryConfettiOverlay.tsx`, `RadarChart.tsx`, and `WeakTopicsPanel.tsx`.
- **Phase 5 — Build All 7 Top-Level Views & Interactive Labs**:
  - Build `StandingView` (plus Refresher/Quiz/Results), `SprintPlannerView`, `SyllabusView`, `ReferenceView` (plus Flashcards & Playbook), `PredictionView`, `InteractiveLabsView` (plus `NumericalDrillLab` & domain simulators), and `FatMockView`.
- **Phase 6 — Wire Global Binder Shell (`src/App.tsx`)**:
  - Connect all 14 `localStorage` persisted states, runtime `solveLeafAlpha` effect, 3-zone header, mobile nav, punched left binder spine, stepped right fore-edge tab rail, deep-link navigation handlers between views (Standing → Notes/Labs/Mock, Prediction → Syllabus/Paper, Readiness Coach → exact target), and global `FormulaQuickRef`.
- **Phase 7 — Full Automated Testing, Compilation & Visual Critique Loop**:
  - Proceed to Section 12 before finishing.

---

## 12. Verification, Testing & Visual Browser Critique Checklist

Never declare the application complete until **all four verification gates** pass cleanly:

### Gate 1 — Pure Logic & Data Integrity Tests (`node:test`)
Run all unit tests via:
```bash
node --import tsx --test src/utils/*.test.ts src/data/*.test.ts
```
Verify **0 failures** across:
- `readinessEngine`: 0% empty state, 100% maxed state, exact 25/15/25/20/15 weights, weakest-module hour tie-breaking, top-3 action prioritization.
- `srsEngine`: both `fat48h` and `longterm` interval schedules, EF floor `1.30`, lapse reset, overdue-first queue sorting, 4-bucket forecast math.
- `standingEngine`: `A/B/C/D` cutoffs (`25/18/10`), prescriptive trigger boundaries (`foundation < 7`, `application < 6`, `analysis < 6`), aggregate radar percentage bands.
- `weakTopicsEngine`: upsert increments `wrongCount` and un-resolves, `>= 3` misses + `>= 2h` overdue pinning, `< 1h` recently reviewed flag.
- `countdownEngine`: all 6 lifecycle phases (`prep`, `sprint_48h`, `final_24h`, `exam_morning`, `in_progress`, `completed`) independent of local machine timezone.
- `pomodoroEngine`: 25/5/15 transitions, 4th-focus Long Break auto-advance, daily midnight reset.
- `confettiEngine`, `darkModeEngine`, `formulaQuickRefEngine`, `cheatSheetPrintEngine`, `predictionEngine`, `numericalDrillEngine`, and every domain simulator engine.
- `courseIntegrity.test.ts`: zero broken `topicId`/`moduleId`/`DiagramId` references, exact 30 standing questions per module (`10/10/10`), valid 4-option `correctIndex ∈ [0..3]` on every MCQ, accurate 100M paper mark totals.

### Gate 2 — Static Type-Check & Production Build
Co-execute both checks and require **zero errors**:
- `npm run lint` (`tsc --noEmit`)
- `npm run build` (`vite build`)

### Gate 3 — Real Browser Visual & Interactive Audit (Desktop + Mobile, Light + Dark)
Inspect the live running app at `http://localhost:3000` in a headless browser (`playwright-cli`) and verify every item:
1. **Zero Console & Runtime Errors**: Zero uncaught exceptions, zero React hydration/key warnings, zero broken `404` asset loads.
2. **Desktop (`1440×900`) — Light & Dark Modes**:
   - Punched left binder spine and right stepped fore-edge division tab rail render cleanly aligned without overlapping content.
   - Switching tabs updates `--division-accent` and `--leaf-alpha`; switching Light ↔ Dark persists across reload without FOUC.
   - All 7 views render with heading-first typography, zero pill bloat, crisp `1px` rules, and legible `.diagram-canvas-plate` SVGs in both Light and Dark mode.
3. **Interactive Flow Spot-Checks**:
   - **Standing**: Complete a module diagnostic (or verify quiz progression + tier interstitial + results dashboard + radar unlock after 2 modules + wrong answer appears in Weak Topics badge).
   - **48h Plan**: Toggle a sprint block, flip 80/20 Triage Mode, start/pause Pomodoro, verify Readiness score updates live.
   - **Syllabus**: Search via `/` shortcut, toggle a topic mastered and verify confetti burst + milestone toast, open Full-Screen Note Reader and step Prev/Next + `Escape` close.
   - **Reference**: Open SM-2 Flashcards, flip with `Space`, rate with `1–4`, verify interval preview updates; verify 2-page Cheat Sheet print trigger and Examiner Trap checkboxes.
   - **Prediction**: Switch across Matrix, Alpha, Beta, Gamma lenses and verify 1-click syllabus/paper jumps.
   - **Labs**: Solve a Numerical Drill problem and run presets in at least 2 domain simulators, verifying visual SVG/trace updates.
   - **FAT Mock**: Enter rubric scores on a 100M paper, toggle `OR` branches (no double counting), start 3-Hour Exam Mode (solutions collapse), inspect Forensics, answer a Rapid MCQ wrong and confirm Weak Topics tracker catches it.
   - **Global `Ctrl+K`**: Press `Ctrl+K`, type a formula keyword, confirm instant filtering and `Escape` close.
4. **Reload Persistence Check**: Reload the page and confirm mastered topics, sprint blocks, rubric scores, dark mode, and weak topics survive intact via `localStorage`.
5. **Mobile (`390×844`) Check**: Verify zero horizontal overflow (`scrollWidth <= innerWidth`), smooth scrollable mobile nav bar, readable SVG plates, and accessible touch targets across all 7 views.

### Gate 4 — Final Polish Pass
Fix any clipped SVG label, contrast defect, spacing misalignment, or interactive quirk surfaced in Gate 3, re-run Gate 1 + Gate 2 + affected visual screenshots, and deliver a concise summary of the tailored course application.
