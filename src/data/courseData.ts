export interface CourseMeta {
  code: string;
  title: string;
  institution: string;
  program: string;
  credits: string;
  examTitle: string;
  examStartIso: string; // 25 Nov 2026 09:00 IST
  examDateDisplay: string;
  durationMinutes: number;
  totalMarks: number;
  textbook: string;
}

export interface DivisionWheelEntry {
  id: string;
  code: string;
  label: string;
  shortLabel: string;
  hex: string;
  darkHex: string;
}

export interface SyllabusTopicMeta {
  id: string;
  moduleId: string;
  title: string;
  hoursTag: string;
  silberschatzRef: string;
  fatFrequency: 'Guaranteed Anchor' | 'High Yield' | 'Overdue Gap';
}

export interface ModuleMeta {
  id: 'm1' | 'm2' | 'm3' | 'm4' | 'm5';
  code: string;
  co: string;
  title: string;
  shortTitle: string;
  hours: number;
  weightPct: number;
  accentHex: string;
  topics: SyllabusTopicMeta[];
  criticalRules: string[];
  comparisonTable: {
    title: string;
    headers: string[];
    rows: string[][];
  };
  expectedPrompts: string[];
}

export interface SprintBlock {
  id: string;
  day: 'Day 1 · Mon 23 Nov' | 'Day 2 · Tue 24 Nov' | 'Exam Morning · Wed 25 Nov';
  timeWindow: string;
  durationMins: number;
  moduleId: string;
  title: string;
  objective: string;
  deliverable: string;
  isHighYield: boolean;
  targetView: 'standing' | 'syllabus' | 'reference' | 'prediction' | 'labs' | 'mock';
  targetTopicId?: string;
}

export interface FlashcardItem {
  id: string;
  moduleId: 'm1' | 'm2' | 'm3' | 'm4' | 'm5';
  topicId: string;
  tag: string;
  front: string;
  back: string;
}

export interface MockMcqItem {
  id: string;
  moduleId: 'm1' | 'm2' | 'm3' | 'm4' | 'm5';
  topicId: string;
  part: 'A' | 'B'; // Part A = 2M conceptual, Part B = 10M multi-step/analytical
  marks: 2 | 10;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
}

export interface ExaminerBlueprint {
  qNo: string;
  moduleId: 'm1' | 'm2' | 'm3' | 'm4' | 'm5';
  marks: string;
  bloom: string;
  archetype: string;
  markingRubric: string;
  mustInclude: string[];
}

export interface ExaminerTrap {
  id: string;
  moduleId: 'm1' | 'm2' | 'm3' | 'm4' | 'm5';
  moduleCode: string;
  penalty: string;
  title: string;
  mistake: string;
  fix: string;
}

export interface PacingSegment {
  window: string;
  minutes: number;
  phase: string;
  target: string;
  tactic: string;
}

export const COURSE_META: CourseMeta = {
  code: 'BACSE106',
  title: 'Operating Systems',
  institution: 'VIT Chennai',
  program: 'B.Tech CSE Core · Semester 3',
  credits: 'L-T-P-C: 3-0-2-4 (45h Theory + 30h Lab)',
  examTitle: 'End-Semester FAT Examination',
  examStartIso: '2026-11-25T09:00:00+05:30',
  examDateDisplay: 'Wed, 25 Nov 2026 · 09:00–12:00 IST',
  durationMinutes: 180,
  totalMarks: 100,
  textbook: 'Silberschatz, Galvin & Gagne — Operating System Concepts (10th Ed.)',
};

export const DIVISION_WHEEL: Record<string, DivisionWheelEntry> = {
  standing: {
    id: 'standing',
    code: 'DIAG',
    label: 'Know Your Standing',
    shortLabel: 'Standing',
    hex: '#2E6F5E',
    darkHex: '#4CA38C',
  },
  m1: {
    id: 'm1',
    code: 'M1',
    label: 'OS & Structure',
    shortLabel: 'M1 · OS',
    hex: '#E5B82E',
    darkHex: '#F0C94F',
  },
  m2: {
    id: 'm2',
    code: 'M2',
    label: 'Processes, CPU & Deadlocks',
    shortLabel: 'M2 · CPU',
    hex: '#E06D2B',
    darkHex: '#EF8347',
  },
  m3: {
    id: 'm3',
    code: 'M3',
    label: 'Synchronization & IPC',
    shortLabel: 'M3 · Sync',
    hex: '#4F8A3D',
    darkHex: '#6CB057',
  },
  m4: {
    id: 'm4',
    code: 'M4',
    label: 'Memory & File Systems',
    shortLabel: 'M4 · Mem',
    hex: '#147E7B',
    darkHex: '#2CA5A1',
  },
  m5: {
    id: 'm5',
    code: 'M5',
    label: 'Disk, Security & VMs',
    shortLabel: 'M5 · Sys',
    hex: '#22559C',
    darkHex: '#4F85D1',
  },
  labs: {
    id: 'labs',
    code: 'LABS',
    label: 'Interactive OS Labs',
    shortLabel: 'OS Labs',
    hex: '#8B3A62',
    darkHex: '#C46493',
  },
  mock: {
    id: 'mock',
    code: 'MOCK',
    label: '100M FAT Papers & MCQ',
    shortLabel: 'FAT Mock',
    hex: '#3B4D7A',
    darkHex: '#6E85BD',
  },
  danger: {
    id: 'danger',
    code: 'TRAP',
    label: 'Examiner Traps & Weak Queue',
    shortLabel: 'Traps',
    hex: '#B83227',
    darkHex: '#E2584C',
  },
};

export const MODULES: ModuleMeta[] = [
  {
    id: 'm1',
    code: 'M1',
    co: 'CO1',
    title: 'Operating Systems and Structure',
    shortTitle: 'OS Structure',
    hours: 6,
    weightPct: 14,
    accentHex: '#E5B82E',
    topics: [
      {
        id: 'm1-basics-history',
        moduleId: 'm1',
        title: 'OS Basics, Dual-Mode Operation & Multiprogramming vs Time-Sharing',
        hoursTag: '1.5h',
        silberschatzRef: 'Ch 1 §1.1–1.5',
        fatFrequency: 'High Yield',
      },
      {
        id: 'm1-os-structures',
        moduleId: 'm1',
        title: 'OS Structures: Monolithic, Layered, Microkernel, Modular & Hybrid',
        hoursTag: '1.5h',
        silberschatzRef: 'Ch 2 §2.7',
        fatFrequency: 'Guaranteed Anchor',
      },
      {
        id: 'm1-syscalls-services',
        moduleId: 'm1',
        title: 'OS Services, System Calls, FD Redirection & Parameter Passing',
        hoursTag: '1h',
        silberschatzRef: 'Ch 2 §2.1–2.4',
        fatFrequency: 'High Yield',
      },
      {
        id: 'm1-interrupts-dma',
        moduleId: 'm1',
        title: 'Interrupts, Traps, I/O Cycle & Direct Memory Access (DMA)',
        hoursTag: '1h',
        silberschatzRef: 'Ch 1 §1.2–1.3',
        fatFrequency: 'Overdue Gap',
      },
      {
        id: 'm1-design-booting',
        moduleId: 'm1',
        title: 'OS Design Issues (Policy vs Mechanism) & Linux Boot Sequence',
        hoursTag: '1h',
        silberschatzRef: 'Ch 2 §2.6, 2.8–2.9',
        fatFrequency: 'High Yield',
      },
    ],
    criticalRules: [
      'Mode bit = 0 is Kernel Mode (privileged instructions allowed); Mode bit = 1 is User Mode.',
      'Monolithic kernels communicate via fast function calls inside shared kernel address space; Microkernels communicate via user-space IPC message passing.',
      'Standard Unix file descriptors: FD 0 = stdin, FD 1 = stdout, FD 2 = stderr. Closing FD 1 then calling open() guarantees the OS assigns the lowest unused descriptor (FD 1).',
      'Boot order: Firmware (BIOS/UEFI + POST) -> Bootloader (GRUB) -> Kernel -> initramfs -> Mount rootfs -> init/systemd (PID 1).',
    ],
    comparisonTable: {
      title: 'Kernel Architecture Matrix (C1 2-2 Q1 & C2 Q1a)',
      headers: ['Architecture', 'Kernel Space Contents', 'Communication', 'Strength', 'Weakness'],
      rows: [
        ['Monolithic', 'Scheduler, VM, FS, Drivers, IPC', 'Direct C function calls', 'Lowest latency & highest throughput', 'Single driver crash panics whole OS'],
        ['Microkernel', 'Minimal IPC, basic scheduling, MM', 'Message passing (user servers)', 'Fault isolation & high reliability', 'Repeated user/kernel context switches'],
        ['Modular (LKM)', 'Core kernel + dynamic loadable modules', 'Direct calls via kernel interfaces', 'Flexible like layered + fast like monolithic', 'Modules still run in Ring 0'],
        ['Hybrid', 'Combines monolithic speed + microkernel isolation', 'Direct calls + localized IPC', 'Practical balance (macOS XNU, Windows NT)', 'Higher architectural complexity'],
      ],
    },
    expectedPrompts: [
      'Compare Monolithic and Microkernel architectures with neatly labeled diagrams and IPC paths (10M).',
      'Trace an embedded Linux boot failure when rootfs fails to mount and justify Time-Sharing over Multiprogramming (10M).',
      'Trace `./analyzer data.txt > report.log` using fork(), exec(), open(), close(), read(), write() and the lowest-FD rule (10M).',
    ],
  },
  {
    id: 'm2',
    code: 'M2',
    co: 'CO2',
    title: 'Process, Scheduling, Threads and Deadlocks',
    shortTitle: 'CPU & Deadlocks',
    hours: 10,
    weightPct: 26,
    accentHex: '#E06D2B',
    topics: [
      {
        id: 'm2-process-pcb',
        moduleId: 'm2',
        title: 'Process Concepts, Memory Layout, PCB & 5-State Lifecycle',
        hoursTag: '1.5h',
        silberschatzRef: 'Ch 3 §3.1–3.2',
        fatFrequency: 'High Yield',
      },
      {
        id: 'm2-process-operations',
        moduleId: 'm2',
        title: 'Operations on Processes: fork(), exec(), wait(), Orphan & Zombie',
        hoursTag: '1.5h',
        silberschatzRef: 'Ch 3 §3.3',
        fatFrequency: 'Overdue Gap',
      },
      {
        id: 'm2-threads',
        moduleId: 'm2',
        title: 'Threads, Multithreading Models (M:1, 1:1, M:M), Pthreads & Amdahl’s Law',
        hoursTag: '1.5h',
        silberschatzRef: 'Ch 4 §4.1–4.5',
        fatFrequency: 'High Yield',
      },
      {
        id: 'm2-nonpreemptive-scheduling',
        moduleId: 'm2',
        title: 'CPU Scheduling Criteria & Non-Preemptive Schedulers (FCFS, SJF, NP-Priority)',
        hoursTag: '1.5h',
        silberschatzRef: 'Ch 5 §5.1–5.3',
        fatFrequency: 'Guaranteed Anchor',
      },
      {
        id: 'm2-preemptive-scheduling',
        moduleId: 'm2',
        title: 'Preemptive Schedulers: SRTF, Round Robin, Preemptive Priority (+CS) & MLFQ',
        hoursTag: '1.5h',
        silberschatzRef: 'Ch 5 §5.3–5.4',
        fatFrequency: 'Guaranteed Anchor',
      },
      {
        id: 'm2-deadlock-rag',
        moduleId: 'm2',
        title: 'Deadlock Characterization (4 Coffman Conditions), RAG & Wait-For Graphs',
        hoursTag: '1h',
        silberschatzRef: 'Ch 8 §8.1–8.4',
        fatFrequency: 'Guaranteed Anchor',
      },
      {
        id: 'm2-deadlock-handling',
        moduleId: 'm2',
        title: 'Deadlock Prevention, Avoidance (Banker’s Algorithm), Detection & Recovery',
        hoursTag: '1.5h',
        silberschatzRef: 'Ch 8 §8.5–8.8',
        fatFrequency: 'Guaranteed Anchor',
      },
    ],
    criticalRules: [
      'Context Switch overhead (1 ms in C1 2-2 Q5) applies on every switch between distinct processes, excludes initial dispatch and final completion, and arrivals during CS enter the ready queue before dispatch.',
      'In Banker’s Resource-Request: check (1) Request_i <= Need_i, (2) Request_i <= Available, (3) Tentative Safety — never skip step 3!',
      'Single-instance RAG cycle = necessary & sufficient for deadlock. Multi-instance RAG cycle = necessary ONLY (not sufficient).',
      'Threads share Code, Data, and Open Files; each thread has its own private Registers, Program Counter (PC), and Stack.',
    ],
    comparisonTable: {
      title: 'CPU Scheduling Algorithm Comparison',
      headers: ['Algorithm', 'Preemptive?', 'Starvation?', 'Key Trade-off'],
      rows: [
        ['FCFS', 'No', 'No', 'Simple but suffers from Convoy Effect (long CPU-bound job blocks short jobs)'],
        ['SJF / SRTF', 'No / Yes', 'Yes', 'Provably optimal minimum Average WT, but requires predicting next CPU burst'],
        ['Priority', 'Both', 'Yes (solve via Aging)', 'Supports real-time urgency; equal priority ties broken via FCFS'],
        ['Round Robin', 'Yes (quantum q)', 'No', 'Best Response Time; too small q -> excessive CS overhead; too large q -> degrades to FCFS'],
        ['MLFQ', 'Yes', 'Prevented via Aging', 'Separates I/O-bound (high priority) from CPU-bound (demoted) dynamically'],
      ],
    },
    expectedPrompts: [
      'Construct Gantt chart with 1 ms CS overhead for Preemptive Priority (10 processes) and calculate CT, TAT, WT, RT & averages (15M).',
      'Compute Need, Available, Safe Sequence, and evaluate a dynamic Resource Request using Banker’s Algorithm (15M).',
      'Compare FCFS vs Round Robin (q=10) on Gantt charts and Avg WT/TAT, plus explain RAG/WFG deadlock cycles (10M).',
    ],
  },
  {
    id: 'm3',
    code: 'M3',
    co: 'CO3',
    title: 'Process Synchronization',
    shortTitle: 'Synchronization',
    hours: 9,
    weightPct: 20,
    accentHex: '#4F8A3D',
    topics: [
      {
        id: 'm3-ipc',
        moduleId: 'm3',
        title: 'Inter-Process Communication (Shared Memory, Message Passing, Pipes & Sockets)',
        hoursTag: '1.5h',
        silberschatzRef: 'Ch 3 §3.4–3.8',
        fatFrequency: 'Overdue Gap',
      },
      {
        id: 'm3-critical-section-peterson',
        moduleId: 'm3',
        title: 'Race Conditions, Critical Section Criteria, Peterson’s Proof & Bakery Algorithm',
        hoursTag: '2h',
        silberschatzRef: 'Ch 6 §6.1–6.3',
        fatFrequency: 'Guaranteed Anchor',
      },
      {
        id: 'm3-hardware-sync',
        moduleId: 'm3',
        title: 'Hardware Sync: Memory Barriers, Test-and-Set & Bounded-Waiting Compare-and-Swap',
        hoursTag: '1.5h',
        silberschatzRef: 'Ch 6 §6.4',
        fatFrequency: 'Overdue Gap',
      },
      {
        id: 'm3-mutex-semaphores',
        moduleId: 'm3',
        title: 'Mutex Locks & Semaphores (Binary/Counting, Wait Queues & Priority Inversion)',
        hoursTag: '1.5h',
        silberschatzRef: 'Ch 6 §6.5–6.6',
        fatFrequency: 'High Yield',
      },
      {
        id: 'm3-classical-problems',
        moduleId: 'm3',
        title: 'Classical Sync Problems: Bounded Buffer, Readers-Writers, Dining Philosophers & Sleeping Barber',
        hoursTag: '1.5h',
        silberschatzRef: 'Ch 7 §7.1',
        fatFrequency: 'Guaranteed Anchor',
      },
      {
        id: 'm3-monitors',
        moduleId: 'm3',
        title: 'Monitors, Condition Variables (Hoare vs Mesa) & Scenario Monitor Design',
        hoursTag: '1h',
        silberschatzRef: 'Ch 6 §6.7–6.8',
        fatFrequency: 'High Yield',
      },
    ],
    criticalRules: [
      'Every Critical Section solution must satisfy all 3 requirements: Mutual Exclusion, Progress, and Bounded Waiting.',
      'In Peterson’s solution, `turn` is a single shared variable — it cannot simultaneously equal 0 and 1, which powers the contradiction proof.',
      'In Bounded Buffer: ALWAYS execute `wait(empty)` / `wait(full)` BEFORE `wait(mutex)`. Reversing them causes immediate deadlock!',
      'Condition variables inside Monitors have NO integer value (unlike semaphores): `x.signal()` with no waiting process is lost (no-op).',
    ],
    comparisonTable: {
      title: 'Synchronization Primitives Comparison',
      headers: ['Primitive', 'Busy Wait?', 'Ownership', 'Primary Use Case'],
      rows: [
        ["Peterson's Solution", 'Yes (spin)', '2 processes only', 'Pure software proof; fails on OoO CPUs without memory barriers'],
        ['Test-and-Set / CAS', 'Yes (spinlock)', 'None', 'Short kernel critical sections on multiprocessors'],
        ['Mutex Lock', 'Spin or sleep', 'Strict owner unlocks', 'Simple binary mutual exclusion'],
        ['Counting Semaphore', 'No (block queue)', 'No ownership', 'Resource pool counting & producer-consumer signaling'],
        ['Monitor + CondVar', 'No (entry/cond queues)', 'Compiler-enforced ME', 'Complex multi-condition priority/anti-starvation policies'],
      ],
    },
    expectedPrompts: [
      'Write Sleeping Barber or Bounded Buffer semaphore pseudocode and prove race & deadlock prevention (10M).',
      'Prove Mutual Exclusion for Peterson’s solution by contradiction and trace simultaneous entry on shared seats (10M).',
      'Design a Monitor for a multi-resource hospital/bridge scenario with priority and anti-starvation threshold (10M).',
    ],
  },
  {
    id: 'm4',
    code: 'M4',
    co: 'CO4',
    title: 'Memory and File Management',
    shortTitle: 'Memory & Files',
    hours: 10,
    weightPct: 24,
    accentHex: '#147E7B',
    topics: [
      {
        id: 'm4-contiguous-allocation',
        moduleId: 'm4',
        title: 'MMU Address Binding, Fragmentation & Contiguous Placement (FF, BF, WF, NF)',
        hoursTag: '1.5h',
        silberschatzRef: 'Ch 9 §9.1–9.2',
        fatFrequency: 'Guaranteed Anchor',
      },
      {
        id: 'm4-paging-tlb',
        moduleId: 'm4',
        title: 'Paging, TLB Effective Access Time (EAT), Multi-Level/Hashed/Inverted Tables & Segmentation',
        hoursTag: '2h',
        silberschatzRef: 'Ch 9 §9.3–9.6',
        fatFrequency: 'Guaranteed Anchor',
      },
      {
        id: 'm4-virtual-memory',
        moduleId: 'm4',
        title: 'Virtual Memory, Demand Paging Fault Cycle, Copy-on-Write & Fault-Rate EAT',
        hoursTag: '1.5h',
        silberschatzRef: 'Ch 10 §10.1–10.3',
        fatFrequency: 'High Yield',
      },
      {
        id: 'm4-page-replacement',
        moduleId: 'm4',
        title: 'Page Replacement Algorithms (FIFO, Belady’s Anomaly, OPT, LRU, Second-Chance Clock)',
        hoursTag: '1.5h',
        silberschatzRef: 'Ch 10 §10.4',
        fatFrequency: 'Guaranteed Anchor',
      },
      {
        id: 'm4-thrashing-ws',
        moduleId: 'm4',
        title: 'Frame Allocation, Thrashing Curve, Working-Set Model (Δ) & Page-Fault Frequency',
        hoursTag: '1h',
        silberschatzRef: 'Ch 10 §10.5–10.6',
        fatFrequency: 'Guaranteed Anchor',
      },
      {
        id: 'm4-file-directories',
        moduleId: 'm4',
        title: 'File Concepts, Access Methods & Directory Structures (Tree, DAG, General Graph)',
        hoursTag: '1h',
        silberschatzRef: 'Ch 13 §13.1–13.3',
        fatFrequency: 'Overdue Gap',
      },
      {
        id: 'm4-file-allocation',
        moduleId: 'm4',
        title: 'File Allocation Methods (Contiguous, Linked/FAT, Unix Inode) & Free-Space Management',
        hoursTag: '1.5h',
        silberschatzRef: 'Ch 14 §14.3–14.5',
        fatFrequency: 'Overdue Gap',
      },
    ],
    criticalRules: [
      'Paging eliminates external fragmentation (minor internal fragmentation in last page); Segmentation eliminates internal fragmentation (causes external fragmentation).',
      'Segmentation check is STRICT: `offset < limit`. If `offset >= limit`, hardware raises an Addressing Error TRAP.',
      'LRU and OPT are Stack Algorithms — they NEVER suffer from Belady’s Anomaly (only FIFO and non-stack algorithms do).',
      'Unix Inode Max File Size = `(Direct + P + P^2 + P^3) * BlockSize` where `P = BlockSize / PointerSize`.',
    ],
    comparisonTable: {
      title: 'File Allocation Strategies (Overdue M4 Gap)',
      headers: ['Method', 'Sequential Access', 'Random Access', 'External Frag?', 'Growth / Reliability'],
      rows: [
        ['Contiguous', 'Fastest (1 seek)', 'O(1) direct offset', 'Yes (severe)', 'Hard to grow file without copying'],
        ['Linked / FAT', 'Good', 'O(n) disk reads (O(1) RAM in FAT)', 'No', 'Easy growth; broken pointer loses tail'],
        ['Indexed (Unix Inode)', 'Good', 'O(1) via index block', 'No', 'Scales via single/double/triple indirect pointers'],
      ],
    },
    expectedPrompts: [
      'Trace FIFO, LRU, and OPT for 4 frames on a 20–25 page reference string and compare fault rates (15M).',
      'Compare First Fit, Best Fit, Next Fit (with wrap pointer), and Worst Fit on 7 memory blocks and explain external fragmentation (15M).',
      'Compute Paging bit splits & TLB EAT (80% vs 95%) OR Unix Inode max file size with indirect blocks (10M).',
    ],
  },
  {
    id: 'm5',
    code: 'M5',
    co: 'CO5',
    title: 'Managing Devices, Security, Protection and Virtualization',
    shortTitle: 'Disk, Sec & VMs',
    hours: 8,
    weightPct: 16,
    accentHex: '#22559C',
    topics: [
      {
        id: 'm5-disk-scheduling',
        moduleId: 'm5',
        title: 'Disk Geometry, Access Latency & Disk Scheduling (FCFS, SSTF, SCAN, C-SCAN, LOOK, C-LOOK)',
        hoursTag: '2h',
        silberschatzRef: 'Ch 11 §11.1–11.2',
        fatFrequency: 'Guaranteed Anchor',
      },
      {
        id: 'm5-raid',
        moduleId: 'm5',
        title: 'RAID Levels (0, 1, 4, 5, 6, 10), Parity Trade-offs & Scenario Selection',
        hoursTag: '1.5h',
        silberschatzRef: 'Ch 11 §11.7',
        fatFrequency: 'High Yield',
      },
      {
        id: 'm5-security-crypto',
        moduleId: 'm5',
        title: 'Program & Network Threats (Buffer Overflow, Viruses, DoS) & Cryptography (AES, RSA, TLS)',
        hoursTag: '1.5h',
        silberschatzRef: 'Ch 16 §16.1–16.6',
        fatFrequency: 'Overdue Gap',
      },
      {
        id: 'm5-protection-matrix',
        moduleId: 'm5',
        title: 'Protection Domains, Access Matrix, ACLs, Capability Lists, Lock-Key & Least Privilege',
        hoursTag: '1.5h',
        silberschatzRef: 'Ch 17 §17.1–17.6',
        fatFrequency: 'Overdue Gap',
      },
      {
        id: 'm5-virtualization',
        moduleId: 'm5',
        title: 'Virtualization (Type 1/2 Hypervisors, Full vs Para-Virt) & OS-Level Containers (Docker)',
        hoursTag: '1.5h',
        silberschatzRef: 'Ch 18 §18.1–18.5',
        fatFrequency: 'Guaranteed Anchor',
      },
    ],
    criticalRules: [
      'Always infer initial disk arm direction from previous position! (`prev = 250, current = 215` => moving DOWNWARD toward 0).',
      'SCAN/C-SCAN travel all the way to disk boundary (0 or maxTrack); LOOK/C-LOOK reverse at the last pending request.',
      'Encrypt for confidentiality with receiver PUBLIC key; create Digital Signature with sender PRIVATE key on `H(m)`.',
      'Full Virtualization runs unmodified guest OS via Trap-and-Emulate/VT-x; Para-Virtualization modifies guest OS for hypercalls; Containers share the host kernel via namespaces + cgroups.',
    ],
    comparisonTable: {
      title: 'Virtualization vs OS-Level Containers (C1 2-2 Q4 & C2 Q10)',
      headers: ['Dimension', 'Full Virtualization (VM)', 'Para-Virtualization', 'Containers (Docker)'],
      rows: [
        ['Guest OS', 'Unmodified full guest OS', 'Modified guest kernel (hypercalls)', 'None — shares host OS kernel'],
        ['Isolation Layer', 'Type-1 / Type-2 Hypervisor', 'Hypervisor + hypercall API', 'Linux namespaces & cgroups'],
        ['Boot Time & Size', 'Minutes · GBs per VM image', 'Seconds–minutes · GBs', 'Milliseconds · MBs per image'],
        ['Security Isolation', 'Strongest (hardware ring boundary)', 'Strong', 'Shared kernel attack surface'],
      ],
    },
    expectedPrompts: [
      'Compute head movement & seek plots for SSTF, SCAN, LOOK, and C-LOOK with explicit direction & RPM latency (10–15M).',
      'Compare Full Virtualization, Para-Virtualization, and Docker Containers with layered architecture diagrams (10M).',
      'Explain Buffer Overflow + AES/RSA Digital Signatures OR Protection Access Matrix (ACL vs Capabilities) (10M).',
    ],
  },
];

export const SPRINT_BLOCKS: SprintBlock[] = [
  // DAY 1: Mon 23 Nov (Foundation + Heavy M2 & M4 Anchors)
  {
    id: 'sb-01',
    day: 'Day 1 · Mon 23 Nov',
    timeWindow: '09:00 – 10:30',
    durationMins: 90,
    moduleId: 'standing',
    title: 'Diagnostic Baseline Across M1–M5',
    objective: 'Run Standing Diagnostics for M2 & M4 first (50% of FAT marks) to expose Foundation vs Analysis gaps.',
    deliverable: 'Radar baseline populated & Weak Topics Queue seeded.',
    isHighYield: true,
    targetView: 'standing',
  },
  {
    id: 'sb-02',
    day: 'Day 1 · Mon 23 Nov',
    timeWindow: '10:45 – 12:15',
    durationMins: 90,
    moduleId: 'm2',
    title: 'CPU Scheduling Numericals (Priority+CS, SRTF, RR)',
    objective: 'Master Gantt charts with 1 ms CS overhead (C1 2-2 Q5), NP-Priority (C1 1-2 Q2), and FCFS vs RR (C2 Q3).',
    deliverable: 'Solve all 4 CPU Lab presets with zero CT/TAT/WT errors.',
    isHighYield: true,
    targetView: 'labs',
    targetTopicId: 'm2-preemptive-scheduling',
  },
  {
    id: 'sb-03',
    day: 'Day 1 · Mon 23 Nov',
    timeWindow: '13:30 – 15:00',
    durationMins: 90,
    moduleId: 'm2',
    title: "Deadlocks: Banker's Algorithm (6×4 & 4×3) + RAG/WFG",
    objective: 'Drill Need/Available/Work tables, 3-step Resource Request check (C1 2-2 Q7c denial trap), and C2 Q4 RAG cycle.',
    deliverable: 'Complete Banker’s & RAG Lab presets + M2 Standing quiz.',
    isHighYield: true,
    targetView: 'labs',
    targetTopicId: 'm2-deadlock-handling',
  },
  {
    id: 'sb-04',
    day: 'Day 1 · Mon 23 Nov',
    timeWindow: '15:15 – 16:45',
    durationMins: 90,
    moduleId: 'm2',
    title: 'Process Lifecycle, fork()/Orphan/Zombie & Threads',
    objective: 'Review PCB, 5-state transitions, fork tree counts, M:1/1:1/M:M models, and Amdahl’s Law.',
    deliverable: 'Mark all M2 syllabus topics mastered.',
    isHighYield: false,
    targetView: 'syllabus',
    targetTopicId: 'm2-threads',
  },
  {
    id: 'sb-05',
    day: 'Day 1 · Mon 23 Nov',
    timeWindow: '17:15 – 19:00',
    durationMins: 105,
    moduleId: 'm4',
    title: 'Page Replacement (FIFO/LRU/OPT) & Working Set / Thrashing',
    objective: 'Trace C1 2-2 Q6 (25-ref), C2 Q7 (20-ref), Belady’s anomaly, and C1 1-2 Q6 Working Set Δ=5.',
    deliverable: 'Verify fault counts (17/12/10 and 14/10/8) in Memory Lab.',
    isHighYield: true,
    targetView: 'labs',
    targetTopicId: 'm4-page-replacement',
  },
  {
    id: 'sb-06',
    day: 'Day 1 · Mon 23 Nov',
    timeWindow: '20:15 – 21:45',
    durationMins: 90,
    moduleId: 'm4',
    title: 'Contiguous Placement, Paging+TLB EAT & Segmentation',
    objective: 'Master C1 2-2 Q8 (FF/BF/NF/WF), C2 Q8 (TLB EAT 80%->95%), and C1 1-2 Q5 Segmentation traps.',
    deliverable: 'Pass 10 straight Memory & TLB problems in Numerical Drill.',
    isHighYield: true,
    targetView: 'syllabus',
    targetTopicId: 'm4-paging-tlb',
  },
  // DAY 2: Tue 24 Nov (M3 Sync, Overdue M4/M5 Gaps & Full 100M Mock)
  {
    id: 'sb-07',
    day: 'Day 2 · Tue 24 Nov',
    timeWindow: '08:30 – 10:00',
    durationMins: 90,
    moduleId: 'm3',
    title: "Peterson's Proof, Hardware CAS & Classical Semaphores",
    objective: 'Memorize Peterson’s contradiction proof, bounded-waiting CAS, Bounded Buffer, and Sleeping Barber.',
    deliverable: 'Trace all 5 scenarios in Sync Concurrency Lab.',
    isHighYield: true,
    targetView: 'labs',
    targetTopicId: 'm3-classical-problems',
  },
  {
    id: 'sb-08',
    day: 'Day 2 · Tue 24 Nov',
    timeWindow: '10:15 – 11:30',
    durationMins: 75,
    moduleId: 'm3',
    title: 'Monitors (Hoare vs Mesa) & IPC (Shared Mem / Pipes)',
    objective: 'Study Hospital Priority Monitor (C1 1-2 Q4), Dining Philosophers Monitor, and IPC models.',
    deliverable: 'Complete M3 Standing Diagnostic >= Band B.',
    isHighYield: false,
    targetView: 'syllabus',
    targetTopicId: 'm3-monitors',
  },
  {
    id: 'sb-09',
    day: 'Day 2 · Tue 24 Nov',
    timeWindow: '11:45 – 13:15',
    durationMins: 90,
    moduleId: 'm4',
    title: 'OVERDUE GAP: File Systems, Directories & Unix Inodes',
    objective: 'Close the #1 untested M4 gap: Contiguous vs Linked/FAT vs Indexed allocation & inode max-size math.',
    deliverable: 'Compute 12-direct + 3-level indirect inode file size unaided.',
    isHighYield: true,
    targetView: 'syllabus',
    targetTopicId: 'm4-file-allocation',
  },
  {
    id: 'sb-10',
    day: 'Day 2 · Tue 24 Nov',
    timeWindow: '14:15 – 15:45',
    durationMins: 90,
    moduleId: 'm5',
    title: 'Disk Scheduling (SSTF/SCAN/LOOK/C-LOOK) & RAID 0–10',
    objective: 'Master direction inference (`prev 250 -> 215`), boundary vs request reversal, RPM latency, and RAID 5 vs 6.',
    deliverable: 'Verify C1 1-2 Q9 & C2 Q9 in Disk & RAID Lab.',
    isHighYield: true,
    targetView: 'labs',
    targetTopicId: 'm5-disk-scheduling',
  },
  {
    id: 'sb-11',
    day: 'Day 2 · Tue 24 Nov',
    timeWindow: '16:00 – 17:30',
    durationMins: 90,
    moduleId: 'm5',
    title: 'OVERDUE GAP: Security, Crypto, Access Matrix & Virtualization',
    objective: 'Cover Buffer Overflow, AES/RSA/Signatures, ACL vs Capabilities, and Full/Para-Virt vs Docker Containers.',
    deliverable: 'Review Prediction View Alpha Gap & Gamma Consensus models.',
    isHighYield: true,
    targetView: 'prediction',
    targetTopicId: 'm5-security-crypto',
  },
  {
    id: 'sb-12',
    day: 'Day 2 · Tue 24 Nov',
    timeWindow: '17:45 – 18:45',
    durationMins: 60,
    moduleId: 'm1',
    title: 'M1 Rapid Lock: Kernel Structures, Syscalls, DMA & Booting',
    objective: 'Lock 10/10 on Q1: Monolithic vs Microkernel diagram, FD redirection, DMA cycle, and Linux boot sequence.',
    deliverable: 'Complete M1 Standing Diagnostic >= Band A.',
    isHighYield: false,
    targetView: 'syllabus',
    targetTopicId: 'm1-os-structures',
  },
  {
    id: 'sb-13',
    day: 'Day 2 · Tue 24 Nov',
    timeWindow: '19:30 – 22:30',
    durationMins: 180,
    moduleId: 'mock',
    title: 'Full Timed 100M FAT Simulation (3-Hour Exam Mode)',
    objective: 'Run C1 Set 2-2 or Parallel Predicted Paper under strict 180-min pacing + per-sub-part rubric grading.',
    deliverable: 'Target >= 78/100 and log all missed sub-parts.',
    isHighYield: true,
    targetView: 'mock',
  },
  // EXAM MORNING: Wed 25 Nov (06:00 - 08:30 IST)
  {
    id: 'sb-14',
    day: 'Exam Morning · Wed 25 Nov',
    timeWindow: '06:30 – 07:30',
    durationMins: 60,
    moduleId: 'reference',
    title: '48-Hour SM-2 Flashcard Sweep & 20 Examiner Traps',
    objective: 'Flush every due SM-2 card and scan all twenty -2M examiner traps (no new theory).',
    deliverable: '0 overdue flashcards + 2-Page A4 Formula Sheet printed/reviewed.',
    isHighYield: true,
    targetView: 'reference',
  },
  {
    id: 'sb-15',
    day: 'Exam Morning · Wed 25 Nov',
    timeWindow: '07:45 – 08:20',
    durationMins: 35,
    moduleId: 'mock',
    title: 'Weak Topics Queue Final Clear & Pacing Check',
    objective: 'Resolve any remaining urgent Weak Topics and lock 3-hour exam hall time targets.',
    deliverable: 'Calm readiness check before 09:00 IST hall entry.',
    isHighYield: false,
    targetView: 'mock',
  },
];

export const FLASHCARDS: FlashcardItem[] = [
  // M1 (10 cards)
  { id: 'fc-m1-01', moduleId: 'm1', topicId: 'm1-basics-history', tag: 'Dual Mode', front: 'What are the two hardware CPU modes, their mode-bit values, and how does a transition occur?', back: 'User Mode (mode bit = 1) and Kernel/Supervisor Mode (mode bit = 0). Transition from User -> Kernel happens only via hardware interrupt, exception, or software trap (system call); kernel resets bit to 1 on return.' },
  { id: 'fc-m1-02', moduleId: 'm1', topicId: 'm1-basics-history', tag: 'Scheduling', front: 'Contrast Multiprogramming vs Time-Sharing (Multitasking) OS.', back: 'Multiprogramming maximizes CPU utilization by switching jobs only when the running job waits for I/O. Time-sharing switches CPU frequently via timer interrupts (time quanta) to minimize interactive response time.' },
  { id: 'fc-m1-03', moduleId: 'm1', topicId: 'm1-os-structures', tag: 'Architecture', front: 'Why is a Microkernel ideal for a safety-critical medical neuro-stimulator (C2 Q1a)?', back: 'Only minimal IPC, basic scheduling, and memory management run in kernel mode; drivers & file systems run as isolated user-space servers so a driver crash cannot panic the kernel. Trade-off: IPC context-switch overhead.' },
  { id: 'fc-m1-04', moduleId: 'm1', topicId: 'm1-os-structures', tag: 'Architecture', front: 'How do Loadable Kernel Modules (LKMs) in Linux improve on pure Layered and pure Monolithic kernels?', back: 'Core kernel remains compact while modules (drivers, file systems) load dynamically at runtime and talk directly via kernel interfaces — avoiding both layered indirection overhead and microkernel message-passing latency.' },
  { id: 'fc-m1-05', moduleId: 'm1', topicId: 'm1-syscalls-services', tag: 'System Calls', front: 'List the 3 methods used to pass parameters from user space to the OS during a system call.', back: '(1) CPU Registers (fastest, limited count), (2) Block/Table in memory with its address passed in a register (Linux/Solaris), (3) Push onto program stack and pop by OS.' },
  { id: 'fc-m1-06', moduleId: 'm1', topicId: 'm1-syscalls-services', tag: 'FD Rule', front: 'How does the shell implement `./analyzer data.txt > report.log` (C2 Q1b)?', back: 'Parent calls fork(). Child calls close(1) (closing stdout), then open("report.log", O_WRONLY|O_CREAT|O_TRUNC) — OS assigns the lowest free FD (1!). Child then calls exec() so all write(1, ...) calls go to report.log.' },
  { id: 'fc-m1-07', moduleId: 'm1', topicId: 'm1-interrupts-dma', tag: 'I/O & DMA', front: 'Why does DMA dramatically outperform Interrupt-Driven I/O for disk/network transfers?', back: 'Interrupt-driven I/O interrupts the CPU once per byte/word. A DMA controller transfers an entire block directly between device buffer and RAM via cycle stealing and raises only ONE interrupt per block.' },
  { id: 'fc-m1-08', moduleId: 'm1', topicId: 'm1-interrupts-dma', tag: 'Interrupts', front: 'Differentiate a Hardware Interrupt from a Software Trap (Exception).', back: 'Hardware interrupts are asynchronous signals from external devices (timer, disk, keyboard). Traps are synchronous events caused by the currently executing instruction (system call, divide-by-zero, page fault).' },
  { id: 'fc-m1-09', moduleId: 'm1', topicId: 'm1-design-booting', tag: 'Design', front: 'State the OS design principle separating Policy from Mechanism with an example.', back: 'Policy = WHAT should be done (e.g., 10 ms vs 100 ms time quantum or priority rules). Mechanism = HOW to do it (e.g., hardware countdown timer interrupt). Separating them lets policies change without rewriting kernel mechanisms.' },
  { id: 'fc-m1-10', moduleId: 'm1', topicId: 'm1-design-booting', tag: 'Boot Sequence', front: 'Trace the 6 stages of Linux OS booting and what happens if rootfs is corrupted (C1 1-2 Q1).', back: '1. BIOS/UEFI + POST -> 2. Bootloader (GRUB) -> 3. Kernel loads into RAM -> 4. initramfs loads storage drivers -> 5. Mount root filesystem (/) -> 6. Start PID 1 (systemd/init). Missing rootfs triggers kernel panic / initramfs emergency shell; fix by repairing fstab/UUID or running fsck.' },

  // M2 (10 cards)
  { id: 'fc-m2-01', moduleId: 'm2', topicId: 'm2-process-pcb', tag: 'Process Layout', front: 'List the 4 memory sections of a process and which two grow toward each other.', back: 'Text (code), Data (globals/statics), Heap (dynamic `malloc`/`new`, grows UP), and Stack (local vars/return addresses, grows DOWN). Heap and Stack grow toward each other.' },
  { id: 'fc-m2-02', moduleId: 'm2', topicId: 'm2-process-pcb', tag: 'PCB', front: 'What 5 core fields live inside a Process Control Block (PCB) for context switching?', back: 'Process state, Program Counter (PC), CPU registers, CPU-scheduling info (priority, queue pointers), Memory-management info (page tables/base-limit), plus I/O status & open files.' },
  { id: 'fc-m2-03', moduleId: 'm2', topicId: 'm2-process-operations', tag: 'POSIX', front: 'Differentiate a Zombie process from an Orphan process.', back: 'Zombie: child terminated (`exit()`) but parent has NOT yet called `wait()` — PCB entry remains in process table. Orphan: parent terminated before child — `init`/`systemd` (PID 1) adopts and reaps the child.' },
  { id: 'fc-m2-04', moduleId: 'm2', topicId: 'm2-process-operations', tag: 'fork()', front: 'If a process executes `n` consecutive unconditional `fork()` calls, how many total processes (and how many new children) exist?', back: 'Total processes = 2^n; newly created child processes = 2^n - 1. Return values: child receives 0, parent receives child PID (>0), error returns -1.' },
  { id: 'fc-m2-05', moduleId: 'm2', topicId: 'm2-threads', tag: 'Threads', front: 'What resources are shared across threads of the same process vs private to each thread?', back: 'Shared: Code (Text), Data, Heap, Open Files & Signals. Private per thread: Thread ID, Program Counter (PC), Register Set, and Stack.' },
  { id: 'fc-m2-06', moduleId: 'm2', topicId: 'm2-threads', tag: 'Models', front: 'Compare Many-to-One, One-to-One, and Many-to-Many multithreading models.', back: 'M:1: fast user creation, but 1 blocking syscall freezes entire process & no multicore parallelism. 1:1 (Linux/Windows): true multicore concurrency, higher kernel thread overhead. M:M: multiplexes M user threads onto <=M kernel threads.' },
  { id: 'fc-m2-07', moduleId: 'm2', topicId: 'm2-nonpreemptive-scheduling', tag: 'Scheduling', front: 'What is the Convoy Effect and which scheduler suffers from it?', back: 'In FCFS, short I/O-bound processes wait behind one long CPU-bound process, causing lower CPU & I/O device utilization and inflated average waiting time.' },
  { id: 'fc-m2-08', moduleId: 'm2', topicId: 'm2-preemptive-scheduling', tag: 'Starvation', front: 'What causes Indefinite Blocking (Starvation) in Priority/SJF scheduling and how does Aging fix it?', back: 'A steady stream of higher-priority (or shorter) arrivals indefinitely delays low-priority processes. Aging gradually increases the priority of waiting processes over time so every job eventually runs.' },
  { id: 'fc-m2-09', moduleId: 'm2', topicId: 'm2-deadlock-rag', tag: 'Deadlock', front: 'State the 4 Coffman necessary conditions for Deadlock.', back: '1. Mutual Exclusion, 2. Hold and Wait, 3. No Preemption, 4. Circular Wait. Breaking ANY ONE prevents deadlock.' },
  { id: 'fc-m2-10', moduleId: 'm2', topicId: 'm2-deadlock-handling', tag: "Banker's", front: 'State the 3 validation checks in Banker’s Resource-Request Algorithm for `Request_i`.', back: '(1) Request_i <= Need_i (else error: exceeded max claim). (2) Request_i <= Available (else process waits). (3) Pretend to allocate (Avail-=Req, Alloc+=Req, Need-=Req) and run Safety Algorithm — grant ONLY if safe!' },

  // M3 (10 cards)
  { id: 'fc-m3-01', moduleId: 'm3', topicId: 'm3-ipc', tag: 'IPC', front: 'Compare Shared Memory vs Message Passing IPC on kernel intervention and speed.', back: 'Shared Memory needs kernel calls ONLY to establish the shared region — subsequent reads/writes run at RAM speed (requires user sync). Message Passing uses kernel syscalls (`send`/`recv`) per message — simpler sync, ideal for distributed systems.' },
  { id: 'fc-m3-02', moduleId: 'm3', topicId: 'm3-critical-section-peterson', tag: 'CS Criteria', front: 'Define the 3 required properties of any Critical Section solution.', back: '1. Mutual Exclusion (at most 1 process in CS). 2. Progress (if CS is free, only processes wishing to enter decide next; decision cannot be postponed indefinitely). 3. Bounded Waiting (finite bound on entries by others after a process requests CS).' },
  { id: 'fc-m3-03', moduleId: 'm3', topicId: 'm3-critical-section-peterson', tag: "Peterson's", front: 'Why can Peterson’s solution fail on modern multicore CPUs and how is it fixed?', back: 'Processors/compilers may reorder independent store/load instructions (`flag[i]=true` and `turn=j`), letting both enter CS simultaneously. Fixed by inserting Memory Barriers (fences) to enforce instruction visibility order.' },
  { id: 'fc-m3-04', moduleId: 'm3', topicId: 'm3-critical-section-peterson', tag: 'Bakery', front: 'How does Lamport’s Bakery Algorithm break ties when two processes pick the same ticket number?', back: 'Lexicographic ordering `(number[i], i) < (number[j], j)`: smaller ticket enters first; equal tickets are broken deterministically by smaller process ID `i`.' },
  { id: 'fc-m3-05', moduleId: 'm3', topicId: 'm3-hardware-sync', tag: 'Hardware Sync', front: 'Which Critical Section requirement does naive Test-and-Set / Compare-and-Swap violate?', back: 'Bounded Waiting! A waiting process may lose the atomic lock race repeatedly and starve. Solved by adding a shared `waiting[n]` array that passes the lock cyclically `(i+1) % n` on exit.' },
  { id: 'fc-m3-06', moduleId: 'm3', topicId: 'm3-mutex-semaphores', tag: 'Semaphores', front: 'What does a negative value `-k` mean in a blocking (non-busy-wait) semaphore implementation?', back: 'Its magnitude `k` equals the exact number of processes currently blocked and sleeping inside that semaphore’s waiting queue.' },
  { id: 'fc-m3-07', moduleId: 'm3', topicId: 'm3-mutex-semaphores', tag: 'Liveness', front: 'Define Priority Inversion and how the Priority-Inheritance Protocol resolves it.', back: 'A high-priority task H waits for a lock held by low-priority L while medium-priority M preempts L indefinitely. Priority Inheritance temporarily elevates L’s priority to H’s level until L releases the lock.' },
  { id: 'fc-m3-08', moduleId: 'm3', topicId: 'm3-classical-problems', tag: 'Bounded Buffer', front: 'In Producer-Consumer (`mutex=1, empty=N, full=0`), what happens if Producer executes `wait(mutex)` BEFORE `wait(empty)`?', back: 'DEADLOCK! When buffer is full (`empty=0`), Producer acquires `mutex` then sleeps on `wait(empty)` while STILL holding `mutex`. Consumer can never acquire `mutex` to consume an item and `signal(empty)`.' },
  { id: 'fc-m3-09', moduleId: 'm3', topicId: 'm3-classical-problems', tag: 'Dining Phil.', front: 'Give 3 ways to prevent deadlock in the Dining Philosophers problem.', back: '1. Allow at most 4 philosophers at the 5-chopstick table. 2. Pick up both chopsticks only if both are free inside a critical section/Monitor. 3. Asymmetric solution: odd philosophers pick left first, even pick right first.' },
  { id: 'fc-m3-10', moduleId: 'm3', topicId: 'm3-monitors', tag: 'Monitors', front: 'Compare Hoare (Signal-and-Wait) vs Mesa (Signal-and-Continue) Monitor semantics.', back: 'Hoare: signaling thread immediately hands monitor lock to woken thread (use `if`). Mesa (Java/Pthreads): signaling thread keeps running until exit; woken thread must re-check predicate in a `while` loop!' },

  // M4 (10 cards)
  { id: 'fc-m4-01', moduleId: 'm4', topicId: 'm4-contiguous-allocation', tag: 'Fragmentation', front: 'Contrast Internal vs External Fragmentation with an exact example of each.', back: 'Internal: unused memory INSIDE an allocated fixed partition/page (e.g., 2 KB allocated inside a 4 KB frame -> 2 KB wasted). External: total free memory >= request, but split into non-contiguous holes too small individually (C1 2-2 Q8: 790 KB free, 400 KB P5 rejected!).' },
  { id: 'fc-m4-02', moduleId: 'm4', topicId: 'm4-contiguous-allocation', tag: '50% Rule', front: 'What is the 50-Percent Rule in First-Fit dynamic memory allocation?', back: 'Statistical analysis shows that given N allocated blocks, another 0.5 N blocks are lost to external fragmentation — meaning roughly one-third of memory may be unusable.' },
  { id: 'fc-m4-03', moduleId: 'm4', topicId: 'm4-paging-tlb', tag: 'TLB', front: 'Why does a TLB drastically improve performance even though the Page Table already resides in RAM (C2 Q8d)?', back: 'Without a TLB, every logical memory reference requires TWO RAM accesses (page table lookup + actual data). A TLB hit resolves translation in ~10 ns associative SRAM, cutting memory accesses from 2 to 1.' },
  { id: 'fc-m4-04', moduleId: 'm4', topicId: 'm4-paging-tlb', tag: 'Page Tables', front: 'How does an Inverted Page Table save memory compared to per-process page tables?', back: 'Instead of 1 entry per virtual page per process, the system keeps ONE global table with 1 entry per physical RAM frame `<pid, page_number>`. Table size scales with physical RAM, not virtual address space.' },
  { id: 'fc-m4-05', moduleId: 'm4', topicId: 'm4-virtual-memory', tag: 'Demand Paging', front: 'List the 6 hardware/OS steps executed when a Page Fault trap occurs.', back: '1. Trap to OS on invalid-bit PTE. 2. Verify reference valid (else kill) & locate page on backing store. 3. Find free frame (or evict victim). 4. Schedule disk read into frame. 5. Update page table (valid bit = v). 6. Restart faulted instruction.' },
  { id: 'fc-m4-06', moduleId: 'm4', topicId: 'm4-page-replacement', tag: "Belady's", front: 'Define Belady’s Anomaly and explain why LRU and Optimal never exhibit it.', back: 'Belady’s Anomaly: increasing physical frames causes MORE page faults (e.g., FIFO on `1,2,3,4,1,2,5,1,2,3,4,5`: 3 frames=9 faults, 4 frames=10 faults). LRU & OPT satisfy the Stack Inclusion Property (pages in k frames are always a subset of pages in k+1 frames).' },
  { id: 'fc-m4-07', moduleId: 'm4', topicId: 'm4-thrashing-ws', tag: 'Thrashing', front: 'What is Thrashing and what triggers its feedback loop?', back: 'Thrashing occurs when a process spends more time paging (swapping) than executing. Low CPU utilization tricks a global scheduler into raising degree of multiprogramming -> fewer frames/process -> more faults -> CPU utilization collapses to near zero.' },
  { id: 'fc-m4-08', moduleId: 'm4', topicId: 'm4-thrashing-ws', tag: 'Working Set', front: 'If total RAM has 20 frames and 3 processes have WSS = 6, 8, and 7 (C1 1-2 Q6c), what must the OS do?', back: 'Total demand D = 6 + 8 + 7 = 21 > 20 frames -> thrashing imminent. OS must suspend/swap out one process and reallocate its frames to the remaining active processes.' },
  { id: 'fc-m4-09', moduleId: 'm4', topicId: 'm4-file-directories', tag: 'Directories', front: 'Compare Hard Links vs Symbolic (Soft) Links in an Acyclic-Graph (DAG) Directory.', back: 'Hard link points directly to the same inode (increments link count; file deleted only when count==0; cannot span filesystems). Soft link stores a pathname string (can span filesystems/directories, but leaves a dangling pointer if target is deleted).' },
  { id: 'fc-m4-10', moduleId: 'm4', topicId: 'm4-file-allocation', tag: 'Unix Inode', front: 'For 4 KB blocks and 4-byte block pointers, how many data blocks can 1 Double-Indirect pointer address?', back: 'Pointers per block P = 4096 / 4 = 1024 = 2^10. A double-indirect block addresses P^2 = 1024^2 = 1,048,576 blocks (= 4 GB of data!).' },

  // M5 (10 cards)
  { id: 'fc-m5-01', moduleId: 'm5', topicId: 'm5-disk-scheduling', tag: 'Disk Latency', front: 'Compute Average Rotational Latency for a 6000 RPM magnetic disk (C1 1-2 Q9).', back: '6000 RPM = 100 rotations/sec -> 1 full rotation = 10 ms. Average rotational latency = half a rotation = 5 ms.' },
  { id: 'fc-m5-02', moduleId: 'm5', topicId: 'm5-disk-scheduling', tag: 'Disk Algos', front: 'Contrast SCAN, C-SCAN, LOOK, and C-LOOK on boundary travel and wait-time uniformity.', back: 'SCAN travels to 0/maxTrack and services both ways. C-SCAN travels to boundary, wraps to other end without servicing on return (uniform wait time). LOOK/C-LOOK reverse at the last request instead of physical disk ends.' },
  { id: 'fc-m5-03', moduleId: 'm5', topicId: 'm5-disk-scheduling', tag: 'Starvation', front: 'Why can SSTF cause starvation while SCAN/LOOK guarantee bounded wait?', back: 'SSTF greedily picks the closest request; continuous arrivals near the current cylinder starve distant inner/outer tracks forever. SCAN/LOOK sweep across all cylinders systematically.' },
  { id: 'fc-m5-04', moduleId: 'm5', topicId: 'm5-raid', tag: 'RAID', front: 'Compare RAID 5 vs RAID 6 on fault tolerance, parity overhead, and minimum disks (C1 1-2 Q7).', back: 'RAID 5 uses single distributed parity (min 3 disks, N-1 usable, tolerates 1 failure). RAID 6 uses dual P+Q Reed-Solomon parity (min 4 disks, N-2 usable, tolerates ANY 2 simultaneous disk failures, slower writes).' },
  { id: 'fc-m5-05', moduleId: 'm5', topicId: 'm5-security-crypto', tag: 'Threats', front: 'Explain a Stack-Based Buffer Overflow attack and name 3 OS defenses.', back: 'Unchecked input overflows a fixed stack buffer to overwrite the saved return address with shellcode address. Defenses: (1) DEP/NX (non-executable stack), (2) ASLR (randomized memory layout), (3) Stack Canaries.' },
  { id: 'fc-m5-06', moduleId: 'm5', topicId: 'm5-security-crypto', tag: 'Crypto', front: 'How do Symmetric (AES) and Asymmetric (RSA) cryptography work together in TLS?', back: 'Asymmetric RSA/ECDHE authenticates the server via X.509 certificate and exchanges a session key; Symmetric AES encrypts bulk session traffic at 100–1000× higher speed.' },
  { id: 'fc-m5-07', moduleId: 'm5', topicId: 'm5-protection-matrix', tag: 'Protection', front: 'Compare Access Control Lists (ACL) vs Capability Lists on revocation ease.', back: 'ACL (column of Access Matrix stored per object): instant revocation by editing object’s list. Capability List (row stored per domain/user): fast access check, but hard to revoke because capabilities are scattered across domains.' },
  { id: 'fc-m5-08', moduleId: 'm5', topicId: 'm5-protection-matrix', tag: 'Access Matrix', front: 'Define Copy (*), Owner, and Control rights in an Access Matrix.', back: 'Copy (*) allows domain to copy a right within the same column (object). Owner allows adding/removing any right in that object’s column. Control allows domain D_i to modify rights in another domain D_j’s row.' },
  { id: 'fc-m5-09', moduleId: 'm5', topicId: 'm5-virtualization', tag: 'Hypervisors', front: 'Differentiate Type-1 (Bare-Metal) vs Type-2 (Hosted) Hypervisors with examples.', back: 'Type-1 runs directly on physical hardware (VMware ESXi, Xen, KVM, Hyper-V) for enterprise performance. Type-2 runs as an application atop a host OS (VirtualBox, VMware Workstation) for desktop dev/testing.' },
  { id: 'fc-m5-10', moduleId: 'm5', topicId: 'm5-virtualization', tag: 'Containers', front: 'Which two Linux kernel primitives power Docker Containers?', back: 'Namespaces (isolate PID, network, mount, IPC, UTS, user views per container) and cgroups / Control Groups (meter and cap CPU, memory, and I/O quotas per container).' },
];

export const MOCK_MCQS: MockMcqItem[] = [
  // Module 1 (10 MCQs: 6 Part A + 4 Part B)
  { id: 'mcq-m1-01', moduleId: 'm1', topicId: 'm1-basics-history', part: 'A', marks: 2, question: 'Which instruction MUST be privileged (executable only in Kernel Mode)?', options: ['Reading the system clock', 'Disabling hardware interrupts', 'Adding two user registers', 'Branching to a user subroutine'], correctIndex: 1, explanation: 'Disabling interrupts, modifying timer/base-limit registers, and direct I/O are privileged instructions; allowing user mode to disable interrupts could hijack the CPU permanently.' },
  { id: 'mcq-m1-02', moduleId: 'm1', topicId: 'm1-os-structures', part: 'A', marks: 2, question: 'What is the primary performance disadvantage of a pure Microkernel architecture?', options: ['Inability to add new device drivers', 'Frequent user-to-kernel context switches for IPC message passing', 'Lack of memory protection between services', 'Cannot support virtual memory'], correctIndex: 1, explanation: 'Moving services to user space isolates faults but forces inter-service calls to cross kernel boundaries via message passing.' },
  { id: 'mcq-m1-03', moduleId: 'm1', topicId: 'm1-syscalls-services', part: 'A', marks: 2, question: 'In POSIX/Unix, after `close(1)` is followed immediately by `open("out.txt", O_WRONLY|O_CREAT)`, which file descriptor is returned?', options: ['FD 0', 'FD 1', 'FD 2', 'FD 3'], correctIndex: 1, explanation: 'POSIX guarantees `open()` allocates the lowest-numbered unused file descriptor. Since FD 0 is open and FD 1 was just closed, FD 1 (stdout) is assigned.' },
  { id: 'mcq-m1-04', moduleId: 'm1', topicId: 'm1-interrupts-dma', part: 'A', marks: 2, question: 'How many CPU interrupts are generated when a DMA controller transfers a 4 KB disk block to RAM?', options: ['4096 interrupts (one per byte)', '1024 interrupts (one per word)', '1 interrupt upon entire block completion', '0 interrupts (CPU polls continuously)'], correctIndex: 2, explanation: 'DMA transfers the full block directly to RAM via cycle stealing and raises a single completion interrupt.' },
  { id: 'mcq-m1-05', moduleId: 'm1', topicId: 'm1-design-booting', part: 'A', marks: 2, question: 'Which Linux boot stage mounts temporary storage drivers before the real root filesystem `/` is mounted?', options: ['BIOS POST', 'GRUB Stage 1', 'initramfs', 'systemd user target'], correctIndex: 2, explanation: 'initramfs provides an in-memory initial root filesystem containing storage/LVM/NVMe drivers needed to mount the real rootfs.' },
  { id: 'mcq-m1-06', moduleId: 'm1', topicId: 'm1-basics-history', part: 'A', marks: 2, question: 'Which mechanism ensures a runaway user loop cannot monopolize the CPU forever in a Time-Sharing OS?', options: ['DMA controller', 'Hardware Timer generating periodic interrupts', 'Interrupt Vector Table', 'Bootloader checksum'], correctIndex: 1, explanation: 'A hardware countdown timer triggers an interrupt when the quantum expires, returning control to the OS kernel.' },
  { id: 'mcq-m1-07', moduleId: 'm1', topicId: 'm1-os-structures', part: 'B', marks: 10, question: 'An implantable neuro-stimulator requires strict fault isolation so a sensor driver crash never halts pacing. Which kernel structure & trade-off applies?', options: ['Monolithic; fastest driver calls with shared Ring 0 crash risk', 'Microkernel; drivers isolated in user space at the cost of IPC overhead', 'Simple MS-DOS structure; zero privilege separation', 'Batch monitor; sequential non-interactive jobs'], correctIndex: 1, explanation: 'C2 Q1a directly tests this: Microkernel isolates drivers in user space so faults do not crash the core kernel, trading minor IPC overhead for safety.' },
  { id: 'mcq-m1-08', moduleId: 'm1', topicId: 'm1-design-booting', part: 'B', marks: 10, question: 'A hospital embedded Linux patient monitor passes POST and GRUB, decompresses the kernel, then loops with `VFS: Unable to mount root fs`. Which stage failed?', options: ['Firmware POST stage', 'Bootloader MBR lookup', 'Root filesystem mount stage (missing/corrupt root= UUID or storage driver in initramfs)', 'User login shell stage'], correctIndex: 2, explanation: 'C1 Set 1-2 Q1a: Kernel booted successfully; failure occurred at rootfs mount (Stage 5) due to wrong root= parameter, corrupt filesystem, or missing initramfs driver.' },
  { id: 'mcq-m1-09', moduleId: 'm1', topicId: 'm1-syscalls-services', part: 'B', marks: 10, question: 'Why does Linux pass large sets of system-call arguments via a memory block pointer in a register rather than purely in CPU registers?', options: ['CPU registers cannot store integers', 'The number of parameters may exceed available general-purpose registers', 'Memory blocks bypass kernel mode', 'Registers are cleared before the trap fires'], correctIndex: 1, explanation: 'When a syscall requires more parameters than CPU registers available, placing parameters in a memory block and passing its base address in one register removes the argument-count ceiling.' },
  { id: 'mcq-m1-10', moduleId: 'm1', topicId: 'm1-design-booting', part: 'B', marks: 10, question: 'Which pair cleanly illustrates separating OS Policy from OS Mechanism?', options: ['Timer hardware interrupt (Mechanism) vs choosing 20 ms time quantum (Policy)', 'CPU registers (Policy) vs RAM chips (Mechanism)', 'File name (Mechanism) vs disk sector (Policy)', 'Monolithic kernel (Policy) vs Microkernel (Mechanism)'], correctIndex: 0, explanation: 'Mechanism = HOW (timer hardware); Policy = WHAT (quantum length / priority decision).' },

  // Module 2 (10 MCQs)
  { id: 'mcq-m2-01', moduleId: 'm2', topicId: 'm2-process-operations', part: 'A', marks: 2, question: 'A program runs `fork(); fork(); fork();` sequentially with no errors. How many NEW child processes are created?', options: ['3', '6', '7', '8'], correctIndex: 2, explanation: 'Total processes = 2^3 = 8; original parent is 1, so 8 - 1 = 7 new child processes.' },
  { id: 'mcq-m2-02', moduleId: 'm2', topicId: 'm2-process-operations', part: 'A', marks: 2, question: 'A child process exits, yet its PID remains visible as `<defunct>` in `ps` until the parent terminates. What state is the child in?', options: ['Orphan process', 'Zombie process', 'Swapped-out Ready process', 'Daemon process'], correctIndex: 1, explanation: 'A terminated child whose exit status has not been reaped via `wait()` by its parent is a Zombie.' },
  { id: 'mcq-m2-03', moduleId: 'm2', topicId: 'm2-threads', part: 'A', marks: 2, question: 'Which item is PRIVATE to each thread rather than shared across threads in a process?', options: ['Heap memory', 'Global variables (Data section)', 'Open file descriptor table', 'Thread Stack and Program Counter'], correctIndex: 3, explanation: 'Each thread maintains its own execution context: Stack, Registers, and Program Counter.' },
  { id: 'mcq-m2-04', moduleId: 'm2', topicId: 'm2-threads', part: 'A', marks: 2, question: 'By Amdahl’s Law, if 25% of a program is strictly serial, what is the MAXIMUM possible speedup on 4 cores?', options: ['4.00×', '2.29×', '3.00×', '1.75×'], correctIndex: 1, explanation: 'Speedup <= 1 / (0.25 + 0.75/4) = 1 / (0.25 + 0.1875) = 1 / 0.4375 = 2.29×.' },
  { id: 'mcq-m2-05', moduleId: 'm2', topicId: 'm2-deadlock-rag', part: 'A', marks: 2, question: 'If a Resource Allocation Graph with MULTIPLE instances per resource type contains a cycle, then:', options: ['Deadlock definitely exists', 'Deadlock MAY exist (cycle is necessary, not sufficient)', 'Deadlock cannot exist', 'The system is guaranteed safe'], correctIndex: 1, explanation: 'With multiple instances, a process outside the cycle may release an instance and break the wait.' },
  { id: 'mcq-m2-06', moduleId: 'm2', topicId: 'm2-nonpreemptive-scheduling', part: 'A', marks: 2, question: 'Which CPU scheduling algorithm minimizes average waiting time for a known set of jobs?', options: ['FCFS', 'Round Robin', 'SJF / SRTF', 'Priority Scheduling'], correctIndex: 2, explanation: 'Shortest-Job-First (and preemptive SRTF) is provably optimal for minimum average waiting time.' },
  { id: 'mcq-m2-07', moduleId: 'm2', topicId: 'm2-nonpreemptive-scheduling', part: 'B', marks: 10, question: 'In C1 Set 1-2 Q2 Non-Preemptive Priority (1=highest): P1(0,7,3), P2(1,5,1), P3(2,4,4), P4(3,3,2), P5(5,6,5). What is the exact Average Waiting Time?', options: ['7.20 ms', '8.40 ms', '9.60 ms', '13.40 ms'], correctIndex: 1, explanation: 'Execution order: P1[0–7], P2[7–12], P4[12–15], P3[15–19], P5[19–25]. WTs = 0, 6, 13, 9, 14 -> Sum = 42 / 5 = 8.40 ms.' },
  { id: 'mcq-m2-08', moduleId: 'm2', topicId: 'm2-deadlock-handling', part: 'B', marks: 10, question: 'In C1 Set 2-2 Q7 (Available=(2,1,1,1)), why must Request2 = (0,0,1,0) be DENIED even though Request2 <= Need2 and Request2 <= Available?', options: ['P2 exceeded Max claim', 'Tentatively granting drops Available.C to 0 while P2, P3, P4, and P5 all still need C=1 and P0/P1 hold C=0 -> UNSAFE state', 'Banker’s forbids odd requests', 'P0 cannot finish with Available=(2,1,0,1)'], correctIndex: 1, explanation: 'After P0 and P1 finish, Work becomes (4,2,0,2). Every remaining process (P2–P5) needs C>=1, so none can finish -> unsafe state!' },
  { id: 'mcq-m2-09', moduleId: 'm2', topicId: 'm2-deadlock-rag', part: 'B', marks: 10, question: 'In C2 Q4 single-instance RAG: P1 holds R1 req R2, P2 holds R2 req R3, P3 holds R3 req R1, P4 holds None req R2. Which exact set of processes is deadlocked in the cycle?', options: ['{P1, P2, P3, P4}', '{P1, P2, P3} (P4 is blocked waiting on R2, outside the cycle)', '{P2, P3, P4}', 'None — system is safe'], correctIndex: 1, explanation: 'Wait-For Graph cycle is P1 -> P2 -> P3 -> P1. P4 -> P2 feeds into the cycle (blocked indefinitely until cycle breaks) but the cycle itself is {P1, P2, P3}.' },
  { id: 'mcq-m2-10', moduleId: 'm2', topicId: 'm2-preemptive-scheduling', part: 'B', marks: 10, question: 'In C2 Q3 3D Printer jobs S1(0,25), S2(5,35), S3(10,15), S4(15,45), how do FCFS and Round Robin (q=10) compare on Average Waiting Time?', options: ['RR has lower Avg WT (22.5 vs 32.5)', 'FCFS has lower Avg WT (32.5 vs 52.5), while RR has much lower Response Time', 'Both have identical Avg WT (32.5)', 'FCFS has higher Avg TAT (82.5 vs 62.5)'], correctIndex: 1, explanation: 'FCFS Avg WT = (0+20+50+60)/4 = 32.5 ms; RR(q=10) Avg WT = 52.5 ms due to repeated time-slicing, though RR responds immediately.' },

  // Module 3 (10 MCQs)
  { id: 'mcq-m3-01', moduleId: 'm3', topicId: 'm3-critical-section-peterson', part: 'A', marks: 2, question: 'In Peterson’s solution, if `flag[0]=true`, `flag[1]=true`, and `turn=0` (C2 Q5), which process enters its Critical Section first?', options: ['P0 enters first because its loop checks `flag[1] && turn == 1` (false)', 'P1 enters first because `turn == 0`', 'Both enter simultaneously', 'Both deadlock forever'], correctIndex: 0, explanation: 'P0 waits while `(flag[1] && turn == 1)`. Since `turn == 0`, P0 exits the spin loop and enters CS immediately; P1 spins until P0 sets `flag[0] = false`.' },
  { id: 'mcq-m3-02', moduleId: 'm3', topicId: 'm3-hardware-sync', part: 'A', marks: 2, question: 'Which Critical Section criterion is NOT guaranteed by a basic `while (test_and_set(&lock));` spinlock?', options: ['Mutual Exclusion', 'Progress', 'Bounded Waiting', 'Atomicity'], correctIndex: 2, explanation: 'Naive Test-and-Set guarantees Mutual Exclusion and Progress, but a waiting thread can starve indefinitely (violating Bounded Waiting).' },
  { id: 'mcq-m3-03', moduleId: 'm3', topicId: 'm3-classical-problems', part: 'A', marks: 2, question: 'In Bounded Buffer of size 5 (C2 Q6), what are the correct initial semaphore values `(mutex, empty, full)`?', options: ['(1, 0, 5)', '(1, 5, 0)', '(0, 5, 0)', '(5, 1, 0)'], correctIndex: 1, explanation: 'Initially buffer has 5 empty slots (`empty=5`), 0 filled items (`full=0`), and unlocked critical section (`mutex=1`).' },
  { id: 'mcq-m3-04', moduleId: 'm3', topicId: 'm3-monitors', part: 'A', marks: 2, question: 'What happens when a Monitor invokes `x.signal()` on a condition variable `x` that has NO waiting processes?', options: ['It increments `x` to 1 like a semaphore', 'It has NO effect (state is not remembered)', 'It throws a runtime deadlock exception', 'It wakes a random process on another condition'], correctIndex: 1, explanation: 'Unlike semaphores, Monitor condition variables carry no internal counter; signaling an empty queue is a no-op.' },
  { id: 'mcq-m3-05', moduleId: 'm3', topicId: 'm3-mutex-semaphores', part: 'A', marks: 2, question: 'A counting semaphore initialized to 7 undergoes 20 `wait()` operations and 15 `signal()` operations. What is its final value?', options: ['2', '-2', '12', '5'], correctIndex: 0, explanation: '7 - 20 + 15 = 2.' },
  { id: 'mcq-m3-06', moduleId: 'm3', topicId: 'm3-ipc', part: 'A', marks: 2, question: 'Which IPC mechanism allows unrelated processes on the same host to communicate via a named filesystem entry?', options: ['Ordinary (Anonymous) Pipe', 'Named Pipe (FIFO)', 'Thread-local stack', 'Peterson flag array'], correctIndex: 1, explanation: 'Ordinary pipes require parent-child ancestry; Named Pipes (FIFOs) exist in the filesystem and connect unrelated processes.' },
  { id: 'mcq-m3-07', moduleId: 'm3', topicId: 'm3-classical-problems', part: 'B', marks: 10, question: 'In the Producer-Consumer problem, swapping `wait(empty); wait(mutex);` to `wait(mutex); wait(empty);` leads to what failure?', options: ['Race condition on buffer index', 'Deadlock as soon as Producer runs when the buffer is full', 'Starvation of Producer only', 'No issue — order of waits does not matter'], correctIndex: 1, explanation: 'Producer locks `mutex=0` then blocks on `empty=0`. Consumer then blocks on `wait(mutex)` and can never empty a slot -> permanent deadlock.' },
  { id: 'mcq-m3-08', moduleId: 'm3', topicId: 'm3-classical-problems', part: 'B', marks: 10, question: 'In the First Readers-Writers semaphore solution, which party risks starvation?', options: ['Readers starve whenever a writer arrives', 'Writers starve if a continuous stream of overlapping readers keeps `read_count > 0`', 'Neither can starve', 'Both deadlock immediately'], correctIndex: 1, explanation: 'Because subsequent readers bypass `rw_mutex` while `read_count >= 1`, writers waiting on `rw_mutex` can starve indefinitely.' },
  { id: 'mcq-m3-09', moduleId: 'm3', topicId: 'm3-monitors', part: 'B', marks: 10, question: 'Under Mesa Monitor semantics (used by Java `synchronized` and POSIX condition variables), why MUST `cond.wait()` be placed inside a `while (!ready)` loop rather than `if (!ready)`?', options: ['Syntax requirement of C++', 'Because the signaling thread continues running and another thread may invalidate the condition before the woken thread re-acquires the monitor lock', 'Because `if` causes busy waiting', 'Because Mesa monitors allow two threads inside the monitor simultaneously'], correctIndex: 1, explanation: 'In Mesa (signal-and-continue), another barging thread can enter and alter state between `signal()` and the woken thread resuming, so re-checking via `while` is mandatory.' },
  { id: 'mcq-m3-10', moduleId: 'm3', topicId: 'm3-critical-section-peterson', part: 'B', marks: 10, question: 'In C2 Q5 Railway Reservation (10 initial seats, each process reserves 2 inside CS), after both P0 and P1 complete Peterson’s protocol once, how many seats remain?', options: ['8 seats (lost update)', '6 seats (consistent sequential updates)', '4 seats', '10 seats'], correctIndex: 1, explanation: 'Mutual exclusion ensures P0 reads 10 -> writes 8, then P1 reads 8 -> writes 6. Final consistent seat count = 6.' },

  // Module 4 (10 MCQs)
  { id: 'mcq-m4-01', moduleId: 'm4', topicId: 'm4-paging-tlb', part: 'A', marks: 2, question: 'In C1 Set 1-2 Q5 Segmentation Table: Data(base=2500, limit=300). What happens for logical address `(Data, 350)`?', options: ['Physical address 2850', 'Physical address 2800', 'TRAP: Addressing Error (offset 350 >= limit 300)', 'Page Fault loaded from disk'], correctIndex: 2, explanation: 'Offset must satisfy `0 <= offset < limit`. Since 350 >= 300, hardware traps with a segmentation fault / addressing error.' },
  { id: 'mcq-m4-02', moduleId: 'm4', topicId: 'm4-page-replacement', part: 'A', marks: 2, question: 'Which page replacement algorithm can exhibit Belady’s Anomaly (more frames -> more faults)?', options: ['Optimal (OPT)', 'Least Recently Used (LRU)', 'First-In First-Out (FIFO)', 'All stack algorithms'], correctIndex: 2, explanation: 'FIFO is NOT a stack algorithm and exhibits Belady’s anomaly (e.g., 3 frames=9 faults vs 4 frames=10 faults on `1,2,3,4,1,2,5,1,2,3,4,5`).' },
  { id: 'mcq-m4-03', moduleId: 'm4', topicId: 'm4-thrashing-ws', part: 'A', marks: 2, question: 'In C1 Set 1-2 Q6 (`Δ=5`, string `1,2,3,2,4,1,5,2,1,3,4,5`), what is the Working Set at the 8th reference (`2`)?', options: ['{1, 2, 3, 4, 5}', '{1, 2, 4, 5}', '{2, 3, 4, 5}', '{1, 2, 3, 4}'], correctIndex: 1, explanation: 'Last 5 references ending at index 8 are `[2, 4, 1, 5, 2]` -> distinct set `{1, 2, 4, 5}` (WSS = 4).' },
  { id: 'mcq-m4-04', moduleId: 'm4', topicId: 'm4-file-directories', part: 'A', marks: 2, question: 'Which directory structure permits shared files/subdirectories while forbidding cycles?', options: ['Single-Level Directory', 'Two-Level Directory', 'Acyclic-Graph Directory (DAG)', 'General Graph Directory'], correctIndex: 2, explanation: 'DAG directories support shared links while disallowing cycles so traversal/deletion never loops.' },
  { id: 'mcq-m4-05', moduleId: 'm4', topicId: 'm4-file-allocation', part: 'A', marks: 2, question: 'Which file allocation method eliminates external fragmentation AND supports fast O(1) direct/random access without scanning a linked chain on disk?', options: ['Contiguous Allocation', 'Pure Linked Allocation', 'Indexed Allocation (Unix Inode)', 'Single-level directory'], correctIndex: 2, explanation: 'Indexed allocation stores block pointers in an index block/inode, avoiding external fragmentation and giving direct random access.' },
  { id: 'mcq-m4-06', moduleId: 'm4', topicId: 'm4-virtual-memory', part: 'A', marks: 2, question: 'What is the purpose of Copy-on-Write (COW) during `fork()`?', options: ['Avoid creating a PCB', 'Share parent/child pages read-only until either modifies a page, then copy only that page', 'Bypass the MMU entirely', 'Force immediate swap-out of parent'], correctIndex: 1, explanation: 'COW makes `fork()` near-instant (especially when followed by `exec()`) by deferring physical page copying until an actual write fault occurs.' },
  { id: 'mcq-m4-07', moduleId: 'm4', topicId: 'm4-paging-tlb', part: 'B', marks: 10, question: 'In C2 Q8 (64 KB VAS, 16 KB RAM, 1 KB page, TLB=10 ns, RAM=100 ns), what are `(p, d, f)` bit counts and EAT at 80% vs 95% TLB hit ratio?', options: ['(6,10,4); 130 ns vs 115 ns', '(4,10,6); 120 ns vs 105 ns', '(6,12,4); 140 ns vs 115 ns', '(8,8,6); 130 ns vs 110 ns'], correctIndex: 0, explanation: '64KB=2^16, 1KB=2^10 -> d=10, p=6; 16KB=2^14 -> f=4. EAT(80%)=0.8(110)+0.2(210)=130ns; EAT(95%)=0.95(110)+0.05(210)=115ns.' },
  { id: 'mcq-m4-08', moduleId: 'm4', topicId: 'm4-page-replacement', part: 'B', marks: 10, question: 'In C2 Q7 (4 frames, 20-ref string `1,2,3,4,2,1,5,6,2,1,2,3,7,6,3,2,1,2,3,6`), what are the exact page fault counts for (FIFO, LRU, OPT)?', options: ['(14, 10, 8)', '(12, 10, 8)', '(14, 12, 9)', '(15, 11, 8)'], correctIndex: 0, explanation: 'Verified via our Memory Lab engine: FIFO = 14 faults (70%), LRU = 10 faults (50%), OPT = 8 faults (40%).' },
  { id: 'mcq-m4-09', moduleId: 'm4', topicId: 'm4-contiguous-allocation', part: 'B', marks: 10, question: 'In C1 Set 2-2 Q8 (blocks `[180,420,260,500,320,380,220]`, procs `[100,410,390,350,400,240]`), why does P5 (400 KB) fail in ALL four strategies even though 790 KB remains free?', options: ['Internal fragmentation inside P1', 'External fragmentation — largest single remaining contiguous hole is only 320 KB (or 260 KB in WF) < 400 KB', 'Paging table overflow', 'Insufficient total RAM'], correctIndex: 1, explanation: 'Total remaining free memory is 790 KB (>= 400 KB), but scattered across 7 non-contiguous holes whose maximum is 320 KB -> classic external fragmentation.' },
  { id: 'mcq-m4-10', moduleId: 'm4', topicId: 'm4-file-allocation', part: 'B', marks: 10, question: 'A Unix inode has 12 direct pointers, 1 single-indirect, and 1 double-indirect pointer. Block size = 1 KB, pointer size = 4 B. How many data blocks max?', options: ['12 + 256 + 65,536 = 65,804 blocks (~64.26 MB)', '12 + 512 + 262,144 blocks', '12 + 1024 + 1,048,576 blocks', '256 blocks'], correctIndex: 0, explanation: 'P = 1024 / 4 = 256 pointers per block. Total blocks = 12 + 256 + 256^2 = 12 + 256 + 65536 = 65,804 blocks.' },

  // Module 5 (10 MCQs)
  { id: 'mcq-m5-01', moduleId: 'm5', topicId: 'm5-raid', part: 'A', marks: 2, question: 'A university data center MUST survive 2 simultaneous disk failures (C1 1-2 Q7). Which RAID level is required?', options: ['RAID 0', 'RAID 5', 'RAID 6', 'RAID 4'], correctIndex: 2, explanation: 'RAID 6 uses P+Q dual distributed parity, surviving any 2 simultaneous disk failures.' },
  { id: 'mcq-m5-02', moduleId: 'm5', topicId: 'm5-disk-scheduling', part: 'A', marks: 2, question: 'In C2 Q9, the disk head is currently at track 215 and the previous request was at track 250. Which direction is the arm moving?', options: ['Upward toward track 499', 'Downward toward track 0', 'Stationary (random)', 'Alternating every track'], correctIndex: 1, explanation: '250 -> 215 is decreasing, so initial sweep direction for LOOK/C-LOOK/SCAN is DOWNWARD toward 0.' },
  { id: 'mcq-m5-03', moduleId: 'm5', topicId: 'm5-security-crypto', part: 'A', marks: 2, question: 'To create a verifiable Digital Signature on message `M` using RSA, the sender encrypts `Hash(M)` with:', options: ['Receiver’s Public Key', 'Sender’s Private Key', 'Sender’s Public Key', 'A shared AES key'], correctIndex: 1, explanation: 'Signing uses the sender’s PRIVATE key so anyone with the sender’s PUBLIC key can verify authenticity & non-repudiation.' },
  { id: 'mcq-m5-04', moduleId: 'm5', topicId: 'm5-protection-matrix', part: 'A', marks: 2, question: 'In an Access Matrix, which implementation stores access rights column-wise (one list attached to each file/object)?', options: ['Capability List', 'Access Control List (ACL)', 'Lock-Key table', 'Domain switch table'], correctIndex: 1, explanation: 'Each column corresponds to an object -> storing non-empty column entries with the object forms an ACL.' },
  { id: 'mcq-m5-05', moduleId: 'm5', topicId: 'm5-virtualization', part: 'A', marks: 2, question: 'Which virtualization approach requires modifying the Guest OS kernel to issue explicit hypercalls?', options: ['Full Virtualization with Intel VT-x', 'Para-Virtualization (e.g., classic Xen)', 'Type-2 Emulation', 'Hardware-assisted nested paging'], correctIndex: 1, explanation: 'Para-virtualization modifies the guest OS to replace sensitive instructions with direct hypercalls to the hypervisor.' },
  { id: 'mcq-m5-06', moduleId: 'm5', topicId: 'm5-security-crypto', part: 'A', marks: 2, question: 'Which OS defense prevents injected shellcode on the stack from being executed by the CPU?', options: ['RAID 1 mirroring', 'DEP / NX (No-Execute) page bit', 'Round Robin scheduling', 'DMA cycle stealing'], correctIndex: 1, explanation: 'DEP/NX marks stack and heap memory pages non-executable so jumping to injected stack bytes raises a hardware fault.' },
  { id: 'mcq-m5-07', moduleId: 'm5', topicId: 'm5-disk-scheduling', part: 'B', marks: 10, question: 'In C2 Q9 (tracks 0–499, head=215 moving down, queue `82,170,43,140,310,465,125,230`), what is the exact total head movement for LOOK?', options: ['594 tracks', '624 tracks', '829 tracks', '680 tracks'], correctIndex: 0, explanation: 'LOOK down: 215->170->140->125->82->43 (172 tracks) then reverses up ->230->310->465 (422 tracks). Total = 172 + 422 = 594 tracks.' },
  { id: 'mcq-m5-08', moduleId: 'm5', topicId: 'm5-disk-scheduling', part: 'B', marks: 10, question: 'In C1 Set 1-2 Q9 (tracks 1–100, head=50, 1 ms/track, queue `45,20,90,10,60,80,25,70`), what is the SSTF total head movement & seek time?', options: ['130 tracks (130 ms)', '138 tracks (138 ms)', '140 tracks (140 ms)', '165 tracks (165 ms)'], correctIndex: 0, explanation: 'SSTF order: 50->45(5)->60(15)->70(10)->80(10)->90(10)->25(65)->20(5)->10(10) = 130 tracks = 130 ms.' },
  { id: 'mcq-m5-09', moduleId: 'm5', topicId: 'm5-virtualization', part: 'B', marks: 10, question: 'Why do Docker containers start in milliseconds and pack 10× higher density than Full VMs, yet offer weaker kernel isolation (C2 Q10)?', options: ['Containers run without RAM', 'Containers share the single host OS kernel via namespaces/cgroups instead of booting a guest OS per instance', 'Containers use Type-0 hardware hypervisors', 'Containers disable memory paging'], correctIndex: 1, explanation: 'Sharing the host kernel eliminates guest OS boot and RAM duplication, but a kernel vulnerability can affect all containers on that host.' },
  { id: 'mcq-m5-10', moduleId: 'm5', topicId: 'm5-protection-matrix', part: 'B', marks: 10, question: 'Why is immediate per-user permission revocation much easier in an ACL system than in a pure Capability List system?', options: ['ACLs are encrypted with RSA', 'Revoking access in an ACL modifies one centralized list on the object, whereas capabilities may be copied across many domains', 'Capability lists cannot store write rights', 'ACLs never check domain IDs'], correctIndex: 1, explanation: 'In ACLs, deleting `(User, Right)` on the object revokes immediately; in Capability systems, finding every copied capability across processes requires indirection/back-pointers or keys.' },
];

export const EXAMINER_BLUEPRINTS: ExaminerBlueprint[] = [
  { qNo: 'Q1', moduleId: 'm1', marks: '10M', bloom: 'K2–K4', archetype: 'Kernel Architecture OR Boot Failure OR Syscall/FD Redirection', markingRubric: 'Neat labeled diagram (5–7M) + Structured comparison / trace (3–5M)', mustInclude: ['User vs Kernel boundary line', 'Exact syscall names (fork/exec/open/close)', 'Trade-off sentence (latency vs isolation)'] },
  { qNo: 'Q2', moduleId: 'm2', marks: '10–15M', bloom: 'K3', archetype: 'CPU Scheduling Gantt Chart + CT/TAT/WT/RT Table', markingRubric: 'Gantt chart with timestamps (4–6M) + Per-process table (4–6M) + Averages & comparison (2–3M)', mustInclude: ['Explicit CS blocks if CS > 0', 'Formulas written before numbers', 'Units (ms) on final averages'] },
  { qNo: 'Q3', moduleId: 'm2', marks: '10–15M', bloom: 'K3–K4', archetype: "Banker's Algorithm + Resource Request OR Single-Instance RAG/WFG", markingRubric: 'Available & Need matrix (3–5M) + Work trace & Safe Sequence (4–6M) + Request/WFG decision (4–6M)', mustInclude: ['All 3 Request checks (<=Need, <=Avail, Safety)', 'Explicit <P..> safe sequence brackets', '4 Coffman conditions named'] },
  { qNo: 'Q4', moduleId: 'm3', marks: '10M', bloom: 'K3–K4', archetype: "Peterson's Contradiction Proof OR Hardware CAS", markingRubric: 'Shared variables & code (3M) + Contradiction proof (4M) + Trace / memory-barrier note (3M)', mustInclude: ['Assume both P0 & P1 in CS simultaneously', 'Show turn cannot equal both 0 and 1', 'Verify Progress & Bounded Waiting'] },
  { qNo: 'Q5', moduleId: 'm3', marks: '10M', bloom: 'K3–K4', archetype: 'Classical Semaphore Problem OR Priority Monitor Design', markingRubric: 'Semaphore/Condition init (2–3M) + Clean pseudocode (5M) + Race/deadlock/starvation proof (2–3M)', mustInclude: ['Correct wait() ordering (empty/full BEFORE mutex)', 'Anti-starvation threshold or aging if asked', 'No busy-waiting'] },
  { qNo: 'Q6', moduleId: 'm4', marks: '10–15M', bloom: 'K3', archetype: 'Page Replacement Matrix (FIFO, LRU, OPT) + Fault Ratio', markingRubric: 'FIFO trace (3–4M) + LRU trace (3–4M) + OPT trace (3–4M) + Comparison table (1–3M)', mustInclude: ['Mark H/F on every column', 'State OPT tie-break rule explicitly', 'Compute both Fault Count and Fault Rate %'] },
  { qNo: 'Q7', moduleId: 'm4', marks: '10–15M', bloom: 'K3–K5', archetype: 'Contiguous Placement (FF/BF/NF/WF) OR Paging+TLB EAT OR Segmentation', markingRubric: 'Step-by-step allocation/translation (6–10M) + Fragmentation/EAT comparison (3–5M)', mustInclude: ['Remainder stays in place', 'Next Fit wrap-around pointer shown', 'Strict offset < limit TRAP check'] },
  { qNo: 'Q8', moduleId: 'm4', marks: '10M', bloom: 'K2–K4', archetype: 'Thrashing & Working Set OR File Allocation / Unix Inode (Overdue Gap)', markingRubric: 'Diagram/curve or Inode sketch (4M) + Calculation (4M) + Mitigation/comparison (2M)', mustInclude: ['WSS(Δ) distinct set', 'D = ΣWSS > m swap-out action', 'Inode P = BlockSize/PointerSize'] },
  { qNo: 'Q9', moduleId: 'm5', marks: '10–15M', bloom: 'K3', archetype: 'Disk Scheduling (SSTF/SCAN/LOOK/C-LOOK) + RAID Selection', markingRubric: 'Head movement sketch (4–6M) + Distance sum & seek time (4–6M) + Fairness/starvation note (2–3M)', mustInclude: ['Verify arm direction from previous track', 'Distinguish SCAN boundary vs LOOK request reversal', 'Show |to - from| sum explicitly'] },
  { qNo: 'Q10', moduleId: 'm5', marks: '10M', bloom: 'K2–K3', archetype: 'Virtualization/Docker Containers OR Security/Access Matrix (Overdue Gap)', markingRubric: 'Layered architecture diagram (5–6M) + Structured comparison/mechanism (4–5M)', mustInclude: ['Hypervisor vs Host Kernel namespaces/cgroups', 'AES vs RSA + Digital Signature key direction', 'ACL vs Capability revocation'] },
];

export const EXAMINER_TRAPS: ExaminerTrap[] = [
  { id: 'trap-01', moduleId: 'm1', moduleCode: 'M1', penalty: '-2M', title: 'Missing Mode-Bit Boundary in Kernel Diagrams', mistake: 'Drawing Monolithic and Microkernel boxes without a horizontal User Space / Kernel Space line.', fix: 'Always draw a bold horizontal privilege boundary labeled `User Mode (bit=1)` above and `Kernel Mode (bit=0)` below.' },
  { id: 'trap-02', moduleId: 'm1', moduleCode: 'M1', penalty: '-2M', title: 'Wrong Syscall Order for Shell Redirection', mistake: 'Calling `open("report.log")` before `close(1)` or inside the parent process.', fix: 'Must happen in the CHILD after `fork()`: `close(1)` FIRST, then `open(...)` so OS assigns FD 1, then `exec()`.' },
  { id: 'trap-03', moduleId: 'm2', moduleCode: 'M2', penalty: '-3M', title: 'Forgetting Arrivals During Context Switch (CS)', mistake: 'Ignoring processes that arrive during a 1 ms CS block in Preemptive Priority (C1 2-2 Q5).', fix: 'Re-check the ready queue at `t + CS` before picking the next process, and exclude CS at `t=0` and after the last process.' },
  { id: 'trap-04', moduleId: 'm2', moduleCode: 'M2', penalty: '-2M', title: 'Preempting on Equal Priority', mistake: 'Preempting a running process when a newly arrived process has the SAME priority number.', fix: 'Equal priority uses FCFS (no preemption). Only strictly higher priority (smaller number when 1=highest) preempts.' },
  { id: 'trap-05', moduleId: 'm2', moduleCode: 'M2', penalty: '-2M', title: 'Confusing Priority Polarity (1=Highest vs 1=Lowest)', mistake: 'Treating priority 7 as higher than priority 1 without reading the question header.', fix: 'Underline the question’s priority rule first! VIT Chennai C1 papers explicitly specify `1 = highest priority`.' },
  { id: 'trap-06', moduleId: 'm2', moduleCode: 'M2', penalty: '-2M', title: 'Round Robin Enqueue Tie Order', mistake: 'Re-queuing the preempted running process BEFORE a new process that arrived at the exact same timestamp `t`.', fix: 'Standard Silberschatz/VIT rule: enqueue newly arrived processes with `AT <= t` FIRST, then push the preempted process to the tail.' },
  { id: 'trap-07', moduleId: 'm2', moduleCode: 'M2', penalty: '-4M', title: "Granting Banker's Request After Only Checking Request <= Available", mistake: 'Saying "Request2=(0,0,1,0) <= Available=(2,1,1,1), therefore GRANTED" in C1 2-2 Q7c.', fix: 'ALWAYS run the tentative Safety Algorithm! In C1 2-2 Q7c, granting drops `Available.C` to 0 -> UNSAFE -> MUST DENY.' },
  { id: 'trap-08', moduleId: 'm2', moduleCode: 'M2', penalty: '-2M', title: 'Claiming Every RAG Cycle Means Deadlock', mistake: 'Writing "cycle => deadlock" without specifying single-instance vs multi-instance resources.', fix: 'State explicitly: Single-instance = necessary & sufficient; Multi-instance = necessary ONLY (not sufficient).' },
  { id: 'trap-09', moduleId: 'm3', moduleCode: 'M3', penalty: '-3M', title: 'Reversing wait(mutex) and wait(empty) in Bounded Buffer', mistake: 'Writing `wait(mutex); wait(empty);` in Producer or `wait(mutex); wait(full);` in Consumer.', fix: 'ALWAYS acquire the counting semaphore (`empty` or `full`) FIRST, then acquire binary `mutex`.' },
  { id: 'trap-10', moduleId: 'm3', moduleCode: 'M3', penalty: '-2M', title: "Hand-Waving Peterson's Contradiction Proof", mistake: 'Describing Peterson’s casually instead of proving Mutual Exclusion formally.', fix: 'Assume both enter CS -> both saw `flag[other]==false` or `turn==self` -> since both flags are true before the loop, `turn` must be both 0 and 1 simultaneously -> Contradiction.' },
  { id: 'trap-11', moduleId: 'm3', moduleCode: 'M3', penalty: '-2M', title: 'Using `if` Instead of `while` in Mesa Monitors', mistake: 'Writing `if (busy) cond.wait();` in hospital/bridge monitor pseudocode.', fix: 'Use `while (condition_not_met) cond.wait();` so waking threads safely re-validate state under Mesa semantics.' },
  { id: 'trap-12', moduleId: 'm4', moduleCode: 'M4', penalty: '-2M', title: 'Treating `offset == limit` as Valid in Segmentation', mistake: 'Translating `(Data, 300)` when `limit = 300` instead of trapping.', fix: 'Valid offsets are `0` to `limit - 1`. Strictly check `offset < limit`, else write `TRAP: Addressing Error`.' },
  { id: 'trap-13', moduleId: 'm4', moduleCode: 'M4', penalty: '-2M', title: 'Missing OPT Tie-Break Rule on Never-Used-Again Pages', mistake: 'Picking an arbitrary victim when two resident pages never appear again in the reference string.', fix: 'State and follow FIFO (earliest-loaded) tie-break consistently (explicitly required in C1 2-2 Q6).' },
  { id: 'trap-14', moduleId: 'm4', moduleCode: 'M4', penalty: '-2M', title: 'Forgetting Second Memory Access on TLB Miss', mistake: 'Writing `Miss Time = T_tlb + T_mem` instead of `T_tlb + 2 * T_mem`.', fix: 'On a TLB miss, RAM is accessed TWICE: once for the Page Table Entry, once for the actual byte.' },
  { id: 'trap-15', moduleId: 'm4', moduleCode: 'M4', penalty: '-2M', title: 'Mixing Milliseconds and Nanoseconds in Demand Paging EAT', mistake: 'Plugging `8 ms` directly next to `100 ns` without unit conversion.', fix: 'Convert immediately: `1 ms = 10^6 ns`, so `8 ms = 8,000,000 ns`.' },
  { id: 'trap-16', moduleId: 'm4', moduleCode: 'M4', penalty: '-2M', title: 'Restarting Next Fit Search From Block 0', mistake: 'Tracing Next Fit identically to First Fit instead of continuing from the last allocation pointer with wrap-around.', fix: 'Track the pointer explicitly after every allocation and annotate when it wraps from Block 7 back to Block 1.' },
  { id: 'trap-17', moduleId: 'm5', moduleCode: 'M5', penalty: '-3M', title: 'Wrong Initial Disk Head Direction', mistake: 'Sweeping upward from 215 when the question says `previous request was at 250` (C2 Q9).', fix: 'Compute `current - previous = 215 - 250 = -35` -> arm is moving DOWNWARD toward 0.' },
  { id: 'trap-18', moduleId: 'm5', moduleCode: 'M5', penalty: '-2M', title: 'Touching Track 0/499 in LOOK or Skipping Boundary in SCAN', mistake: 'Adding track 0 to LOOK or omitting track 1/100 in SCAN.', fix: 'SCAN/C-SCAN ALWAYS hit the physical disk end before reversing; LOOK/C-LOOK reverse at the extreme pending request.' },
  { id: 'trap-19', moduleId: 'm5', moduleCode: 'M5', penalty: '-2M', title: 'Swapping Public vs Private Key in Digital Signatures', mistake: 'Saying the sender signs a document with their public key.', fix: 'Confidentiality = encrypt with RECEIVER PUBLIC key. Digital Signature = encrypt hash with SENDER PRIVATE key.' },
  { id: 'trap-20', moduleId: 'm5', moduleCode: 'M5', penalty: '-2M', title: 'Forgetting Total Marks Audit on Multi-Part Questions', mistake: 'Answering (a) and (b) thoroughly but skipping a 2M comparison sub-part like (d).', fix: 'Tick off every sub-part letter `(a)(b)(c)(d)` against its mark allocation before turning the page.' },
];

export const PACING_PLAN: PacingSegment[] = [
  { window: '09:00 – 09:08', minutes: 8, phase: 'Paper Triage & Direction Audit', target: 'Read all questions', tactic: 'Underline priority polarity (1=high), CS overhead, disk prev-head direction, and 15M anchors.' },
  { window: '09:08 – 10:15', minutes: 67, phase: 'Heavy 15M Numericals First (Fresh Brain)', target: 'CPU Scheduling, Banker’s, Page Replacement / Placement', tactic: 'Spend ~20–22 min per 15M numerical while arithmetic focus is sharpest; double-check sums immediately.' },
  { window: '10:15 – 11:25', minutes: 70, phase: 'Core 10M Diagrams, Sync & Disk/Memory', target: 'OS Structure, Peterson’s/Semaphore/Monitor, TLB/Disk', tactic: '12–14 min per 10M question: lead with a crisp labeled diagram or pseudocode block, then bullet justifications.' },
  { window: '11:25 – 11:45', minutes: 20, phase: 'Remaining Theory / Virtualization / Security', target: 'Containers vs VMs, RAID, Security/Files', tactic: 'Use structured comparison tables (5 rows × 3 cols) to earn full marks rapidly.' },
  { window: '11:45 – 12:00', minutes: 15, phase: '20-Trap Audit & Sub-Part Sweep', target: '0 missed sub-parts', tactic: 'Re-verify Banker’s step 3, Segmentation `< limit`, disk direction, units (ms/ns/KB), and box final answers.' },
];
