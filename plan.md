# BACSE106 FAT Sprint — 5-Step Overhaul Plan
## Aligning BACSE106 (Operating Systems) to the Exact BACSE202 (Database Systems) UI/UX & Architecture

> **Target Model**: Gemini 4 Neon Max in Google AI Studio Build Mode  
> **Source Baseline**: `https://github.com/nannanvp/BACSE202-Database-Systems` (Live: `https://202-mauve.vercel.app/`)  
> **Target Project**: `BACSE106 Operating Systems FAT Sprint` (`Intermediate`)  
> **Design Metaphor**: `rw-manual-acetate-tab-board` (Boxed late-1980s workstation reference manual lying open on an oiled-charcoal binder mat with milk-acetate leaves and a stepped fore-edge division tab rail).

---

## Executive Summary of the Overhaul

Transform BACSE106 from its current hybrid card layout into an exact architectural replica of the award-winning BACSE202 application. This includes:
1. Adopting the exact **color scheme, typography, surfaces, and contrast tokens** (`#26231E`, `#EAE4D7`, `#F4EFE4`, `#FAF7F0`, `#1C1B18`, Archivo, EB Garamond, JetBrains Mono).
2. Implementing the **punched ring-binder spine** on the left and **stepped fore-edge division tab rail** on the right.
3. Structuring the **Syllabus Reference Manual** as a distraction-free, 100% full-width reader with an overlay modal.
4. Converting all Operating Systems simulators into **7:5 asymmetric workbenches** (7-column interactive stage + 5-column preset/parameter control panel) alongside the **Procedural Numerical Drill Arena**.
5. Replacing the static gap prediction with the **tripartite Alpha (Complement) / Beta (Progression) / Gamma (Consensus) forecasting engine**.

---

## Step 1: Design Tokens, Surfaces & Typography Foundation

### Objectives
Establish the identical color tokens, typography scales, paper surfaces, and contrast solver from BACSE202 in `DESIGN.md`, `src/index.css`, `index.html`, and `src/utils/contrastSolver.ts`.

### Execution Tasks
1. **Create / Replace `DESIGN.md`**:
   - Document the `rw-manual-acetate-tab-board` specification.
   - Core surface tokens:
     - `--surface-binder`: `#26231E` (Oiled charcoal desk mat)
     - `--surface-board`: `#EAE4D7` (Uncoated archival paperboard body)
     - `--surface-leaf`: `#F4EFE4` (Milk-acetate section leaf)
     - `--surface-sheet`: `#FAF7F0` (Primary high-contrast manual reading sheet)
     - `--surface-well`: `#E2DBCC` (Recessed parameter control wells)
   - Carbon ink hierarchy:
     - `--ink-primary`: `#1C1B18` (Headings, primary text, 1px rules)
     - `--ink-secondary`: `#434038` (Explanations, table rows)
     - `--ink-muted`: `#6E695D` (Folios, timestamps, captions)
     - `--rule-hairline`: `#C5BEB0` (1px dividers)
   - 7-Division Fore-Edge Palette:
     - Division 1 (`m1` OS Structure & Core): Chrome Yellow `#E5B82E`
     - Division 2 (`m2` Processes, Threads, CPU Scheduling): Oxide Orange `#E06D2B`
     - Division 3 (`m3` Concurrency & Deadlocks): Grass Green `#4F8A3D`
     - Division 4 (`m4` Memory & Virtual Memory): Teal `#147E7B`
     - Division 5 (`m5` Storage, I/O & Protection): Ultramarine `#22559C`
     - Division 6 (`labs` Interactive Simulators): Violet `#6F539B`
     - Division 7 (`mock` 100M FAT Mock Papers): Sienna `#854D2B`
2. **Typography Setup in `index.html` & `src/index.css`**:
   - Import Google Fonts: `Archivo` (500, 600, 700, 800), `EB Garamond` (400, 500, 600, italic), and `JetBrains Mono` (400, 500, 600).
   - In `src/index.css`, configure:
     ```css
     @theme {
       --font-display: 'Archivo', -apple-system, BlinkMacSystemFont, sans-serif;
       --font-sans: 'Archivo', -apple-system, BlinkMacSystemFont, sans-serif;
       --font-serif: 'EB Garamond', Georgia, serif;
       --font-mono: 'JetBrains Mono', monospace;
     }
     ```
   - Add `.prose-manual` utility class for long-form study prose: `font-serif`, `text-[1.04rem]`, `leading-[1.65]`, capped strictly at `max-w-[68ch]`.
3. **Acetate Luminance Contrast Solver (`src/utils/contrastSolver.ts`)**:
   - Port the 12-iteration binary search algorithm from BACSE202 that dynamically calculates `--leaf-alpha` so that any division color alpha-composited against `--surface-board` maintains a WCAG AAA contrast ratio ($\ge 9.5:1$) against `#1C1B18` text.

### Verification Gate
- [ ] Inspect elements in browser: no generic blue/slate backgrounds or blurred Tailwind shadows (`shadow-lg`).
- [ ] Body text uses `EB Garamond`; headings use tightly tracked `Archivo`; all numbers and timers use `JetBrains Mono` with `tabular-nums`.

---

## Step 2: Open Manual Binder Frame, Specification Header & Stepped Tab Rail

### Objectives
Overhaul `src/App.tsx` and layout primitives to match the open boxed-software binder frame layout with the left punched spine and the right stepped division rail.

### Execution Tasks
1. **Outer Desk Mat & Binder Board Frame (`src/App.tsx`)**:
   - Wrap the entire application in an outer `#26231E` frame (`p-2 sm:p-3 lg:p-4 min-h-screen`).
   - Center the manual board (`#EAE4D7`, `max-w-[1600px]`, `rounded-[6px]`, `border border-[#1C1B18]`).
2. **Left Punched Ring-Binder Spine (`w-[44px]` on `xl:flex`)**:
   - Add the vertical left margin strip with 3 circular punched ring-binder holes (`w-4 h-4 rounded-full border border-[#1C1B18] bg-[#26231E]`).
   - Add the vertical rotated folio label (`writing-mode: vertical-rl; transform: rotate(180deg)`):
     `BACSE106 · OPERATING SYSTEMS · VIT CHENNAI · FALL 2026-2027`.
3. **Top Manual Specification Header**:
   - Build the 3-zone header:
     - Left: Course identity stamp (`BACSE106 · FAT SPRINT`, `Division M1–M5`).
     - Center: View navigation bar (`Standing`, `Sprint`, `Syllabus`, `Reference`, `Prediction`, `Labs`, `FAT Mock`).
     - Right: Live FAT Countdown Clock, `Formulas (^K)` quick-ref launcher, and Paper Light / Dark theme toggle.
4. **Right Stepped Fore-Edge Division Tab Rail (`w-[44px]` on `xl:flex`)**:
   - Implement the right-hand die-cut tab column (`rounded-r-[6px]`, border `border-[#1C1B18]`).
   - Tabs: `M1` (Yellow), `M2` (Orange), `M3` (Green), `M4` (Teal), `M5` (Ultramarine), `LABS` (Violet), `MOCK` (Sienna).
   - Proportional tab heights matching lecture hours (`6h`, `10h`, `10h`, `10h`, `9h`).
   - Active tab protrudes horizontally (`translate-x-1`) and activates its active division color.

### Verification Gate
- [ ] Left spine shows 3 circular binder holes and vertical folio text.
- [ ] Right division tab rail renders with proportional heights and transitions active tabs smoothly.
- [ ] Responsive behavior: spine and division rail fold gracefully into a mobile bottom bar on `<1280px` viewports.

---

## Step 3: Full-Width Syllabus Manual & Distraction-Free Reader

### Objectives
Overhaul `src/components/SyllabusView.tsx` from card-cluttered blocks into a full-width study manual matching BACSE202, separating reference appendices into `ReferenceView.tsx`.

### Execution Tasks
1. **Full-Width Reading Sheet Layout**:
   - Remove narrow right-rail widgets from the syllabus page.
   - Topics render on `--surface-sheet` (`#FAF7F0`) with 1px outer carbon rules and hairline dividers.
   - Use `.prose-manual` with `EB Garamond` for all concept explanations, keeping line measure strictly under `68ch`.
2. **Topic Header & Examiner Cues**:
   - Each topic starts with its primary `h2` title.
   - Sub-metadata line below the heading (never above): `Module X · Topic X.Y · Lecture Hours · Bloom K2–K4`.
   - Embedded SVG architecture diagrams from `src/components/diagrams/` rendered with clean ink outlines on milk-acetate canvas (`#F4EFE4`).
3. **Full-Screen Reader Mode Modal (`data-testid="fullscreen-note-reader"`)**:
   - Add a full-screen reader modal for uninterrupted focus.
   - Features: Sticky top navigation, `Previous Topic` / `Next Topic` buttons, `Mark Topic Mastered` toggle, and `Escape` key listener.
4. **Clean Division of Content**:
   - Keep lecture slides, comparison tables, formula lists, and examiner trap catalogs in `src/components/ReferenceView.tsx` to preserve the Syllabus view strictly for study reading.

### Verification Gate
- [ ] Syllabus notes span full width without right-column crowding.
- [ ] Pressing `Full Screen` opens the distraction-free reader; pressing `Esc` closes it cleanly.
- [ ] Vector SVG diagrams render crisply with zero blurry text.

---

## Step 4: 7:5 Asymmetric Lab Workbenches & Procedural Drill Arena

### Objectives
Standardize all 6 Operating Systems simulators in `src/components/InteractiveLabsView.tsx` into BACSE202's `7:5` asymmetric workbench pattern, backed by pure TypeScript math engines in `src/utils/`.

### Execution Tasks
1. **7:5 Asymmetric Grid System**:
   - Every simulator tab must follow the 12-column split:
     - **Left 7 Columns (Stage Canvas)**: Visual state, timelines, and memory matrices.
     - **Right 5 Columns (Control Workbench)**: Input parameters, step execution buttons (`Prev Step`, `Next Step`, `Auto Run`), and **1-Click Past Exam Presets**.
2. **Standardize the 6 OS Simulators**:
   - **Lab 1: CPU Scheduler Workbench (`CpuSchedulerLab.tsx`)**:
     - Left (7 cols): Interactive Gantt chart clearly rendering **1 ms context-switch blocks** (`CS[t1-t2]`), timeline markers, and completion calculation table.
     - Right (5 cols): Process table inputs (Arrival, Burst, Priority) + Presets (`C1 Set 2-2 Q5 Preemptive Priority`, `C2 Q3 Round Robin q=10`).
   - **Lab 2: Banker's Safety & RAG Cycle Lab (`BankersRagLab.tsx`)**:
     - Left (7 cols): Allocation, Max, Available vectors, dynamic Need matrix, and step-by-step Work trace.
     - Right (5 cols): Resource allocation inputs + Resource Request evaluator + Presets (`C1 Set 2-2 Q7 6x4 Matrix`, `C2 Q4 Healthcare RAG`).
   - **Lab 3: Synchronization Concurrency Lab (`SyncConcurrencyLab.tsx`)**:
     - Left (7 cols): Visual buffer slots, barber shop chairs, or philosophers table with live mutex states.
     - Right (5 cols): Step trace controls + Race condition trigger + Deadlock-free resolution traces.
   - **Lab 4: Memory & Demand Paging Lab (`MemoryPagingLab.tsx`)**:
     - Left (7 cols): Frame allocation grid across reference string showing Hit/Fault indicators + Belady's anomaly toggle.
     - Right (5 cols): Algorithm selector (FIFO, LRU, OPT, Clock) + Frame size slider + TLB EAT numerical calculator.
   - **Lab 5: Disk Scheduling & RAID Lab (`DiskRaidLab.tsx`)**:
     - Left (7 cols): Visual disk cylinder track graph (0–199 or 0–499) showing head seek trajectories.
     - Right (5 cols): Algorithm selector (LOOK, C-LOOK, SSTF, SCAN) + Track queue inputs + RAID 0/1/5/6 capacity evaluator.
3. **Lab 0: Procedural Numerical Drill Arena (`NumericalDrillLab.tsx`)**:
   - Multi-archetype problem generator (CPU avg WT, Banker's need vector, Demand paging EAT, Unix inode max file size, Disk rotational latency).
   - Live pacing timer with target exam-hall times (`targetSeconds`).
   - Instant grading with step-by-step mark breakdown reveals.

### Verification Gate
- [ ] All labs conform strictly to the 7:5 column layout on desktop.
- [ ] Loading a Real Exam Preset automatically populates the controls and executes the exact trace.
- [ ] Numerical drill timer functions accurately with persistent streak tracking in `localStorage`.

---

## Step 5: Tripartite Prediction Engine & Slot Forensics

### Objectives
Port the predictive architecture from `BACSE202/src/utils/predictionEngine.ts` and `PredictionView.tsx` into BACSE106, upgrading from the simple C1/C2 gap model to the full **Alpha F2 / Beta F2 / Gamma F2** system.

### Execution Tasks
1. **Coverage Matrix with Expandable Question Cards (Lens 1)**:
   - Map all 26+ BACSE106 syllabus topics across uploaded past slots (`C1 Set 2-2`, `C1 Set 1-2`, `C2+TC2`, and incoming `F1 Slot`).
   - Badges: `untested` (0 appearances), `partial` (sub-part only), `tested`.
   - Expandable inline question cards showing the full prompt, marks, and worked solution with 1-click deep links to Syllabus and Labs.
2. **Lens 2: Alpha F2 Model (Pure Complement of F1)**:
   - Mathematical formula: $\mathbf{\text{Alpha}}_{F2} = \mathcal{S}_{\text{Syllabus}} \setminus \mathcal{Q}_{F1}$.
   - Complete 100-mark paper (10×10M or 4×10M + 4×15M) selecting exclusively from topics untested in the morning F1 slot.
   - Every question includes Bloom taxonomy, marks, prompt, and gap rationale.
3. **Lens 3: Beta F2 Model (Progression Shift Pattern Table)**:
   - Mathematical formula: $\mathbf{\text{Beta}}_{F2} = \mathcal{Q}_{F1} \oplus \vec{\Delta}_{C1 \to C2}$.
   - Add the **Empirical Shift Proof Table**:
     - Maps how the exam setter shifted from $C1 \to C2$ (e.g., Preemptive Priority with CS $\to$ Round Robin; Banker's 6×4 $\to$ Healthcare RAG; Page Replacement $\to$ TLB EAT).
     - Applies the shift vector to F1 questions to project the expected sibling rotation in F2.
4. **Lens 4: Gamma F2 Model (Arbitrated Consensus Synthesis)**:
   - Mathematical formula: $\mathbf{\text{Gamma}}_{F2} = \mathbf{\text{Alpha}}_{F2} \cap \mathbf{\text{Beta}}_{F2}$.
   - Full 100M paper reconciling Alpha and Beta into a single authoritative forecast.
   - Arbitration table tagging each question:
     - `Unanimous Lock` (90–96% confidence where Alpha and Beta coincide).
     - `Consensus + Split` (arbitrated between competing high-yield candidates).
     - `Arbitrated Anchor` (guaranteed exam numerical with rotated values).

### Verification Gate
- [ ] 4-lens navigation switches cleanly across Matrix, Alpha F2, Beta F2, and Gamma F2.
- [ ] Shift Proof Table in Beta explicitly displays the $C1 \to C2$ transformation applied to F1.
- [ ] Gamma consensus table displays confidence percentages and arbitration reasons for all 100 marks.
- [ ] `npm test`, `npm run lint`, and `npm run build` pass with 0 errors.

---

## Instructions for Gemini 4 Neon Max in AI Studio Build Mode

```text
Follow the 5-step plan in plan.md sequentially to overhaul the BACSE106 application.
Maintain 100% offline functionality with zero external runtime dependencies.
Do not remove existing verified data in courseData.ts or slotPaperAnalysis.ts; enhance and restructure them to match the BACSE202 reference architecture.
Ensure all TypeScript tests in src/utils/*.test.ts continue to pass with 0 errors.
```
