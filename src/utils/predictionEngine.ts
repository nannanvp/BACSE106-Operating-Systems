export interface SlotAppearanceItem {
  slotId: string; // e.g. 'c1-2-2', 'c1-1-2', 'c2'
  slotLabel: string;
  questionNumber: string;
  marks: number;
  moduleId: string;
  topicId: string;
  topicTitle: string;
  bloom: 'K2' | 'K3' | 'K4' | 'K5';
  archetype: string;
}

export interface CoverageMatrixRow {
  moduleId: string;
  moduleCode: string;
  topicId: string;
  topicTitle: string;
  appearances: Record<string, { questionNumber: string; marks: number } | undefined>;
  totalAppearances: number;
  totalMarksAcrossSlots: number;
  status: 'untested-gap' | 'single-slot' | 'recurring-anchor';
}

export interface PredictedQuestionItem {
  qNo: string;
  moduleId: string;
  moduleCode: string;
  topicId: string;
  marks: number;
  bloom: 'K2' | 'K3' | 'K4' | 'K5';
  title: string;
  prompt: string;
  rationale: string;
  linkedPaperId?: string;
}

export interface PredictionModelResult {
  matrix: CoverageMatrixRow[];
  untestedTopicsCount: number;
  recurringAnchorsCount: number;
  alphaGapPaper: {
    name: string;
    subtitle: string;
    totalMarks: number;
    questions: PredictedQuestionItem[];
  };
  betaRotationPaper: {
    name: string;
    subtitle: string;
    totalMarks: number;
    questions: PredictedQuestionItem[];
  };
  gammaConsensusPaper: {
    name: string;
    subtitle: string;
    totalMarks: number;
    questions: PredictedQuestionItem[];
  };
}

export function buildCoverageMatrix(
  syllabusTopics: Array<{ moduleId: string; moduleCode: string; topicId: string; topicTitle: string }>,
  slotItems: SlotAppearanceItem[]
): CoverageMatrixRow[] {
  return syllabusTopics.map((topic) => {
    const matches = slotItems.filter((item) => item.topicId === topic.topicId);
    const appearances: Record<string, { questionNumber: string; marks: number } | undefined> = {};
    let totalMarksAcrossSlots = 0;

    for (const m of matches) {
      appearances[m.slotId] = { questionNumber: m.questionNumber, marks: m.marks };
      totalMarksAcrossSlots += m.marks;
    }

    const totalAppearances = Object.keys(appearances).length;
    const status: CoverageMatrixRow['status'] =
      totalAppearances === 0
        ? 'untested-gap'
        : totalAppearances === 1
          ? 'single-slot'
          : 'recurring-anchor';

    return {
      moduleId: topic.moduleId,
      moduleCode: topic.moduleCode,
      topicId: topic.topicId,
      topicTitle: topic.topicTitle,
      appearances,
      totalAppearances,
      totalMarksAcrossSlots,
      status,
    };
  });
}

export function buildPredictionModels(
  syllabusTopics: Array<{ moduleId: string; moduleCode: string; topicId: string; topicTitle: string }>,
  slotItems: SlotAppearanceItem[]
): PredictionModelResult {
  const matrix = buildCoverageMatrix(syllabusTopics, slotItems);
  const untestedTopicsCount = matrix.filter((r) => r.status === 'untested-gap').length;
  const recurringAnchorsCount = matrix.filter((r) => r.status === 'recurring-anchor').length;

  // Alpha Model: Untested Gap Focus (100M exact sum: 10 x 10M)
  const alphaQuestions: PredictedQuestionItem[] = [
    {
      qNo: 'Q1',
      moduleId: 'm1',
      moduleCode: 'M1',
      topicId: 'm1-interrupts-dma',
      marks: 10,
      bloom: 'K3',
      title: 'Interrupt Processing Cycle & DMA Transfer Architecture',
      prompt:
        '(a) Trace step-by-step how a hardware interrupt invokes the Interrupt Vector Table and ISR with CPU context preservation (5M). (b) Contrast Programmed I/O vs Interrupt-Driven I/O vs DMA for high-speed NVMe disk transfers (5M).',
      rationale: '0 appearances across C1 Set 2-2, C1 Set 1-2, and C2 despite explicit M1 syllabus hours.',
    },
    {
      qNo: 'Q2',
      moduleId: 'm2',
      moduleCode: 'M2',
      topicId: 'm2-preemptive-scheduling',
      marks: 10,
      bloom: 'K3',
      title: 'SRTF & Multilevel Feedback Queue (MLFQ) Design',
      prompt:
        '(a) Compute Gantt chart, CT, TAT, WT for SRTF on 5 arriving jobs and prove why SRTF minimizes average waiting time (6M). (b) Explain the 5 MLFQ parameters that prevent starvation via aging (4M).',
      rationale: 'C1 tested Priority (preemptive/NP) and C2 tested FCFS/RR — SRTF & MLFQ are the exact unasked schedulers.',
    },
    {
      qNo: 'Q3',
      moduleId: 'm2',
      moduleCode: 'M2',
      topicId: 'm2-process-operations',
      marks: 10,
      bloom: 'K3',
      title: 'POSIX fork()/exec()/wait() Process Tree, Orphan & Zombie States',
      prompt:
        '(a) Trace total child processes created by a nested fork() snippet and sketch the process tree (5M). (b) Differentiate Orphan vs Zombie processes and how init/systemd and wait() reap them (5M).',
      rationale: 'Core M2 syllabus & lab experiment topic with 0 full questions in C1/C2.',
    },
    {
      qNo: 'Q4',
      moduleId: 'm3',
      moduleCode: 'M3',
      topicId: 'm3-hardware-sync',
      marks: 10,
      bloom: 'K3',
      title: 'Hardware Synchronization: Test-and-Set & Bounded-Waiting CAS',
      prompt:
        '(a) Write atomic test_and_set() and compare_and_swap() lock algorithms and explain why basic CAS violates bounded waiting (5M). (b) Write the waiting[n] bounded-waiting CAS algorithm and prove all 3 CS criteria (5M).',
      rationale: 'C1/C2 heavily asked Peterson’s, Sleeping Barber, Bounded Buffer, and Monitors — Hardware Sync & Bakery are untouched.',
    },
    {
      qNo: 'Q5',
      moduleId: 'm3',
      moduleCode: 'M3',
      topicId: 'm3-classical-problems',
      marks: 10,
      bloom: 'K3',
      title: 'Readers-Writers & Dining Philosophers (Deadlock Prevention)',
      prompt:
        '(a) Write First Readers-Writers semaphore solution and explain writer starvation (5M). (b) Show how Dining Philosophers deadlocks and give 3 deadlock-free fixes including asymmetric ordering (5M).',
      rationale: 'Both classic Silberschatz Ch 7 problems were skipped in favor of Sleeping Barber (C1 2-2) and Bounded Buffer (C2).',
    },
    {
      qNo: 'Q6',
      moduleId: 'm4',
      moduleCode: 'M4',
      topicId: 'm4-file-directories',
      marks: 10,
      bloom: 'K2',
      title: 'Directory Structures (Tree, DAG, General Graph) & Hard vs Soft Links',
      prompt:
        '(a) Compare Single-Level, Two-Level, Tree, Acyclic-Graph (DAG), and General Graph directories with diagrams (6M). (b) Explain dangling pointer and cycle-detection issues using reference counts vs garbage collection (4M).',
      rationale: 'CRITICAL GAP: 0 File System questions appeared across all 3 real papers (C1 2-2, C1 1-2, C2)!',
    },
    {
      qNo: 'Q7',
      moduleId: 'm4',
      moduleCode: 'M4',
      topicId: 'm4-file-allocation',
      marks: 10,
      bloom: 'K3',
      title: 'File Allocation (Contiguous, Linked/FAT, Unix Inode Calculation)',
      prompt:
        '(a) Compare Contiguous, Linked (FAT), and Indexed allocation on random access, fragmentation, and reliability (5M). (b) Given 4 KB blocks, 4-byte pointers, 12 direct + 1 single + 1 double + 1 triple indirect pointers, compute max file size (5M).',
      rationale: 'Highest-probability M4 gap topic for upcoming slots (0 appearances so far).',
    },
    {
      qNo: 'Q8',
      moduleId: 'm4',
      moduleCode: 'M4',
      topicId: 'm4-paging-tlb',
      marks: 10,
      bloom: 'K4',
      title: 'Multi-Level, Hashed & Inverted Page Tables + Demand Paging EAT',
      prompt:
        '(a) Calculate page table size for 32-bit/64-bit VAS and explain why Hierarchical, Hashed, and Inverted page tables solve memory bloat (5M). (b) Given ma=100ns, page fault service=8ms, compute max fault rate p for <10% degradation (5M).',
      rationale: 'C2 Q8 tested TLB EAT only; page-table architectures & demand-paging fault EAT remain unasked.',
    },
    {
      qNo: 'Q9',
      moduleId: 'm5',
      moduleCode: 'M5',
      topicId: 'm5-security-crypto',
      marks: 10,
      bloom: 'K3',
      title: 'Program/Network Threats (Buffer Overflow) & Cryptography (AES/RSA/Signatures)',
      prompt:
        '(a) Diagram a stack-based buffer overflow exploit and 3 OS mitigations (ASLR, DEP/NX, Stack Canaries) (5M). (b) Contrast Symmetric vs Asymmetric cryptography and explain how Hash + RSA achieves digital signatures (5M).',
      rationale: 'CRITICAL GAP: 0 Security/Cryptography questions appeared in C1 Set 2-2, C1 Set 1-2, or C2!',
    },
    {
      qNo: 'Q10',
      moduleId: 'm5',
      moduleCode: 'M5',
      topicId: 'm5-protection-matrix',
      marks: 10,
      bloom: 'K3',
      title: 'Protection Domains, Access Matrix, ACL vs Capability Lists & Lock-Key',
      prompt:
        '(a) Construct a Protection Domain Access Matrix with copy (*), owner, and switch rights for a hospital system (5M). (b) Compare Global Table, Access Control Lists (ACL), Capability Lists, and Lock-Key on revocation cost (5M).',
      rationale: 'CRITICAL GAP: 0 Protection/Access Matrix questions appeared across all 3 real papers!',
    },
  ];

  // Beta Model: Recurring Anchor Rotation (100M exact sum: 4x10M + 4x15M like C1 2-2)
  const betaQuestions: PredictedQuestionItem[] = [
    {
      qNo: 'Q1',
      moduleId: 'm1',
      moduleCode: 'M1',
      topicId: 'm1-os-structures',
      marks: 10,
      bloom: 'K2',
      title: 'Hybrid, Modular (LKM) & Layered Kernel Architectures vs Microkernel',
      prompt:
        'Rotate from C1 2-2 Q1 (Monolithic vs Microkernel): diagram Loadable Kernel Modules (Linux) and Hybrid OS (macOS/Windows) and evaluate IPC overhead vs modularity.',
      rationale: 'OS Structure appeared in 2 of 3 papers (C1 2-2 Q1, C2 Q1a) — strong rotation to Modular/Hybrid.',
    },
    {
      qNo: 'Q2',
      moduleId: 'm3',
      moduleCode: 'M3',
      topicId: 'm3-monitors',
      marks: 10,
      bloom: 'K4',
      title: 'Priority Monitor Design (Hoare vs Mesa Condition Variables)',
      prompt:
        'Rotate from C1 1-2 Q4 (Hospital Monitor): design a Priority Reader-Writer or Bridge-Crossing Monitor using condition variables (`wait`/`signal`), preventing starvation and contrasting Hoare vs Mesa semantics.',
      rationale: 'Scenario-driven Monitor/Semaphore design appeared in all 3 papers.',
    },
    {
      qNo: 'Q3',
      moduleId: 'm4',
      moduleCode: 'M4',
      topicId: 'm4-thrashing-ws',
      marks: 10,
      bloom: 'K4',
      title: 'Thrashing Curve, Page-Fault Frequency (PFF) & Working-Set Window',
      prompt:
        'Rotate from C1 2-2 Q3 & C1 1-2 Q6: plot CPU utilization vs degree of multiprogramming, evaluate WSS(Δ=4) on a 15-reference trace, and derive swap-out decisions when ΣWSS > frames.',
      rationale: 'Thrashing / Working-Set appeared in BOTH C1 Set 2-2 (Q3) and C1 Set 1-2 (Q6).',
    },
    {
      qNo: 'Q4',
      moduleId: 'm5',
      moduleCode: 'M5',
      topicId: 'm5-virtualization',
      marks: 10,
      bloom: 'K2',
      title: 'Type-1/Type-2 Hypervisors, Trap-and-Emulate, VT-x & Docker Namespaces/cgroups',
      prompt:
        'Rotate from C1 2-2 Q4 & C2 Q10: explain Popek-Goldberg sensitive non-privileged instructions, Binary Translation vs Intel VT-x, and how Linux namespaces + cgroups isolate Docker containers.',
      rationale: 'Virtualization / Containers appeared in 2 of 3 papers (C1 2-2 Q4, C2 Q10).',
    },
    {
      qNo: 'Q5',
      moduleId: 'm2',
      moduleCode: 'M2',
      topicId: 'm2-preemptive-scheduling',
      marks: 15,
      bloom: 'K3',
      title: 'Round Robin (q=4) vs SRTF with 1 ms Context-Switch Overhead',
      prompt:
        'Rotate from C1 2-2 Q5 (15M Preemptive Priority + CS) & C2 Q3 (RR): compute full Gantt chart, CT, TAT, WT, RT, and CPU utilization for 6 arriving processes under SRTF vs RR(q=4).',
      rationale: 'CPU Scheduling numerical appeared in 100% (3/3) of past papers.',
    },
    {
      qNo: 'Q6',
      moduleId: 'm2',
      moduleCode: 'M2',
      topicId: 'm2-deadlock-handling',
      marks: 15,
      bloom: 'K4',
      title: "Banker's Algorithm (5×4 Matrix) + Two Consecutive Resource Requests + RAG",
      prompt:
        'Rotate from C1 2-2 Q7 (15M) & C1 1-2 Q8 (15M): calculate Need & Available, prove safe sequence, test Request A (safe) and Request B (unsafe/exceeds available), and justify multi-instance RAG cycle non-sufficiency.',
      rationale: "Deadlocks (Banker's or RAG) appeared in 100% (3/3) of past papers.",
    },
    {
      qNo: 'Q7',
      moduleId: 'm4',
      moduleCode: 'M4',
      topicId: 'm4-page-replacement',
      marks: 15,
      bloom: 'K3',
      title: "Page Replacement (FIFO, LRU, OPT, Second-Chance Clock) & Belady's Anomaly",
      prompt:
        'Rotate from C1 2-2 Q6 (15M) & C2 Q7 (10M): trace 3-frame vs 4-frame FIFO to prove Belady’s anomaly, then compare LRU, OPT, and Clock/Second-Chance on a 20-page reference string.',
      rationale: 'Page replacement matrix appeared in 2 of 3 papers (15M in C1 2-2, 10M in C2).',
    },
    {
      qNo: 'Q8',
      moduleId: 'm5',
      moduleCode: 'M5',
      topicId: 'm5-disk-scheduling',
      marks: 15,
      bloom: 'K3',
      title: 'Disk Scheduling (C-SCAN, C-LOOK, SSTF, FCFS) + Rotational & Transfer Latency',
      prompt:
        'Rotate from C1 1-2 Q9 (15M SSTF/SCAN) & C2 Q9 (10M LOOK/C-LOOK/SSTF): compute head movement, seek time, and avg rotational latency (7200 RPM) moving upward on tracks 0–199 for C-SCAN vs C-LOOK vs SSTF.',
      rationale: 'Disk scheduling numerical appeared in 2 of 3 papers (C1 1-2 Q9, C2 Q9).',
    },
  ];

  // Gamma Model: Consensus Synthesis (100M exact sum: 7x10M + 2x15M like C1 Set 1-2)
  // Balances guaranteed VIT anchors (55M) with overdue syllabus gaps (45M)
  const gammaQuestions: PredictedQuestionItem[] = [
    {
      qNo: 'Q1',
      moduleId: 'm1',
      moduleCode: 'M1',
      topicId: 'm1-syscalls-services',
      marks: 10,
      bloom: 'K3',
      title: 'System Calls, Dual-Mode Trap, Parameter Passing & Interrupt/DMA Cycle',
      prompt:
        '(a) Trace a user-mode read() system call through mode bit transition, syscall table, and kernel return (5M). (b) Explain DMA cycle stealing and why DMA outperforms programmed I/O (5M).',
      rationale: 'Combines C2 Q1b syscall anchor with untested M1 Interrupt/DMA syllabus hours.',
    },
    {
      qNo: 'Q2',
      moduleId: 'm2',
      moduleCode: 'M2',
      topicId: 'm2-threads',
      marks: 10,
      bloom: 'K3',
      title: 'Multithreading Models (M:1, 1:1, M:M), Pthreads & Amdahl’s Law Numerical',
      prompt:
        '(a) Compare Many-to-One, One-to-One, and Many-to-Many models on blocking syscalls & multicore parallelism (6M). (b) Compute Amdahl’s Law speedup for 25% serial code on 4 cores vs 16 cores (4M).',
      rationale: 'Extends C2 Q2b multithreading anchor with quantitative Amdahl’s Law check.',
    },
    {
      qNo: 'Q3',
      moduleId: 'm3',
      moduleCode: 'M3',
      topicId: 'm3-hardware-sync',
      marks: 10,
      bloom: 'K3',
      title: "Peterson's Proof vs Hardware Compare-and-Swap (Bounded Waiting)",
      prompt:
        '(a) Prove why Peterson’s solution fails on modern out-of-order CPUs without memory barriers (4M). (b) Write bounded-waiting CAS lock pseudocode and verify Progress & Bounded Waiting (6M).',
      rationale: 'Bridges recurring Peterson’s anchor (C1 1-2 Q3, C2 Q5) with unasked Hardware Sync.',
    },
    {
      qNo: 'Q4',
      moduleId: 'm3',
      moduleCode: 'M3',
      topicId: 'm3-classical-problems',
      marks: 10,
      bloom: 'K3',
      title: 'Dining Philosophers (Monitor/Semaphore) or Readers-Writers Synchronization',
      prompt:
        'Design a deadlock-free Dining Philosophers Monitor (`pickup(i)`, `putdown(i)`, `test(i)`) with `THINKING/HUNGRY/EATING` states and prove mutual exclusion & no deadlock (10M).',
      rationale: 'Guaranteed M3 classical sync problem slot; Dining Philosophers is due next.',
    },
    {
      qNo: 'Q5',
      moduleId: 'm4',
      moduleCode: 'M4',
      topicId: 'm4-file-allocation',
      marks: 10,
      bloom: 'K3',
      title: 'File Allocation Methods & Unix Inode Max File Size Numerical',
      prompt:
        '(a) Compare Contiguous, Linked/FAT, and Indexed file allocation with diagrams (5M). (b) Compute max file size for a Unix inode with 2 KB blocks, 4-byte block pointers, 10 direct + 1 single + 1 double indirect pointers (5M).',
      rationale: 'Highest-likelihood M4 overdue gap (0 file system questions across 3 papers).',
    },
    {
      qNo: 'Q6',
      moduleId: 'm5',
      moduleCode: 'M5',
      topicId: 'm5-security-crypto',
      marks: 10,
      bloom: 'K3',
      title: 'Access Matrix (ACL vs Capabilities) & Buffer Overflow / Digital Signatures',
      prompt:
        '(a) Contrast ACLs vs Capability Lists on revocation and Principle of Least Privilege (5M). (b) Explain how TLS combines RSA/Diffie-Hellman, AES, and SHA-256 digital signatures (5M).',
      rationale: 'Highest-likelihood M5 overdue gap (0 security/protection questions across 3 papers).',
    },
    {
      qNo: 'Q7',
      moduleId: 'm5',
      moduleCode: 'M5',
      topicId: 'm5-virtualization',
      marks: 10,
      bloom: 'K2',
      title: 'RAID 5/6 Selection + Full vs Para-Virtualization vs Docker Containers',
      prompt:
        '(a) Justify RAID 6 vs RAID 10 for a 6-disk transactional database (4M). (b) Diagram Type-1 Hypervisor vs Docker Container Engine showing kernel sharing, namespaces, and cgroups (6M).',
      rationale: 'High-frequency M5 synthesis combining C1 1-2 Q7 (RAID) and C1 2-2 Q4 / C2 Q10 (Virtualization).',
    },
    {
      qNo: 'Q8',
      moduleId: 'm2',
      moduleCode: 'M2',
      topicId: 'm2-deadlock-handling',
      marks: 15,
      bloom: 'K4',
      title: "15M Anchor: CPU Scheduling (SRTF / RR) OR Banker's Algorithm + Resource Request",
      prompt:
        "(a) Run SRTF on 5 processes and compute Avg WT/TAT (7M). (b) Given 5 processes × 3 resources in Banker's state, compute Need, Available, Safe Sequence, and evaluate Request P1=(1,0,2) (8M).",
      rationale: 'Both CPU Scheduling and Banker’s appeared in 100% of past VIT Chennai FAT papers.',
    },
    {
      qNo: 'Q9',
      moduleId: 'm4',
      moduleCode: 'M4',
      topicId: 'm4-page-replacement',
      marks: 15,
      bloom: 'K3',
      title: '15M Anchor: Page Replacement (FIFO/LRU/OPT) + TLB EAT & Disk C-SCAN/LOOK',
      prompt:
        '(a) Trace FIFO, LRU, OPT for 4 frames on a 16-reference string and compare fault ratios (9M). (b) Compute TLB EAT for 90% hit ratio (TLB=15ns, RAM=120ns) and compare with 98% hit ratio (6M).',
      rationale: 'Combines the two heaviest M4 numericals seen in C1 Set 2-2 Q6 and C2 Q7/Q8.',
    },
  ];

  return {
    matrix,
    untestedTopicsCount,
    recurringAnchorsCount,
    alphaGapPaper: {
      name: 'Alpha Model — Untested Gap Paper',
      subtitle: '100% focus on syllabus topics with 0 appearances across C1 Set 2-2, C1 Set 1-2 & C2',
      totalMarks: alphaQuestions.reduce((s, q) => s + q.marks, 0),
      questions: alphaQuestions,
    },
    betaRotationPaper: {
      name: 'Beta Model — Anchor Rotation Paper',
      subtitle: 'Rotates parameters/algorithms on topics tested in 2–3 past slots (4×10M + 4×15M)',
      totalMarks: betaQuestions.reduce((s, q) => s + q.marks, 0),
      questions: betaQuestions,
    },
    gammaConsensusPaper: {
      name: 'Gamma Model — Consensus Prediction Paper',
      subtitle: 'Balanced 55M VIT FAT anchors + 45M overdue File Systems & Security gaps (7×10M + 2×15M)',
      totalMarks: gammaQuestions.reduce((s, q) => s + q.marks, 0),
      questions: gammaQuestions,
    },
  };
}
