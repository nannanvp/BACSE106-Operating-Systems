import { SlotAppearanceItem } from '../utils/predictionEngine';

export interface PaperSubPart {
  id: string;
  label: string; // e.g., "(a)"
  prompt: string;
  maxMarks: number;
  rubricCue: string;
}

export interface PaperQuestion {
  id: string;
  qNo: string;
  moduleId: 'm1' | 'm2' | 'm3' | 'm4' | 'm5';
  topicId: string;
  co: string;
  bloom: 'K2' | 'K3' | 'K4' | 'K5';
  marks: number;
  title: string;
  stem: string;
  subParts: PaperSubPart[];
  workedSolution: string;
  labPresetLink?: { labTab: 'cpu' | 'bankers' | 'sync' | 'memory' | 'disk'; note: string };
}

export interface ExamPaper {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  setter: string;
  structureLabel: string;
  totalMarks: number;
  durationMinutes: number;
  isRealSlot: boolean;
  pdfHref?: string;
  questions: PaperQuestion[];
}

export const SLOT_COLUMNS = [
  { id: 'c1-2-2', label: 'C1 Set 2-2', sub: 'Prof. Sudhakaran · 4×10+4×15' },
  { id: 'c1-1-2', label: 'C1 Set 1-2', sub: '7×10+2×15' },
  { id: 'c2', label: 'C2+TC2', sub: 'Prof. Linda Joseph · 10×10' },
  { id: 'f1', label: 'F1 Slot', sub: 'Ready to plug in tomorrow' },
] as const;

export const EXAM_PAPERS: ExamPaper[] = [
  // =========================================================================
  // PAPER 1: Real Slot C1+TC1 Set 2-2 (4×10M + 4×15M = 100M)
  // =========================================================================
  {
    id: 'paper-c1-2-2',
    code: 'C1+TC1 · Set 2-2',
    title: 'VIT Chennai Real FAT — Slot C1+TC1 (Set 2-2)',
    subtitle: '4 × 10M + 4 × 15M = 100M · Heavy numerical weight on CPU+CS, Banker’s 6×4, Page Replacement & Placement',
    setter: 'Prof. Sudhakaran G (VIT Chennai)',
    structureLabel: '4×10M + 4×15M = 100M',
    totalMarks: 100,
    durationMinutes: 180,
    isRealSlot: true,
    pdfHref: '/assets/aistudio/BACSE106_Operating_Systems_C1_2-2_FAT_VITC_-_Copy_4a36a71b.pdf',
    questions: [
      {
        id: 'c122-q1',
        qNo: 'Q1',
        moduleId: 'm1',
        topicId: 'm1-os-structures',
        co: 'CO1',
        bloom: 'K2',
        marks: 10,
        title: 'Monolithic vs Microkernel Operating System Architectures',
        stem: 'Analyze Monolithic and Microkernel operating system architectures with neat labeled structural diagrams and evaluate their core trade-offs.',
        subParts: [
          { id: 'c122-q1a', label: '(a)', prompt: 'Explain Monolithic and Microkernel structures with clearly labeled User/Kernel boundary diagrams.', maxMarks: 7, rubricCue: 'Monolithic diagram (3.5M) + Microkernel IPC diagram (3.5M) with privilege boundary.' },
          { id: 'c122-q1b', label: '(b)', prompt: 'List key differences, advantages, and disadvantages of both architectures.', maxMarks: 3, rubricCue: 'Structured comparison across communication, fault isolation, performance, extensibility.' },
        ],
        workedSolution:
          '**Monolithic Kernel** places CPU scheduling, virtual memory, file system, and device drivers inside a single Kernel Mode (`bit=0`) address space. Services communicate via direct C function calls -> lowest latency & highest throughput, but any driver crash causes a full kernel panic.\n\n**Microkernel** minimizes Kernel Mode to IPC, basic scheduling, and memory mapping; File Server, Device Drivers, and Process Server run as isolated User Mode (`bit=1`) processes communicating via **IPC message passing** routed through the kernel -> superior fault isolation & security, but incurs repeated user/kernel context-switch overhead.',
      },
      {
        id: 'c122-q2',
        qNo: 'Q2',
        moduleId: 'm3',
        topicId: 'm3-classical-problems',
        co: 'CO3',
        bloom: 'K3',
        marks: 10,
        title: 'Sleeping Barber Synchronization Problem Using Semaphores',
        stem: 'Formulate a deadlock-free semaphore solution for the Sleeping Barber problem with `N` waiting room chairs and one barber chair.',
        subParts: [
          { id: 'c122-q2a', label: '(a)', prompt: 'Define semaphores/shared variables and write complete Barber and Customer pseudocode.', maxMarks: 5, rubricCue: 'Init `customers=0, barber=0, mutex=1, waiting=0` + exact wait/signal order + `signal(mutex)` in `else`.' },
          { id: 'c122-q2b', label: '(b)', prompt: 'Explain how your solution prevents race conditions, lost wakeups, and deadlocks.', maxMarks: 5, rubricCue: 'Mutex guards `waiting`; counting semaphore `customers` stores wakeups; full-shop leaves cleanly.' },
        ],
        workedSolution:
          '**Init**: `semaphore customers = 0, barber = 0, mutex = 1; int waiting = 0;`\n\n**Barber**: `while(true) { wait(customers); wait(mutex); waiting--; signal(barber); signal(mutex); cut_hair(); }`\n\n**Customer**: `wait(mutex); if (waiting < N) { waiting++; signal(customers); signal(mutex); wait(barber); get_haircut(); } else { signal(mutex); leave(); }`\n\n**Verification**: `mutex` prevents two arriving customers from racing on `waiting < N`; `customers` counting semaphore eliminates lost wakeups (even if customer signals before barber calls `wait(customers)`); releasing `mutex` in the `else` branch prevents shop-full deadlock.',
        labPresetLink: { labTab: 'sync', note: 'Step through Sleeping Barber live in Lab 3' },
      },
      {
        id: 'c122-q3',
        qNo: 'Q3',
        moduleId: 'm4',
        topicId: 'm4-thrashing-ws',
        co: 'CO4',
        bloom: 'K2',
        marks: 10,
        title: 'Thrashing: Underlying Cause, Curve & Overcoming Techniques',
        stem: 'Examine the phenomenon of Thrashing in demand-paged virtual memory systems.',
        subParts: [
          { id: 'c122-q3a', label: '(a)', prompt: 'Explain the underlying cause of thrashing with a labeled CPU Utilization vs Degree of Multiprogramming illustration.', maxMarks: 5, rubricCue: 'Feedback loop explanation + labeled curve showing thrashing collapse point.' },
          { id: 'c122-q3b', label: '(b)', prompt: 'Detail techniques used by modern operating systems to overcome thrashing.', maxMarks: 5, rubricCue: 'Local replacement, Working-Set Model (`D = ΣWSS_i <= m`), Page-Fault Frequency (PFF) bounds.' },
        ],
        workedSolution:
          '**Cause**: A process thrashes when it spends more time paging than executing because its allocated frames fall below its active locality size. Under global replacement, low CPU utilization tricks the medium-term scheduler into admitting *even more* processes -> frame starvation spirals -> CPU utilization collapses toward 0%.\n\n**Remedies**: (1) **Local/Priority Page Replacement** prevents one thrashing process from stealing frames from healthy processes. (2) **Working-Set Model (`Δ`)**: compute `D = Σ WSS_i`; whenever `D > m`, suspend/swap out a process. (3) **Page-Fault Frequency (PFF)**: allocate a frame if fault rate exceeds upper threshold; reclaim a frame if below lower threshold.',
      },
      {
        id: 'c122-q4',
        qNo: 'Q4',
        moduleId: 'm5',
        topicId: 'm5-virtualization',
        co: 'CO5',
        bloom: 'K2',
        marks: 10,
        title: 'Full Virtualization, Para-Virtualization & OS-Level Containers (Docker)',
        stem: 'Compare modern virtualization architectures from bare-metal hypervisors to OS-level containers.',
        subParts: [
          { id: 'c122-q4a', label: '(a)', prompt: 'Explain Full Virtualization, Para-Virtualization, and OS-Level Containers (Docker) with neat layered diagrams.', maxMarks: 6, rubricCue: '3 clear stack diagrams: Full VM (unmodified guest), Para-Virt (hypercalls), Docker (shared host kernel + namespaces/cgroups).' },
          { id: 'c122-q4b', label: '(b)', prompt: 'Compare all three on guest OS requirement, isolation, boot speed, performance, and portability.', maxMarks: 4, rubricCue: '5-dimension comparison table with concrete strengths/trade-offs.' },
        ],
        workedSolution:
          '**Full Virtualization**: Hypervisor (ESXi/KVM) runs *unmodified* guest OSes via Trap-and-Emulate, Binary Translation, or Intel VT-x/AMD-V. Strongest isolation, heavier RAM/GB images.\n\n**Para-Virtualization**: Guest OS kernel is modified to invoke direct **hypercalls** to the hypervisor (Xen), avoiding trap overhead.\n\n**OS-Level Containers (Docker)**: No guest OS — containers share the Host OS Kernel, isolated by **Linux Namespaces** (PID/Net/Mnt/IPC) and resource-capped by **cgroups** -> millisecond startup, MB images, 10× density, shared-kernel attack surface.',
      },
      {
        id: 'c122-q5',
        qNo: 'Q5',
        moduleId: 'm2',
        topicId: 'm2-preemptive-scheduling',
        co: 'CO2',
        bloom: 'K3',
        marks: 15,
        title: 'Preemptive Priority Scheduling with 1 ms Context-Switch Overhead (10 Processes)',
        stem: 'Schedule P1(0,9,6), P2(1,5,4), P3(3,8,7), P4(4,4,2), P5(6,6,5), P6(8,3,1), P7(10,7,3), P8(12,5,4), P9(19,2,1), P10(17,4,2) using Preemptive Priority (1 = highest; equal priority = FCFS no preemption; 1 ms CS overhead excluded for initial dispatch & final completion; arrivals during CS considered).',
        subParts: [
          { id: 'c122-q5a', label: '(a)', prompt: 'Construct the complete Gantt chart clearly showing every 1 ms CS block.', maxMarks: 6, rubricCue: 'Exact 67 ms timeline with all 14 CS blocks and correct P9/P10/P2/P8 tie handling.' },
          { id: 'c122-q5b', label: '(b)', prompt: 'Compute Completion Time (CT) for all 10 processes.', maxMarks: 2, rubricCue: 'P1=58, P2=36, P3=67, P4=14, P5=49, P6=12, P7=32, P8=42, P9=22, P10=26.' },
          { id: 'c122-q5c', label: '(c)', prompt: 'Compute TAT, WT, and RT for every process.', maxMarks: 5, rubricCue: 'TAT=CT-AT, WT=TAT-BT, RT=FirstStart-AT verified across all 10 rows.' },
          { id: 'c122-q5d', label: '(d)', prompt: 'Compute Average Turnaround Time and Average Waiting Time.', maxMarks: 2, rubricCue: 'Avg TAT = 278/10 = 27.80 ms; Avg WT = 225/10 = 22.50 ms.' },
        ],
        workedSolution:
          '**Verified Gantt (67 ms total = 53 ms burst + 14 ms CS)**:\n`P1[0-1] CS[1-2] P2[2-4] CS[4-5] P4[5-8] CS[8-9] P6[9-12] CS[12-13] P4[13-14] CS[14-15] P7[15-17] CS[17-18] P10[18-19] CS[19-20] P9[20-22] CS[22-23] P10[23-26] CS[26-27] P7[27-32] CS[32-33] P2[33-36] CS[36-37] P8[37-42] CS[42-43] P5[43-49] CS[49-50] P1[50-58] CS[58-59] P3[59-67]`\n\n**Per-Process (CT / TAT / WT / RT)**:\nP1(58/58/49/0), P2(36/35/30/1), P3(67/64/56/56), P4(14/10/6/1), P5(49/43/37/37), P6(12/4/1/1), P7(32/22/15/5), P8(42/30/25/25), P9(22/3/1/1), P10(26/9/5/1).\n\n**Averages**: **Avg TAT = 27.80 ms**, **Avg WT = 22.50 ms**, Avg RT = 12.80 ms.',
        labPresetLink: { labTab: 'cpu', note: 'Load C1 Set 2-2 Q5 preset in Lab 1 (CPU Scheduler)' },
      },
      {
        id: 'c122-q6',
        qNo: 'Q6',
        moduleId: 'm4',
        topicId: 'm4-page-replacement',
        co: 'CO4',
        bloom: 'K3',
        marks: 15,
        title: 'Demand Paging Replacement Comparison (4 Frames, 25-Reference String)',
        stem: 'For 4 initially empty frames and 25-reference string `1, 2, 3, 4, 2, 1, 5, 2, 1, 6, 3, 2, 1, 4, 2, 5, 1, 2, 7, 1, 3, 2, 4, 1, 2` (OPT tie-break: earliest loaded), evaluate FIFO, LRU, and Optimal.',
        subParts: [
          { id: 'c122-q6a', label: '(a)', prompt: 'Trace FIFO frame-by-frame and count page faults.', maxMarks: 4, rubricCue: 'FIFO = 17 faults, 8 hits (68% fault rate).' },
          { id: 'c122-q6b', label: '(b)', prompt: 'Trace LRU frame-by-frame and count page faults.', maxMarks: 4, rubricCue: 'LRU = 12 faults, 13 hits (48% fault rate).' },
          { id: 'c122-q6c', label: '(c)', prompt: 'Trace Optimal (OPT) with earliest-loaded tie-break and count page faults.', maxMarks: 4, rubricCue: 'OPT = 10 faults, 15 hits (40% fault rate).' },
          { id: 'c122-q6d', label: '(d)', prompt: 'Compare all three on fault counts, hit ratios, and practical OS feasibility.', maxMarks: 3, rubricCue: 'OPT (10) < LRU (12) < FIFO (17); LRU best practical due to locality & stack property.' },
        ],
        workedSolution:
          '**Verified Engine Counts (25 references, 4 frames)**:\n- **FIFO**: **17 faults**, 8 hits (**68.0%** fault rate, 32.0% hit ratio)\n- **LRU**: **12 faults**, 13 hits (**48.0%** fault rate, 52.0% hit ratio)\n- **OPT**: **10 faults**, 15 hits (**40.0%** fault rate, 60.0% hit ratio)\n\n**Comparison**: OPT achieves the theoretical minimum (10) but requires future reference knowledge; FIFO performs worst (17) because it evicts frequently hit pages like `1` and `2` purely by arrival age; LRU (12) closely tracks OPT and never exhibits Belady’s anomaly.',
        labPresetLink: { labTab: 'memory', note: 'Inspect all 25 columns in Lab 4 (Memory & Paging)' },
      },
      {
        id: 'c122-q7',
        qNo: 'Q7',
        moduleId: 'm2',
        topicId: 'm2-deadlock-handling',
        co: 'CO2',
        bloom: 'K4',
        marks: 15,
        title: "Banker's Algorithm (6 Processes × 4 Resources) & Dynamic Request Evaluation",
        stem: 'Given Total `(A=7, B=5, C=5, D=4)`, Alloc: `P0(1,0,0,1), P1(1,1,0,0), P2(1,1,1,0), P3(0,1,1,1), P4(2,0,0,1), P5(0,1,2,0)`, Max: `P0(2,1,0,2), P1(2,2,0,1), P2(2,2,3,1), P3(1,2,2,2), P4(3,1,1,2), P5(1,2,3,1)`.',
        subParts: [
          { id: 'c122-q7a', label: '(a)', prompt: 'Compute Total Allocated, Available vector, and Need matrix.', maxMarks: 3, rubricCue: 'Total Alloc=(5,4,4,3), Available=(2,1,1,1), all 6 Need rows exact.' },
          { id: 'c122-q7b', label: '(b)', prompt: 'Determine whether the system is safe with step-by-step Work vector trace.', maxMarks: 6, rubricCue: 'Safe sequence `<P0, P1, P3, P4, P5, P2>` ending at Work=(7,5,5,4).' },
          { id: 'c122-q7c', label: '(c)', prompt: 'Evaluate `Request2 = (0, 0, 1, 0)` — should it be granted or denied?', maxMarks: 6, rubricCue: 'Passes <=Need and <=Avail, but tentative Available=(2,1,0,1) leaves P2..P5 blocked on C=0 -> UNSAFE -> DENY!' },
        ],
        workedSolution:
          '**(a)** Total Alloc = `(5,4,4,3)` => **`Available = (2,1,1,1)`**. Needs: `P0(1,1,0,1), P1(1,1,0,1), P2(1,1,2,1), P3(1,1,1,1), P4(1,1,1,1), P5(1,1,1,1)`.\n\n**(b)** Initial Safety Trace: `P0 -> (3,1,1,2)` -> `P1 -> (4,2,1,2)` -> `P3 -> (4,3,2,3)` -> `P4 -> (6,3,2,4)` -> `P5 -> (6,4,4,4)` -> `P2 -> (7,5,5,4)`. **SAFE**: **`<P0, P1, P3, P4, P5, P2>`**.\n\n**(c)** `Request2 = (0,0,1,0)`: (1) `(0,0,1,0) <= Need2(1,1,2,1)` OK. (2) `(0,0,1,0) <= Avail(2,1,1,1)` OK. (3) Tentative `Avail = (2,1,0,1)`, `Alloc2=(1,1,2,0)`, `Need2=(1,1,1,1)`. `P0` finishes -> `(3,1,0,2)`; `P1` finishes -> `(4,2,0,2)`. Now `P2, P3, P4, P5` ALL need `C=1`, but `Work.C = 0`! **UNSAFE -> MUST DENY & ROLL BACK!**',
        labPresetLink: { labTab: 'bankers', note: 'Verify Q7(b) & Q7(c) live in Lab 2 (Banker’s & RAG)' },
      },
      {
        id: 'c122-q8',
        qNo: 'Q8',
        moduleId: 'm4',
        topicId: 'm4-contiguous-allocation',
        co: 'CO4',
        bloom: 'K3',
        marks: 15,
        title: 'Contiguous Memory Placement (FF, BF, NF, WF) & External Fragmentation',
        stem: '7 free memory blocks `[180, 420, 260, 500, 320, 380, 220]` KB receive 6 sequential requests `P1=100, P2=410, P3=390, P4=350, P5=400, P6=240` KB (remainder stays in place).',
        subParts: [
          { id: 'c122-q8a', label: '(a)', prompt: 'Trace First Fit and Best Fit allocations.', maxMarks: 4, rubricCue: 'Both allocate P1,P2,P3,P4,P6 (5/6), fail P5; final `[80,10,20,110,320,30,220]`.' },
          { id: 'c122-q8b', label: '(b)', prompt: 'Trace Next Fit with explicit pointer position and wrap-around.', maxMarks: 4, rubricCue: 'Pointer advances after each fit and wraps from block 7 to block 1; 5/6 allocated, P5 unallocated.' },
          { id: 'c122-q8c', label: '(c)', prompt: 'Trace Worst Fit allocations.', maxMarks: 4, rubricCue: 'P1->500(400), P2->420(10), P3->400(10), P4->380(30), P5 fails, P6->320(80); final `[180,10,260,10,80,30,220]`.' },
          { id: 'c122-q8d', label: '(d)', prompt: 'Compare allocated count, total free memory, largest contiguous block, and explain external fragmentation.', maxMarks: 3, rubricCue: 'All allocate 5/6 with 790 KB free (>400 KB), yet P5 rejected since largest hole is 320 KB (260 KB in WF).' },
        ],
        workedSolution:
          '**Verified Allocation Results**:\n- **First Fit / Best Fit / Next Fit**: 5/6 allocated (`P5=400 KB` unallocated), final blocks `[80, 10, 20, 110, 320, 30, 220]`, Total Free = **790 KB**, Largest Contiguous Block = **320 KB**.\n- **Worst Fit**: 5/6 allocated (`P5=400 KB` unallocated), final blocks `[180, 10, 260, 10, 80, 30, 220]`, Total Free = **790 KB**, Largest Contiguous Block = **260 KB**.\n- **External Fragmentation**: 790 KB total free memory easily exceeds P5’s 400 KB requirement, yet P5 cannot be loaded because free memory is shattered into non-contiguous holes <= 320 KB.',
        labPresetLink: { labTab: 'memory', note: 'Trace all 4 placement strategies in Lab 4' },
      },
    ],
  },

  // =========================================================================
  // PAPER 2: Real Slot C1 Set 1-2 (7×10M + 2×15M = 100M)
  // =========================================================================
  {
    id: 'paper-c1-1-2',
    code: 'C1 · Set 1-2',
    title: 'VIT Chennai Real FAT — Slot C1 (Set 1-2)',
    subtitle: '7 × 10M + 2 × 15M = 100M · Scenario-heavy: Linux Boot, Hospital Monitor, Working Set, RAID, Banker’s & Disk',
    setter: 'VIT Chennai CSE Faculty',
    structureLabel: '7×10M + 2×15M = 100M',
    totalMarks: 100,
    durationMinutes: 180,
    isRealSlot: true,
    pdfHref: '/assets/aistudio/BACSE106_Operating_Systems_C1_1-2_FAT_VITC_dc52fb46.pdf',
    questions: [
      {
        id: 'c112-q1',
        qNo: 'Q1',
        moduleId: 'm1',
        topicId: 'm1-design-booting',
        co: 'CO1',
        bloom: 'K4',
        marks: 10,
        title: 'Embedded Linux Patient Monitor Boot Loop & Time-Sharing Analysis',
        stem: 'A hospital embedded Linux patient-monitoring device repeatedly restarts right after loading the kernel because its root filesystem cannot be mounted.',
        subParts: [
          { id: 'c112-q1a', label: '(a)', prompt: 'Explain the complete Linux boot sequence, pinpoint the failing stage, and specify the recovery steps.', maxMarks: 5, rubricCue: '6-stage boot + Stage 5 rootfs mount failure + UUID/initramfs/fsck fix.' },
          { id: 'c112-q1b', label: '(b)', prompt: 'Compare Multiprogramming vs Time-Sharing and justify which is required for live patient monitoring.', maxMarks: 5, rubricCue: 'Switching trigger & response-time table + Time-Sharing recommendation.' },
        ],
        workedSolution:
          '**(a)** Boot stages: 1. BIOS/UEFI POST -> 2. Bootloader (GRUB) -> 3. Kernel -> 4. initramfs -> **5. Mount Root FS (`/`) [FAILING STAGE]** -> 6. init/systemd (PID 1). Fix: verify kernel `root=UUID=` parameter, rebuild `initramfs` with storage driver, run `fsck` on corrupted partition, repair `/etc/fstab`.\n\n**(b)** **Time-Sharing** uses periodic hardware timer quanta to guarantee low, bounded response time so critical vital-sign alarms are never starved behind compute jobs (unlike non-preemptive multiprogramming).',
      },
      {
        id: 'c112-q2',
        qNo: 'Q2',
        moduleId: 'm2',
        topicId: 'm2-nonpreemptive-scheduling',
        co: 'CO2',
        bloom: 'K3',
        marks: 10,
        title: 'Non-Preemptive Priority Scheduling vs FCFS & Aging',
        stem: 'Processes `P1(AT=0,BT=7,Pr=3), P2(1,5,1), P3(2,4,4), P4(3,3,2), P5(5,6,5)` (1 = highest priority) are scheduled using Non-Preemptive Priority.',
        subParts: [
          { id: 'c112-q2a', label: '(a)', prompt: 'Draw the Gantt chart and compute WT, TAT, and averages.', maxMarks: 4, rubricCue: 'P1[0-7] P2[7-12] P4[12-15] P3[15-19] P5[19-25]; Avg WT=8.40 ms, Avg TAT=13.40 ms.' },
          { id: 'c112-q2b', label: '(b)', prompt: 'Compare with FCFS, analyze responsiveness, state 2 limitations, and explain Aging.', maxMarks: 6, rubricCue: 'FCFS Avg WT=8.60 ms; Starvation + Priority Inversion; Aging solution.' },
        ],
        workedSolution:
          '**(a)** Gantt: `P1[0–7] | P2[7–12] | P4[12–15] | P3[15–19] | P5[19–25]`. WTs: `P1=0, P2=6, P3=13, P4=9, P5=14` -> **Avg WT = 42/5 = 8.40 ms**; TATs: `7, 11, 17, 12, 20` -> **Avg TAT = 67/5 = 13.40 ms**.\n\n**(b)** FCFS gives `Avg WT = 8.60 ms`. Priority improves urgency handling for P2/P4 but suffers from **(1) Starvation** (fixed via **Aging** — gradually incrementing priority of waiting processes) and **(2) Priority Inversion** (fixed via Priority Inheritance).',
        labPresetLink: { labTab: 'cpu', note: 'Verify C1 Set 1-2 Q2 in Lab 1 (CPU Scheduler)' },
      },
      {
        id: 'c112-q3',
        qNo: 'Q3',
        moduleId: 'm3',
        topicId: 'm3-critical-section-peterson',
        co: 'CO3',
        bloom: 'K3',
        marks: 10,
        title: "Railway Ticket Booking — Peterson's Solution Proof & Trace",
        stem: 'Two concurrent railway booking terminals update a shared seat counter using Peterson’s software synchronization protocol.',
        subParts: [
          { id: 'c112-q3a', label: '(a)', prompt: 'Explain the purpose of the two shared variables `flag[2]` and `turn`.', maxMarks: 3, rubricCue: 'Intent array + polite tie-breaker variable.' },
          { id: 'c112-q3b', label: '(b)', prompt: 'Prove Mutual Exclusion formally by contradiction.', maxMarks: 4, rubricCue: 'Both in CS => both flags true => turn must be 0 and 1 simultaneously -> Contradiction.' },
          { id: 'c112-q3c', label: '(c)', prompt: 'Trace simultaneous entry attempts by P0 and P1.', maxMarks: 3, rubricCue: 'Last writer to `turn` yields CS to the other process first.' },
        ],
        workedSolution:
          '**(a)** `flag[i] = true` declares `Pi` wants to enter CS; `turn = j` yields tie-breaking priority to `Pj`.\n\n**(b) Proof**: Assume both `P0` and `P1` are in CS simultaneously. Both executed `flag[0]=T` and `flag[1]=T` before their `while` loops. To pass the loop, `P0` must have observed `turn==0` while `P1` observed `turn==1`. Because `turn` holds only one value at a time, this is a **contradiction**.\n\n**(c)** If `P0` writes `turn=1` then `P1` writes `turn=0`, `P0` exits its loop (`turn==1` is false) and enters CS first; once `P0` sets `flag[0]=false`, `P1` enters.',
        labPresetLink: { labTab: 'sync', note: 'Trace Peterson’s live in Lab 3' },
      },
      {
        id: 'c112-q4',
        qNo: 'Q4',
        moduleId: 'm3',
        topicId: 'm3-monitors',
        co: 'CO3',
        bloom: 'K4',
        marks: 10,
        title: 'Hospital Operating Theatre Priority Monitor with Anti-Starvation',
        stem: 'A hospital has 3 operating theatres shared by 5 surgical teams. Emergency surgeries take priority over scheduled surgeries, a waiting threshold prevents starvation, and every theatre requires post-surgery cleaning before reuse.',
        subParts: [
          { id: 'c112-q4a', label: '(a)', prompt: 'Design a Monitor with `requestTheatre()`, `releaseTheatre()`, and `completeCleaning()`.', maxMarks: 6, rubricCue: 'Condition variables + `while` loops + `freeTheatres++` strictly inside `completeCleaning()`.' },
          { id: 'c112-q4b', label: '(b)', prompt: 'Analyze starvation prevention under continuous emergency arrivals.', maxMarks: 4, rubricCue: 'Explain how `consecutiveEmergencies >= THRESHOLD` bounds scheduled wait time.' },
        ],
        workedSolution:
          'Maintain `freeTheatres = 3`, `waitingEmergency`, `waitingScheduled`, `consecutiveEmergencies`, `THRESHOLD = 2`, and `condition emergQueue, schedQueue`. `requestTheatre(isEmergency)` uses Mesa-safe `while` loops blocking emergencies once `waitingScheduled > 0 && consecutiveEmergencies >= THRESHOLD`. `releaseTheatre()` hands the room to cleaning WITHOUT incrementing `freeTheatres`. `completeCleaning()` increments `freeTheatres` and signals `schedQueue` when the threshold is reached (else `emergQueue`).',
      },
      {
        id: 'c112-q5',
        qNo: 'Q5',
        moduleId: 'm4',
        topicId: 'm4-paging-tlb',
        co: 'CO4',
        bloom: 'K3',
        marks: 10,
        title: 'Segmentation Address Translation & Fragmentation Analysis',
        stem: 'Segment Table: `Code(base=1000, limit=400)`, `Data(2500, 300)`, `Heap(4000, 500)`, `Stack(6000, 200)`.',
        subParts: [
          { id: 'c112-q5a', label: '(a)', prompt: 'Translate `(Code, 250)`, `(Data, 350)`, `(Heap, 400)`, and `(Stack, 150)`.', maxMarks: 4, rubricCue: '1250, TRAP (350 >= 300), 4400, 6150.' },
          { id: 'c112-q5b', label: '(b)', prompt: 'Differentiate Internal vs External Fragmentation.', maxMarks: 3, rubricCue: 'Unused inside allocated unit vs scattered free holes outside.' },
          { id: 'c112-q5c', label: '(c)', prompt: 'Explain a technique to reduce external fragmentation in segmented systems.', maxMarks: 3, rubricCue: 'Compaction or Paged Segmentation (combining segmentation with fixed-size paging).' },
        ],
        workedSolution:
          '**(a)** `(Code, 250)`: `250 < 400` -> **`1250`**. `(Data, 350)`: `350 >= 300` -> **TRAP (Addressing Error)**. `(Heap, 400)`: `400 < 500` -> **`4400`**. `(Stack, 150)`: `150 < 200` -> **`6150`**.\n\n**(b)–(c)** Segmentation eliminates internal fragmentation but suffers external fragmentation across variable-sized segments -> resolved by **Compaction** (coalescing holes at runtime) or **Paged Segmentation**.',
        labPresetLink: { labTab: 'memory', note: 'Verify Segmentation Table in Lab 4' },
      },
      {
        id: 'c112-q6',
        qNo: 'Q6',
        moduleId: 'm4',
        topicId: 'm4-thrashing-ws',
        co: 'CO4',
        bloom: 'K4',
        marks: 10,
        title: 'Working-Set Model (Δ = 5) & Thrashing Swap-Out Decision',
        stem: 'Given page reference string `1, 2, 3, 2, 4, 1, 5, 2, 1, 3, 4, 5` with working-set window `Δ = 5`.',
        subParts: [
          { id: 'c112-q6a', label: '(a)', prompt: 'Find the Working Set at the 8th and 12th references.', maxMarks: 4, rubricCue: '8th: `{1,2,4,5}` (WSS=4); 12th: `{1,2,3,4,5}` (WSS=5).' },
          { id: 'c112-q6b', label: '(b)', prompt: 'What occurs if a process requires 4 frames but is allocated only 3?', maxMarks: 2, rubricCue: 'Active locality does not fit -> continuous page faults (Thrashing).' },
          { id: 'c112-q6c', label: '(c)', prompt: 'A system has 20 frames and 3 processes with WSS 6, 8, and 7. What action must the OS take?', maxMarks: 4, rubricCue: 'D = 6+8+7 = 21 > 20 -> suspend/swap out 1 process and redistribute its frames.' },
        ],
        workedSolution:
          '**(a)** 8th ref window `[2,4,1,5,2]` -> **`{1, 2, 4, 5}`** (`WSS=4`). 12th ref window `[2,1,3,4,5]` -> **`{1, 2, 3, 4, 5}`** (`WSS=5`).\n\n**(b)** Allocating 3 < 4 frames triggers **thrashing**.\n\n**(c)** `D = 6 + 8 + 7 = 21 > 20` frames -> OS must **suspend/swap out one process** so remaining active processes satisfy `D <= 20`.',
      },
      {
        id: 'c112-q7',
        qNo: 'Q7',
        moduleId: 'm5',
        topicId: 'm5-raid',
        co: 'CO5',
        bloom: 'K3',
        marks: 10,
        title: 'RAID Architecture Selection (University Data Center vs Multimedia Studio)',
        stem: 'Scenario 1: University Data Center must survive 2 simultaneous disk failures. Scenario 2: Multimedia editing studio stores easily regenerable scratch video needing maximum R/W throughput and 100% capacity.',
        subParts: [
          { id: 'c112-q7a', label: '(a)', prompt: 'Identify the appropriate RAID level for Scenario 1 and Scenario 2.', maxMarks: 2, rubricCue: 'Scenario 1 = RAID 6; Scenario 2 = RAID 0.' },
          { id: 'c112-q7b', label: '(b)', prompt: 'Justify both selections technically.', maxMarks: 4, rubricCue: 'Dual P+Q parity for 2-disk survival vs pure striping for 100% capacity & speed.' },
          { id: 'c112-q7c', label: '(c)', prompt: 'Compare RAID 5 vs RAID 6.', maxMarks: 2, rubricCue: '1 vs 2 failures; (N-1) vs (N-2) capacity; write parity overhead.' },
          { id: 'c112-q7d', label: '(d)', prompt: 'Explain why RAID 0 is unsuitable for Scenario 1.', maxMarks: 2, rubricCue: 'Zero redundancy: single disk failure destroys entire array (`MTTF/N`).' },
        ],
        workedSolution:
          '**(a)–(b)** **Scenario 1: RAID 6** (dual P+Q distributed parity tolerates ANY 2 simultaneous disk failures, protecting against a second failure during long rebuilds). **Scenario 2: RAID 0** (block striping delivers `N×` throughput and 100% usable capacity with zero parity penalty; data is regenerable).\n\n**(c)** RAID 5 uses single XOR parity (`N-1` usable, 1 failure); RAID 6 uses dual P+Q (`N-2` usable, 2 failures).\n\n**(d)** RAID 0 has 0 fault tolerance — losing even 1 disk wipes the entire University Data Center volume.',
        labPresetLink: { labTab: 'disk', note: 'Compare RAID 0/5/6 capacity in Lab 5' },
      },
      {
        id: 'c112-q8',
        qNo: 'Q8',
        moduleId: 'm2',
        topicId: 'm2-deadlock-handling',
        co: 'CO2',
        bloom: 'K3',
        marks: 15,
        title: "Banker's Algorithm (4 Processes × 3 Resources) + RAG / Wait-For Graph",
        stem: 'Total `(A=6, B=4, C=5)`. Alloc: `P0(1,0,1), P1(1,1,0), P2(1,1,1), P3(0,0,1)`. Max: `P0(3,2,2), P1(2,2,1), P2(4,2,2), P3(2,1,2)`.',
        subParts: [
          { id: 'c112-q8a', label: '(a)', prompt: 'Compute Available vector.', maxMarks: 2, rubricCue: 'Total Alloc=(3,2,3) => Available=(3,2,2).' },
          { id: 'c112-q8b', label: '(b)', prompt: 'Construct the Need matrix.', maxMarks: 3, rubricCue: 'P0(2,2,1), P1(1,1,1), P2(3,1,1), P3(2,1,1).' },
          { id: 'c112-q8c', label: '(c)', prompt: 'Find a Safe Sequence with Work vector updates.', maxMarks: 4, rubricCue: '`<P0, P1, P2, P3>` ending at Work=(6,4,5).' },
          { id: 'c112-q8d', label: '(d)', prompt: 'Explain RAG & Wait-For Graph cycle detection and justify single- vs multi-instance validity.', maxMarks: 6, rubricCue: 'Draw RAG & WFG + prove cycle is necessary & sufficient ONLY for single-instance resources.' },
        ],
        workedSolution:
          '**(a)–(c)** `Available = (6,4,5) - (3,2,3) = (3,2,2)`. Needs: `P0(2,2,1), P1(1,1,1), P2(3,1,1), P3(2,1,1)`. Trace: `P0 -> (4,2,3)` -> `P1 -> (5,3,3)` -> `P2 -> (6,4,4)` -> `P3 -> (6,4,5)`. **Safe sequence: `<P0, P1, P2, P3>`**.\n\n**(d)** WFG collapses single-instance resources to `Pi -> Pj` wait edges; cycle detection (`O(n^2)`) proves deadlock iff every resource has 1 instance; multi-instance systems require Banker’s/detection algorithm.',
        labPresetLink: { labTab: 'bankers', note: 'Verify C1 Set 1-2 Q8 in Lab 2' },
      },
      {
        id: 'c112-q9',
        qNo: 'Q9',
        moduleId: 'm5',
        topicId: 'm5-disk-scheduling',
        co: 'CO5',
        bloom: 'K3',
        marks: 15,
        title: 'Magnetic Disk Geometry + SSTF & SCAN Scheduling (6000 RPM)',
        stem: 'A magnetic disk has 100 tracks (1–100), spins at 6000 RPM, 100 sectors/track, 512 B/sector, seek rate 1 ms/track. Head starts at track 50; queue = `45, 20, 90, 10, 60, 80, 25, 70`.',
        subParts: [
          { id: 'c112-q9a', label: '(a)', prompt: 'Explain magnetic disk physical components and compute avg rotational latency.', maxMarks: 3, rubricCue: 'Platters, tracks, sectors, cylinders, arm/head + 6000 RPM -> 5 ms avg rotational latency.' },
          { id: 'c112-q9b', label: '(b)', prompt: 'Compute service order, total head movement, and seek time for SSTF.', maxMarks: 5, rubricCue: '50->45->60->70->80->90->25->20->10 = 130 tracks = 130 ms.' },
          { id: 'c112-q9c', label: '(c)', prompt: 'Compute service order, total head movement, and seek time for SCAN (specify direction).', maxMarks: 5, rubricCue: 'SCAN Down (to track 1): 138 tracks (138 ms); SCAN Up (to track 100): 140 tracks (140 ms).' },
          { id: 'c112-q9d', label: '(d)', prompt: 'Identify which algorithm avoids starvation and why.', maxMarks: 2, rubricCue: 'SCAN avoids starvation by sweeping across all tracks systematically, unlike greedy SSTF.' },
        ],
        workedSolution:
          '**(a)** Components: Platters, Spindle, Read/Write Heads on Actuator Arm, Tracks, Sectors (512 B), Cylinders. At 6000 RPM (`100 rev/s`), 1 full rotation = `10 ms` -> **Avg Rotational Latency = 5 ms**.\n\n**(b) SSTF**: `50->45(5)->60(15)->70(10)->80(10)->90(10)->25(65)->20(5)->10(10)` => **130 tracks = 130 ms**.\n\n**(c) SCAN (Down -> Track 1)**: `50->45->25->20->10->1->60->70->80->90` = `(50-1) + (90-1) = 49 + 89 =` **138 tracks = 138 ms** *(note: SCAN Up to 100 = 50 + 90 = 140 tracks)*.\n\n**(d)** **SCAN** avoids starvation because the elevator sweep guarantees every cylinder is serviced within one full back-and-forth cycle.',
        labPresetLink: { labTab: 'disk', note: 'Plot C1 Set 1-2 Q9 SSTF & SCAN in Lab 5' },
      },
    ],
  },

  // =========================================================================
  // PAPER 3: Real Slot C2+TC2 (Prof. Linda Joseph, 10×10M = 100M)
  // =========================================================================
  {
    id: 'paper-c2',
    code: 'C2+TC2',
    title: 'VIT Chennai Real FAT — Slot C2+TC2',
    subtitle: '10 × 10M = 100M · Balanced 2 questions per CO (Microkernel, FD Redirection, RR, RAG, Peterson’s, Bounded Buffer, Paging, TLB, LOOK/C-LOOK, Containers)',
    setter: 'Prof. Linda Joseph (VIT Chennai)',
    structureLabel: '10×10M = 100M',
    totalMarks: 100,
    durationMinutes: 180,
    isRealSlot: true,
    pdfHref: '/assets/aistudio/BACSE106_Operating_Systems_C2_FAT_VITC_6c7734d2.pdf',
    questions: [
      {
        id: 'c2-q1',
        qNo: 'Q1',
        moduleId: 'm1',
        topicId: 'm1-syscalls-services',
        co: 'CO1',
        bloom: 'K3',
        marks: 10,
        title: 'Neuro-Stimulator Microkernel & Shell I/O Redirection Syscalls',
        stem: 'Apply OS structure and POSIX system-call mechanics to embedded safety and shell execution.',
        subParts: [
          { id: 'c2-q1a', label: '(a)', prompt: 'Recommend & sketch a kernel architecture for an implantable neuro-stimulator needing high reliability and low latency, noting its trade-off.', maxMarks: 5, rubricCue: 'Microkernel diagram + fault isolation in user space + IPC overhead trade-off.' },
          { id: 'c2-q1b', label: '(b)', prompt: 'Trace `./analyzer data.txt > report.log` via fork, exec, open, close, read, write and the FD 1 reassignment rule.', maxMarks: 5, rubricCue: 'Child calls `close(1)` then `open("report.log")` -> lowest unused FD = 1 -> `exec()` preserves FD table.' },
        ],
        workedSolution:
          '**(a)** **Microkernel**: drivers run in isolated user servers so driver crashes never halt pulse pacing; trade-off is IPC context-switch latency.\n\n**(b)** Shell `fork()`s child -> child calls `close(1)` -> `open("report.log", O_WRONLY|O_CREAT|O_TRUNC)` gets **FD 1** (lowest free FD rule) -> `exec("./analyzer", ...)` preserves FD table -> `analyzer` reads `data.txt` and `write(1, ...)` writes directly to `report.log`.',
      },
      {
        id: 'c2-q2',
        qNo: 'Q2',
        moduleId: 'm2',
        topicId: 'm2-threads',
        co: 'CO2',
        bloom: 'K4',
        marks: 10,
        title: 'Online Banking Process Lifecycle & Multithreading Model Selection',
        stem: 'Design concurrency and process lifecycle handling for a high-throughput online banking backend.',
        subParts: [
          { id: 'c2-q2a', label: '(a)', prompt: 'Explain process states, scheduling queues, and process operations in the banking server.', maxMarks: 5, rubricCue: '5-state diagram + Ready/Device wait queues + fork/exec/wait context.' },
          { id: 'c2-q2b', label: '(b)', prompt: 'Recommend a multithreading model (One-to-One vs Many-to-Many) contrasting user vs kernel threads.', maxMarks: 5, rubricCue: '1:1 + Thread Pool gives true SMP parallelism and non-blocking I/O isolation.' },
        ],
        workedSolution:
          '**(a)** Incoming banking connections move through New -> Ready -> Running, blocking in Waiting queues on DB/network I/O while other Ready transactions execute.\n\n**(b)** Recommend **One-to-One** (Linux/Windows) backed by a **Thread Pool**: avoids Many-to-One whole-process stalls on blocking DB calls and exploits all physical CPU cores while bounding kernel thread count.',
      },
      {
        id: 'c2-q3',
        qNo: 'Q3',
        moduleId: 'm2',
        topicId: 'm2-preemptive-scheduling',
        co: 'CO2',
        bloom: 'K3',
        marks: 10,
        title: '3D Printer Job Scheduler — FCFS vs Round Robin (q = 10)',
        stem: 'Jobs: `S1(AT=0, BT=25)`, `S2(5, 35)`, `S3(10, 15)`, `S4(15, 45)`.',
        subParts: [
          { id: 'c2-q3a', label: '(a)', prompt: 'Draw Gantt charts for FCFS and Round Robin (`q = 10`).', maxMarks: 4, rubricCue: 'Both 0–120 ms timelines cleanly marked.' },
          { id: 'c2-q3b', label: '(b)', prompt: 'Calculate Average Waiting Time and Average Turnaround Time for both.', maxMarks: 4, rubricCue: 'FCFS: Avg WT=32.5, Avg TAT=62.5; RR: Avg WT=52.5, Avg TAT=82.5.' },
          { id: 'c2-q3c', label: '(c)', prompt: 'State which algorithm is more efficient by Average Waiting Time.', maxMarks: 2, rubricCue: 'FCFS is more efficient by Avg WT (32.5 < 52.5), though RR gives far lower Response Time.' },
        ],
        workedSolution:
          '**FCFS**: `S1[0-25] S2[25-60] S3[60-75] S4[75-120]` -> WTs `(0, 20, 50, 60)` -> **Avg WT = 32.50 ms**, **Avg TAT = 62.50 ms**.\n\n**RR (q=10)**: `S1[0-10] S2[10-20] S3[20-30] S1[30-40] S4[40-50] S2[50-60] S3[60-65] S1[65-70] S4[70-80] S2[80-90] S4[90-100] S2[100-105] S4[105-120]` -> CTs `(70, 105, 65, 120)` -> **Avg WT = 52.50 ms**, **Avg TAT = 82.50 ms**.\n\n**Efficiency**: **FCFS** wins on Average Waiting Time (`32.5 < 52.5`), while RR wins on fairness & response time.',
        labPresetLink: { labTab: 'cpu', note: 'Compare FCFS vs RR(q=10) in Lab 1' },
      },
      {
        id: 'c2-q4',
        qNo: 'Q4',
        moduleId: 'm2',
        topicId: 'm2-deadlock-rag',
        co: 'CO2',
        bloom: 'K3',
        marks: 10,
        title: 'Healthcare Single-Instance Resource Allocation Graph Deadlock',
        stem: 'Single-instance medical resources: `P1 holds R1 req R2`, `P2 holds R2 req R3`, `P3 holds R3 req R1`, `P4 holds None req R2`.',
        subParts: [
          { id: 'c2-q4a', label: '(a)', prompt: 'Draw the RAG, verify all 4 Coffman conditions, and identify the exact deadlocked process set.', maxMarks: 4, rubricCue: 'Cycle P1->R2->P2->R3->P3->R1->P1 => deadlocked set `{P1, P2, P3}` (P4 waits outside cycle).' },
          { id: 'c2-q4b', label: '(b)', prompt: 'Compare 2 deadlock handling strategies and their limitations.', maxMarks: 4, rubricCue: 'Prevention (low utilization) vs Avoidance/Banker’s (needs advance Max claims).' },
          { id: 'c2-q4c', label: '(c)', prompt: 'Outline recovery methods and victim selection criteria.', maxMarks: 2, rubricCue: 'Process termination / resource preemption; priority, elapsed time, rollback cost, starvation bound.' },
        ],
        workedSolution:
          '**(a)** Single-instance cycle `P1 -> R2 -> P2 -> R3 -> P3 -> R1 -> P1` satisfies all 4 Coffman conditions -> **deadlocked set = `{P1, P2, P3}`** (`P4` is blocked waiting on `R2`).\n\n**(b)–(c)** Compare Prevention (break Circular Wait via global lock ordering) vs Avoidance (Banker’s requires a-priori Max). Recover by aborting/preempting lowest-cost victim process.',
        labPresetLink: { labTab: 'bankers', note: 'Inspect C2 Q4 RAG & WFG cycle in Lab 2' },
      },
      {
        id: 'c2-q5',
        qNo: 'Q5',
        moduleId: 'm3',
        topicId: 'm3-critical-section-peterson',
        co: 'CO3',
        bloom: 'K4',
        marks: 10,
        title: "Railway Reservation — Peterson's State Trace (10 Seats -> 6 Seats)",
        stem: 'A shared train coach has 10 available seats; P0 and P1 each attempt to reserve 2 seats inside a Peterson-protected Critical Section.',
        subParts: [
          { id: 'c2-q5a', label: '(a)', prompt: 'Explain how `flag[2]` and `turn` coordinate entry.', maxMarks: 3, rubricCue: 'Intent + turn tie-breaker + code.' },
          { id: 'c2-q5b', label: '(b)', prompt: 'Trace state `flag[0]=true, flag[1]=true, turn=0` to determine who enters CS first.', maxMarks: 4, rubricCue: 'P0 checks `(flag[1] && turn==1)`=false -> P0 enters first; P1 spins until `flag[0]=false`.' },
          { id: 'c2-q5c', label: '(c)', prompt: 'Determine final remaining seat count and verify race-condition freedom.', maxMarks: 3, rubricCue: '10 -> 8 (P0) -> 6 (P1); final seats = 6.' },
        ],
        workedSolution:
          'With `flag[0]=T, flag[1]=T, turn=0`, **P0 enters first** because its spin test `flag[1] && turn == 1` is FALSE (`0 != 1`). P0 updates `seats = 10 - 2 = 8` and exits (`flag[0]=F`). P1 now exits its spin loop, enters CS, updates `seats = 8 - 2 = 6`, and exits. **Final seats = 6** (no lost update!).',
        labPresetLink: { labTab: 'sync', note: 'Run C2 Q5 simultaneous trace in Lab 3' },
      },
      {
        id: 'c2-q6',
        qNo: 'Q6',
        moduleId: 'm3',
        topicId: 'm3-classical-problems',
        co: 'CO3',
        bloom: 'K3',
        marks: 10,
        title: 'Food Ordering Bounded Buffer (Capacity = 5) Using Semaphores',
        stem: 'Chefs (Producers) place completed orders onto a 5-slot counter and Delivery Riders (Consumers) pick them up concurrently.',
        subParts: [
          { id: 'c2-q6a', label: '(a)', prompt: 'State the synchronization conditions that must hold.', maxMarks: 2, rubricCue: 'No overflow (>5), no underflow (<0), mutual exclusion on counter index.' },
          { id: 'c2-q6b', label: '(b)', prompt: 'Define the semaphores and initial values.', maxMarks: 3, rubricCue: '`mutex = 1`, `empty = 5`, `full = 0`.' },
          { id: 'c2-q6c', label: '(c)', prompt: 'Write Producer and Consumer pseudocode and explain wait() ordering.', maxMarks: 5, rubricCue: '`wait(empty)`/`wait(full)` strictly BEFORE `wait(mutex)` to prevent deadlock.' },
        ],
        workedSolution:
          '**Semaphores**: `mutex = 1` (binary), `empty = 5` (counting free slots), `full = 0` (counting ready orders).\n\n**Producer**: `wait(empty); wait(mutex); insert(order); signal(mutex); signal(full);`\n**Consumer**: `wait(full); wait(mutex); remove(order); signal(mutex); signal(empty);`\n\nReversing `wait(mutex)` before `wait(empty)`/`wait(full)` would cause immediate deadlock whenever the counter fills or empties.',
        labPresetLink: { labTab: 'sync', note: 'Simulate Bounded Buffer (capacity 5) in Lab 3' },
      },
      {
        id: 'c2-q7',
        qNo: 'Q7',
        moduleId: 'm4',
        topicId: 'm4-page-replacement',
        co: 'CO4',
        bloom: 'K3',
        marks: 10,
        title: 'Traffic Control Demand Paging — FIFO, OPT & LRU (4 Frames, 20 Refs)',
        stem: 'Reference string: `1, 2, 3, 4, 2, 1, 5, 6, 2, 1, 2, 3, 7, 6, 3, 2, 1, 2, 3, 6` with 4 initially empty frames.',
        subParts: [
          { id: 'c2-q7a', label: '(a)', prompt: 'Trace FIFO and count faults.', maxMarks: 3, rubricCue: 'FIFO = 14 faults (70% fault rate).' },
          { id: 'c2-q7b', label: '(b)', prompt: 'Trace Optimal (OPT) and count faults.', maxMarks: 3, rubricCue: 'OPT = 8 faults (40% fault rate).' },
          { id: 'c2-q7c', label: '(c)', prompt: 'Trace LRU and count faults.', maxMarks: 3, rubricCue: 'LRU = 10 faults (50% fault rate).' },
          { id: 'c2-q7d', label: '(d)', prompt: 'Compare fault rates and hit ratios.', maxMarks: 1, rubricCue: 'OPT 40% < LRU 50% < FIFO 70%.' },
        ],
        workedSolution:
          '**Verified Results (20 refs, 4 frames)**:\n- **FIFO**: **14 faults**, 6 hits (**70%** fault rate)\n- **OPT**: **8 faults**, 12 hits (**40%** fault rate)\n- **LRU**: **10 faults**, 10 hits (**50%** fault rate)',
        labPresetLink: { labTab: 'memory', note: 'Load C2 Q7 preset in Lab 4 (Memory & Paging)' },
      },
      {
        id: 'c2-q8',
        qNo: 'Q8',
        moduleId: 'm4',
        topicId: 'm4-paging-tlb',
        co: 'CO4',
        bloom: 'K5',
        marks: 10,
        title: 'Paging Address Bit Splits & TLB Effective Access Time (80% vs 95%)',
        stem: '64 KB Virtual Address Space, 16 KB Physical RAM, 1 KB Page Size, TLB lookup = 10 ns, RAM access = 100 ns.',
        subParts: [
          { id: 'c2-q8a', label: '(a)', prompt: 'Compute page number bits, offset bits, frame number bits, and physical address bits.', maxMarks: 3, rubricCue: 'p=6, d=10 (16-bit logical); f=4, physical=14 bits.' },
          { id: 'c2-q8b', label: '(b)', prompt: 'Compute EAT at 80% TLB hit ratio.', maxMarks: 3, rubricCue: '0.8(110) + 0.2(210) = 130 ns.' },
          { id: 'c2-q8c', label: '(c)', prompt: 'Compute EAT at 95% TLB hit ratio and percentage improvement.', maxMarks: 2, rubricCue: '0.95(110) + 0.05(210) = 115 ns -> 15 ns (11.54%) faster.' },
          { id: 'c2-q8d', label: '(d)', prompt: 'Justify why a TLB helps even though the Page Table is already in RAM.', maxMarks: 2, rubricCue: 'Eliminates the extra RAM access needed for page-table lookup on every hit (2 RAM accesses -> 1).' },
        ],
        workedSolution:
          '**(a)** `64 KB = 2^16`, `1 KB = 2^10` => **`d = 10`, `p = 6`** (64 pages). `16 KB = 2^14` => **`f = 4`, physical = 14 bits** (16 frames).\n\n**(b)** `EAT(80%) = 0.80(10+100) + 0.20(10+200) = 88 + 42 =` **130 ns**.\n\n**(c)** `EAT(95%) = 0.95(110) + 0.05(210) = 104.5 + 10.5 =` **115 ns** -> **`15 ns` (`11.54%`) faster**.\n\n**(d)** Without TLB, every instruction/data access requires 2 RAM fetches; TLB hits cut that to 1 RAM fetch + 10 ns associative lookup.',
        labPresetLink: { labTab: 'memory', note: 'Verify C2 Q8 TLB EAT in Lab 4' },
      },
      {
        id: 'c2-q9',
        qNo: 'Q9',
        moduleId: 'm5',
        topicId: 'm5-disk-scheduling',
        co: 'CO5',
        bloom: 'K3',
        marks: 10,
        title: 'E-Commerce Disk Scheduling — LOOK, C-LOOK & SSTF (0–499)',
        stem: 'Cylinders `0–499`, current head = `215`, previous request = `250`, pending queue = `82, 170, 43, 140, 310, 465, 125, 230`.',
        subParts: [
          { id: 'c2-q9a', label: '(a)', prompt: 'Sketch and compute total head movement for LOOK and C-LOOK.', maxMarks: 4, rubricCue: 'Direction DOWN (250->215)! LOOK = 594 tracks; C-LOOK = 829 tracks (incl. wrap).' },
          { id: 'c2-q9b', label: '(b)', prompt: 'Sketch and compute total head movement for SSTF.', maxMarks: 3, rubricCue: '215->230->170->140->125->82->43->310->465 = 624 tracks.' },
          { id: 'c2-q9c', label: '(c)', prompt: 'Compare direction inference, movement, and fairness across all three.', maxMarks: 3, rubricCue: 'LOOK wins movement (594) + no starvation; C-LOOK gives uniform wait; SSTF risks starvation.' },
        ],
        workedSolution:
          '**Initial Direction**: `prev 250 -> curr 215` => **DOWNWARD toward 0**.\n- **LOOK**: `215->170->140->125->82->43->230->310->465` = `(215-43) + (465-43) = 172 + 422 =` **594 tracks**.\n- **C-LOOK**: `215->170->140->125->82->43->465->310->230` = `172 + 422 + 235 =` **829 tracks**.\n- **SSTF**: `215->230->170->140->125->82->43->310->465` = `15 + 187 + 422 =` **624 tracks**.\n\nLOOK beats even SSTF here while avoiding SSTF’s starvation risk!',
        labPresetLink: { labTab: 'disk', note: 'Plot C2 Q9 LOOK/C-LOOK/SSTF in Lab 5' },
      },
      {
        id: 'c2-q10',
        qNo: 'Q10',
        moduleId: 'm5',
        topicId: 'm5-virtualization',
        co: 'CO5',
        bloom: 'K2',
        marks: 10,
        title: 'Containers vs Virtual Machines Architecture & Deployment Trade-offs',
        stem: 'Evaluate OS-level containerization against hypervisor-based virtual machines for cloud microservices.',
        subParts: [
          { id: 'c2-q10a', label: '(a)', prompt: 'Explain container architecture (namespaces, cgroups, shared host kernel) and deployment workflow.', maxMarks: 5, rubricCue: 'Layered Docker diagram + namespaces + cgroups + OCI image build/ship/run.' },
          { id: 'c2-q10b', label: '(b)', prompt: 'Compare Containers vs VMs across architecture, resource utilization, portability, performance, and isolation.', maxMarks: 5, rubricCue: '5-dimension comparison table.' },
        ],
        workedSolution:
          '**(a)** Containers package app + runtime libs into immutable OCI images running atop a single Host OS Kernel via **namespaces** (isolation) and **cgroups** (CPU/RAM caps).\n\n**(b)** Containers boot in milliseconds with MB footprint and 10× higher density; VMs boot separate guest OSes via a hypervisor, offering stronger kernel-boundary isolation for untrusted multi-tenant workloads.',
      },
    ],
  },

  // =========================================================================
  // PAPER 4: Parallel Predicted 100M FAT Practice Paper (Nov 25 Consensus)
  // =========================================================================
  {
    id: 'paper-predicted-2026',
    code: 'PREDICTED · 2026',
    title: 'Nov 25 Consensus Practice FAT — Anchors + Overdue Gaps',
    subtitle: '7 × 10M + 2 × 15M = 100M · Synthesizes guaranteed VIT anchors (SRTF, Banker’s, Page Repl) with 0%-tested File Systems & Security gaps',
    setter: 'Empirical Gap + Rotation Model',
    structureLabel: '7×10M + 2×15M = 100M',
    totalMarks: 100,
    durationMinutes: 180,
    isRealSlot: false,
    questions: [
      {
        id: 'pred-q1',
        qNo: 'Q1',
        moduleId: 'm1',
        topicId: 'm1-interrupts-dma',
        co: 'CO1',
        bloom: 'K3',
        marks: 10,
        title: 'Interrupt Processing Cycle & DMA vs Interrupt-Driven I/O',
        stem: 'High-speed NVMe storage transfers overwhelm CPU cores if handled byte-by-byte.',
        subParts: [
          { id: 'pred-q1a', label: '(a)', prompt: 'Trace the hardware interrupt cycle via IVT/ISR and contrast asynchronous interrupts vs synchronous traps.', maxMarks: 5, rubricCue: 'Save PC/PSW -> Kernel mode -> IVT lookup -> ISR -> IRET.' },
          { id: 'pred-q1b', label: '(b)', prompt: 'Explain DMA cycle stealing and compare interrupts generated for a 4 KB transfer under Byte I/O vs DMA.', maxMarks: 5, rubricCue: '4096 interrupts vs 1 single block completion interrupt.' },
        ],
        workedSolution:
          'CPU initializes DMA address, byte count, and mode, then runs other processes. DMA steals memory bus cycles to write all 4096 bytes straight into RAM and fires **1 interrupt** upon completion (vs 4096 interrupts in byte-level I/O).',
      },
      {
        id: 'pred-q2',
        qNo: 'Q2',
        moduleId: 'm2',
        topicId: 'm2-process-operations',
        co: 'CO2',
        bloom: 'K3',
        marks: 10,
        title: 'POSIX fork() Tree, Zombie/Orphan Processes & Amdahl’s Law',
        stem: 'Analyze Unix process creation and multicore thread scalability.',
        subParts: [
          { id: 'pred-q2a', label: '(a)', prompt: 'Trace total processes from `fork(); if (fork() == 0) fork();` and distinguish Zombie vs Orphan processes.', maxMarks: 6, rubricCue: '6 total processes (5 new children) + wait() reaping vs PID 1 adoption.' },
          { id: 'pred-q2b', label: '(b)', prompt: 'Compute Amdahl’s Law max speedup on 4 cores and ∞ cores for a 25% serial workload.', maxMarks: 4, rubricCue: '4 cores = 2.29×; ∞ cores = 4.00×.' },
        ],
        workedSolution:
          '**(a)** 1 -> 2 -> 4 (2 children enter `if`) -> **6 total processes** (5 children). Zombie = dead child un-reaped by parent; Orphan = living child adopted by `init`/`systemd` (PID 1).\n\n**(b)** `N=4`: `1/(0.25 + 0.75/4) = 2.29×`; `N->∞`: `1/0.25 = 4.00×`.',
      },
      {
        id: 'pred-q3',
        qNo: 'Q3',
        moduleId: 'm3',
        topicId: 'm3-hardware-sync',
        co: 'CO3',
        bloom: 'K3',
        marks: 10,
        title: 'Hardware Synchronization: Compare-and-Swap with Bounded Waiting',
        stem: 'Modern SMP kernels rely on hardware atomic instructions for spinlocks.',
        subParts: [
          { id: 'pred-q3a', label: '(a)', prompt: 'Explain atomic `compare_and_swap()` and why basic CAS spinlocks violate Bounded Waiting.', maxMarks: 4, rubricCue: 'Returns original value; losing thread can starve indefinitely.' },
          { id: 'pred-q3b', label: '(b)', prompt: 'Write the `waiting[n]` Bounded-Waiting CAS protocol and prove at most `n - 1` wait turns.', maxMarks: 6, rubricCue: 'Cyclic `(i+1)%n` scan hands `waiting[j]=false` while keeping `lock=1`.' },
        ],
        workedSolution:
          'On exit, `Pi` scans `j = (i+1)%n` cyclically for the first `waiting[j] == true`. If found, it sets `waiting[j] = false` (keeping `lock = 1`) so `Pj` enters directly; if none found (`j == i`), sets `lock = 0`. Every waiting process enters within `<= n - 1` turns.',
      },
      {
        id: 'pred-q4',
        qNo: 'Q4',
        moduleId: 'm3',
        topicId: 'm3-classical-problems',
        co: 'CO3',
        bloom: 'K3',
        marks: 10,
        title: 'Dining Philosophers Deadlock & First Readers-Writers Starvation',
        stem: 'Resolve concurrency liveness hazards in classical synchronization benchmarks.',
        subParts: [
          { id: 'pred-q4a', label: '(a)', prompt: 'Show how naive Dining Philosophers deadlocks and give 3 deadlock-free solutions including asymmetric ordering.', maxMarks: 5, rubricCue: 'Circular wait of 5 left chopsticks -> max-4, Monitor both-or-none, odd/even asymmetric.' },
          { id: 'pred-q4b', label: '(b)', prompt: 'Write First Readers-Writers semaphore code and explain why writers can starve.', maxMarks: 5, rubricCue: '`read_count` + `rw_mutex`; continuous overlapping readers keep `read_count > 0` forever.' },
        ],
        workedSolution:
          'Asymmetric Dining Philosophers (odd picks `i` then `(i+1)%5`; even picks `(i+1)%5` then `i`) breaks Circular Wait directly. In First Readers-Writers, `if (read_count == 1) wait(rw_mutex)` blocks writers until the *last* reader exits -> writer starvation.',
      },
      {
        id: 'pred-q5',
        qNo: 'Q5',
        moduleId: 'm4',
        topicId: 'm4-file-allocation',
        co: 'CO4',
        bloom: 'K3',
        marks: 10,
        title: 'File Allocation Strategies & Unix Inode Max File Size (Overdue Gap)',
        stem: 'A Unix filesystem uses 4 KB disk blocks, 4-byte block pointers, 12 direct pointers, 1 single-indirect, 1 double-indirect, and 1 triple-indirect pointer.',
        subParts: [
          { id: 'pred-q5a', label: '(a)', prompt: 'Compare Contiguous, Linked/FAT, and Indexed file allocation with diagrams.', maxMarks: 5, rubricCue: 'Random access, external fragmentation, growth, reliability.' },
          { id: 'pred-q5b', label: '(b)', prompt: 'Compute pointers per indirect block `P` and exact maximum file size.', maxMarks: 5, rubricCue: 'P = 4096/4 = 1024; Max = (12 + 2^10 + 2^20 + 2^30) * 4 KB ≈ 4.004 TB.' },
        ],
        workedSolution:
          '`P = 4096 / 4 = 1024 = 2^10`. Direct = `12 * 4 KB = 48 KB`; Single = `2^10 * 4 KB = 4 MB`; Double = `2^20 * 4 KB = 4 GB`; Triple = `2^30 * 4 KB = 4 TB`. Total ≈ **4.004 TB**.',
      },
      {
        id: 'pred-q6',
        qNo: 'Q6',
        moduleId: 'm5',
        topicId: 'm5-security-crypto',
        co: 'CO5',
        bloom: 'K3',
        marks: 10,
        title: 'Buffer Overflow Mitigations & RSA Digital Signatures (Overdue Gap)',
        stem: 'Protect an internet-facing Linux server against memory corruption and message tampering.',
        subParts: [
          { id: 'pred-q6a', label: '(a)', prompt: 'Diagram a stack buffer overflow overwriting the return address and explain ASLR, DEP/NX, and Stack Canaries.', maxMarks: 5, rubricCue: 'Stack frame sketch + all 3 mitigations.' },
          { id: 'pred-q6b', label: '(b)', prompt: 'Contrast Symmetric (AES) vs Asymmetric (RSA) crypto and trace Digital Signature creation & verification.', maxMarks: 5, rubricCue: 'Sign `H(M)` with Sender PRIVATE key; verify with Sender PUBLIC key.' },
        ],
        workedSolution:
          'Stack Canaries detect overwrite before `ret`; DEP/NX blocks executing stack bytes; ASLR randomizes memory layout. Digital signature: Sender computes `S = Encrypt_SenderPriv(SHA256(M))`; Receiver checks `Decrypt_SenderPub(S) == SHA256(M)`.',
      },
      {
        id: 'pred-q7',
        qNo: 'Q7',
        moduleId: 'm5',
        topicId: 'm5-protection-matrix',
        co: 'CO5',
        bloom: 'K3',
        marks: 10,
        title: 'Protection Access Matrix: ACL vs Capability List vs Lock-Key (Overdue Gap)',
        stem: 'Model fine-grained file and domain access control in a multi-tenant OS.',
        subParts: [
          { id: 'pred-q7a', label: '(a)', prompt: 'Explain the Access Matrix with `copy(*)`, `owner`, `control`, and `switch` rights.', maxMarks: 5, rubricCue: 'Matrix sketch + exact semantics of all 4 meta-rights.' },
          { id: 'pred-q7b', label: '(b)', prompt: 'Compare Global Table, ACL, Capability List, and Lock-Key on storage orientation and revocation cost.', maxMarks: 5, rubricCue: 'ACL=column (easy revoke); Capability=row (hard revoke); Lock-Key hybrid.' },
        ],
        workedSolution:
          'ACLs slice the Access Matrix column-wise (stored per object -> instant revocation). Capabilities slice row-wise (stored per domain -> fast O(1) ticket verification, hard global revocation). Lock-Key matches domain keys against changeable object locks.',
      },
      {
        id: 'pred-q8',
        qNo: 'Q8',
        moduleId: 'm2',
        topicId: 'm2-preemptive-scheduling',
        co: 'CO2',
        bloom: 'K4',
        marks: 15,
        title: "15M Anchor: SRTF Benchmark + Silberschatz Ch 8 Banker's Safety & Request",
        stem: 'Part I: SRTF on `P1(0,8), P2(1,4), P3(2,9), P4(3,5)`. Part II: Classic Banker’s 5 processes `Total=(10,5,7)`, Alloc `P0(0,1,0), P1(2,0,0), P2(3,0,2), P3(2,1,1), P4(0,0,2)`, Max `P0(7,5,3), P1(3,2,2), P2(9,0,2), P3(2,2,2), P4(4,3,3)`.',
        subParts: [
          { id: 'pred-q8a', label: '(a)', prompt: 'Construct SRTF Gantt chart and compute exact Average Waiting Time.', maxMarks: 7, rubricCue: 'P1[0-1] P2[1-5] P4[5-10] P1[10-17] P3[17-26]; Avg WT = (9+0+15+2)/4 = 6.50 ms.' },
          { id: 'pred-q8b', label: '(b)', prompt: 'Find Available, Need, Safe Sequence, and evaluate `Request1 = (1, 0, 2)`.', maxMarks: 8, rubricCue: 'Avail=(3,3,2), Safe `<P1,P3,P4,P0,P2>`; Request1 GRANTED safely with `<P1,P3,P4,P0,P2>`!' },
        ],
        workedSolution:
          '**(a) SRTF**: `P1[0-1] P2[1-5] P4[5-10] P1[10-17] P3[17-26]` -> WTs: `P1=9, P2=0, P3=15, P4=2` -> **Avg WT = 6.50 ms**.\n\n**(b) Banker’s**: `Available = (3,3,2)`. Safe sequence `<P1, P3, P4, P0, P2>`. `Request1 = (1,0,2)` leaves `Available = (2,3,0)` which remains **SAFE** (`<P1, P3, P4, P0, P2>`) -> **GRANTED**.',
        labPresetLink: { labTab: 'bankers', note: 'Verify Silberschatz Ch 8 Banker’s in Lab 2' },
      },
      {
        id: 'pred-q9',
        qNo: 'Q9',
        moduleId: 'm4',
        topicId: 'm4-page-replacement',
        co: 'CO4',
        bloom: 'K3',
        marks: 15,
        title: "15M Anchor: Belady's Anomaly + Demand Paging EAT & Disk C-SCAN",
        stem: 'Part I: Prove Belady’s anomaly using FIFO on `1,2,3,4,1,2,5,1,2,3,4,5` (3 vs 4 frames). Part II: `ma = 100 ns`, page fault = `8 ms`, `p = 0.00001`. Part III: Disk `0–199`, head `53` moving down, queue `98,183,37,122,14,124,65,67` under SCAN.',
        subParts: [
          { id: 'pred-q9a', label: '(a)', prompt: 'Trace 3-frame vs 4-frame FIFO to prove Belady’s Anomaly and explain why LRU is immune.', maxMarks: 6, rubricCue: '3 frames = 9 faults < 4 frames = 10 faults; LRU stack inclusion property.' },
          { id: 'pred-q9b', label: '(b)', prompt: 'Compute Demand Paging EAT in nanoseconds.', maxMarks: 4, rubricCue: '8 ms = 8,000,000 ns -> EAT = 0.99999(100) + 0.00001(8,000,000) ≈ 180 ns.' },
          { id: 'pred-q9c', label: '(c)', prompt: 'Compute SCAN (downward toward 0) sequence and total head movement.', maxMarks: 5, rubricCue: '53->37->14->0->65->67->98->122->124->183 = 53 + 183 = 236 tracks.' },
        ],
        workedSolution:
          '**(a)** FIFO gives **9 faults** (3 frames) vs **10 faults** (4 frames) — classic Belady’s Anomaly! LRU satisfies Stack Inclusion so faults never increase with more frames.\n\n**(b)** `EAT = 0.99999(100) + 10^-5(8,000,000) = 99.999 + 80 =` **180 ns**.\n\n**(c)** SCAN Down: `53 -> 37 -> 14 -> 0 -> 65 -> 67 -> 98 -> 122 -> 124 -> 183` = `53 + 183 =` **236 cylinders**.',
        labPresetLink: { labTab: 'memory', note: 'Verify Belady’s Anomaly in Lab 4 & Silberschatz Disk in Lab 5' },
      },
    ],
  },
];

/**
 * Forensic question map extracted verbatim from the 3 real VIT Chennai FAT papers
 * (powers View 5 Coverage Matrix + Alpha/Beta/Gamma models AND View 7 Forensics).
 */
export const SLOT_FORENSIC_ITEMS: SlotAppearanceItem[] = [
  // Slot C1+TC1 Set 2-2 (8 Questions = 100M)
  { slotId: 'c1-2-2', slotLabel: 'C1 Set 2-2', questionNumber: 'Q1', marks: 10, moduleId: 'm1', topicId: 'm1-os-structures', topicTitle: 'OS Structures: Monolithic vs Microkernel', bloom: 'K2', archetype: 'Architecture Diagrams + Trade-offs' },
  { slotId: 'c1-2-2', slotLabel: 'C1 Set 2-2', questionNumber: 'Q2', marks: 10, moduleId: 'm3', topicId: 'm3-classical-problems', topicTitle: 'Classical Sync: Sleeping Barber Semaphores', bloom: 'K3', archetype: 'Semaphore Pseudocode + Proof' },
  { slotId: 'c1-2-2', slotLabel: 'C1 Set 2-2', questionNumber: 'Q3', marks: 10, moduleId: 'm4', topicId: 'm4-thrashing-ws', topicTitle: 'Thrashing Cause, Curve & Remedies', bloom: 'K2', archetype: 'Curve + Prevention Techniques' },
  { slotId: 'c1-2-2', slotLabel: 'C1 Set 2-2', questionNumber: 'Q4', marks: 10, moduleId: 'm5', topicId: 'm5-virtualization', topicTitle: 'Full vs Para-Virt vs Docker Containers', bloom: 'K2', archetype: 'Layered Stack Diagrams + Table' },
  { slotId: 'c1-2-2', slotLabel: 'C1 Set 2-2', questionNumber: 'Q5', marks: 15, moduleId: 'm2', topicId: 'm2-preemptive-scheduling', topicTitle: 'Preemptive Priority + 1 ms CS Overhead', bloom: 'K3', archetype: '15M Gantt + CT/TAT/WT/RT' },
  { slotId: 'c1-2-2', slotLabel: 'C1 Set 2-2', questionNumber: 'Q6', marks: 15, moduleId: 'm4', topicId: 'm4-page-replacement', topicTitle: 'Page Replacement FIFO/LRU/OPT (25 refs)', bloom: 'K3', archetype: '15M Frame Matrix Comparison' },
  { slotId: 'c1-2-2', slotLabel: 'C1 Set 2-2', questionNumber: 'Q7', marks: 15, moduleId: 'm2', topicId: 'm2-deadlock-handling', topicTitle: "Banker's Algorithm (6×4) + Request2 Denial", bloom: 'K4', archetype: '15M Safety + Request Trap' },
  { slotId: 'c1-2-2', slotLabel: 'C1 Set 2-2', questionNumber: 'Q8', marks: 15, moduleId: 'm4', topicId: 'm4-contiguous-allocation', topicTitle: 'Contiguous Placement (FF/BF/NF/WF)', bloom: 'K3', archetype: '15M Placement + External Frag' },

  // Slot C1 Set 1-2 (9 Questions = 100M)
  { slotId: 'c1-1-2', slotLabel: 'C1 Set 1-2', questionNumber: 'Q1', marks: 10, moduleId: 'm1', topicId: 'm1-design-booting', topicTitle: 'Linux Boot Sequence & Time-Sharing', bloom: 'K4', archetype: 'Failure Diagnosis + Comparison' },
  { slotId: 'c1-1-2', slotLabel: 'C1 Set 1-2', questionNumber: 'Q2', marks: 10, moduleId: 'm2', topicId: 'm2-nonpreemptive-scheduling', topicTitle: 'Non-Preemptive Priority vs FCFS + Aging', bloom: 'K3', archetype: 'Gantt + Starvation Analysis' },
  { slotId: 'c1-1-2', slotLabel: 'C1 Set 1-2', questionNumber: 'Q3', marks: 10, moduleId: 'm3', topicId: 'm3-critical-section-peterson', topicTitle: "Peterson's Contradiction Proof & Trace", bloom: 'K3', archetype: 'Formal Proof + Execution Trace' },
  { slotId: 'c1-1-2', slotLabel: 'C1 Set 1-2', questionNumber: 'Q4', marks: 10, moduleId: 'm3', topicId: 'm3-monitors', topicTitle: 'Hospital 3-Theatre Priority Monitor', bloom: 'K4', archetype: 'Custom Monitor Design + Starvation' },
  { slotId: 'c1-1-2', slotLabel: 'C1 Set 1-2', questionNumber: 'Q5', marks: 10, moduleId: 'm4', topicId: 'm4-paging-tlb', topicTitle: 'Segmentation Translation & Fragmentation', bloom: 'K3', archetype: 'Base/Limit TRAP + Frag Fix' },
  { slotId: 'c1-1-2', slotLabel: 'C1 Set 1-2', questionNumber: 'Q6', marks: 10, moduleId: 'm4', topicId: 'm4-thrashing-ws', topicTitle: 'Working-Set Model (Δ=5) & Swap-Out', bloom: 'K4', archetype: 'WSS Trace + D>m Decision' },
  { slotId: 'c1-1-2', slotLabel: 'C1 Set 1-2', questionNumber: 'Q7', marks: 10, moduleId: 'm5', topicId: 'm5-raid', topicTitle: 'RAID 6 vs RAID 0 Scenario Selection', bloom: 'K3', archetype: 'Scenario Selection + Parity Proof' },
  { slotId: 'c1-1-2', slotLabel: 'C1 Set 1-2', questionNumber: 'Q8', marks: 15, moduleId: 'm2', topicId: 'm2-deadlock-handling', topicTitle: "Banker's Algorithm (4×3) + RAG/WFG", bloom: 'K3', archetype: '15M Safety + Graph Theory' },
  { slotId: 'c1-1-2', slotLabel: 'C1 Set 1-2', questionNumber: 'Q9', marks: 15, moduleId: 'm5', topicId: 'm5-disk-scheduling', topicTitle: 'Disk Geometry + SSTF & SCAN (6000 RPM)', bloom: 'K3', archetype: '15M Seek Trace + Starvation' },

  // Slot C2+TC2 (10 Questions = 100M)
  { slotId: 'c2', slotLabel: 'C2+TC2', questionNumber: 'Q1', marks: 10, moduleId: 'm1', topicId: 'm1-syscalls-services', topicTitle: 'Microkernel + Shell FD Redirection Syscalls', bloom: 'K3', archetype: 'Architecture + POSIX FD Trace' },
  { slotId: 'c2', slotLabel: 'C2+TC2', questionNumber: 'Q2', marks: 10, moduleId: 'm2', topicId: 'm2-threads', topicTitle: 'Process States + Multithreading Models', bloom: 'K4', archetype: 'Banking Server Lifecycle + 1:1' },
  { slotId: 'c2', slotLabel: 'C2+TC2', questionNumber: 'Q3', marks: 10, moduleId: 'm2', topicId: 'm2-preemptive-scheduling', topicTitle: '3D Printer FCFS vs Round Robin (q=10)', bloom: 'K3', archetype: 'Dual Gantt + Avg WT Comparison' },
  { slotId: 'c2', slotLabel: 'C2+TC2', questionNumber: 'Q4', marks: 10, moduleId: 'm2', topicId: 'm2-deadlock-rag', topicTitle: 'Healthcare Single-Instance RAG Deadlock', bloom: 'K3', archetype: 'RAG Cycle + Coffman + Recovery' },
  { slotId: 'c2', slotLabel: 'C2+TC2', questionNumber: 'Q5', marks: 10, moduleId: 'm3', topicId: 'm3-critical-section-peterson', topicTitle: "Railway Peterson's Trace (10 -> 6 Seats)", bloom: 'K4', archetype: 'State Trace + Seat Consistency' },
  { slotId: 'c2', slotLabel: 'C2+TC2', questionNumber: 'Q6', marks: 10, moduleId: 'm3', topicId: 'm3-classical-problems', topicTitle: 'Food Ordering Bounded Buffer (Capacity 5)', bloom: 'K3', archetype: 'Semaphore Init + Pseudocode' },
  { slotId: 'c2', slotLabel: 'C2+TC2', questionNumber: 'Q7', marks: 10, moduleId: 'm4', topicId: 'm4-page-replacement', topicTitle: 'Page Replacement FIFO/OPT/LRU (20 refs)', bloom: 'K3', archetype: 'Frame Matrix + Fault Rate' },
  { slotId: 'c2', slotLabel: 'C2+TC2', questionNumber: 'Q8', marks: 10, moduleId: 'm4', topicId: 'm4-paging-tlb', topicTitle: 'Paging Bit Splits & TLB EAT (80% vs 95%)', bloom: 'K5', archetype: 'Bit Math + Speedup Evaluation' },
  { slotId: 'c2', slotLabel: 'C2+TC2', questionNumber: 'Q9', marks: 10, moduleId: 'm5', topicId: 'm5-disk-scheduling', topicTitle: 'Disk LOOK, C-LOOK & SSTF (Head 215 ← 250)', bloom: 'K3', archetype: 'Direction Trap + Movement Compare' },
  { slotId: 'c2', slotLabel: 'C2+TC2', questionNumber: 'Q10', marks: 10, moduleId: 'm5', topicId: 'm5-virtualization', topicTitle: 'Containers vs VMs Architecture & Comparison', bloom: 'K2', archetype: 'Docker Namespaces/cgroups + Table' },
];
