import { SlotAppearanceItem } from '../utils/predictionEngine';

export interface PaperSubPart {
  id: string;
  label: string; // e.g., "(a)", "(b)", "(c)", "(d)"
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
        stem: 'Analyze Monolithic and Microkernel operating system architectures with neat labeled structural diagrams and evaluate their core engineering trade-offs regarding fault isolation, performance, and extensibility.',
        subParts: [
          {
            id: 'c122-q1a',
            label: '(a)',
            prompt: 'Explain Monolithic and Microkernel structures with clearly labeled User/Kernel privilege boundary diagrams.',
            maxMarks: 7,
            rubricCue: 'Monolithic diagram (3.5M) showing single address space + Microkernel diagram (3.5M) showing user-space servers and IPC message passing.',
          },
          {
            id: 'c122-q1b',
            label: '(b)',
            prompt: 'List key differences, advantages, and disadvantages of both architectures in a structured technical comparison.',
            maxMarks: 3,
            rubricCue: 'Structured comparison across communication overhead, fault isolation/blast radius, reliability, and code extensibility.',
          },
        ],
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [7 Marks] — Architecture Diagrams & Privilege Boundary Analysis

**1. Monolithic Kernel Architecture [3.5 Marks]**
In a monolithic kernel, all core operating system services—including the CPU scheduler, virtual memory manager, virtual file system (VFS), networking stack, IPC primitives, and hardware device drivers—execute within a **single contiguous kernel address space** running in privileged CPU mode (\`Mode Bit = 0\`).

\`\`\`
+-------------------------------------------------------------+
| USER SPACE (Unprivileged Mode: Mode Bit = 1)                |
|   User Applications (Shell, Compilers, Web Browsers)        |
+-------------------------------------------------------------+
| [System Call Interface / TRAP: sysenter, syscall, int 0x80] |
+-------------------------------------------------------------+
| KERNEL SPACE (Privileged Mode: Mode Bit = 0)                |
|  +---------------------+ +-------------------------------+  |
|  | Process Scheduler   | | Virtual Memory & Paging       |  |
|  +---------------------+ +-------------------------------+  |
|  | Virtual File System | | Network Protocol Stack (TCP)  |  |
|  +---------------------+ +-------------------------------+  |
|  | Inter-Process Comm  | | Hardware Device Drivers (GPU) |  |
|  +---------------------+ +-------------------------------+  |
|  [Monolithic Shared Address Space: Direct C Function Calls] |
+-------------------------------------------------------------+
| HARDWARE (CPU, MMU, Physical RAM, NVMe Disks, NICs)         |
+-------------------------------------------------------------+
\`\`\`

- **Communication Mechanism**: Subsystems interact via direct, low-latency in-memory C function calls without user-kernel context switching.
- **Vulnerability**: Because there is zero memory isolation between kernel components, a null-pointer dereference or bug in a third-party peripheral device driver triggers a **kernel panic / blue screen**, crashing the entire machine.

---

**2. Microkernel Architecture [3.5 Marks]**
The microkernel philosophy follows the principle of minimal privilege: only the absolute bare essentials required to maintain the operating system remain in privileged kernel space (\`Mode Bit = 0\`). All non-essential OS services are extracted and executed as isolated **user-level server processes** (\`Mode Bit = 1\`).

\`\`\`
+-------------------------------------------------------------+
| USER SPACE (Unprivileged Mode: Mode Bit = 1)                |
|  +--------------+  +---------------+  +------------------+  |
|  | Applications |  | File Server   |  | Network Server   |  |
|  +--------------+  +---------------+  +------------------+  |
|  +-------------------+  +--------------------------------+  |
|  | Process Manager   |  | Hardware Device Drivers (NIC)  |  |
|  +-------------------+  +--------------------------------+  |
|  [Isolated User Address Spaces: Communication via IPC]      |
+-------------------------------------------------------------+
| [System Call / Trap Boundary: Context Switch to Kernel]     |
+-------------------------------------------------------------+
| MICROKERNEL (Privileged Mode: Mode Bit = 0)                 |
|  +-------------------+  +------------------+  +-----------+ |
|  | IPC Message Bus   |  | Low-Level Sched  |  | Page Map  | |
|  +-------------------+  +------------------+  +-----------+ |
+-------------------------------------------------------------+
| HARDWARE (CPU, MMU, RAM, Storage, I/O Devices)              |
+-------------------------------------------------------------+
\`\`\`

- **Kernel Resident Services**: (1) IPC message routing, (2) Low-level CPU thread scheduling, (3) Minimal address-space hardware page mapping.
- **Fault Isolation**: If the File Server or Ethernet driver crashes, its user-space process terminates and can be restarted dynamically by the process manager without halting the kernel or disrupting other running applications.

---

#### Part (b) [3 Marks] — Structured Technical Comparison

| Technical Dimension | Monolithic Architecture (Linux, FreeBSD) | Microkernel Architecture (Mach, QNX, L4) |
| :--- | :--- | :--- |
| **Privilege Distribution** | Entire OS runs in Kernel Mode (\`bit = 0\`). | Only IPC, Scheduler, MMU map in Kernel Mode. |
| **Communication Path** | Direct in-memory C function calls (zero IPC penalty). | IPC message passing (repeated user $\to$ kernel $\to$ user switches). |
| **Execution Performance** | **Highest throughput & lowest latency**. | Lower throughput due to 4 context switches per service call. |
| **Fault Isolation & Blast Radius** | **Poor**: Driver crash crashes the entire OS. | **Superior**: Driver crash only kills unprivileged user process. |
| **Extensibility & Modularity** | Requires compiling kernel modules (\`.ko\`). | New services added as standard user-space daemons. |
| **Kernel Size & Attack Surface** | Large code base (>30 million lines); large attack surface. | Minimal trusted computing base (10,000–50,000 lines). |`,
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
        stem: 'Formulate a deadlock-free and starvation-free semaphore solution for the Sleeping Barber problem consisting of one barber chair, one barber, and N waiting room chairs.',
        subParts: [
          {
            id: 'c122-q2a',
            label: '(a)',
            prompt: 'Define all semaphores and shared state variables with initial values, and write complete Barber and Customer pseudocode.',
            maxMarks: 5,
            rubricCue: 'Init customers=0, barber=0, mutex=1, waiting=0 + exact wait/signal ordering in barber and customer routines.',
          },
          {
            id: 'c122-q2b',
            label: '(b)',
            prompt: 'Explain how your solution prevents race conditions on waiting chairs, lost wakeups, and deadlock when the shop is full.',
            maxMarks: 5,
            rubricCue: 'Mutex guards waiting counter; counting semaphore stores wakeups; releasing mutex in else prevents full-shop deadlocks.',
          },
        ],
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [5 Marks] — Semaphore Definitions & Complete Pseudocode

**1. Variable & Semaphore Declarations [1.5 Marks]**
\`\`\`c
#define CHAIRS N                  // Number of chairs in the waiting room
semaphore customers = 0;          // Counting semaphore: tracks waiting customers ready for haircuts
semaphore barber = 0;             // Binary semaphore: barber chair available (0 = busy/asleep, 1 = ready)
semaphore mutex = 1;              // Binary semaphore: mutual exclusion for shared variable 'waiting'
int waiting = 0;                  // Counter: number of customers currently seated in waiting chairs
\`\`\`

**2. Barber Process Pseudocode [1.5 Marks]**
\`\`\`c
void barber() {
    while (true) {
        wait(customers);          // Block/sleep if no customers are waiting; wake when customer arrives
        wait(mutex);              // Acquire exclusive lock to update waiting room count
        waiting = waiting - 1;    // Customer leaves waiting chair to sit in the barber chair
        signal(barber);           // Notify seated customer that barber is ready to cut hair
        signal(mutex);            // Release waiting room lock
        
        cut_hair();               // Perform haircut (outside critical section!)
    }
}
\`\`\`

**3. Customer Process Pseudocode [2.0 Marks]**
\`\`\`c
void customer() {
    wait(mutex);                  // Acquire exclusive lock to inspect waiting room
    if (waiting < CHAIRS) {
        waiting = waiting + 1;    // Take an empty waiting chair
        signal(customers);        // Wake up barber if asleep (or increment pending queue)
        signal(mutex);            // Release waiting room lock BEFORE waiting for barber!
        wait(barber);             // Wait until barber is free and invites customer to chair
        
        get_haircut();            // Customer receives haircut in barber chair
    } else {
        signal(mutex);            // CRITICAL: Release lock if shop is full!
        leave();                  // Customer departs without a haircut (Baulking)
    }
}
\`\`\`

---

#### Part (b) [5 Marks] — Liveness & Correctness Proofs

- **Race Condition Prevention on \`waiting\` [1.5 Marks]**:
  The shared counter \`waiting\` is manipulated inside mutually exclusive critical sections guarded by \`wait(mutex)\` and \`signal(mutex)\`. No two customers can concurrently read and update \`waiting < CHAIRS\`, eliminating any possibility of overfilling the waiting room beyond $N$ chairs.
- **Lost Wakeup Freedom [1.5 Marks]**:
  The semaphore \`customers\` is a **counting semaphore**. If three customers arrive while the barber is actively cutting hair, they each execute \`signal(customers)\`, incrementing the semaphore count to 3. When the barber finishes and executes \`wait(customers)\`, the count decrements to 2 without sleeping. Wakeup signals are preserved in the semaphore counter, completely eliminating lost wakeups.
- **Deadlock Freedom When Shop is Full [2.0 Marks]**:
  In the \`customer()\` routine, if \`waiting == CHAIRS\`, the execution path reaches the \`else\` branch. The code explicitly calls \`signal(mutex)\` before invoking \`leave()\`. If \`signal(mutex)\` were omitted in the \`else\` branch, the baulking customer would exit while permanently holding \`mutex\`, blocking all future customers and the barber in an unrecoverable deadlock.`,
        labPresetLink: { labTab: 'sync', note: 'Step through Sleeping Barber live in Lab 3 (Synchronization)' },
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
        stem: 'Examine the phenomenon of Thrashing in demand-paged virtual memory systems. Analyze how thrashing occurs, sketch its characteristic curve, and contrast techniques used by modern operating systems to overcome it.',
        subParts: [
          {
            id: 'c122-q3a',
            label: '(a)',
            prompt: 'Explain the underlying cause of thrashing with a labeled CPU Utilization vs Degree of Multiprogramming illustration.',
            maxMarks: 5,
            rubricCue: 'Feedback loop explanation + labeled curve showing linear rise, optimal peak, and steep thrashing collapse point.',
          },
          {
            id: 'c122-q3b',
            label: '(b)',
            prompt: 'Detail techniques used by modern operating systems to overcome thrashing, including Local Replacement, Working-Set Model, and Page-Fault Frequency.',
            maxMarks: 5,
            rubricCue: 'Local replacement boundaries + Working-Set Model (D = sum WSS_i <= m) swap-out decision + PFF upper/lower thresholds.',
          },
        ],
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [5 Marks] — Cause of Thrashing & Characteristic Curve

**1. Root Cause & Positive Feedback Loop [2.5 Marks]**
A process is **thrashing** when it spends more time paging (swapping pages into and out of memory) than executing instructions.
- **Mechanics**:
  1. As the degree of multiprogramming increases, physical memory frames are divided among more processes.
  2. Each process receives fewer frames than required by its current **Locality of Reference**.
  3. Missing locality pages trigger frequent **Page Faults**.
  4. Faulting processes block on the swap disk device queue waiting for I/O page-ins.
  5. As processes block, the CPU Ready Queue empties, causing **CPU Utilization to collapse**.
  6. The OS Medium/Long-Term CPU Scheduler inspects the low CPU utilization, incorrectly infers that the system is underloaded, and **admits even more processes into memory**.
  7. This exacerbates frame starvation, page faults spike to near 100%, and the system grinds to a complete halt.

**2. Characteristic Curve [2.5 Marks]**
\`\`\`
 CPU Utilization (%)
  100% |                  Peak / Optimal Degree
       |                       (D*)
       |                      /\
       |                     /  \
       |                    /    \
       |                   /      \   <--- Steep Thrashing Collapse!
       |                  /        \
       |                 /          \
       |                /            \
    0% +---------------+--------------+-----------------> Degree of Multiprogramming
                       <-- Healthy -->  <-- Thrashing -->
\`\`\`
- **Zone 1 (Healthy Multiprogramming)**: Adding processes increases CPU utilization as the scheduler overlaps I/O wait times with compute bursts.
- **Optimal Point ($D^*$)**: Maximum throughput where physical RAM capacity perfectly accommodates the sum of all active working sets.
- **Zone 2 (Thrashing Collapse)**: Exceeding $D^*$ causes page-fault servicing times to dominate, driving CPU utilization asymptotically toward 0%.

---

#### Part (b) [5 Marks] — Operating System Remedies

**1. Local Page Replacement Policy [1.5 Marks]**
- Under **Global Replacement**, a thrashing process can steal frames from non-thrashing processes, spreading the thrashing cascade across the entire system.
- Under **Local Replacement**, a process can only evict pages from its own allocated frame quota. While the thrashing process runs slowly, it cannot corrupt the frame allocations of healthy processes.

**2. Working-Set Model (Denning) [2.0 Marks]**
- Based on the principle of locality. The parameter $\Delta$ defines the **working-set window** (e.g., the last $\Delta$ page references).
- The **Working Set Size** of process $P_i$, denoted $WSS_i(t)$, is the number of distinct pages referenced in time interval $[t - \Delta, t]$.
- The total physical memory demand is:
  $$D = \sum_{i=1}^{n} WSS_i$$
- Let $m$ be total available physical frames:
  - If $D \le m$: All active processes have their entire locality resident in RAM $\implies$ No thrashing occurs.
  - If $D > m$: System is in danger of thrashing $\implies$ The OS **suspends (swaps out)** one or more processes, frees their frames, and redistributes them until $D \le m$.

**3. Page-Fault Frequency (PFF) Strategy [1.5 Marks]**
- Directly measures the actual page-fault rate per process:
  - If $\text{Fault Rate} > \text{Upper Threshold } U$: The process is thrashing and lacks frames. The OS allocates additional physical frames to it.
  - If $\text{Fault Rate} < \text{Lower Threshold } L$: The process has excess frames that are sitting idle. The OS reclaims frames from it.
  - If page faults exceed $U$ and zero free frames exist, the OS swaps out an entire process to disk.`,
        labPresetLink: { labTab: 'memory', note: 'Explore Working Set & Page Fault Frequency in Lab 4 (Memory & Paging)' },
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
        stem: 'Compare modern virtualization architectures ranging from bare-metal hypervisors to OS-level containerization. Detail their execution layers, hardware isolation, and resource efficiency.',
        subParts: [
          {
            id: 'c122-q4a',
            label: '(a)',
            prompt: 'Explain Full Virtualization, Para-Virtualization, and OS-Level Containers (Docker) with neat layered architecture diagrams.',
            maxMarks: 6,
            rubricCue: '3 clear stack diagrams: Full VM (unmodified guest + binary translation/VT-x), Para-Virt (hypercalls), Docker (shared host kernel + namespaces/cgroups).',
          },
          {
            id: 'c122-q4b',
            label: '(b)',
            prompt: 'Compare all three paradigms across guest OS requirements, hypervisor layer, performance overhead, boot speed, and isolation boundary.',
            maxMarks: 4,
            rubricCue: '5-dimension structured comparison table with concrete engineering trade-offs.',
          },
        ],
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [6 Marks] — Layered Architectural Stacks

**1. Full Virtualization (Type-1 / Type-2 Hypervisors) [2.0 Marks]**
\`\`\`
+-----------------------+  +-----------------------+
| Guest App A           |  | Guest App B           |
+-----------------------+  +-----------------------+
| Guest OS 1 (Linux)    |  | Guest OS 2 (Windows)  |
| [Unmodified OS]       |  | [Unmodified OS]       |
+-----------------------+  +-----------------------+
| Virtual Hardware      |  | Virtual Hardware      |
+-----------------------+--+-----------------------+
| HYPERVISOR / VMM (VMware ESXi, KVM, VirtualBox)  |
| [Binary Translation / Intel VT-x Hardware Assist] |
+--------------------------------------------------+
| PHYSICAL BARE-METAL HARDWARE (x86 CPU, RAM, NIC) |
+--------------------------------------------------+
\`\`\`
- The VMM provides a complete virtual replica of underlying hardware.
- Guest operating systems run **completely unmodified**. Non-virtualizable sensitive instructions are intercepted via **Trap-and-Emulate** or hardware-assisted virtualization (Intel VT-x / AMD-V root/non-root modes).

---

**2. Para-Virtualization (e.g., Xen Classic) [2.0 Marks]**
\`\`\`
+-----------------------+  +-----------------------+
| Guest App A           |  | Guest App B           |
+-----------------------+  +-----------------------+
| Modified Guest Kernel |  | Modified Guest Kernel |
| [Custom Hypercalls]   |  | [Custom Hypercalls]   |
+-----------------------+--+-----------------------+
| HYPERVISOR (Xen Dom0 / Microkernel VMM)          |
| [Direct Hypercall Interface API]                 |
+--------------------------------------------------+
| PHYSICAL BARE-METAL HARDWARE                     |
+--------------------------------------------------+
\`\`\`
- The guest operating system kernel is **explicitly modified (enlightened)** at source code level.
- Instead of executing privileged x86 instructions that trigger slow hardware traps, the guest kernel executes software **hypercalls** directly to the hypervisor, delivering near-native execution speed.

---

**3. OS-Level Containerization (Docker, Containerd) [2.0 Marks]**
\`\`\`
+--------------------+  +--------------------+  +--------------------+
| Container 1 (AppA) |  | Container 2 (AppB) |  | Container 3 (AppC) |
| App + User Libs    |  | App + User Libs    |  | App + User Libs    |
+--------------------+  +--------------------+  +--------------------+
| CONTAINER RUNTIME / ENGINE (Docker, Podman, containerd, runc)      |
+--------------------------------------------------------------------+
| SINGLE HOST OS KERNEL (Linux 6.x)                                  |
| [Namespaces: PID, NET, MNT, IPC | Control Groups: CPU, Memory, IO] |
+--------------------------------------------------------------------+
| PHYSICAL BARE-METAL HARDWARE                                       |
+--------------------------------------------------------------------+
\`\`\`
- **No guest OS and no hypervisor**. Containers share the **single Host OS Kernel**.
- Isolation is enforced entirely through Linux kernel primitives:
  - **Namespaces**: Provide process isolation (\`pid\`), virtual networking (\`net\`), mount points (\`mnt\`), and IPC (\`ipc\`).
  - **Cgroups (Control Groups)**: Enforce strict CPU quotas, memory limits, and disk I/O throttling.

---

#### Part (b) [4 Marks] — Structured Technical Comparison

| Evaluation Metric | Full Virtualization (ESXi, KVM) | Para-Virtualization (Xen) | OS Containers (Docker) |
| :--- | :--- | :--- | :--- |
| **Guest OS Modification** | None (Runs off-the-shelf OS). | **Required** (Kernel patched for hypercalls). | **No Guest OS** (Shares host kernel). |
| **Virtualization Layer** | Full Type-1/2 Hypervisor. | Microkernel Hypervisor. | Container Engine / Host Kernel. |
| **Boot Time** | Minutes (boots full virtual hardware + OS). | Tens of seconds to minutes. | **Milliseconds** (forks isolated process). |
| **Memory Footprint** | Gigabytes per VM (duplicated OS kernel in RAM). | Hundreds of MBs to GBs per VM. | **Megabytes** per container (zero duplicate kernels). |
| **Hardware Isolation** | **Strongest**: Hardware-enforced VM boundaries. | Strong: Hypervisor boundary. | Moderate: Shared kernel attack surface. |
| **Host Compatibility** | Can run Linux on Windows or Windows on Linux. | Restricted to modified kernels. | Linux containers run on Linux kernel only. |`,
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
        stem: 'Schedule the following 10 processes using Preemptive Priority Scheduling where lower numerical value represents higher priority (1 = highest). In case of a priority tie, use FCFS without preemption. A 1 ms context-switch overhead occurs whenever CPU switches between different processes. Overhead is excluded for initial dispatch at t=0 and upon final completion. Process arrivals during context switch intervals are recognized at the completion of that interval.\n\nProcess table: P1(AT=0,BT=9,Pr=6), P2(1,5,4), P3(3,8,7), P4(4,4,2), P5(6,6,5), P6(8,3,1), P7(10,7,3), P8(12,5,4), P9(19,2,1), P10(17,4,2).',
        subParts: [
          {
            id: 'c122-q5a',
            label: '(a)',
            prompt: 'Construct the complete, verified Gantt chart timeline clearly showing all active execution slices and 1 ms context-switch blocks.',
            maxMarks: 6,
            rubricCue: 'Exact 67 ms timeline with 14 CS blocks, proper handling of P9/P6/P4/P10 preemption and tie-breaks.',
          },
          {
            id: 'c122-q5b',
            label: '(b)',
            prompt: 'Compute Completion Time (CT) for all 10 processes.',
            maxMarks: 2,
            rubricCue: 'Accurate CTs: P1=58, P2=36, P3=67, P4=14, P5=49, P6=12, P7=32, P8=42, P9=22, P10=26.',
          },
          {
            id: 'c122-q5c',
            label: '(c)',
            prompt: 'Compute Turnaround Time (TAT = CT - AT), Waiting Time (WT = TAT - BT), and Response Time (RT = FirstStart - AT) for each process.',
            maxMarks: 5,
            rubricCue: 'Complete tabular verification of TAT, WT, and RT across all 10 processes.',
          },
          {
            id: 'c122-q5d',
            label: '(d)',
            prompt: 'Calculate Average Turnaround Time and Average Waiting Time across the system.',
            maxMarks: 2,
            rubricCue: 'Avg TAT = 278 / 10 = 27.80 ms; Avg WT = 225 / 10 = 22.50 ms; Avg RT = 12.80 ms.',
          },
        ],
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [6 Marks] — Gantt Chart Construction & Dispatch Decisions

**Rules**:
1. Priority: $1 = \text{Highest}, 7 = \text{Lowest}$.
2. Preemption occurs immediately when a newly arriving process has strictly higher priority (lower value).
3. 1 ms Context-Switch (CS) overhead between process switches.
4. Total CPU Burst $= 9 + 5 + 8 + 4 + 6 + 3 + 7 + 5 + 2 + 4 = 53\text{ ms}$.
5. Exactly 14 context switches occur ($14 \times 1\text{ ms} = 14\text{ ms}$). Total time $= 53 + 14 = 67\text{ ms}$.

**Timeline Trace**:
- $t=0$: $P1$ (Pr 6) dispatches with 0 initial CS. Runs $[0 - 1]$. Remaining BT: $P1 = 8$.
- $t=1$: $P2$ arrives (Pr 4). $4 < 6 \implies P2$ preempts $P1$. $\text{CS}[1 - 2]$.
- $t=2$: $P2$ dispatches. Runs $[2 - 4]$. Remaining BT: $P2 = 3$. At $t=3$, $P3$ arrives (Pr 7, lower priority $\implies$ no preemption).
- $t=4$: $P4$ arrives (Pr 2). $2 < 4 \implies P4$ preempts $P2$. $\text{CS}[4 - 5]$.
- $t=5$: $P4$ dispatches. Runs $[5 - 8]$. Remaining BT: $P4 = 1$. At $t=6$, $P5$ arrives (Pr 5 $\implies$ no preemption).
- $t=8$: $P6$ arrives (Pr 1). $1 < 2 \implies P6$ preempts $P4$. $\text{CS}[8 - 9]$.
- $t=9$: $P6$ dispatches. Runs $[9 - 12]$ (Burst 3). **$P6$ finishes at $t=12$!**
- $t=12$: Preempted processes ready: $P4(\text{Pr } 2, \text{rem } 1), P2(\text{Pr } 4, \text{rem } 3), P5(\text{Pr } 5, \text{rem } 6), P1(\text{Pr } 6, \text{rem } 8), P3(\text{Pr } 7, \text{rem } 8)$. Highest is $P4$. Switch to $P4$: $\text{CS}[12 - 13]$.
- $t=13$: $P4$ dispatches. Runs $[13 - 14]$ (rem 1). **$P4$ finishes at $t=14$!**
- $t=14$: At $t=10$, $P7$ (Pr 3) had arrived. Highest priority ready is $P7$ (Pr 3). Switch to $P7$: $\text{CS}[14 - 15]$.
- $t=15$: $P7$ dispatches. Runs $[15 - 17]$. Remaining BT: $P7 = 5$. At $t=12$, $P8$ (Pr 4) arrived.
- $t=17$: $P10$ arrives (Pr 2). $2 < 3 \implies P10$ preempts $P7$. $\text{CS}[17 - 18]$.
- $t=18$: $P10$ dispatches. Runs $[18 - 19]$. Remaining BT: $P10 = 3$.
- $t=19$: $P9$ arrives (Pr 1). $1 < 2 \implies P9$ preempts $P10$. $\text{CS}[19 - 20]$.
- $t=20$: $P9$ dispatches. Runs $[20 - 22]$ (Burst 2). **$P9$ finishes at $t=22$!**
- $t=22$: Highest priority ready is $P10$ (Pr 2, rem 3). Switch to $P10$: $\text{CS}[22 - 23]$.
- $t=23$: $P10$ dispatches. Runs $[23 - 26]$ (rem 3). **$P10$ finishes at $t=26$!**
- $t=26$: Highest ready is $P7$ (Pr 3, rem 5). Switch to $P7$: $\text{CS}[26 - 27]$.
- $t=27$: $P7$ dispatches. Runs $[27 - 32]$ (rem 5). **$P7$ finishes at $t=32$!**
- $t=32$: Ready: $P2$ (Pr 4, rem 3, AT=1) and $P8$ (Pr 4, rem 5, AT=12). Tie-break FCFS $\implies P2$. Switch to $P2$: $\text{CS}[32 - 33]$.
- $t=33$: $P2$ dispatches. Runs $[33 - 36]$ (rem 3). **$P2$ finishes at $t=36$!**
- $t=36$: Highest ready is $P8$ (Pr 4, rem 5). Switch to $P8$: $\text{CS}[36 - 37]$.
- $t=37$: $P8$ dispatches. Runs $[37 - 42]$ (rem 5). **$P8$ finishes at $t=42$!**
- $t=42$: Highest ready is $P5$ (Pr 5, rem 6). Switch to $P5$: $\text{CS}[42 - 43]$.
- $t=43$: $P5$ dispatches. Runs $[43 - 49]$ (rem 6). **$P5$ finishes at $t=49$!**
- $t=49$: Highest ready is $P1$ (Pr 6, rem 8). Switch to $P1$: $\text{CS}[49 - 50]$.
- $t=50$: $P1$ dispatches. Runs $[50 - 58]$ (rem 8). **$P1$ finishes at $t=58$!**
- $t=58$: Lowest priority ready is $P3$ (Pr 7, rem 8). Switch to $P3$: $\text{CS}[58 - 59]$.
- $t=59$: $P3$ dispatches. Runs $[59 - 67]$ (rem 8). **$P3$ finishes at $t=67$!**

\`\`\`
Gantt Chart (67 ms Total):
|P1|CS|P2|CS|P4|CS|P6|CS|P4|CS|P7|CS|P10|CS|P9|CS|P10|CS|P7|CS|P2|CS|P8|CS|P5|CS|P1|CS|P3|
0  1  2  4  5  8  9  12 13 14 15 17 18  19 20 22 23  26 27 32 33 36 37 42 43 49 50 58 59 67
\`\`\`

---

#### Parts (b) & (c) [7 Marks] — Process Metrics Table

| Process | AT (ms) | BT (ms) | Priority | First Start | Completion (CT) | TAT (CT - AT) | WT (TAT - BT) | RT (Start - AT) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **P1** | 0 | 9 | 6 | 0 | **58** | 58 | 49 | 0 |
| **P2** | 1 | 5 | 4 | 2 | **36** | 35 | 30 | 1 |
| **P3** | 3 | 8 | 7 | 59 | **67** | 64 | 56 | 56 |
| **P4** | 4 | 4 | 2 | 5 | **14** | 10 | 6 | 1 |
| **P5** | 6 | 6 | 5 | 43 | **49** | 43 | 37 | 37 |
| **P6** | 8 | 3 | 1 | 9 | **12** | 4 | 1 | 1 |
| **P7** | 10 | 7 | 3 | 15 | **32** | 22 | 15 | 5 |
| **P8** | 12 | 5 | 4 | 37 | **42** | 30 | 25 | 25 |
| **P9** | 19 | 2 | 1 | 20 | **22** | 3 | 1 | 1 |
| **P10** | 17 | 4 | 2 | 18 | **26** | 9 | 5 | 1 |

---

#### Part (d) [2 Marks] — System Averages Calculation

- **Average Turnaround Time**:
  $$\text{Avg TAT} = \frac{58 + 35 + 64 + 10 + 43 + 4 + 22 + 30 + 3 + 9}{10} = \frac{278}{10} = \mathbf{27.80\text{ ms}}$$
- **Average Waiting Time**:
  $$\text{Avg WT} = \frac{49 + 30 + 56 + 6 + 37 + 1 + 15 + 25 + 1 + 5}{10} = \frac{225}{10} = \mathbf{22.50\text{ ms}}$$
- **Average Response Time**:
  $$\text{Avg RT} = \frac{0 + 1 + 56 + 1 + 37 + 1 + 5 + 25 + 1 + 1}{10} = \frac{128}{10} = \mathbf{12.80\text{ ms}}$$`,
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
        stem: 'Given a system with 4 initially empty physical frames and the 25-page reference string:\n\`1, 2, 3, 4, 2, 1, 5, 2, 1, 6, 3, 2, 1, 4, 2, 5, 1, 2, 7, 1, 3, 2, 4, 1, 2\`\nSimulate page replacement using FIFO, LRU, and Optimal (OPT with earliest-loaded tie break).',
        subParts: [
          {
            id: 'c122-q6a',
            label: '(a)',
            prompt: 'Trace FIFO frame-by-frame and compute page faults and hit count.',
            maxMarks: 4,
            rubricCue: 'FIFO = 17 faults, 8 hits (68% fault rate).',
          },
          {
            id: 'c122-q6b',
            label: '(b)',
            prompt: 'Trace LRU frame-by-frame and compute page faults and hit count.',
            maxMarks: 4,
            rubricCue: 'LRU = 12 faults, 13 hits (48% fault rate).',
          },
          {
            id: 'c122-q6c',
            label: '(c)',
            prompt: 'Trace Optimal (OPT) frame-by-frame with earliest-loaded tie-breaker and compute page faults and hit count.',
            maxMarks: 4,
            rubricCue: 'OPT = 10 faults, 15 hits (40% fault rate).',
          },
          {
            id: 'c122-q6d',
            label: '(d)',
            prompt: 'Construct a comparison table evaluating fault counts, hit ratios, susceptibility to Belady’s anomaly, and practical OS feasibility.',
            maxMarks: 3,
            rubricCue: 'Comprehensive evaluation matrix showing OPT theoretical minimum vs LRU stack property vs FIFO Belady vulnerability.',
          },
        ],
        workedSolution: `### Step-by-Step Examiner Solution

#### Overview of Input String
- Reference String Length: $N = 25$
- Physical Frames: $m = 4$ (initially empty)
- References: \`1, 2, 3, 4, 2, 1, 5, 2, 1, 6, 3, 2, 1, 4, 2, 5, 1, 2, 7, 1, 3, 2, 4, 1, 2\`

---

#### Part (a) [4 Marks] — First-In First-Out (FIFO) Simulation

- FIFO evicts the page that was loaded into memory earliest (oldest arrival timestamp).
- **Step-by-Step Trace**:
  - $1, 2, 3, 4$: 4 Compulsory Faults $\to$ Frames contain \`[1, 2, 3, 4]\` (Arrival ages: $1 > 2 > 3 > 4$).
  - Ref $2$: **HIT** (Frames: \`[1, 2, 3, 4]\`).
  - Ref $1$: **HIT** (Frames: \`[1, 2, 3, 4]\`).
  - Ref $5$: **FAULT**. Oldest is $1$. Evict $1 \to$ Frames: \`[5, 2, 3, 4]\`.
  - Ref $2$: **HIT** (Frames: \`[5, 2, 3, 4]\`).
  - Ref $1$: **FAULT**. Oldest is $2$. Evict $2 \to$ Frames: \`[5, 1, 3, 4]\`.
  - Ref $6$: **FAULT**. Oldest is $3$. Evict $3 \to$ Frames: \`[5, 1, 6, 4]\`.
  - Ref $3$: **FAULT**. Oldest is $4$. Evict $4 \to$ Frames: \`[5, 1, 6, 3]\`.
  - Ref $2$: **FAULT**. Oldest is $5$. Evict $5 \to$ Frames: \`[2, 1, 6, 3]\`.
  - Ref $1$: **HIT** (Frames: \`[2, 1, 6, 3]\`).
  - Ref $4$: **FAULT**. Oldest is $1$. Evict $1 \to$ Frames: \`[2, 4, 6, 3]\`.
  - Ref $2$: **HIT** (Frames: \`[2, 4, 6, 3]\`).
  - Ref $5$: **FAULT**. Oldest is $6$. Evict $6 \to$ Frames: \`[2, 4, 5, 3]\`.
  - Ref $1$: **FAULT**. Oldest is $3$. Evict $3 \to$ Frames: \`[2, 4, 5, 1]\`.
  - Ref $2$: **HIT** (Frames: \`[2, 4, 5, 1]\`).
  - Ref $7$: **FAULT**. Oldest is $2$. Evict $2 \to$ Frames: \`[7, 4, 5, 1]\`.
  - Ref $1$: **HIT** (Frames: \`[7, 4, 5, 1]\`).
  - Ref $3$: **FAULT**. Oldest is $4$. Evict $4 \to$ Frames: \`[7, 3, 5, 1]\`.
  - Ref $2$: **FAULT**. Oldest is $5$. Evict $5 \to$ Frames: \`[7, 3, 2, 1]\`.
  - Ref $4$: **FAULT**. Oldest is $1$. Evict $1 \to$ Frames: \`[7, 3, 2, 4]\`.
  - Ref $1$: **FAULT**. Oldest is $7$. Evict $7 \to$ Frames: \`[1, 3, 2, 4]\`.
  - Ref $2$: **HIT** (Frames: \`[1, 3, 2, 4]\`).
- **FIFO Summary**: **17 Page Faults**, 8 Hits (Fault Rate $= \frac{17}{25} = \mathbf{68.0\%}$, Hit Ratio $= \mathbf{32.0\%}$).

---

#### Part (b) [4 Marks] — Least Recently Used (LRU) Simulation

- LRU evicts the page whose last reference occurred furthest in the past.
- **Key Trace Moments**:
  - Refs $1, 2, 3, 4$: 4 Compulsory Faults $\to$ \`[1, 2, 3, 4]\`.
  - Refs $2, 1$: **HITS**. Recency order (most to least): $1, 2, 4, 3$.
  - Ref $5$: **FAULT**. Evict $3$ (least recently used) $\to$ \`[1, 2, 5, 4]\`.
  - Refs $2, 1$: **HITS**. Recency: $1, 2, 5, 4$.
  - Ref $6$: **FAULT**. Evict $4 \to$ \`[1, 2, 5, 6]\`.
  - Ref $3$: **FAULT**. Evict $5 \to$ \`[1, 2, 3, 6]\`.
  - Refs $2, 1$: **HITS**. Recency: $1, 2, 3, 6$.
  - Ref $4$: **FAULT**. Evict $6 \to$ \`[1, 2, 3, 4]\`.
  - Ref $2$: **HIT**.
  - Ref $5$: **FAULT**. Evict $3 \to$ \`[1, 2, 5, 4]\`.
  - Refs $1, 2$: **HITS**.
  - Ref $7$: **FAULT**. Evict $4 \to$ \`[1, 2, 5, 7]\`.
  - Ref $1$: **HIT**.
  - Ref $3$: **FAULT**. Evict $5 \to$ \`[1, 2, 3, 7]\`.
  - Ref $2$: **HIT**.
  - Ref $4$: **FAULT**. Evict $7 \to$ \`[1, 2, 3, 4]\`.
  - Refs $1, 2$: **HITS**.
- **LRU Summary**: **12 Page Faults**, 13 Hits (Fault Rate $= \frac{12}{25} = \mathbf{48.0\%}$, Hit Ratio $= \mathbf{52.0\%}$).

---

#### Part (c) [4 Marks] — Optimal (OPT) Simulation

- OPT evicts the page that will not be used for the longest period of future time.
- **Trace Highlights**:
  - Compulsory: \`[1, 2, 3, 4]\` (4 Faults).
  - At Ref $5$: Next occurrences: $2$ (next), $1$ (soon), $3$ (at ref 11), $4$ (at ref 14). Evict $4 \to$ \`[1, 2, 3, 5]\`.
  - At Ref $6$: Next occurrences: $3$ (next), $2$ (soon), $1$ (soon), $5$ (at ref 16). Evict $5 \to$ \`[1, 2, 3, 6]\`.
  - Next 4 refs ($3, 2, 1$): **All 3 HITS!**
  - At Ref $4$: Next: $2, 5, 1, 2, 7...$ Evict $6$ (never used again!) $\to$ \`[1, 2, 3, 4]\`.
  - At Ref $5$: Evict $3$ (not used until ref 21) $\to$ \`[1, 2, 5, 4]\`.
  - At Ref $7$: Evict $5$ (never used again!) $\to$ \`[1, 2, 7, 4]\`.
  - At Ref $3$: Evict $7$ (never used again!) $\to$ \`[1, 2, 3, 4]\`.
  - Remaining refs ($2, 4, 1, 2$): **All 4 HITS!**
- **OPT Summary**: **10 Page Faults**, 15 Hits (Fault Rate $= \frac{10}{25} = \mathbf{40.0\%}$, Hit Ratio $= \mathbf{60.0\%}$).

---

#### Part (d) [3 Marks] — Algorithm Evaluation Matrix

| Criterion | FIFO | LRU | Optimal (OPT) |
| :--- | :---: | :---: | :---: |
| **Total Page Faults (out of 25)** | **17 Faults** | **12 Faults** | **10 Faults** (Theoretical Minimum) |
| **Hit Ratio** | 32.0% | 52.0% | 60.0% |
| **Belady’s Anomaly Risk** | **Yes** (Vulnerable to fault increase) | **No** (Satisfies Stack Property) | **No** (Satisfies Stack Property) |
| **OS Feasibility** | Simple queue / circular array. | Expensive (needs counter/stack per access). | **Unrealizable** (Requires future oracle). |
| **Industry Practical Alternative** | Rarely used standalone. | Approximated via **Clock / Second-Chance**. | Used as theoretical benchmark only. |`,
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
        stem: 'Given a system with 6 processes (P0 to P5) and 4 resource types (A, B, C, D) with Total System Vector Total = (A=7, B=5, C=5, D=4).\n\nCurrent Allocation Matrix:\n- P0: (1, 0, 0, 1)\n- P1: (1, 1, 0, 0)\n- P2: (1, 1, 1, 0)\n- P3: (0, 1, 1, 1)\n- P4: (2, 0, 0, 1)\n- P5: (0, 1, 2, 0)\n\nMaximum Claim Matrix:\n- P0: (2, 1, 0, 2)\n- P1: (2, 2, 0, 1)\n- P2: (2, 2, 3, 1)\n- P3: (1, 2, 2, 2)\n- P4: (3, 1, 1, 2)\n- P5: (1, 2, 3, 1)',
        subParts: [
          {
            id: 'c122-q7a',
            label: '(a)',
            prompt: 'Compute Total Allocated instances, the Available vector, and the complete dynamic Need matrix.',
            maxMarks: 3,
            rubricCue: 'Total Alloc = (5, 4, 4, 3); Available = (2, 1, 1, 1); Need matrix for all 6 processes exact.',
          },
          {
            id: 'c122-q7b',
            label: '(b)',
            prompt: 'Execute the Safety Algorithm: show the step-by-step Work vector trace and identify the complete Safe Sequence.',
            maxMarks: 6,
            rubricCue: 'Step-by-step Work updates leading to safe sequence <P0, P1, P3, P4, P5, P2> and final Work = (7, 5, 5, 4).',
          },
          {
            id: 'c122-q7c',
            label: '(c)',
            prompt: 'Evaluate dynamic request: If Process P2 issues Request2 = (0, 0, 1, 0), can it be granted immediately? Justify with a full tentative safety analysis.',
            maxMarks: 6,
            rubricCue: 'Passes <=Need and <=Avail, but tentative Work=(2,1,0,1) halts after P0, P1 because remaining processes need C=1 -> UNSAFE -> DENY!',
          },
        ],
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [3 Marks] — Available Vector & Need Matrix Computation

**1. Total Allocation Vector**:
$$\sum \text{Allocation} = (1+1+1+0+2+0, 0+1+1+1+0+1, 0+0+1+1+0+2, 1+0+0+1+1+0) = \mathbf{(5, 4, 4, 3)}$$

**2. Available Vector**:
$$\text{Available} = \text{Total} - \sum \text{Allocation} = (7, 5, 5, 4) - (5, 4, 4, 3) = \mathbf{(2, 1, 1, 1)}$$

**3. Need Matrix ($\text{Need}[i] = \text{Max}[i] - \text{Allocation}[i]$)**:
- $\text{Need}[P0] = (2, 1, 0, 2) - (1, 0, 0, 1) = \mathbf{(1, 1, 0, 1)}$
- $\text{Need}[P1] = (2, 2, 0, 1) - (1, 1, 0, 0) = \mathbf{(1, 1, 0, 1)}$
- $\text{Need}[P2] = (2, 2, 3, 1) - (1, 1, 1, 0) = \mathbf{(1, 1, 2, 1)}$
- $\text{Need}[P3] = (1, 2, 2, 2) - (0, 1, 1, 1) = \mathbf{(1, 1, 1, 1)}$
- $\text{Need}[P4] = (3, 1, 1, 2) - (2, 0, 0, 1) = \mathbf{(1, 1, 1, 1)}$
- $\text{Need}[P5] = (1, 2, 3, 1) - (0, 1, 2, 0) = \mathbf{(1, 1, 1, 1)}$

---

#### Part (b) [6 Marks] — Safety Algorithm Execution Trace

- Initialize: $\text{Work} = \text{Available} = (2, 1, 1, 1)$, $\text{Finish}[P0..P5] = [\text{False}, \dots, \text{False}]$.

**Step 1: Inspect P0**
- $\text{Need}[P0] = (1, 1, 0, 1) \le \text{Work}(2, 1, 1, 1) \implies \mathbf{TRUE}$.
- $P0$ executes and releases its resources:
  $$\text{Work} = (2, 1, 1, 1) + (1, 0, 0, 1) = \mathbf{(3, 1, 1, 2)}$$
- $\text{Finish}[P0] = \text{True}$.

**Step 2: Inspect P1**
- $\text{Need}[P1] = (1, 1, 0, 1) \le \text{Work}(3, 1, 1, 2) \implies \mathbf{TRUE}$.
- $P1$ executes and releases its resources:
  $$\text{Work} = (3, 1, 1, 2) + (1, 1, 0, 0) = \mathbf{(4, 2, 1, 2)}$$
- $\text{Finish}[P1] = \text{True}$.

**Step 3: Inspect P3**
- $\text{Need}[P3] = (1, 1, 1, 1) \le \text{Work}(4, 2, 1, 2) \implies \mathbf{TRUE}$.
- $P3$ executes and releases its resources:
  $$\text{Work} = (4, 2, 1, 2) + (0, 1, 1, 1) = \mathbf{(4, 3, 2, 3)}$$
- $\text{Finish}[P3] = \text{True}$.

**Step 4: Inspect P4**
- $\text{Need}[P4] = (1, 1, 1, 1) \le \text{Work}(4, 3, 2, 3) \implies \mathbf{TRUE}$.
- $P4$ executes and releases its resources:
  $$\text{Work} = (4, 3, 2, 3) + (2, 0, 0, 1) = \mathbf{(6, 3, 2, 4)}$$
- $\text{Finish}[P4] = \text{True}$.

**Step 5: Inspect P5**
- $\text{Need}[P5] = (1, 1, 1, 1) \le \text{Work}(6, 3, 2, 4) \implies \mathbf{TRUE}$.
- $P5$ executes and releases its resources:
  $$\text{Work} = (6, 3, 2, 4) + (0, 1, 2, 0) = \mathbf{(6, 4, 4, 4)}$$
- $\text{Finish}[P5] = \text{True}$.

**Step 6: Inspect P2**
- $\text{Need}[P2] = (1, 1, 2, 1) \le \text{Work}(6, 4, 4, 4) \implies \mathbf{TRUE}$.
- $P2$ executes and releases its resources:
  $$\text{Work} = (6, 4, 4, 4) + (1, 1, 1, 0) = \mathbf{(7, 5, 5, 4)}$$
- $\text{Finish}[P2] = \text{True}$.

**Conclusion**: All processes finish ($\{P0, P1, P3, P4, P5, P2\}$). The system is in a **SAFE STATE** with Safe Sequence:
$$\mathbf{\langle P0, P1, P3, P4, P5, P2 \rangle}$$

---

#### Part (c) [6 Marks] — Dynamic Request Evaluation: $Request_2 = (0, 0, 1, 0)$

**Condition Checks**:
1. $Request_2 (0, 0, 1, 0) \le \text{Need}[P2] (1, 1, 2, 1) \implies \mathbf{TRUE}$.
2. $Request_2 (0, 0, 1, 0) \le \text{Available} (2, 1, 1, 1) \implies \mathbf{TRUE}$.

**Tentative State Construction**:
- $\text{Available}' = \text{Available} - Request_2 = (2, 1, 1, 1) - (0, 0, 1, 0) = \mathbf{(2, 1, 0, 1)}$
- $\text{Allocation}'[P2] = (1, 1, 1, 0) + (0, 0, 1, 0) = (1, 1, 2, 0)$
- $\text{Need}'[P2] = (1, 1, 2, 1) - (0, 0, 1, 0) = (1, 1, 1, 1)$

**Tentative Safety Algorithm Execution**:
- Initialize: $\text{Work} = (2, 1, 0, 1)$.
- **Check P0**: $\text{Need}[P0] = (1, 1, 0, 1) \le \text{Work}(2, 1, 0, 1) \implies \mathbf{TRUE}$.
  $$\text{Work} = (2, 1, 0, 1) + (1, 0, 0, 1) = \mathbf{(3, 1, 0, 2)}$$
- **Check P1**: $\text{Need}[P1] = (1, 1, 0, 1) \le \text{Work}(3, 1, 0, 2) \implies \mathbf{TRUE}$.
  $$\text{Work} = (3, 1, 0, 2) + (1, 1, 0, 0) = \mathbf{(4, 2, 0, 2)}$$
- **Check All Remaining Processes (P2, P3, P4, P5)**:
  - $\text{Need}[P2] = (1, 1, 1, 1)$ requires $C = 1$. But $\text{Work}.C = 0 \implies$ **BLOCKED**.
  - $\text{Need}[P3] = (1, 1, 1, 1)$ requires $C = 1$. But $\text{Work}.C = 0 \implies$ **BLOCKED**.
  - $\text{Need}[P4] = (1, 1, 1, 1)$ requires $C = 1$. But $\text{Work}.C = 0 \implies$ **BLOCKED**.
  - $\text{Need}[P5] = (1, 1, 1, 1)$ requires $C = 1$. But $\text{Work}.C = 0 \implies$ **BLOCKED**.

**Verdict**: Zero processes can proceed. The tentative state is **DEADLOCKED / UNSAFE**!
**Examiner Decision**: **Request2 CANNOT be granted immediately.** Process $P2$ must wait, and the tentative allocation must be rolled back.`,
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
        stem: 'A system has 7 free memory blocks: [180, 420, 260, 500, 320, 380, 220] KB in memory order. Six process requests arrive sequentially: P1 = 100 KB, P2 = 410 KB, P3 = 390 KB, P4 = 350 KB, P5 = 400 KB, P6 = 240 KB. When a block is allocated, the leftover space remains in the same position as a smaller free block.',
        subParts: [
          {
            id: 'c122-q8a',
            label: '(a)',
            prompt: 'Trace First Fit and Best Fit allocations and show the final state of memory blocks.',
            maxMarks: 4,
            rubricCue: 'Both allocate P1, P2, P3, P4, P6 (5/6); P5 fails; final blocks = [80, 10, 20, 110, 320, 30, 220] KB.',
          },
          {
            id: 'c122-q8b',
            label: '(b)',
            prompt: 'Trace Next Fit starting from Block 1, showing pointer movement and wrap-around behavior.',
            maxMarks: 4,
            rubricCue: 'Pointer advances sequentially; wraps from block 7 to block 1; allocates 5/6 processes, P5 fails.',
          },
          {
            id: 'c122-q8c',
            label: '(c)',
            prompt: 'Trace Worst Fit allocation and show block splits and final block capacities.',
            maxMarks: 4,
            rubricCue: 'P1->500(400), P2->420(10), P3->400(10), P4->380(30), P5 fails, P6->320(80); final blocks = [180, 10, 260, 10, 80, 30, 220] KB.',
          },
          {
            id: 'c122-q8d',
            label: '(d)',
            prompt: 'Compare all 4 algorithms on successful allocations, total free memory, and largest contiguous block. Formally explain external fragmentation in this context.',
            maxMarks: 3,
            rubricCue: 'All strategies leave 790 KB free memory (> 400 KB needed by P5), yet P5 is starved due to external fragmentation.',
          },
        ],
        workedSolution: `### Step-by-Step Examiner Solution

#### Initial System State
- Free Blocks: $B1=180, B2=420, B3=260, B4=500, B5=320, B6=380, B7=220\text{ KB}$.
- Total Initial Free Memory $= 180 + 420 + 260 + 500 + 320 + 380 + 220 = \mathbf{2280\text{ KB}}$.
- Process Requests: $P1=100, P2=410, P3=390, P4=350, P5=400, P6=240\text{ KB}$.

---

#### Part (a) [4 Marks] — First Fit & Best Fit Traces

**1. First Fit (FF) Trace**:
- $P1 (100\text{ KB}) \to$ fits $B1 (180)$. Leftover in $B1 = 180 - 100 = \mathbf{80\text{ KB}}$.
- $P2 (410\text{ KB}) \to$ skips $B1(80)$, fits $B2 (420)$. Leftover in $B2 = 420 - 410 = \mathbf{10\text{ KB}}$.
- $P3 (390\text{ KB}) \to$ skips $B1(80), B2(10), B3(260)$, fits $B4 (500)$. Leftover in $B4 = 500 - 390 = \mathbf{110\text{ KB}}$.
- $P4 (350\text{ KB}) \to$ skips $B1..B5(320)$, fits $B6 (380)$. Leftover in $B6 = 380 - 350 = \mathbf{30\text{ KB}}$.
- $P5 (400\text{ KB}) \to$ Available blocks: $[80, 10, 260, 110, 320, 30, 220]$. None is $\ge 400\text{ KB} \implies \mathbf{P5\text{ CANNOT BE ALLOCATED}}$.
- $P6 (240\text{ KB}) \to$ skips $B1, B2$, fits $B3 (260)$. Leftover in $B3 = 260 - 240 = \mathbf{20\text{ KB}}$.
- **Final FF Blocks**: \`[80, 10, 20, 110, 320, 30, 220] KB\` (Total Free $= 790\text{ KB}$, Largest $= 320\text{ KB}$).

**2. Best Fit (BF) Trace**:
- Always chooses smallest block $\ge$ request size:
  - $P1 (100) \to B1 (180)$ (smallest fit $\ge 100$). Leftover: $80\text{ KB}$.
  - $P2 (410) \to B2 (420)$ (smallest fit $\ge 410$). Leftover: $10\text{ KB}$.
  - $P3 (390) \to B4 (500)$ (only fit $\ge 390$). Leftover: $110\text{ KB}$.
  - $P4 (350) \to B6 (380)$ (smallest fit $\ge 350$). Leftover: $30\text{ KB}$.
  - $P5 (400) \to$ None $\ge 400 \implies \mathbf{P5\text{ FAILS}}$.
  - $P6 (240) \to B3 (260)$ (smallest fit $\ge 240$). Leftover: $20\text{ KB}$.
- **Final BF Blocks**: Identical to FF: \`[80, 10, 20, 110, 320, 30, 220] KB\`.

---

#### Part (b) [4 Marks] — Next Fit (NF) Trace

- Next Fit begins scanning from the point of the previous allocation and wraps to block 1:
  - $P1 (100) \to$ starts at $B1$, fits $B1(180 \to 80\text{ KB})$. Pointer at $B1$.
  - $P2 (410) \to$ scans from $B1$: $B2(420 \to 10\text{ KB})$. Pointer at $B2$.
  - $P3 (390) \to$ scans from $B2$: skips $B3(260)$, fits $B4(500 \to 110\text{ KB})$. Pointer at $B4$.
  - $P4 (350) \to$ scans from $B4$: skips $B5(320)$, fits $B6(380 \to 30\text{ KB})$. Pointer at $B6$.
  - $P5 (400) \to$ scans $B7(220)$, wraps to $B1(80), B2(10), B3(260), B4(110), B5(320), B6(30) \implies$ None fits $\implies \mathbf{P5\text{ FAILS}}$. Pointer remains at $B6$.
  - $P6 (240) \to$ scans from $B6$: skips $B7(220)$, wraps to $B1(80), B2(10)$, fits $B3(260 \to 20\text{ KB})$. Pointer at $B3$.
- **Final NF Blocks**: \`[80, 10, 20, 110, 320, 30, 220] KB\`.

---

#### Part (c) [4 Marks] — Worst Fit (WF) Trace

- Always allocates into the currently largest available free hole:
  - $P1 (100) \to$ largest is $B4 (500)$. Leftover: $500 - 100 = \mathbf{400\text{ KB}}$.
  - $P2 (410) \to$ largest is $B2 (420)$. Leftover: $420 - 410 = \mathbf{10\text{ KB}}$.
  - $P3 (390) \to$ largest is $B4 (400)$. Leftover: $400 - 390 = \mathbf{10\text{ KB}}$.
  - $P4 (350) \to$ largest is $B6 (380)$. Leftover: $380 - 350 = \mathbf{30\text{ KB}}$.
  - $P5 (400) \to$ largest remaining block is $B5(320\text{ KB}) < 400 \implies \mathbf{P5\text{ FAILS}}$.
  - $P6 (240) \to$ largest remaining block is $B5(320)$. Leftover: $320 - 240 = \mathbf{80\text{ KB}}$.
- **Final WF Blocks**: \`[180, 10, 260, 10, 80, 30, 220] KB\` (Total Free $= 790\text{ KB}$, Largest $= 260\text{ KB}$).

---

#### Part (d) [3 Marks] — Comprehensive Comparison & External Fragmentation Proof

| Strategy | Allocated Count | Starved Processes | Final Largest Block | Total Free Memory |
| :--- | :---: | :---: | :---: | :---: |
| **First Fit** | 5 of 6 (83.3%) | P5 (400 KB) | 320 KB (B5) | **790 KB** |
| **Best Fit** | 5 of 6 (83.3%) | P5 (400 KB) | 320 KB (B5) | **790 KB** |
| **Next Fit** | 5 of 6 (83.3%) | P5 (400 KB) | 320 KB (B5) | **790 KB** |
| **Worst Fit** | 5 of 6 (83.3%) | P5 (400 KB) | 260 KB (B3) | **790 KB** |

- **External Fragmentation Analysis**:
  In all 4 placement strategies, **790 KB** of total unallocated physical memory remains free. Process $P5$ requires only **400 KB**. Even though the total available memory ($790\text{ KB}$) is almost double the requested memory ($400\text{ KB}$), $P5$ cannot be scheduled because the free memory is shattered into non-contiguous fragments whose maximum individual size is at most 320 KB (or 260 KB in Worst Fit).
- **Remedies**:
  1. **Compaction**: Shuffle all occupied memory blocks toward low memory to coalesce all free fragments into one continuous hole of 790 KB (requires dynamic relocatable addressing via base/limit registers).
  2. **Non-Contiguous Paging**: Decompose the process address space into fixed-size pages (e.g., 4 KB) mapped via page tables, completely eliminating external fragmentation.`,
        labPresetLink: { labTab: 'memory', note: 'Trace all 4 placement strategies in Lab 4 (Memory & Paging)' },
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
        stem: 'A critical care hospital embedded Linux patient-monitoring device enters an endless reboot loop immediately after the kernel loads into RAM because its root filesystem cannot be mounted.',
        subParts: [
          {
            id: 'c112-q1a',
            label: '(a)',
            prompt: 'Explain the complete 6-stage Linux boot sequence, pinpoint the exact failing stage in this scenario, and specify concrete diagnostic and recovery steps.',
            maxMarks: 5,
            rubricCue: '6 boot stages (POST, Bootloader, Kernel, initramfs, Root Mount, init/systemd) + Stage 5 rootfs mount failure + UUID/initramfs driver/fsck fix.',
          },
          {
            id: 'c112-q1b',
            label: '(b)',
            prompt: 'Compare Multiprogramming vs Time-Sharing operating systems across CPU switching triggers, response latency, and scheduler goals. Justify why Time-Sharing is mandatory for live patient vital-sign telemetry.',
            maxMarks: 5,
            rubricCue: 'Structured comparison table + explanation of periodic timer preemption guaranteeing bounded response time (<=100 ms) for vital cardiac alarms.',
          },
        ],
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [5 Marks] — 6-Stage Linux Boot Sequence & Failure Diagnosis

**1. The 6 Standard Linux Boot Stages [2.5 Marks]**:
1. **BIOS / UEFI POST (Power-On Self-Test)**: Validates CPU, RAM, NVMe/SATA storage; executes firmware initialization and locates the Master Boot Record (MBR) or EFI System Partition (ESP).
2. **Bootloader (GRUB 2 / U-Boot)**: Loads the compressed Linux kernel image (\`vmlinuz\`) and initial RAM disk (\`initrd\` / \`initramfs\`) into physical memory.
3. **Kernel Initialization**: Decompresses kernel, initializes hardware architecture, page tables, interrupts, device drivers, and mounts \`initramfs\`.
4. **Initial RAM Disk (\`initramfs\`)**: Temporary root filesystem in RAM providing essential modular storage/RAID/NVMe drivers required to access real physical drives.
5. **Mounting the Real Root Filesystem (\`/\`) [FAILING STAGE]**: Kernel switches from temporary RAM disk to the permanent root partition (e.g., \`mount -o ro /dev/nvme0n1p2 /\`).
6. **Init Process Execution (\`systemd\` / PID 1)**: Spawns user-space daemons, networking, device managers (\`udev\`), and patient monitor UI services.

**2. Failure Diagnosis & Recovery Steps [2.5 Marks]**:
- **Pinpoint Failure**: Stage 5 (Mounting Root Filesystem). When the kernel cannot locate, decrypt, or mount the storage block device specified by the kernel command-line parameter \`root=UUID=...\`, it throws a kernel panic (\`VFS: Unable to mount root fs on unknown-block(0,0)\`) and reboots.
- **Root Causes**:
  1. Storage partition UUID changed or corrupted in \`/etc/fstab\` or GRUB boot menu.
  2. Missing NVMe/Flash storage driver inside the \`initramfs\` image.
  3. Dirty filesystem shutdown causing filesystem corruption.
- **Recovery Procedure**:
  - Boot into GRUB recovery / single-user mode (\`init=/bin/sh\`).
  - Verify \`root=UUID=...\` parameter matches \`blkid\` output.
  - Rebuild the \`initramfs\` with missing flash drivers: \`dracut -f\` or \`update-initramfs -u\`.
  - Execute \`fsck.ext4 -y /dev/sda1\` to clean corrupted superblocks and journal logs.

---

#### Part (b) [5 Marks] — Multiprogramming vs Time-Sharing for Patient Monitoring

| Criterion | Multiprogramming OS | Time-Sharing OS (Preemptive Multitasking) |
| :--- | :--- | :--- |
| **CPU Switching Trigger** | Switches ONLY when running job blocks on I/O or yields voluntarily. | Switches on **periodic hardware timer interrupts** (quantum slice, e.g. 10 ms). |
| **Primary Design Goal** | **Maximize CPU Utilization & Throughput**. | **Minimize Interactive Response Time & Enforce Fairness**. |
| **Context Switching** | Non-preemptive; long compute jobs monopolize CPU. | Preemptive; CPU forcibly taken when time slice expires. |
| **Response Latency** | Unpredictable (tens of seconds to minutes). | **Strictly bounded (milliseconds)**. |

- **Clinical Justification for Patient Monitoring**:
  In a hospital telemetry device, high-priority sensor threads continuously monitor cardiac arrhythmia (ECG) and pulse oximetry ($SpO_2$).
  - Under basic multiprogramming, if a low-priority logging or diagnostics batch task enters a compute loop, it will hold the CPU indefinitely until it voluntarily performs I/O. A critical ventricular fibrillation cardiac alarm would be starved, resulting in fatal delayed defibrillation.
  - Under Time-Sharing (with preemptive scheduling and priority bands), periodic timer interrupts ensure the kernel retains control every few milliseconds. When an emergency vital-sign interrupt fires, the scheduler immediately preempts running user tasks and dispatches the alarm handler within $< 5\text{ ms}$.`,
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
        stem: 'Schedule the following 5 processes using Non-Preemptive Priority Scheduling where lower numerical value represents higher priority (1 = highest priority). In case of a priority tie, use FCFS order.\n\nProcess table: P1(AT=0,BT=7,Pr=3), P2(1,5,1), P3(2,4,4), P4(3,3,2), P5(5,6,5).',
        subParts: [
          {
            id: 'c112-q2a',
            label: '(a)',
            prompt: 'Construct the Gantt chart and compute Completion Time (CT), Turnaround Time (TAT), Waiting Time (WT), and their averages.',
            maxMarks: 4,
            rubricCue: 'P1[0-7] P2[7-12] P4[12-15] P3[15-19] P5[19-25]; Avg WT = 42/5 = 8.40 ms, Avg TAT = 67/5 = 13.40 ms.',
          },
          {
            id: 'c112-q2b',
            label: '(b)',
            prompt: 'Compare performance with FCFS, analyze two severe limitations of pure static priority scheduling, and explain how the Aging technique eliminates starvation.',
            maxMarks: 6,
            rubricCue: 'FCFS Avg WT = 8.60 ms + Starvation/Indefinite Blocking & Priority Inversion + Aging formula and implementation.',
          },
        ],
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [4 Marks] — Non-Preemptive Priority Scheduling Execution

**1. Dispatch Decisions**:
- $t=0$: Only $P1$ has arrived. $P1$ dispatches. Because scheduling is **non-preemptive**, $P1$ runs uninterrupted to completion for its full 7 ms burst ($[0 - 7]$).
- During $[0 - 7]$, processes $P2 (AT=1, Pr=1), P3 (AT=2, Pr=4), P4 (AT=3, Pr=2), P5 (AT=5, Pr=5)$ all arrive and enter the Ready Queue.
- $t=7$: $P1$ completes. Compare priorities among ready processes:
  - $P2$: Priority 1 (Highest)
  - $P4$: Priority 2
  - $P3$: Priority 4
  - $P5$: Priority 5
  - $\implies P2$ is dispatched. Runs $[7 - 12]$.
- $t=12$: $P2$ completes. Highest ready process is $P4$ (Pr 2). Runs $[12 - 15]$.
- $t=15$: $P4$ completes. Highest ready process is $P3$ (Pr 4). Runs $[15 - 19]$.
- $t=19$: $P3$ completes. Only $P5$ (Pr 5) remains. Runs $[19 - 25]$.
- $t=25$: All processes completed.

\`\`\`
Gantt Chart (Non-Preemptive Priority):
|      P1 (7)      |    P2 (5)    |   P4 (3)   |   P3 (4)   |      P5 (6)      |
0                 7             12          15          19                 25
\`\`\`

**2. Metrics Table**:
| Process | AT (ms) | BT (ms) | Priority | Completion (CT) | TAT (CT - AT) | WT (TAT - BT) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **P1** | 0 | 7 | 3 | **7** | 7 | **0** |
| **P2** | 1 | 5 | 1 | **12** | 11 | **6** |
| **P3** | 2 | 4 | 4 | **19** | 17 | **13** |
| **P4** | 3 | 3 | 2 | **15** | 12 | **9** |
| **P5** | 5 | 6 | 5 | **25** | 20 | **14** |

**3. System Averages**:
- **Average Turnaround Time**: $\text{Avg TAT} = \frac{7 + 11 + 17 + 12 + 20}{5} = \frac{67}{5} = \mathbf{13.40\text{ ms}}$
- **Average Waiting Time**: $\text{Avg WT} = \frac{0 + 6 + 13 + 9 + 14}{5} = \frac{42}{5} = \mathbf{8.40\text{ ms}}$

---

#### Part (b) [6 Marks] — FCFS Comparison, Limitations & Aging

**1. FCFS Comparison [2.0 Marks]**:
- Under pure FCFS, execution follows arrival order: $P1[0-7] \to P2[7-12] \to P3[12-16] \to P4[16-19] \to P5[19-25]$.
  - Waiting Times: $P1 = 0, P2 = 7 - 1 = 6, P3 = 12 - 2 = 10, P4 = 16 - 3 = 13, P5 = 19 - 5 = 14\text{ ms}$.
  - FCFS Avg WT $= \frac{0 + 6 + 10 + 13 + 14}{5} = \frac{43}{5} = \mathbf{8.60\text{ ms}}$.
- Priority scheduling marginally improves average waiting time ($8.40\text{ ms} < 8.60\text{ ms}$) while dramatically speeding up high-priority job $P4$ ($9\text{ ms}$ vs $13\text{ ms}$).

**2. Two Severe Limitations of Static Priority Scheduling [2.0 Marks]**:
1. **Starvation (Indefinite Blocking)**: Low-priority processes (such as $P5$) can wait indefinitely in the Ready Queue if higher-priority processes arrive continuously. In extreme cases, a low-priority job never finishes (e.g., the MIT CTSS shutdown in 1973 where a low-priority job submitted in 1967 had still not run!).
2. **Priority Inversion**: A low-priority process $L$ holds a resource needed by high-priority process $H$. A medium-priority process $M$ that does not need the resource preempts $L$, indirectly blocking $H$ behind $M$. (Resolved via Priority Inheritance).

**3. Aging Mechanism [2.0 Marks]**:
- **Definition**: Aging is a dynamic scheduling technique where the priority of waiting processes is gradually and monotonically increased as time elapses in the Ready Queue.
- **Mathematical Rule**:
  $$\text{Effective Priority}(t) = \text{Static Priority} - \left\lfloor \frac{\text{Waiting Time}(t)}{K} \right\rfloor$$
  (where lower numerical value $=$ higher priority, and $K$ is an OS tuning constant, e.g., decrement priority value by 1 every 10 ms).
- **Outcome**: Even the lowest-priority process $P5$ will eventually age to Priority 1 and be guaranteed execution, providing mathematical immunity against starvation.`,
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
        stem: 'Two concurrent railway reservation booking terminal threads (P0 and P1) update a shared coach seat availability counter using Peterson’s two-process software synchronization algorithm.',
        subParts: [
          {
            id: 'c112-q3a',
            label: '(a)',
            prompt: 'Explain the role and significance of the two shared variables flag[2] and turn in Peterson’s algorithm.',
            maxMarks: 3,
            rubricCue: 'flag[i]=true indicates process Pi wants to enter; turn variable acts as polite tie-breaker giving priority to peer.',
          },
          {
            id: 'c112-q3b',
            label: '(b)',
            prompt: 'Prove Mutual Exclusion formally by contradiction. Show why both terminals can never execute in the critical section simultaneously.',
            maxMarks: 4,
            rubricCue: 'Both in CS implies flag[0]=T & flag[1]=T -> turn must equal 0 and 1 simultaneously -> Contradiction.',
          },
          {
            id: 'c112-q3c',
            label: '(c)',
            prompt: 'Trace the state of both processes when P0 and P1 attempt simultaneous entry: P0 writes turn=1, then immediately P1 writes turn=0.',
            maxMarks: 3,
            rubricCue: 'Last write to turn wins tie; turn=0 causes P0 while-condition to evaluate false, allowing P0 to enter CS first.',
          },
        ],
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [3 Marks] — Shared Variables in Peterson's Algorithm

Peterson’s algorithm uses two shared variables to coordinate entry between Process $0$ ($P0$) and Process $1$ ($P1$):

\`\`\`c
boolean flag[2];  // Initially: flag[0] = false, flag[1] = false
int turn;         // Initially: turn = 0 or 1
\`\`\`

1. **\`flag[2]\` (Intent Array)**:
   - \`flag[i] = true\` signifies that process $P_i$ has a pending intent / request to enter its Critical Section.
   - Initialized to \`false\` so processes do not block each other when idle.
2. **\`turn\` (Tie-Breaker Variable)**:
   - Resolves simultaneous requests. When $P_i$ wishes to enter, it politely sets \`turn = j\` (handing initial priority to its rival).
   - Because \`turn\` is a single memory scalar holding either 0 or 1, it guarantees that exactly one process will find the spin condition false.

---

#### Part (b) [4 Marks] — Formal Proof of Mutual Exclusion by Contradiction

**Structure of Process $P_i$**:
\`\`\`c
flag[i] = true;
turn = j;
while (flag[j] && turn == j);  // Busy wait (spin)
/* CRITICAL SECTION */
flag[i] = false;
\`\`\`

**Contradiction Proof**:
1. **Hypothesis**: Assume both $P0$ and $P1$ are inside the Critical Section simultaneously at time $t$.
2. To have entered the Critical Section:
   - $P0$ must have exited its \`while\` loop, meaning at that instant:
     $$\text{either } (\text{flag}[1] == \text{false}) \quad \text{OR} \quad (\text{turn} == 0)$$
   - $P1$ must have exited its \`while\` loop, meaning at that instant:
     $$\text{either } (\text{flag}[0] == \text{false}) \quad \text{OR} \quad (\text{turn} == 1)$$
3. However, before reaching their \`while\` loops, both processes unconditionally executed:
   - $P0$ executed \`flag[0] = true\`.
   - $P1$ executed \`flag[1] = true\`.
   - Because neither has reached the exit section (\`flag = false\`), both \`flag[0] == true\` and \`flag[1] == true\` must hold concurrently.
4. Therefore, for both to bypass their spin loops:
   - $P0$ required $\text{turn} == 0$.
   - $P1$ required $\text{turn} == 1$.
5. But \`turn\` is an atomic scalar in memory. It can hold $0$ OR it can hold $1$, but **cannot hold both $0$ and $1$ simultaneously**.
6. This yields a mathematical **contradiction**. Hence, the hypothesis is false, proving that Mutual Exclusion is unconditionally preserved.

---

#### Part (c) [3 Marks] — Simultaneous Arrival Execution Trace

- **Chronological Sequence**:
  1. $t_0$: Both terminals attempt booking.
  2. $t_1$: $P0$ sets \`flag[0] = true\`; $P1$ sets \`flag[1] = true\`.
  3. $t_2$: $P0$ executes \`turn = 1\`.
  4. $t_3$: Immediately after, $P1$ executes \`turn = 0\` (overwriting \`turn\`).
  5. Current state: \`flag[0] = true\`, \`flag[1] = true\`, \`turn = 0\`.
- **Spin Condition Evaluation**:
  - **Terminal P0 Evaluates**: \`while (flag[1] && turn == 1)\`
    - \`flag[1]\` is \`true\`, but \`turn\` is \`0\` (not \`1\`).
    - Condition is $\mathbf{false} \implies P0$ **breaks out of the loop and ENTERS Critical Section!**
  - **Terminal P1 Evaluates**: \`while (flag[0] && turn == 0)\`
    - \`flag[0]\` is \`true\`, and \`turn\` is \`0\`.
    - Condition is $\mathbf{true} \implies P1$ **busy waits in the spin loop.**
- **Exit & Handoff**:
  - $P0$ updates the coach seat counter, then executes \`flag[0] = false\`.
  - Now $P1$’s condition \`flag[0] && turn == 0\` becomes \`false && 0 == 0\`, which evaluates to \`false\`.
  - $P1$ exits its spin loop and enters the Critical Section safely. Zero seats are double-booked.`,
        labPresetLink: { labTab: 'sync', note: 'Trace Peterson’s live in Lab 3 (Synchronization)' },
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
        stem: 'A multispecialty hospital has 3 operating theatres shared by 5 surgical teams. Emergency trauma surgeries must take priority over scheduled elective surgeries. However, to prevent scheduled patients from starving indefinitely, after 2 consecutive emergency surgeries, at least one scheduled surgery must be admitted. Furthermore, every theatre requires mandatory post-surgery chemical cleaning before it can be reassigned.',
        subParts: [
          {
            id: 'c112-q4a',
            label: '(a)',
            prompt: 'Design a Monitor structure containing state variables, condition variables, and complete pseudocode for requestTheatre(isEmergency), releaseTheatre(), and completeCleaning().',
            maxMarks: 6,
            rubricCue: 'Clean monitor declaration + Mesa while-loops + threshold logic + freeTheatres++ strictly inside completeCleaning().',
          },
          {
            id: 'c112-q4b',
            label: '(b)',
            prompt: 'Analyze how your monitor guarantees starvation freedom for scheduled elective surgeries under an unbroken stream of emergency trauma arrivals.',
            maxMarks: 4,
            rubricCue: 'Explain how consecutiveEmergencies >= 2 forces emergency surgeries to queue on emergCV, allowing schedCV to be signaled.',
          },
        ],
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [6 Marks] — Complete Operating Theatre Monitor Specification

\`\`\`c
monitor OperatingTheatreManager {
    // Shared Monitor State Variables
    int freeTheatres = 3;                // Total physical operating theatres
    int waitingEmergency = 0;           // Count of queued trauma emergencies
    int waitingScheduled = 0;           // Count of queued elective surgeries
    int consecutiveEmergencies = 0;     // Counter tracking consecutive trauma grants
    const int EMERGENCY_THRESHOLD = 2;   // Anti-starvation limit
    
    // Condition Variables
    condition emergCV;                  // Queue for emergency surgeries
    condition schedCV;                  // Queue for scheduled surgeries
    
    // Entry Procedure 1: Request Theatre
    entry void requestTheatre(boolean isEmergency) {
        if (isEmergency) {
            waitingEmergency++;
            // Block if no rooms OR if threshold reached while scheduled surgeries are waiting
            while (freeTheatres == 0 || (waitingScheduled > 0 && consecutiveEmergencies >= EMERGENCY_THRESHOLD)) {
                wait(emergCV);
            }
            waitingEmergency--;
            freeTheatres--;
            consecutiveEmergencies++;
        } else {
            waitingScheduled++;
            // Scheduled surgeries wait if no rooms OR if emergencies have priority
            while (freeTheatres == 0 || (waitingEmergency > 0 && consecutiveEmergencies < EMERGENCY_THRESHOLD)) {
                wait(schedCV);
            }
            waitingScheduled--;
            freeTheatres--;
            consecutiveEmergencies = 0; // Reset threshold counter when scheduled runs!
        }
    }
    
    // Entry Procedure 2: Release Theatre (Surgery Completed)
    entry void releaseTheatre() {
        // NOTE: Do NOT increment freeTheatres yet! Room must be sanitized first.
        startCleaningCycle();
    }
    
    // Entry Procedure 3: Complete Cleaning (Sanitization Finished)
    entry void completeCleaning() {
        freeTheatres++;
        
        // Priority Dispatching with Anti-Starvation Check
        if (waitingScheduled > 0 && consecutiveEmergencies >= EMERGENCY_THRESHOLD) {
            signal(schedCV);             // Force admission of scheduled surgery
        } else if (waitingEmergency > 0) {
            signal(emergCV);             // Prioritize emergency surgery
        } else if (waitingScheduled > 0) {
            signal(schedCV);             // Adhere to scheduled queue
        }
    }
}
\`\`\`

---

#### Part (b) [4 Marks] — Starvation Prevention Analysis

**1. The Threat of Starvation**:
In emergency departments, life-threatening trauma patients arrive unpredictably. Under a naive priority monitor, an unbroken succession of trauma arrivals would keep \`waitingEmergency > 0\` indefinitely, causing elective cancer and orthopedic surgeries to be postponed forever.

**2. Anti-Starvation Mechanism in the Designed Monitor**:
- The monitor enforces an explicit boundary counter: \`consecutiveEmergencies\`.
- Whenever an emergency surgery is admitted, \`consecutiveEmergencies\` is incremented.
- Once \`consecutiveEmergencies == 2\` and there is at least one scheduled surgery waiting (\`waitingScheduled > 0\`):
  1. Any newly arriving emergency surgery evaluates the condition \`waitingScheduled > 0 && consecutiveEmergencies >= EMERGENCY_THRESHOLD\` to **TRUE**, forcing it to block on \`wait(emergCV)\`.
  2. When an operating theatre finishes its cleaning cycle in \`completeCleaning()\`, the dispatch logic checks \`consecutiveEmergencies >= 2\` and explicitly issues \`signal(schedCV)\`.
  3. The scheduled surgery wakes up, acquires the theatre, and resets \`consecutiveEmergencies = 0\`.
- **Guarantee**: No scheduled patient can wait for more than 2 consecutive emergency surgical cycles, formally bounding waiting time and preventing starvation.`,
        labPresetLink: { labTab: 'sync', note: 'Analyze condition variables & monitor scheduling in Lab 3' },
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
        stem: 'An operating system uses a segmented memory model. The Segment Table is configured as follows:\n- Segment 0 (Code): Base = 1000, Limit = 400\n- Segment 1 (Data): Base = 2500, Limit = 300\n- Segment 2 (Heap): Base = 4000, Limit = 500\n- Segment 3 (Stack): Base = 6000, Limit = 200',
        subParts: [
          {
            id: 'c112-q5a',
            label: '(a)',
            prompt: 'Translate the following logical addresses [Segment Number, Offset] into physical RAM addresses or specify if a TRAP addressing error occurs: (i) [0, 250], (ii) [1, 350], (iii) [2, 400], (iv) [3, 150].',
            maxMarks: 4,
            rubricCue: '1250, TRAP (350 >= 300 limit), 4400, 6150 with explicit offset < limit boundary checks.',
          },
          {
            id: 'c112-q5b',
            label: '(b)',
            prompt: 'Differentiate between Internal Fragmentation and External Fragmentation in memory allocation architectures.',
            maxMarks: 3,
            rubricCue: 'Unused space inside allocated fixed block vs scattered unallocated free holes outside variable segments.',
          },
          {
            id: 'c112-q5c',
            label: '(c)',
            prompt: 'Explain a concrete engineering technique used to reduce or eliminate external fragmentation in segmented memory systems.',
            maxMarks: 3,
            rubricCue: 'Paged Segmentation (breaking segments into fixed-size pages) or runtime memory compaction.',
          },
        ],
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [4 Marks] — Address Translation Calculations

**Hardware Translation Rule**:
For logical address $[s, d]$:
1. Check if offset $d < \text{Limit}[s]$.
2. If $d \ge \text{Limit}[s] \implies$ **TRAP: Addressing Error (Segmentation Fault)**.
3. If $d < \text{Limit}[s] \implies \text{Physical Address} = \text{Base}[s] + d$.

---

- **(i) Address $[0, 250]$ (Segment 0: Code, Base=1000, Limit=400)**:
  - Check: $250 < 400 \implies \mathbf{VALID}$.
  - $\text{Physical Address} = 1000 + 250 = \mathbf{1250}$.

- **(ii) Address $[1, 350]$ (Segment 1: Data, Base=2500, Limit=300)**:
  - Check: $350 < 300 \implies \mathbf{FALSE}$ ($350 \ge 300$).
  - $\implies \mathbf{TRAP: \text{Addressing Exception / Segmentation Violation (SIGSEGV)}}$.
  - The process attempted to access beyond the legal boundary of its Data segment; CPU hardware interrupts into kernel mode.

- **(iii) Address $[2, 400]$ (Segment 2: Heap, Base=4000, Limit=500)**:
  - Check: $400 < 500 \implies \mathbf{VALID}$.
  - $\text{Physical Address} = 4000 + 400 = \mathbf{4400}$.

- **(iv) Address $[3, 150]$ (Segment 3: Stack, Base=6000, Limit=200)**:
  - Check: $150 < 200 \implies \mathbf{VALID}$.
  - $\text{Physical Address} = 6000 + 150 = \mathbf{6150}$.

---

#### Part (b) [3 Marks] — Internal vs External Fragmentation

| Technical Aspect | Internal Fragmentation | External Fragmentation |
| :--- | :--- | :--- |
| **Location** | **Inside** the allocated memory unit. | **Between** allocated memory blocks. |
| **Root Cause** | Memory allocated in fixed-size blocks (e.g., 4 KB pages); process requests 1.2 KB, leaving 2.8 KB wasted internally. | Variable-size partitions/segments loaded and deleted over time leave scattered free memory holes. |
| **System Visibility** | OS cannot reclaim wasted space until process terminates. | Total free memory may exceed request, but no single continuous hole is large enough. |
| **Architecture** | Prevalent in **Paging**. | Prevalent in **Segmentation** and dynamic contiguous placement. |

---

#### Part (c) [3 Marks] — Technique to Mitigate External Fragmentation

**Paged Segmentation (e.g., Intel x86 Protected Mode)**:
- Pure segmentation suffers severely from external fragmentation because segments have variable lengths (e.g., Code $= 120\text{ KB}$, Stack $= 32\text{ KB}$).
- **Solution**: Combine Segmentation with Paging:
  1. The user/compiler views memory logically as variable-length segments (Code, Data, Stack).
  2. Each segment is divided internally into fixed-size **pages** (e.g., 4 KB each).
  3. The Segment Table entry no longer points to physical base RAM; instead, it points to a **Page Table Base Address** for that segment.
  4. Physical allocation occurs purely at page-frame level. Because frames can be placed anywhere non-contiguously in RAM, **external fragmentation is 100% eliminated** while preserving segment-level memory protection.`,
        labPresetLink: { labTab: 'memory', note: 'Verify Segmentation Table in Lab 4 (Memory & Paging)' },
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
        stem: 'Given the page reference string: `1, 2, 3, 2, 4, 1, 5, 2, 1, 3, 4, 5` with a working-set window parameter of Δ = 5.',
        subParts: [
          {
            id: 'c112-q6a',
            label: '(a)',
            prompt: 'Determine the Working Set WSS(t) at the 8th reference and at the 12th reference.',
            maxMarks: 4,
            rubricCue: '8th ref window [2,4,1,5,2] -> {1,2,4,5} (WSS=4); 12th ref window [2,1,3,4,5] -> {1,2,3,4,5} (WSS=5).',
          },
          {
            id: 'c112-q6b',
            label: '(b)',
            prompt: 'What occurs if this process requires 4 physical frames to accommodate its working set, but the OS allocates only 3 frames?',
            maxMarks: 2,
            rubricCue: 'Active locality does not fit in RAM -> repeated page-fault spiral -> Thrashing.',
          },
          {
            id: 'c112-q6c',
            label: '(c)',
            prompt: 'A system has 20 physical frames and 3 concurrent processes with Working Set Sizes of 6, 8, and 7 frames. Formulate the exact decision the OS must execute.',
            maxMarks: 4,
            rubricCue: 'Total demand D = 6 + 8 + 7 = 21 frames > 20 available -> OS must suspend/swap out 1 process to disk.',
          },
        ],
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [4 Marks] — Working-Set Calculation at 8th and 12th References

**Definition**:
The Working-Set Window $\Delta = 5$ looks back across the most recent 5 page references up to and including reference index $t$.
$$WSS(t) = |\text{distinct pages in interval } [t - \Delta + 1, t]|$$

- **1. At the 8th Reference ($t = 8$)**:
  - Full string: \`1, 2, 3, 2, 4, 1, 5, 2\` ...
  - Window of the last 5 references (indices 4 to 8): \`[2, 4, 1, 5, 2]\`.
  - Unique page set: $\mathbf{\{1, 2, 4, 5\}}$.
  - **Working Set Size**: $WSS(8) = \mathbf{4\text{ frames}}$.

- **2. At the 12th Reference ($t = 12$)**:
  - Full string: \`1, 2, 3, 2, 4, 1, 5, 2, 1, 3, 4, 5\`
  - Window of the last 5 references (indices 8 to 12): \`[2, 1, 3, 4, 5]\`.
  - Unique page set: $\mathbf{\{1, 2, 3, 4, 5\}}$.
  - **Working Set Size**: $WSS(12) = \mathbf{5\text{ frames}}$.

---

#### Part (b) [2 Marks] — Frame Starvation & Thrashing Behavior

- If a process requires $WSS(t) = 4\text{ frames}$ to contain its current execution locality, but is allocated only $3\text{ frames}$:
  1. At least one page belonging to its immediate loop/instruction locality cannot reside in physical RAM.
  2. Every time that page is referenced, a page fault is generated.
  3. The page replacement algorithm evicts one of the other 3 active locality pages.
  4. Almost immediately, the evicted page is referenced again, triggering another fault.
  5. The process enters an endless **Page-Fault Loop (Thrashing)**, spending nearly 100% of its execution time blocked on disk I/O with zero computational progress.

---

#### Part (c) [4 Marks] — System Thrashing Decision & Medium-Term Scheduling

- **System Parameters**:
  - Total Available Physical Frames: $m = 20$.
  - Three active processes: $P1 (WSS_1 = 6), P2 (WSS_2 = 8), P3 (WSS_3 = 7)$.
- **Total Memory Demand Calculation**:
  $$D = \sum_{i=1}^{3} WSS_i = 6 + 8 + 7 = \mathbf{21\text{ frames}}$$
- **Evaluation**:
  $$D (21) > m (20)$$
  The collective memory demand strictly exceeds total physical RAM capacity.
- **Mandatory Operating System Action**:
  1. The OS **cannot satisfy all three working sets simultaneously**. If it attempts to run all three, global page faulting will collapse CPU throughput.
  2. The Medium-Term Scheduler must immediately **suspend (swap out)** one process (e.g., $P3$ with $WSS = 7$) and move its memory pages to the swap partition on disk.
  3. The freed frames are redistributed to $P1$ and $P2$, yielding demand $D' = 6 + 8 = 14 \le 20$.
  4. $P1$ and $P2$ execute at 100% full speed with minimal page faults. Once one completes, the suspended process $P3$ is swapped back into RAM.`,
        labPresetLink: { labTab: 'memory', note: 'Evaluate Working Set snapshots in Lab 4 (Memory & Paging)' },
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
        stem: 'Scenario 1: A University Data Center hosts critical student examination records, grading databases, and financial transaction ledgers. The storage subsystem must survive any 2 simultaneous disk drive failures without any downtime or data loss.\n\nScenario 2: A Multimedia Video Editing Studio processes multi-terabyte raw 8K video scratch footage. Video render files are temporary and can be easily regenerated from cloud master copies. The team requires maximum possible read/write throughput and 100% usable storage capacity.',
        subParts: [
          {
            id: 'c112-q7a',
            label: '(a)',
            prompt: 'Identify the appropriate RAID level for Scenario 1 and Scenario 2.',
            maxMarks: 2,
            rubricCue: 'Scenario 1 = RAID 6; Scenario 2 = RAID 0.',
          },
          {
            id: 'c112-q7b',
            label: '(b)',
            prompt: 'Provide rigorous technical justifications for both selections based on parity mechanics, performance, and fault tolerance.',
            maxMarks: 4,
            rubricCue: 'Dual Reed-Solomon P+Q parity for 2-drive failure survival vs block striping across N drives with zero parity write penalty.',
          },
          {
            id: 'c112-q7c',
            label: '(c)',
            prompt: 'Compare RAID 5 vs RAID 6 across fault tolerance, usable capacity on N disks, and write penalty.',
            maxMarks: 2,
            rubricCue: '1 vs 2 disk failures; (N-1) vs (N-2) capacity; 4 I/Os vs 6 I/Os write penalty.',
          },
          {
            id: 'c112-q7d',
            label: '(d)',
            prompt: 'Explain mathematically why RAID 0 is completely unacceptable for the University Data Center.',
            maxMarks: 2,
            rubricCue: 'Zero fault tolerance: MTTF of array is MTTF_disk / N; failure of 1 drive destroys entire array volume.',
          },
        ],
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [2 Marks] — RAID Level Identification
- **Scenario 1 (University Data Center)**: **RAID 6** (Block-level striping with dual distributed P+Q parity).
- **Scenario 2 (Multimedia Video Studio)**: **RAID 0** (Block-level striping with zero redundancy).

---

#### Part (b) [4 Marks] — Technical Justifications

**1. Justification for Scenario 1 (RAID 6) [2.0 Marks]**:
- The University Data Center mandates surviving **2 simultaneous drive failures**.
- RAID 6 computes two independent parity syndromes: standard XOR parity ($P$) and Galois Field Reed-Solomon polynomial syndrome ($Q$), distributed across all $N$ physical drives.
- **Dual-Failure Resilience**: If one disk fails and a second disk suffers a catastrophic read error (Unrecoverable Read Error, URE) during the high-stress multi-hour array rebuild, RAID 6 mathematically reconstructs all lost data, preventing downtime and permanent record loss.

**2. Justification for Scenario 2 (RAID 0) [2.0 Marks]**:
- The 8K video render workflow requires raw streaming bandwidth.
- RAID 0 stripes data blocks cyclically across $N$ disks without computing or writing any parity bits.
- **Performance**: Read and write throughput scales linearly to $N \times \text{Single Disk Throughput}$.
- **Storage Capacity**: $100\%$ of purchased disk capacity is usable ($N \times C$). Because video scratch data is temporary and regenerable, zero redundancy is an acceptable trade-off for maximum speed.

---

#### Part (c) [2 Marks] — RAID 5 vs RAID 6 Comparison

| Technical Metric | RAID 5 | RAID 6 |
| :--- | :---: | :---: |
| **Simultaneous Drive Failures Tolerated** | **1 Disk Failure** | **2 Disk Failures** |
| **Usable Capacity ($N$ disks of capacity $C$)** | $(N - 1) \times C$ | $(N - 2) \times C$ |
| **Parity Overhead** | 1 disk equivalent (XOR $P$) | 2 disks equivalent (Dual $P + Q$) |
| **Write Penalty (Small Random Write)** | **4 I/O operations** (2 reads + 2 writes) | **6 I/O operations** (3 reads + 3 writes) |

---

#### Part (d) [2 Marks] — Why RAID 0 is Unacceptable for University Records

- **Zero Redundancy**: RAID 0 provides no parity, mirroring, or error correction.
- **Reliability Degradation Formula**:
  For an array of $N$ identical disks each with Mean Time To Failure $MTTF_{\text{disk}}$:
  $$MTTF_{\text{array}} = \frac{MTTF_{\text{disk}}}{N}$$
  In an 8-disk RAID 0 array, the storage volume is **8 times more likely to fail** than a single drive!
- **Catastrophic Impact**: If even one drive in the array develops a bad sector or mechanical failure, the striping stripe set is broken, and the entire University database (examination grades, student degrees, fee payments) is permanently corrupted and lost.`,
        labPresetLink: { labTab: 'disk', note: 'Compare RAID 0/5/6 capacity in Lab 5 (Disk & RAID)' },
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
        stem: 'A system consists of 4 processes (P0 to P3) and 3 resource types (A, B, C) with Total System Vector Total = (A=6, B=4, C=5).\n\nCurrent Allocation Matrix:\n- P0: (1, 0, 1)\n- P1: (1, 1, 0)\n- P2: (1, 1, 1)\n- P3: (0, 0, 1)\n\nMaximum Claim Matrix:\n- P0: (3, 2, 2)\n- P1: (2, 2, 1)\n- P2: (4, 2, 2)\n- P3: (2, 1, 2)',
        subParts: [
          {
            id: 'c112-q8a',
            label: '(a)',
            prompt: 'Compute the current Available resource vector.',
            maxMarks: 2,
            rubricCue: 'Total Alloc = (3, 2, 3) => Available = (6,4,5) - (3,2,3) = (3, 2, 2).',
          },
          {
            id: 'c112-q8b',
            label: '(b)',
            prompt: 'Construct the complete Need matrix for all 4 processes.',
            maxMarks: 3,
            rubricCue: 'Need: P0(2,2,1), P1(1,1,1), P2(3,1,1), P3(2,1,1).',
          },
          {
            id: 'c112-q8c',
            label: '(c)',
            prompt: 'Execute the Safety Algorithm: show the step-by-step Work vector updates and derive a valid Safe Sequence.',
            maxMarks: 4,
            rubricCue: 'Work trace: Work=(3,2,2) -> P0(4,2,3) -> P1(5,3,3) -> P2(6,4,4) -> P3(6,4,5); Safe sequence <P0, P1, P2, P3>.',
          },
          {
            id: 'c112-q8d',
            label: '(d)',
            prompt: 'Explain the Wait-For Graph (WFG) cycle detection algorithm and prove why the presence of a cycle is a necessary AND sufficient condition for deadlock in single-instance systems, but only a necessary condition in multi-instance systems.',
            maxMarks: 6,
            rubricCue: 'WFG edge reduction Pi->Pj + single-instance bijection proof + multi-instance counterexample showing cycle broken by external process.',
          },
        ],
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [2 Marks] — Available Vector Calculation

1. **Total Allocated Vector**:
   $$\sum \text{Allocation} = (1+1+1+0, 0+1+1+0, 1+0+1+1) = \mathbf{(3, 2, 3)}$$
2. **Available Vector**:
   $$\text{Available} = \text{Total} - \sum \text{Allocation} = (6, 4, 5) - (3, 2, 3) = \mathbf{(3, 2, 2)}$$

---

#### Part (b) [3 Marks] — Need Matrix Computation

Formula: $\text{Need}[i] = \text{Max}[i] - \text{Allocation}[i]$

- $\text{Need}[P0] = (3, 2, 2) - (1, 0, 1) = \mathbf{(2, 2, 1)}$
- $\text{Need}[P1] = (2, 2, 1) - (1, 1, 0) = \mathbf{(1, 1, 1)}$
- $\text{Need}[P2] = (4, 2, 2) - (1, 1, 1) = \mathbf{(3, 1, 1)}$
- $\text{Need}[P3] = (2, 1, 2) - (0, 0, 1) = \mathbf{(2, 1, 1)}$

---

#### Part (c) [4 Marks] — Safety Algorithm Step-by-Step Trace

- Initialize: $\text{Work} = \text{Available} = (3, 2, 2)$, $\text{Finish}[P0..P3] = [\text{False}, \text{False}, \text{False}, \text{False}]$.

**Step 1: Check P0**
- $\text{Need}[P0] = (2, 2, 1) \le \text{Work}(3, 2, 2) \implies \mathbf{TRUE}$.
- $P0$ finishes and releases resources:
  $$\text{Work} = (3, 2, 2) + (1, 0, 1) = \mathbf{(4, 2, 3)}$$
- $\text{Finish}[P0] = \text{True}$.

**Step 2: Check P1**
- $\text{Need}[P1] = (1, 1, 1) \le \text{Work}(4, 2, 3) \implies \mathbf{TRUE}$.
- $P1$ finishes and releases resources:
  $$\text{Work} = (4, 2, 3) + (1, 1, 0) = \mathbf{(5, 3, 3)}$$
- $\text{Finish}[P1] = \text{True}$.

**Step 3: Check P2**
- $\text{Need}[P2] = (3, 1, 1) \le \text{Work}(5, 3, 3) \implies \mathbf{TRUE}$.
- $P2$ finishes and releases resources:
  $$\text{Work} = (5, 3, 3) + (1, 1, 1) = \mathbf{(6, 4, 4)}$$
- $\text{Finish}[P2] = \text{True}$.

**Step 4: Check P3**
- $\text{Need}[P3] = (2, 1, 1) \le \text{Work}(6, 4, 4) \implies \mathbf{TRUE}$.
- $P3$ finishes and releases resources:
  $$\text{Work} = (6, 4, 4) + (0, 0, 1) = \mathbf{(6, 4, 5)}$$
- $\text{Finish}[P3] = \text{True}$.

**Conclusion**: System is in a **SAFE STATE**. A valid safe sequence is:
$$\mathbf{\langle P0, P1, P2, P3 \rangle}$$
*(Note: $\langle P1, P0, P2, P3 \rangle$ is also an equally valid safe sequence).*

---

#### Part (d) [6 Marks] — Wait-For Graph (WFG) & Cycle Deadlock Theorem

**1. Wait-For Graph (WFG) Construction [2.0 Marks]**:
- In systems where each resource type has only a **single instance**, the standard Resource Allocation Graph (RAG) can be collapsed into a Wait-For Graph by eliminating resource nodes:
  - If process $P_i$ requests resource $R_q$ and $R_q$ is currently allocated to $P_j$, we draw a direct directed edge $P_i \to P_j$ in the WFG.
- Deadlock detection reduces to finding a directed cycle in the WFG using Depth-First Search (DFS) in $O(V^2)$ time.

**2. Single-Instance Systems: Cycle $\iff$ Deadlock [2.0 Marks]**:
- **Necessary ($\\implies$)**: Deadlock implies a circular wait condition where every process in the set is waiting for a resource held by the next process $\implies$ A cycle must exist.
- **Sufficient ($\\Longleftarrow$)**: Because every resource has only 1 instance, a process waiting on a resource can ONLY be satisfied by the specific process currently holding that unique instance. If a closed directed cycle exists ($P_1 \to P_2 \to \dots \to P_k \to P_1$), no process in the cycle can release its resource until it receives its requested resource from the next process. Since all are blocked, none can ever proceed $\implies$ **Deadlock is guaranteed**.

**3. Multi-Instance Systems: Cycle is Necessary but NOT Sufficient [2.0 Marks]**:
- **Counterexample**:
  - Process $P1$ holds $R1$ (Instance 1) and requests $R2$.
  - Process $P2$ holds $R2$ (Instance 1) and requests $R1$.
  - This forms a directed cycle: $P1 \to R2 \to P2 \to R1 \to P1$.
  - **HOWEVER**, suppose $R1$ has a second instance held by process $P3$, and $R2$ has a second instance held by process $P4$.
  - If $P3$ and $P4$ do not request any resources, they finish execution, release their instances of $R1$ and $R2$ into the Available pool.
  - $P1$ and $P2$ claim the newly released instances, finish execution, and break the cycle!
  - **Conclusion**: In multi-instance resource systems, a cycle does NOT guarantee deadlock; safety must be verified using the full Banker’s Safety / Deadlock Detection algorithm.`,
        labPresetLink: { labTab: 'bankers', note: 'Verify C1 Set 1-2 Q8 in Lab 2 (Banker’s & RAG)' },
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
        stem: 'A magnetic hard disk drive has 100 concentric cylinders/tracks numbered 1 to 100. The spindle motor rotates at 6000 RPM. Each track contains 100 sectors of 512 bytes each. The read/write actuator head seek rate is 1 ms per cylinder moved. The head is currently positioned at track 50. The pending I/O disk request queue contains: `45, 20, 90, 10, 60, 80, 25, 70`.',
        subParts: [
          {
            id: 'c112-q9a',
            label: '(a)',
            prompt: 'Explain the physical components of magnetic disk geometry and calculate the average rotational latency in milliseconds.',
            maxMarks: 3,
            rubricCue: 'Platters, spindle, tracks, sectors, cylinders, actuator arm + 6000 RPM = 100 rev/s -> 10 ms per rev -> 5 ms avg rotational latency.',
          },
          {
            id: 'c112-q9b',
            label: '(b)',
            prompt: 'Compute the service order, total head movement (tracks), and total seek time (ms) for Shortest Seek Time First (SSTF).',
            maxMarks: 5,
            rubricCue: '50->45->60->70->80->90->25->20->10 = 130 tracks = 130 ms seek time.',
          },
          {
            id: 'c112-q9c',
            label: '(c)',
            prompt: 'Compute the service order, total head movement (tracks), and total seek time (ms) for SCAN moving downward toward cylinder 1.',
            maxMarks: 5,
            rubricCue: '50->45->25->20->10->1->60->70->80->90 = 49 + 89 = 138 tracks = 138 ms seek time.',
          },
          {
            id: 'c112-q9d',
            label: '(d)',
            prompt: 'Identify which algorithm prevents starvation under high I/O request arrival rates and provide technical justification.',
            maxMarks: 2,
            rubricCue: 'SCAN prevents starvation because its systematic elevator sweep bounds maximum waiting time for all cylinders.',
          },
        ],
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [3 Marks] — Disk Geometry & Rotational Latency

**1. Physical Components of a Magnetic Disk [1.5 Marks]**:
- **Platters**: Circular magnetic aluminum or glass disks coated with magnetic material, stacked on a central spindle.
- **Tracks & Sectors**: Platters are organized into concentric rings called **tracks**. Tracks are subdivided into arc segments called **sectors** (typically 512 B or 4096 B).
- **Cylinders**: The vertical set of all tracks across all platter surfaces at a given radial arm position.
- **Read/Write Heads & Actuator Arm**: Mechanical assembly that swings radially to position heads over requested cylinders.

**2. Average Rotational Latency Calculation [1.5 Marks]**:
- Spindle Speed: $6000\text{ RPM}$ (Revolutions Per Minute).
- Rotational Frequency:
  $$\text{Speed} = \frac{6000\text{ rev}}{60\text{ seconds}} = 100\text{ revolutions/second}$$
- Time for 1 full revolution ($360^\circ$):
  $$T_{\text{rev}} = \frac{1}{100\text{ rev/s}} = 0.010\text{ seconds} = \mathbf{10\text{ ms}}$$
- **Average Rotational Latency**: On average, the requested sector is half a revolution ($180^\circ$) away:
  $$\text{Avg Latency} = \frac{T_{\text{rev}}}{2} = \frac{10\text{ ms}}{2} = \mathbf{5.0\text{ ms}}$$

---

#### Part (b) [5 Marks] — Shortest Seek Time First (SSTF) Simulation

- Current Head Position: **50**.
- Pending Queue: \`[45, 20, 90, 10, 60, 80, 25, 70]\`.
- At each step, SSTF selects the pending cylinder closest to the current head position.

**Trace**:
1. From 50: Distances: $|50-45|=5$, $|50-60|=10$, $|50-25|=25$, etc. Nearest is **45**. (Movement: $5$).
2. From 45: Nearest remaining is **60** ($|45-60|=15$ vs $|45-25|=20$). (Movement: $15$).
3. From 60: Nearest is **70** ($|60-70|=10$). (Movement: $10$).
4. From 70: Nearest is **80** ($|70-80|=10$). (Movement: $10$).
5. From 80: Nearest is **90** ($|80-90|=10$). (Movement: $10$).
6. From 90: Remaining are \`[10, 20, 25]\`. Nearest is **25** ($|90-25|=65$). (Movement: $65$).
7. From 25: Nearest is **20** ($|25-20|=5$). (Movement: $5$).
8. From 20: Nearest is **10** ($|20-10|=10$). (Movement: $10$).

- **Service Order**: $50 \to 45 \to 60 \to 70 \to 80 \to 90 \to 25 \to 20 \to 10$
- **Total Head Movement**:
  $$\text{Seek Distance} = 5 + 15 + 10 + 10 + 10 + 65 + 5 + 10 = \mathbf{130\text{ cylinders / tracks}}$$
- **Total Seek Time**:
  $$\text{Seek Time} = 130\text{ tracks} \times 1\text{ ms/track} = \mathbf{130\text{ ms}}$$

---

#### Part (c) [5 Marks] — SCAN (Elevator Algorithm) Moving Downward to 1

- Current Head Position: **50**. Moving **downward toward Track 1**.
- The head services all pending requests in the downward direction, reaches the boundary cylinder (Track 1), reverses direction, and sweeps upward servicing remaining requests.

**Trace**:
1. Moving Downward from 50:
   - $50 \to 45$ (Movement: $5$)
   - $45 \to 25$ (Movement: $20$)
   - $25 \to 20$ (Movement: $5$)
   - $20 \to 10$ (Movement: $10$)
   - $10 \to 1$ (Reaches lower boundary: $9$)
   - *Subtotal Downward Movement*: $(50 - 1) = \mathbf{49\text{ tracks}}$.
2. Reverse Direction at 1 and Sweep Upward:
   - $1 \to 60$ (Movement: $59$)
   - $60 \to 70$ (Movement: $10$)
   - $70 \to 80$ (Movement: $10$)
   - $80 \to 90$ (Movement: $10$)
   - *Subtotal Upward Movement*: $(90 - 1) = \mathbf{89\text{ tracks}}$.

- **Service Order**: $50 \to 45 \to 25 \to 20 \to 10 \to 1 \to 60 \to 70 \to 80 \to 90$
- **Total Head Movement**:
  $$\text{Total Movement} = (50 - 1) + (90 - 1) = 49 + 89 = \mathbf{138\text{ cylinders / tracks}}$$
- **Total Seek Time**:
  $$\text{Seek Time} = 138\text{ tracks} \times 1\text{ ms/track} = \mathbf{138\text{ ms}}$$
  *(Note: If SCAN is directed upward to 100 first, total movement is $(100 - 50) + (100 - 10) = 50 + 90 = 140\text{ tracks} = 140\text{ ms}$).*

---

#### Part (d) [2 Marks] — Starvation Immunity Analysis

- **Algorithm that Prevents Starvation**: **SCAN** (Elevator Algorithm).
- **Technical Justification**:
  - **SSTF Vulnerability**: SSTF is inherently greedy. If new requests continuously arrive clustered around cylinders 50–80, the head will oscillate locally servicing those nearby requests. Distant cylinders (like Track 10 and 20) will experience **indefinite starvation**.
  - **SCAN Fairness**: SCAN enforces an elevator sweep across the entire platter. Every cylinder request is guaranteed to be serviced within at most one full round-trip sweep ($2 \times \text{Cylinder Count}$), strictly bounding worst-case latency and providing absolute starvation freedom.`,
        labPresetLink: { labTab: 'disk', note: 'Plot C1 Set 1-2 Q9 SSTF & SCAN in Lab 5 (Disk & RAID)' },
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
        stem: 'Apply operating system structure and POSIX system call mechanics to medical safety-critical devices and command-line shell execution.',
        subParts: [
          {
            id: 'c2-q1a',
            label: '(a)',
            prompt: 'Recommend and sketch a kernel architecture for an implantable neuro-stimulator that requires ultra-high reliability and zero downtime. Justify your architectural choice and state its primary performance trade-off.',
            maxMarks: 5,
            rubricCue: 'Microkernel diagram + user-space isolation of telemetry/sensor drivers preventing kernel panics + IPC context-switch latency trade-off.',
          },
          {
            id: 'c2-q1b',
            label: '(b)',
            prompt: 'Trace the execution of `./analyzer data.txt > report.log` in a Unix shell. Detail the sequence of fork(), exec(), open(), close(), read(), and write() system calls, and explain the Lowest Unused File Descriptor rule.',
            maxMarks: 5,
            rubricCue: 'Parent fork() -> child close(1) -> open(report.log) gets FD 1 -> execvp preserves FD table -> writes flow to log file.',
          },
        ],
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [5 Marks] — Implantable Neuro-Stimulator Kernel Architecture

**1. Architectural Recommendation: Microkernel Architecture [2.5 Marks]**:
- An implantable neuro-stimulator generates high-frequency electrical pulses to suppress neurological tremors or seizures. If the operating system halts or crashes, the patient faces immediate neuro-muscular trauma.
- **Structural Blueprint**:
  \`\`\`
  +-------------------------------------------------------------+
  | USER SPACE (Privilege Level: User Mode Bit = 1)             |
  |  +------------------+  +-----------------+  +-------------+ |
  |  | Pulse Controller |  | Battery Monitor |  | RF Telemetry| |
  |  +------------------+  +-----------------+  +-------------+ |
  |  +--------------------------------------------------------+ |
  |  | Peripheral Device Drivers (Bluetooth, Accelerometer)   | |
  |  +--------------------------------------------------------+ |
  +-------------------------------------------------------------+
  | [System Call Trap Boundary / IPC Message Dispatcher]        |
  +-------------------------------------------------------------+
  | KERNEL SPACE (Privilege Level: Kernel Mode Bit = 0)         |
  |  +---------------------+  +-------------------------------+ |
  |  | Low-Level Scheduler |  | Inter-Process Comm (IPC Bus)  | |
  |  +---------------------+  +-------------------------------+ |
  |  | Memory Page Mapper  |  | Hardware Interrupt Traps      | |
  |  +---------------------+  +-------------------------------+ |
  +-------------------------------------------------------------+
  | EMBEDDED HARDWARE (Microcontroller Core, Electrodes, Flash) |
  +-------------------------------------------------------------+
  \`\`\`
- **Fault Isolation Justification**: In a microkernel (e.g., QNX Neutrino, seL4), device drivers (such as wireless telemetry and battery fuel gauges) run as unprivileged user-space processes. If the wireless telemetry driver crashes due to radio interference, its user process terminates and is restarted in milliseconds by the process supervisor. The core pulse stimulation thread continues pacing the brain without interruption.

**2. Engineering Trade-Off [2.5 Marks]**:
- **IPC Switching Latency**: Inter-service communication requires message passing across user-kernel boundaries. A service call takes 4 context switches (Caller $\to$ Kernel $\to$ Server $\to$ Kernel $\to$ Caller) plus memory copy overhead, resulting in lower throughput than direct C function calls in a monolithic kernel.

---

#### Part (b) [5 Marks] — Shell Redirection Trace: \`./analyzer data.txt > report.log\`

**1. Step-by-Step System Call Timeline [3.5 Marks]**:
1. **\`fork()\`**: The parent shell invokes \`pid = fork()\`. The kernel duplicates the shell process address space, creating a child process with an identical copy of the File Descriptor (FD) table (\`0=stdin\`, \`1=stdout\`, \`2=stderr\`).
2. **\`close(1)\`**: Inside the child process, the redirection handler closes standard output (\`close(1)\`). File descriptor slot 1 is now marked free in the child's private FD table.
3. **\`open("report.log", O_WRONLY | O_CREAT | O_TRUNC, 0644)\`**: The child opens the destination log file.
   - **The Lowest Unused FD Rule**: POSIX kernels guarantee that \`open()\` always assigns the lowest-numbered available index in the process FD table. Because slot 1 was closed in Step 2, the kernel assigns **FD 1** to \`report.log\`.
4. **\`execvp("./analyzer", argv)\`**: The child replaces its code and data segments with the \`./analyzer\` binary.
   - Crucially, \`execvp()\` **preserves the open file descriptor table across execution** (unless \`FD_CLOEXEC\` is set).
5. **\`open("data.txt", O_RDONLY)\`**: Inside \`./analyzer\`, the program opens \`data.txt\`, receiving **FD 3**.
6. **\`read(3, buffer, count)\` & \`write(1, buffer, count)\`**: \`./analyzer\` reads input from FD 3. When it prints results using standard \`printf()\` or \`write(1, ...)\`, output flows directly into \`report.log\`.
7. **\`waitpid(child_pid, ...)\`**: The parent shell blocks until the child exits, reaps its exit code, and reprompts the user.

**2. File Descriptor Table Evolution [1.5 Marks]**:
\`\`\`
[Initial Child FD Table]           [After close(1) & open()]
  FD 0 -> /dev/pts/0 (stdin)         FD 0 -> /dev/pts/0 (stdin)
  FD 1 -> /dev/pts/0 (stdout)  ===>  FD 1 -> report.log (O_WRONLY)  <-- REDIRECTED!
  FD 2 -> /dev/pts/0 (stderr)         FD 2 -> /dev/pts/0 (stderr)
\`\`\``,
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
        stem: 'Design process lifecycle handling and concurrency architecture for an online banking transaction backend processing 50,000 requests per minute with strict audit and consistency requirements.',
        subParts: [
          {
            id: 'c2-q2a',
            label: '(a)',
            prompt: 'Explain the 5 standard process states, scheduling queues (Ready, Device), and lifecycle operations (fork, exec, wait, exit) in the context of banking transactions.',
            maxMarks: 5,
            rubricCue: '5-state diagram (New, Ready, Running, Waiting, Terminated) + Ready queue vs I/O device wait queue transitions in transaction lifecycle.',
          },
          {
            id: 'c2-q2b',
            label: '(b)',
            prompt: 'Recommend a multithreading model (One-to-One vs Many-to-One vs Many-to-Many) contrasting user-level threads vs kernel-level threads for the banking engine.',
            maxMarks: 5,
            rubricCue: 'One-to-One recommendation + thread pool + why Many-to-One fails on blocking DB I/O + multicore CPU exploitation.',
          },
        ],
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [5 Marks] — Process States & Queues in Banking Backend

**1. 5-State Process Lifecycle [2.5 Marks]**:
\`\`\`
              +------------+
              |    NEW     |  (Transaction request arrives from network)
              +------------+
                     | admitted
                     v
   +--------> +------------+ <---------+
   | timer    |   READY    |  I/O done | (Waiting in CPU Ready Queue)
   | expired  +------------+           |
   |                 | dispatch        |
   |                 v                 |
   |          +------------+           |
   +--------- |  RUNNING   | ----------+ (Executing transaction validation)
              +------------+ I/O wait
                     | exit
                     v
              +------------+
              | TERMINATED |  (Committed / Reaped by waitpid())
              +------------+
\`\`\`
- **New**: Client HTTP request received; OS allocates PCB, assigns PID, and allocates stack/heap.
- **Ready**: Process resides in main memory awaiting CPU assignment from the Short-Term Scheduler.
- **Running**: Process occupies a CPU core, executing transaction business logic.
- **Waiting (Blocked)**: Process issues a blocking database SQL query or network RPC to credit card networks. It is removed from the CPU and enqueued on the **Device Wait Queue**.
- **Terminated**: Transaction completes or rolls back; PCB remains in Zombie state until reaped.

**2. Process Lifecycle Operations [2.5 Marks]**:
- **\`fork()\`**: Master banking daemon forks worker processes to isolate high-risk credit-card payment gateways into sandboxed address spaces.
- **\`exec()\`**: Worker replaces image with specialized settlement engine.
- **\`wait()\` / \`waitpid()\`**: Master reaps completed child transaction processes, collecting accounting audit codes and preventing Zombie accumulation.
- **\`exit()\`**: Releases locks, closes database connections, and writes rollback logs.

---

#### Part (b) [5 Marks] — Multithreading Model Selection

**1. Technical Comparison of Models [2.5 Marks]**:
- **Many-to-One ($M:1$)**: Many user threads mapped to 1 kernel thread.
  - *Fatal Flaw*: If any thread issues a blocking database read, the entire banking server process blocks! Zero multi-core parallel speedup.
- **Many-to-Many ($M:N$)**: Multiplexes $M$ user threads over $N$ kernel threads. Complex scheduling; rarely used in modern kernels.
- **One-to-One ($1:1$)**: Every user thread maps directly to an independent **Kernel Thread** (Standard in Linux pthreads, Windows threads).

**2. Recommended Architecture for Online Banking [2.5 Marks]**:
- **Recommendation**: **One-to-One Model backed by a Pre-allocated Thread Pool**.
- **Justification**:
  1. **Non-Blocking Concurrency**: When Transaction Thread 1 blocks waiting for a slow PostgreSQL database query, the OS kernel independently schedules Transaction Thread 2 and Thread 3 onto other physical CPU cores.
  2. **Multi-Core Parallelism**: Exploits all 32/64 CPU cores in modern enterprise servers simultaneously.
  3. **Thread Pool Defense**: Creating raw threads per request would exhaust OS kernel memory under a 50,000 req/min surge. A fixed-size Thread Pool (e.g., 500 worker threads) reuses threads, caps context-switching overhead, and prevents server crashes.`,
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
        stem: 'A specialized 3D printing lab receives 4 print jobs: S1(Arrival=0, Burst=25), S2(5, 35), S3(10, 15), S4(15, 45). The shop manager evaluates First-Come, First-Served (FCFS) versus Round Robin with time quantum q = 10 ms.',
        subParts: [
          {
            id: 'c2-q3a',
            label: '(a)',
            prompt: 'Construct complete Gantt charts for both FCFS and Round Robin (q = 10 ms).',
            maxMarks: 4,
            rubricCue: 'FCFS: S1[0-25] S2[25-60] S3[60-75] S4[75-120]; RR: queue tracking across all 12 slices.',
          },
          {
            id: 'c2-q3b',
            label: '(b)',
            prompt: 'Calculate Completion Time (CT), Turnaround Time (TAT), and Waiting Time (WT) for all jobs under both algorithms, and state their averages.',
            maxMarks: 4,
            rubricCue: 'FCFS: Avg WT=32.50 ms, Avg TAT=62.50 ms; RR: Avg WT=52.50 ms, Avg TAT=82.50 ms.',
          },
          {
            id: 'c2-q3c',
            label: '(c)',
            prompt: 'State which algorithm is more efficient based strictly on Average Waiting Time, and discuss the practical trade-off between throughput and interactive responsiveness.',
            maxMarks: 2,
            rubricCue: 'FCFS is more efficient by Avg WT (32.50 < 52.50 ms); RR provides fair response time and avoids starvation.',
          },
        ],
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [4 Marks] — Gantt Chart Constructions

**1. FCFS Scheduling (Non-Preemptive Arrival Order)**:
- Total Burst $= 25 + 35 + 15 + 45 = 120\text{ ms}$.
- $S1$ runs $[0 - 25]$ $\to S2$ runs $[25 - 60]$ $\to S3$ runs $[60 - 75]$ $\to S4$ runs $[75 - 120]$.
\`\`\`
FCFS Gantt:
|    S1 (25)    |       S2 (35)       |   S3 (15)   |          S4 (45)          |
0              25                   60            75                           120
\`\`\`

---

**2. Round Robin Scheduling ($q = 10\text{ ms}$)**:
- $t=0$: $S1(25)$ arrives. Runs $[0 - 10]$ (rem 15). At $t=5$, $S2$ arrives; at $t=10$, $S3$ arrives. Queue: \`S2, S3, S1\`.
- $t=10$: $S2(35)$ runs $[10 - 20]$ (rem 25). At $t=15$, $S4$ arrives. Queue: \`S3, S1, S4, S2\`.
- $t=20$: $S3(15)$ runs $[20 - 30]$ (rem 5). Queue: \`S1, S4, S2, S3\`.
- $t=30$: $S1(15)$ runs $[30 - 40]$ (rem 5). Queue: \`S4, S2, S3, S1\`.
- $t=40$: $S4(45)$ runs $[40 - 50]$ (rem 35). Queue: \`S2, S3, S1, S4\`.
- $t=50$: $S2(25)$ runs $[50 - 60]$ (rem 15). Queue: \`S3, S1, S4, S2\`.
- $t=60$: $S3(5)$ runs $[60 - 65]$ (rem 0). **$S3$ completes at $t=65$!** Queue: \`S1, S4, S2\`.
- $t=65$: $S1(5)$ runs $[65 - 70]$ (rem 0). **$S1$ completes at $t=70$!** Queue: \`S4, S2\`.
- $t=70$: $S4(35)$ runs $[70 - 80]$ (rem 25). Queue: \`S2, S4\`.
- $t=80$: $S2(15)$ runs $[80 - 90]$ (rem 5). Queue: \`S4, S2\`.
- $t=90$: $S4(25)$ runs $[90 - 100]$ (rem 15). Queue: \`S2, S4\`.
- $t=100$: $S2(5)$ runs $[100 - 105]$ (rem 0). **$S2$ completes at $t=105$!** Queue: \`S4\`.
- $t=105$: $S4(15)$ runs $[105 - 120]$ (rem 0). **$S4$ completes at $t=120$!**

\`\`\`
Round Robin (q=10) Gantt:
|S1|S2|S3|S1|S4|S2|S3|S1|S4|S2|S4 |S2 |S4  |
0  10 20 30 40 50 60 65 70 80 90 100 105 120
\`\`\`

---

#### Part (b) [4 Marks] — Metrics Table & Average Computations

**1. FCFS Results**:
| Job | AT | BT | Completion (CT) | TAT (CT - AT) | Waiting Time (TAT - BT) |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **S1** | 0 | 25 | **25** | 25 | **0** |
| **S2** | 5 | 35 | **60** | 55 | **20** |
| **S3** | 10 | 15 | **75** | 65 | **50** |
| **S4** | 15 | 45 | **120** | 105 | **60** |

- $\text{Avg TAT (FCFS)} = \frac{25 + 55 + 65 + 105}{4} = \frac{250}{4} = \mathbf{62.50\text{ ms}}$
- $\text{Avg WT (FCFS)} = \frac{0 + 20 + 50 + 60}{4} = \frac{130}{4} = \mathbf{32.50\text{ ms}}$

---

**2. Round Robin ($q=10$) Results**:
| Job | AT | BT | Completion (CT) | TAT (CT - AT) | Waiting Time (TAT - BT) |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **S1** | 0 | 25 | **70** | 70 | **45** |
| **S2** | 5 | 35 | **105** | 100 | **65** |
| **S3** | 10 | 15 | **65** | 55 | **40** |
| **S4** | 15 | 45 | **120** | 105 | **60** |

- $\text{Avg TAT (RR)} = \frac{70 + 100 + 55 + 105}{4} = \frac{330}{4} = \mathbf{82.50\text{ ms}}$
- $\text{Avg WT (RR)} = \frac{45 + 65 + 40 + 60}{4} = \frac{210}{4} = \mathbf{52.50\text{ ms}}$

---

#### Part (c) [2 Marks] — Efficiency Evaluation & Practical Trade-Off

- **Strict Efficiency Verdict**: **FCFS is significantly more efficient** in terms of Average Waiting Time ($32.50\text{ ms}$ vs $52.50\text{ ms}$) and Average Turnaround Time ($62.50\text{ ms}$ vs $82.50\text{ ms}$).
- **Reason**: When processes have similar burst lengths, Round Robin drags out completion by interleaving slices, meaning every process finishes near the end of the timeline.
- **Practical Trade-Off**:
  - In a 3D printing batch environment where humans do not wait interactively, FCFS maximizes printer hardware throughput.
  - In an interactive operating system, Round Robin is essential because its **Response Time** is dramatically superior (every process gets CPU attention within $q$ time units, eliminating the Convoy Effect).`,
        labPresetLink: { labTab: 'cpu', note: 'Compare FCFS vs RR(q=10) in Lab 1 (CPU Scheduler)' },
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
        stem: 'A regional hospital emergency diagnostic center has 3 single-instance medical resources: R1 (CT Scanner), R2 (MRI Machine), and R3 (Ultrasound Device). Four patient analysis threads interact as follows: P1 holds R1 and requests R2; P2 holds R2 and requests R3; P3 holds R3 and requests R1; P4 requests R2 and holds no resources.',
        subParts: [
          {
            id: 'c2-q4a',
            label: '(a)',
            prompt: 'Construct the Resource Allocation Graph (RAG), verify all 4 Coffman conditions, and identify the exact set of deadlocked processes.',
            maxMarks: 4,
            rubricCue: 'Cycle P1->R2->P2->R3->P3->R1->P1 proves deadlock; deadlocked set is {P1, P2, P3}; P4 waits outside cycle.',
          },
          {
            id: 'c2-q4b',
            label: '(b)',
            prompt: 'Compare two deadlock handling strategies (Deadlock Prevention vs Deadlock Avoidance) and state one major practical limitation of each.',
            maxMarks: 4,
            rubricCue: "Prevention (negates Coffman condition; low device utilization) vs Avoidance (Banker's algorithm; requires advance Max declaration).",
          },
          {
            id: 'c2-q4c',
            label: '(c)',
            prompt: 'Specify two deadlock recovery methods and state three victim selection criteria used by the operating system.',
            maxMarks: 2,
            rubricCue: 'Process termination (abort all vs one-by-one) + Resource preemption; victim criteria: priority, execution time consumed, resources held.',
          },
        ],
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [4 Marks] — RAG Construction, Coffman Conditions & Deadlock Set

**1. Graph Representation [1.5 Marks]**:
- **Resource Assignment Edges (Holds)**: $R1 \to P1$, $R2 \to P2$, $R3 \to P3$.
- **Resource Request Edges (Requests)**: $P1 \to R2$, $P2 \to R3$, $P3 \to R1$, $P4 \to R2$.
\`\`\`
       +--------(holds)--------> [ P1 ] --------(requests)--------+
       |                                                         |
       v                                                         v
    (( R1 )) <---(requests)--- [ P3 ] <---(holds)--- (( R3 ))   (( R2 ))
       ^                         |                      ^        |    ^
       |                         |                      |        |    |
       |                         +-----(holds)----------+        |    |
       |                                                         |    |
       +---------------------------------------------------------+    |
                                                                      |
    [ P4 ] -------------(requests)------------------------------------+
\`\`\`

**2. Verification of the 4 Coffman Conditions [1.5 Marks]**:
1. **Mutual Exclusion**: $R1, R2, R3$ are single-instance medical devices that can be occupied by only one patient thread at a time.
2. **Hold and Wait**: $P1$ holds $R1$ while waiting for $R2$; $P2$ holds $R2$ while waiting for $R3$; $P3$ holds $R3$ while waiting for $R1$.
3. **No Preemption**: A diagnostic scan cannot be forcibly aborted from a patient until it is completed.
4. **Circular Wait**: A closed directed cycle exists:
   $$P1 \to R2 \to P2 \to R3 \to P3 \to R1 \to P1$$

**3. Exact Deadlocked Process Set [1.0 Mark]**:
- **Deadlocked Set**: $\mathbf{\{P1, P2, P3\}}$.
- **Status of P4**: Process $P4$ is **blocked** waiting for $R2$, but $P4$ is **NOT deadlocked** because it holds zero resources and is not part of the circular wait cycle.

---

#### Part (b) [4 Marks] — Deadlock Prevention vs Avoidance

| Deadlock Strategy | Core Mechanism | Major Practical Limitation |
| :--- | :--- | :--- |
| **Deadlock Prevention** | Statically invalidates at least one of the 4 Coffman conditions (e.g., enforce strict global resource ordering $F: R \to \mathbb{N}$ to eliminate Circular Wait). | **Severely degrades resource utilization**; processes are forced to acquire devices before they actually need them or release held devices prematurely. |
| **Deadlock Avoidance** | Dynamically evaluates resource allocation requests using algorithms like **Banker’s Algorithm**, verifying that granting a request leaves the system in a **Safe State**. | **Requires a-priori knowledge of Maximum Resource Claims** for every process, which is impossible to predict accurately in general-purpose computing. |

---

#### Part (c) [2 Marks] — Deadlock Recovery Methods & Victim Selection

**1. Recovery Methods [1.0 Mark]**:
1. **Process Termination**:
   - Abort all deadlocked processes (fast, but discards computation).
   - Abort deadlocked processes one by one in victim order until the RAG cycle is broken.
2. **Resource Preemption**:
   - Forcibly seize a resource from a victim process, roll back the victim to a safe checkpoint, and restart it later.

**2. Victim Selection Criteria (3 Criteria) [1.0 Mark]**:
1. **Process Priority**: Abort lower-priority diagnostic batch tasks before aborting critical emergency room threads.
2. **Execution Time & Resources Consumed**: Prefer aborting a process that just started ($10\%$ complete) rather than one that has run for 2 hours and is $95\%$ complete.
3. **Resources Held vs Resources Needed**: Choose a process holding multiple bottleneck resources whose release immediately frees other blocked processes.`,
        labPresetLink: { labTab: 'bankers', note: 'Inspect C2 Q4 RAG & WFG cycle in Lab 2 (Banker’s & RAG)' },
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
        stem: 'A high-speed train coach reservation system has 10 seats remaining. Two concurrent reservation booking threads (P0 and P1) attempt to reserve 2 seats each. Mutual exclusion is managed using Peterson’s algorithm with shared variables `flag[2]` and `turn`.',
        subParts: [
          {
            id: 'c2-q5a',
            label: '(a)',
            prompt: 'Explain the role of the shared variables flag[2] and turn in Peterson’s algorithm and state their initial values.',
            maxMarks: 3,
            rubricCue: 'flag[i] intent indicator + turn tie-breaker + initial false and 0/1.',
          },
          {
            id: 'c2-q5b',
            label: '(b)',
            prompt: 'Trace execution when the system reaches state: flag[0] = true, flag[1] = true, turn = 0. Determine which process enters the critical section first and show the exact condition evaluation.',
            maxMarks: 4,
            rubricCue: 'P0 condition evaluates false (turn==1 is false) -> P0 enters first; P1 condition evaluates true -> P1 spins in loop.',
          },
          {
            id: 'c2-q5c',
            label: '(c)',
            prompt: 'Trace the update to the shared seat counter (seats = 10) as both processes complete their critical sections. What is the final seat count, and why is race-condition freedom guaranteed?',
            maxMarks: 3,
            rubricCue: 'P0 reserves 2 (seats=8), exits; P1 unblocks, reserves 2 (seats=6); mutual exclusion prevents lost updates.',
          },
        ],
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [3 Marks] — Shared Variables & Initial State

\`\`\`c
boolean flag[2] = {false, false};  // Intent array
int turn = 0;                      // Polite tie-breaker
int seats = 10;                    // Shared coach seat inventory
\`\`\`

- **\`flag[i]\`**: Process $P_i$ asserts \`flag[i] = true\` to signal its intention to enter the reservation Critical Section.
- **\`turn\`**: Resolves conflicting concurrent requests. Process $P_i$ sets \`turn = j\`, courteously yielding priority to its peer $P_j$.

---

#### Part (b) [4 Marks] — State Trace: \`flag[0]=true, flag[1]=true, turn=0\`

**Peterson’s Entry Protocol**:
- Process $P0$ executes: \`while (flag[1] && turn == 1);\`
- Process $P1$ executes: \`while (flag[0] && turn == 0);\`

**State Evaluation**:
1. **For Process P0**:
   - Evaluates: \`flag[1] && turn == 1\`
   - Current values: \`flag[1] = true\`, but \`turn = 0\` ($0 \ne 1$).
   - Condition evaluates to: $\text{true} \land \text{false} = \mathbf{false}$.
   - **Result**: $P0$ does NOT spin; **$P0$ immediately ENTERS the Critical Section!**
2. **For Process P1**:
   - Evaluates: \`flag[0] && turn == 0\`
   - Current values: \`flag[0] = true\` and \`turn = 0\`.
   - Condition evaluates to: $\text{true} \land \text{true} = \mathbf{true}$.
   - **Result**: $P1$ is trapped in its \`while\` loop, **busy waiting (spinning)** on the CPU.

---

#### Part (c) [3 Marks] — Coach Seat Inventory Trace & Race-Condition Freedom

**Sequential Step-by-Step Execution**:
1. **$P0$ in Critical Section**:
   - Reads: \`seats = 10\`.
   - Performs booking: \`seats = seats - 2 = 8\`.
   - Writes back: \`seats = 8\`.
2. **$P0$ Exit Section**:
   - Executes: \`flag[0] = false\`.
3. **$P1$ Unblocks**:
   - Now $P1$ re-evaluates its spin condition: \`flag[0] && turn == 0\`.
   - Since \`flag[0] == false\`, the condition becomes $\text{false} \land \text{true} = \mathbf{false}$.
   - $P1$ breaks out of the loop and **enters the Critical Section**.
4. **$P1$ in Critical Section**:
   - Reads current value: \`seats = 8\`.
   - Performs booking: \`seats = seats - 2 = 6\`.
   - Writes back: \`seats = 6\`.
5. **$P1$ Exit Section**:
   - Executes: \`flag[1] = false\`.

- **Final Seat Count**: $\mathbf{6\text{ seats}}$.
- **Race Condition Immunity**: Mutual exclusion guarantees that $P0$ and $P1$ cannot execute their read-modify-write memory cycles concurrently. Without Peterson’s algorithm, both threads might read \`seats = 10\` simultaneously, write \`seats = 8\`, and lose 2 ticket reservations (Lost Update Anomaly). Peterson’s algorithm ensures complete serializability and consistency.`,
        labPresetLink: { labTab: 'sync', note: 'Run C2 Q5 simultaneous trace in Lab 3 (Synchronization)' },
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
        stem: 'An online food ordering platform manages an order buffer between kitchen chefs (Producers) and delivery delivery riders (Consumers). The pass-through counter can hold at most 5 orders simultaneously.',
        subParts: [
          {
            id: 'c2-q6a',
            label: '(a)',
            prompt: 'State the three synchronization conditions that must be enforced in this bounded-buffer scenario.',
            maxMarks: 2,
            rubricCue: 'No overflow (>5), no underflow (<0), and mutual exclusion on shared buffer insertion/removal.',
          },
          {
            id: 'c2-q6b',
            label: '(b)',
            prompt: 'Define all necessary semaphores, specify their types (binary vs counting), and declare their exact initial values.',
            maxMarks: 3,
            rubricCue: 'mutex = 1 (binary), empty = 5 (counting), full = 0 (counting).',
          },
          {
            id: 'c2-q6c',
            label: '(c)',
            prompt: 'Write complete pseudocode for the Chef (Producer) and Rider (Consumer). Critically explain why reversing the order of wait(empty) and wait(mutex) causes catastrophic deadlock.',
            maxMarks: 5,
            rubricCue: 'Producer & consumer pseudocode + wait(empty) must precede wait(mutex) to avoid holding lock while blocked on full buffer.',
          },
        ],
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [2 Marks] — Three Synchronization Conditions
1. **Mutual Exclusion**: Only one chef or rider can manipulate the circular buffer array, pointers (\`in\`, \`out\`), or order metadata at any instant.
2. **No Overflow (Buffer-Full Invariant)**: Chefs must block and wait when all 5 counter slots are full.
3. **No Underflow (Buffer-Empty Invariant)**: Delivery riders must block and wait when 0 completed orders are on the counter.

---

#### Part (b) [3 Marks] — Semaphore Declarations & Initial Values

\`\`\`c
#define BUFFER_SIZE 5
Order buffer[BUFFER_SIZE];
int in = 0, out = 0;

semaphore mutex = 1;      // Binary semaphore: provides mutual exclusion for buffer access
semaphore empty = 5;      // Counting semaphore: tracks available empty slots (starts at capacity 5)
semaphore full = 0;       // Counting semaphore: tracks ready prepared meals (starts at 0)
\`\`\`

---

#### Part (c) [5 Marks] — Pseudocode & Deadlock Analysis

**1. Producer & Consumer Pseudocode [2.5 Marks]**:
\`\`\`c
void Chef_Producer() {
    while (true) {
        Order meal = cook_meal(); // Prepare order
        
        wait(empty);              // Wait for an empty counter slot (decrements empty)
        wait(mutex);              // Acquire exclusive lock on counter
        
        buffer[in] = meal;        // Place order on counter
        in = (in + 1) % BUFFER_SIZE;
        
        signal(mutex);            // Release counter lock
        signal(full);             // Signal that a prepared meal is ready (increments full)
    }
}

void Rider_Consumer() {
    while (true) {
        wait(full);               // Wait for a prepared meal (decrements full)
        wait(mutex);              // Acquire exclusive lock on counter
        
        Order meal = buffer[out]; // Pick up meal from counter
        out = (out + 1) % BUFFER_SIZE;
        
        signal(mutex);            // Release counter lock
        signal(empty);            // Signal that a counter slot has become empty
        
        deliver_meal(meal);       // Deliver to customer
    }
}
\`\`\`

**2. Deadlock Analysis on Reversed Wait Order [2.5 Marks]**:
- Suppose a programmer mistakenly reverses the wait operations in \`Chef_Producer()\`:
  \`\`\`c
  wait(mutex);  // Acquire mutex FIRST!
  wait(empty);  // Wait for space
  \`\`\`
- **Deadlock Scenario Trace**:
  1. The counter is full (\`empty == 0\`, 5 meals waiting).
  2. A chef finishes cooking and calls \`wait(mutex)\`. Mutex decrements from 1 to 0; chef acquires the lock.
  3. The chef now executes \`wait(empty)\`. Since \`empty == 0\`, the chef **blocks and goes to sleep holding \`mutex\`!**
  4. A delivery rider arrives to pick up a meal. The rider executes \`wait(full)\` (succeeds) followed by \`wait(mutex)\`.
  5. Because the sleeping chef holds \`mutex\`, the rider **blocks on \`mutex\`**.
  6. **Permanent Deadlock**: The rider cannot pick up food to signal \`empty\` because the chef holds \`mutex\`. The chef cannot release \`mutex\` because it is waiting for the rider to signal \`empty\`. Both processes sleep forever.`,
        labPresetLink: { labTab: 'sync', note: 'Simulate Bounded Buffer (capacity 5) in Lab 3 (Synchronization)' },
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
        stem: 'A municipal smart-traffic control system virtualizes surveillance camera video streams. The page reference string is:\n\`1, 2, 3, 4, 2, 1, 5, 6, 2, 1, 2, 3, 7, 6, 3, 2, 1, 2, 3, 6\`\nCompute page replacements under 4 initially empty physical frames for FIFO, Optimal, and LRU.',
        subParts: [
          {
            id: 'c2-q7a',
            label: '(a)',
            prompt: 'Trace FIFO frame allocation step-by-step and count total page faults.',
            maxMarks: 3,
            rubricCue: 'FIFO = 14 page faults, 6 hits (70% fault rate).',
          },
          {
            id: 'c2-q7b',
            label: '(b)',
            prompt: 'Trace Optimal (OPT) page replacement step-by-step and count total page faults.',
            maxMarks: 3,
            rubricCue: 'OPT = 8 page faults, 12 hits (40% fault rate).',
          },
          {
            id: 'c2-q7c',
            label: '(c)',
            prompt: 'Trace LRU page replacement step-by-step and count total page faults.',
            maxMarks: 3,
            rubricCue: 'LRU = 10 page faults, 10 hits (50% fault rate).',
          },
          {
            id: 'c2-q7d',
            label: '(d)',
            prompt: 'Compare fault rates and hit ratios across all three algorithms.',
            maxMarks: 1,
            rubricCue: 'OPT (40%) < LRU (50%) < FIFO (70%).',
          },
        ],
        workedSolution: `### Step-by-Step Examiner Solution

#### System Parameters
- Reference String Length: $N = 20$
- Physical Frames: $m = 4$ (initially empty)
- String: \`1, 2, 3, 4, 2, 1, 5, 6, 2, 1, 2, 3, 7, 6, 3, 2, 1, 2, 3, 6\`

---

#### Part (a) [3 Marks] — FIFO Page Replacement (14 Faults)

- Eviction Rule: Oldest page in memory is evicted first.
- **Trace Highlights**:
  - Refs $1, 2, 3, 4$: 4 Compulsory Faults $\to$ \`[1, 2, 3, 4]\` (Arrival ages: $1 > 2 > 3 > 4$).
  - Ref $2$: **HIT** \`[1, 2, 3, 4]\`.
  - Ref $1$: **HIT** \`[1, 2, 3, 4]\`.
  - Ref $5$: **FAULT**. Evict oldest ($1$) $\to$ \`[5, 2, 3, 4]\`.
  - Ref $6$: **FAULT**. Evict oldest ($2$) $\to$ \`[5, 6, 3, 4]\`.
  - Ref $2$: **FAULT**. Evict oldest ($3$) $\to$ \`[5, 6, 2, 4]\`.
  - Ref $1$: **FAULT**. Evict oldest ($4$) $\to$ \`[5, 6, 2, 1]\`.
  - Ref $2$: **HIT** \`[5, 6, 2, 1]\`.
  - Ref $3$: **FAULT**. Evict oldest ($5$) $\to$ \`[3, 6, 2, 1]\`.
  - Ref $7$: **FAULT**. Evict oldest ($6$) $\to$ \`[3, 7, 2, 1]\`.
  - Ref $6$: **FAULT**. Evict oldest ($2$) $\to$ \`[3, 7, 6, 1]\`.
  - Ref $3$: **HIT** \`[3, 7, 6, 1]\`.
  - Ref $2$: **FAULT**. Evict oldest ($1$) $\to$ \`[3, 7, 6, 2]\`.
  - Ref $1$: **FAULT**. Evict oldest ($3$) $\to$ \`[1, 7, 6, 2]\`.
  - Ref $2$: **HIT** \`[1, 7, 6, 2]\`.
  - Ref $3$: **FAULT**. Evict oldest ($7$) $\to$ \`[1, 3, 6, 2]\`.
  - Ref $6$: **HIT** \`[1, 3, 6, 2]\`.
- **FIFO Total**: **14 Page Faults**, 6 Hits (Fault Rate $= \mathbf{70.0\%}$, Hit Ratio $= \mathbf{30.0\%}$).

---

#### Part (b) [3 Marks] — Optimal (OPT) Page Replacement (8 Faults)

- Eviction Rule: Look ahead into the future; evict page not needed for longest time.
- **Trace Highlights**:
  - Refs $1, 2, 3, 4$: 4 Compulsory Faults $\to$ \`[1, 2, 3, 4]\`.
  - Refs $2, 1$: **HITS**.
  - Ref $5$: **FAULT**. Future uses: $2$ (ref 9), $1$ (ref 10), $3$ (ref 12), $4$ (never!). Evict $4 \to$ \`[1, 2, 3, 5]\`.
  - Ref $6$: **FAULT**. Future uses: $2$ (ref 9), $1$ (ref 10), $3$ (ref 12), $5$ (never!). Evict $5 \to$ \`[1, 2, 3, 6]\`.
  - Refs $2, 1, 2, 3$: **4 CONSECUTIVE HITS!** (Frames: \`[1, 2, 3, 6]\`).
  - Ref $7$: **FAULT**. Future uses: $6$ (ref 14), $3$ (ref 15), $2$ (ref 16), $1$ (ref 17). All are used soon; $1$ is furthest. Evict $1 \to$ \`[7, 2, 3, 6]\`.
  - Ref $6$: **HIT**.
  - Ref $3$: **HIT**.
  - Ref $2$: **HIT**.
  - Ref $1$: **FAULT**. Future uses: $2$ (ref 18), $3$ (ref 19), $6$ (ref 20), $7$ (never!). Evict $7 \to$ \`[1, 2, 3, 6]\`.
  - Refs $2, 3, 6$: **3 CONSECUTIVE HITS!**
- **OPT Total**: **8 Page Faults**, 12 Hits (Fault Rate $= \mathbf{40.0\%}$, Hit Ratio $= \mathbf{60.0\%}$).

---

#### Part (c) [3 Marks] — Least Recently Used (LRU) Page Replacement (10 Faults)

- Eviction Rule: Evict the page that has not been referenced for the longest time.
- **Trace Highlights**:
  - Refs $1, 2, 3, 4$: 4 Compulsory Faults $\to$ \`[1, 2, 3, 4]\`.
  - Refs $2, 1$: **HITS**. Recency order: $1, 2, 4, 3$.
  - Ref $5$: **FAULT**. Evict $3 \to$ \`[1, 2, 4, 5]\`. Recency: $5, 1, 2, 4$.
  - Ref $6$: **FAULT**. Evict $4 \to$ \`[1, 2, 6, 5]\`. Recency: $6, 5, 1, 2$.
  - Refs $2, 1, 2$: **3 CONSECUTIVE HITS!** Recency: $2, 1, 6, 5$.
  - Ref $3$: **FAULT**. Evict $5 \to$ \`[2, 1, 6, 3]\`. Recency: $3, 2, 1, 6$.
  - Ref $7$: **FAULT**. Evict $6 \to$ \`[2, 1, 3, 7]\`. Recency: $7, 3, 2, 1$.
  - Ref $6$: **FAULT**. Evict $1 \to$ \`[2, 3, 7, 6]\`. Recency: $6, 7, 3, 2$.
  - Refs $3, 2$: **HITS**. Recency: $2, 3, 6, 7$.
  - Ref $1$: **FAULT**. Evict $7 \to$ \`[2, 3, 6, 1]\`. Recency: $1, 2, 3, 6$.
  - Refs $2, 3, 6$: **3 CONSECUTIVE HITS!**
- **LRU Total**: **10 Page Faults**, 10 Hits (Fault Rate $= \mathbf{50.0\%}$, Hit Ratio $= \mathbf{50.0\%}$).

---

#### Part (d) [1 Mark] — Comparison Summary

| Metric | FIFO | LRU | Optimal (OPT) |
| :--- | :---: | :---: | :---: |
| **Page Fault Count** | 14 Faults | 10 Faults | **8 Faults** |
| **Fault Rate** | 70.0% | 50.0% | **40.0%** |
| **Hit Ratio** | 30.0% | 50.0% | **60.0%** |`,
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
        stem: 'A computer system has a 64 KB Virtual Address Space, 16 KB Physical RAM, and a 1 KB Page Size. The hardware architecture includes a Translation Lookaside Buffer (TLB) with a lookup time of 10 ns. Physical main memory access time is 100 ns.',
        subParts: [
          {
            id: 'c2-q8a',
            label: '(a)',
            prompt: 'Compute the number of page number bits (p), page offset bits (d), frame number bits (f), and total physical address bits.',
            maxMarks: 3,
            rubricCue: 'p = 6 bits, d = 10 bits (16-bit virtual); f = 4 bits, d = 10 bits (14-bit physical).',
          },
          {
            id: 'c2-q8b',
            label: '(b)',
            prompt: 'Compute the Effective Access Time (EAT) when the TLB hit ratio is 80%.',
            maxMarks: 3,
            rubricCue: 'EAT = 0.80*(10+100) + 0.20*(10+100+100) = 88 + 42 = 130 ns.',
          },
          {
            id: 'c2-q8c',
            label: '(c)',
            prompt: 'Compute the EAT when the TLB hit ratio increases to 95%, and determine the percentage performance improvement.',
            maxMarks: 2,
            rubricCue: 'EAT = 0.95*(110) + 0.05*(210) = 115 ns -> 15 ns speedup (11.54% reduction in memory access latency).',
          },
          {
            id: 'c2-q8d',
            label: '(d)',
            prompt: 'Justify technically why an associative TLB provides massive system speedup even though the page table is already stored in high-speed RAM.',
            maxMarks: 2,
            rubricCue: 'Eliminates the mandatory 2nd RAM access per memory fetch; cuts effective latency by almost half.',
          },
        ],
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [3 Marks] — Address Bit Splits & Architecture Math

1. **Page Offset Bits ($d$)**:
   $$\text{Page Size} = 1\text{ KB} = 1024\text{ bytes} = 2^{10}\text{ bytes} \implies \mathbf{d = 10\text{ bits}}$$

2. **Virtual Address Space ($VAS$) & Page Number Bits ($p$)**:
   $$\text{VAS} = 64\text{ KB} = 64 \times 2^{10} = 2^6 \times 2^{10} = 2^{16}\text{ bytes} \implies \text{Virtual Address} = \mathbf{16\text{ bits}}$$
   $$\text{Number of Virtual Pages} = \frac{64\text{ KB}}{1\text{ KB}} = 64 = 2^6 \implies \mathbf{p = 6\text{ bits}}$$
   *(Verification: $p + d = 6 + 10 = 16\text{ bits}$)*.

3. **Physical Address Space ($PAS$) & Frame Number Bits ($f$)**:
   $$\text{Physical RAM} = 16\text{ KB} = 16 \times 2^{10} = 2^4 \times 2^{10} = 2^{14}\text{ bytes} \implies \text{Physical Address} = \mathbf{14\text{ bits}}$$
   $$\text{Number of Physical Frames} = \frac{16\text{ KB}}{1\text{ KB}} = 16 = 2^4 \implies \mathbf{f = 4\text{ bits}}$$
   *(Verification: $f + d = 4 + 10 = 14\text{ bits}$)*.

\`\`\`
Virtual Address (16 bits):
+---------------------+----------------------+
| Page Number (p = 6) | Page Offset (d = 10) |
+---------------------+----------------------+

Physical Address (14 bits):
+----------------------+----------------------+
| Frame Number (f = 4) | Page Offset (d = 10) |
+----------------------+----------------------+
\`\`\`

---

#### Part (b) [3 Marks] — EAT at 80% Hit Ratio ($lpha = 0.80$)

- **Parameters**: $\text{TLB Lookup } t_{\text{tlb}} = 10\text{ ns}$, $\text{Main Memory Access } t_{\text{mem}} = 100\text{ ns}$.
- **Access Paths**:
  - **On TLB Hit**: Access TLB ($10\text{ ns}$) $+$ Access RAM for target word ($100\text{ ns}$) $= \mathbf{110\text{ ns}}$.
  - **On TLB Miss**: Access TLB ($10\text{ ns}$) $+$ Access RAM Page Table ($100\text{ ns}$) $+$ Access RAM target word ($100\text{ ns}$) $= \mathbf{210\text{ ns}}$.
- **Formula**:
  $$\text{EAT} = \alpha \times (t_{\text{tlb}} + t_{\text{mem}}) + (1 - \alpha) \times (t_{\text{tlb}} + 2 \times t_{\text{mem}})$$
  $$\text{EAT} = 0.80 \times (10 + 100) + 0.20 \times (10 + 200)$$
  $$\text{EAT} = 0.80 \times 110 + 0.20 \times 210 = 88 + 42 = \mathbf{130\text{ ns}}$$

---

#### Part (c) [2 Marks] — EAT at 95% Hit Ratio & Speedup

- At $\alpha = 0.95$:
  $$\text{EAT}_{95\%} = 0.95 \times 110 + 0.05 \times 210 = 104.5 + 10.5 = \mathbf{115\text{ ns}}$$
- **Absolute Improvement**:
  $$\Delta t = 130\text{ ns} - 115\text{ ns} = \mathbf{15\text{ ns speedup}}$$
- **Percentage Latency Reduction**:
  $$\text{Improvement} = \frac{130 - 115}{130} \times 100\% = \frac{15}{130} \times 100\% = \mathbf{11.54\%}$$

---

#### Part (d) [2 Marks] — Why Associative TLB is Critical

- **The Paging Memory Tax**: In a pure paged system without a TLB, **every single instruction and data reference requires TWO physical memory accesses**:
  1. Access 1: Read the Page Table Entry (PTE) from RAM to obtain the frame number.
  2. Access 2: Read/write the actual operand instruction at that physical frame in RAM.
  - This effectively cuts CPU memory bandwidth in half (slows down execution by $100\%$).
- **The TLB Solution**: The TLB is an on-chip, high-speed associative hardware cache. On a hit ($95\%$ of the time), address translation happens in $10\text{ ns}$ in parallel with cache tag checks, bypassing the first RAM read entirely. Memory access drops from $200\text{ ns} \to 110\text{ ns}$, doubling effective memory throughput.`,
        labPresetLink: { labTab: 'memory', note: 'Verify C2 Q8 TLB EAT in Lab 4 (Memory & Paging)' },
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
        stem: 'An enterprise e-commerce database storage controller has disk cylinders 0 to 499. The read/write head is currently at cylinder 215, having just serviced a previous request at cylinder 250. The queue of pending disk cylinder requests is: `82, 170, 43, 140, 310, 465, 125, 230`.',
        subParts: [
          {
            id: 'c2-q9a',
            label: '(a)',
            prompt: 'Deduce the head movement direction, and compute the seek order and total head movement (in cylinders) for both LOOK and Circular LOOK (C-LOOK).',
            maxMarks: 4,
            rubricCue: 'Direction is DOWNWARD (250->215); LOOK = 594 tracks; C-LOOK = 829 tracks (including return jump).',
          },
          {
            id: 'c2-q9b',
            label: '(b)',
            prompt: 'Compute the service order and total head movement for Shortest Seek Time First (SSTF).',
            maxMarks: 3,
            rubricCue: '215->230->170->140->125->82->43->310->465 = 15 + 187 + 422 = 624 tracks.',
          },
          {
            id: 'c2-q9c',
            label: '(c)',
            prompt: 'Compare LOOK vs C-LOOK vs SSTF on head travel efficiency, variance of waiting times, and vulnerability to starvation.',
            maxMarks: 3,
            rubricCue: 'LOOK wins efficiency (594 tracks); C-LOOK provides uniform waiting time; SSTF is vulnerable to starvation.',
          },
        ],
        workedSolution: `### Step-by-Step Examiner Solution

#### Direction Deduction
- Previous Request: $250$.
- Current Head Position: $215$.
- Because $215 < 250$, the actuator arm is actively moving **DOWNWARD (toward cylinder 0)**.
- Pending Queue: \`[43, 82, 125, 140, 170, 230, 310, 465]\`.

---

#### Part (a) [4 Marks] — LOOK & C-LOOK Computations

**1. LOOK Scheduling**:
- Sweeps downward servicing requests until the lowest pending request ($43$) is reached, reverses direction without traveling to cylinder 0, and sweeps upward to the highest pending request ($465$).
- **Service Order**: $215 \to 170 \to 140 \to 125 \to 82 \to 43 \to 230 \to 310 \to 465$
- **Total Head Movement**:
  $$\text{Downward Sweep} = 215 - 43 = 172\text{ cylinders}$$
  $$\text{Upward Sweep} = 465 - 43 = 422\text{ cylinders}$$
  $$\text{Total Movement (LOOK)} = 172 + 422 = \mathbf{594\text{ cylinders}}$$

**2. Circular LOOK (C-LOOK) Scheduling**:
- Sweeps downward servicing requests to the lowest request ($43$), immediately jumps to the highest pending request ($465$) without servicing on return, and sweeps downward again to service remaining requests.
- **Service Order**: $215 \to 170 \to 140 \to 125 \to 82 \to 43 \to 465 \to 310 \to 230$
- **Total Head Movement**:
  $$\text{Initial Downward Sweep} = 215 - 43 = 172\text{ cylinders}$$
  $$\text{Circular Jump to Highest} = 465 - 43 = 422\text{ cylinders}$$
  $$\text{Second Downward Sweep} = 465 - 230 = 235\text{ cylinders}$$
  $$\text{Total Movement (C-LOOK)} = 172 + 422 + 235 = \mathbf{829\text{ cylinders}}$$
  *(Note: If the return circular jump is counted as zero seek penalty because no I/O is serviced, seek distance is $172 + 235 = 407\text{ cylinders}$).*

---

#### Part (b) [3 Marks] — Shortest Seek Time First (SSTF) Simulation

- From $215$: Distances: $|215-230|=15$, $|215-170|=45$. Nearest is **230**. (Movement: $15$).
- From $230$: Distances: $|230-170|=60$, $|230-310|=80$. Nearest is **170**. (Movement: $60$).
- From $170$: Nearest is **140**. (Movement: $30$).
- From $140$: Nearest is **125**. (Movement: $15$).
- From $125$: Nearest is **82**. (Movement: $43$).
- From $82$: Nearest is **43**. (Movement: $39$).
- From $43$: Remaining are $310$ and $465$. Nearest is **310** ($|43-310|=267$). (Movement: $267$).
- From $310$: Nearest is **465** ($|310-465|=155$). (Movement: $155$).

- **Service Order**: $215 \to 230 \to 170 \to 140 \to 125 \to 82 \to 43 \to 310 \to 465$
- **Total Head Movement**:
  $$\text{Movement} = 15 + 60 + 30 + 15 + 43 + 39 + 267 + 155 = \mathbf{624\text{ cylinders}}$$

---

#### Part (c) [3 Marks] — Comparative Performance Analysis

| Metric | LOOK | C-LOOK | SSTF |
| :--- | :---: | :---: | :---: |
| **Total Head Movement** | **594 cylinders (Best)** | 829 cylinders | 624 cylinders |
| **Starvation Vulnerability** | **Immune** (Sweeps whole queue) | **Immune** (Sweeps whole queue) | **High Risk** (Trapped by local arrivals) |
| **Waiting Time Variance** | Moderate | **Lowest (Most Uniform)** | Highly Skewed |

- **Key Takeaway**:
  LOOK achieves the absolute lowest head movement ($594 < 624$), outperforming even SSTF because SSTF made an inefficient detour to $230$ before reversing all the way back down to $43$. Furthermore, LOOK and C-LOOK guarantee zero starvation.`,
        labPresetLink: { labTab: 'disk', note: 'Plot C2 Q9 LOOK/C-LOOK/SSTF in Lab 5 (Disk & RAID)' },
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
        stem: 'Evaluate modern OS-level containerization against hypervisor-based virtual machines for enterprise cloud microservices architectures.',
        subParts: [
          {
            id: 'c2-q10a',
            label: '(a)',
            prompt: 'Explain the core architectural building blocks of Linux containers (namespaces, cgroups, layered root filesystems) and trace the container deployment lifecycle.',
            maxMarks: 5,
            rubricCue: 'Namespaces (PID, NET, MNT, IPC) + cgroups (resource limits) + OverlayFS layered image + build/ship/run lifecycle.',
          },
          {
            id: 'c2-q10b',
            label: '(b)',
            prompt: 'Construct a 5-dimension comparison table evaluating Containers vs VMs across hardware abstraction, resource density, boot latency, security isolation, and OS flexibility.',
            maxMarks: 5,
            rubricCue: '5-point technical comparison with clear trade-offs between shared-kernel density and hypervisor-enforced isolation.',
          },
        ],
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [5 Marks] — Container Architectural Building Blocks & Lifecycle

**1. Three Core Linux Kernel Technologies [3.0 Marks]**:
1. **Linux Namespaces (Isolation Boundary)**:
   - Partition kernel resources so each container sees its own private virtual environment:
     - \`PID Namespace\`: Container has its own Process ID tree; container PID 1 is isolated from host PID 1.
     - \`NET Namespace\`: Private virtual network interfaces (\`veth\`), routing tables, and firewall rules.
     - \`MNT Namespace\`: Isolated filesystem mount points.
     - \`IPC Namespace\`: Isolates System V IPC and POSIX message queues.
     - \`UTS Namespace\`: Private hostname and NIS domain.
     - \`USER Namespace\`: Maps root inside the container (\`UID 0\`) to an unprivileged user on the host.
2. **Control Groups (cgroups v2 — Resource Governance)**:
   - Meters and enforces hardware resource caps:
     - \`cpu.max\`: Limits CPU time allocation (CFS bandwidth quota).
     - \`memory.max\`: Hard RAM limits; triggers OOM killer if exceeded.
     - \`io.weight\`: Throttles block storage read/write bandwidth.
3. **Layered Union Filesystems (OverlayFS)**:
   - Container images consist of immutable, stacked read-only layers.
   - When a container boots, OverlayFS mounts a thin, mutable **Copy-On-Write (COW)** layer on top. Modifying a file copies it to the upper layer without modifying the shared base image.

**2. Container Deployment Lifecycle [2.0 Marks]**:
- **Build**: Developer writes a \`Dockerfile\` and executes \`docker build\` to compile code into an Open Container Initiative (OCI) image.
- **Ship**: Image is cryptographically signed and pushed to a central registry (Docker Hub, AWS ECR, Artifact Registry).
- **Run**: Container orchestrator (Kubernetes, containerd, runc) pulls the image, configures namespaces and cgroups, mounts OverlayFS, and forks the isolated entrypoint process in milliseconds.

---

#### Part (b) [5 Marks] — Structured Comparison: Containers vs Virtual Machines

| Architectural Dimension | Virtual Machines (VMware ESXi, KVM) | OS Containers (Docker, Kubernetes) |
| :--- | :--- | :--- |
| **Virtualization Layer** | **Hardware Abstraction**: Hypervisor virtualizes CPU, RAM, BIOS, and NICs. | **OS Kernel Abstraction**: Direct system call isolation via Linux namespaces & cgroups. |
| **Guest OS Requirement** | **Full Duplicate Guest OS** per VM (Windows, Linux kernel in RAM). | **No Guest OS**: All containers share the single underlying Host OS Kernel. |
| **Resource Density & Footprint** | Gigabytes of RAM per VM; large disk images (20–40 GB). | **Megabytes per container**; up to $10\times$ higher container density per server. |
| **Boot Latency** | **Tens of seconds to minutes** (boots virtual BIOS, kernel, drivers). | **Milliseconds to seconds** (instantly forks isolated process). |
| **Security & Isolation Boundary** | **Strongest Isolation**: Hardware-enforced MMU / hypervisor privilege boundaries. | Moderate Isolation: Vulnerable to kernel privilege escalation / container breakout. |
| **Operating System Flexibility** | Can run Windows guest on Linux host or BSD on Windows host. | Restricted: Linux containers can ONLY run atop a Linux kernel. |`,
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
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [5 Marks] — Hardware Interrupt Cycle & Traps vs Interrupts
- **Cycle**: When hardware raises an interrupt, CPU finishes current instruction, pushes PC and PSW (Processor Status Word) onto Kernel Stack, flips Mode Bit to 0, indexes the **Interrupt Vector Table (IVT)**, executes the **Interrupt Service Routine (ISR)**, and restores context via \`IRET\`.
- **Contrast**:
  - **Asynchronous Interrupts**: Triggered externally by hardware clocks or I/O devices independent of CPU execution.
  - **Synchronous Traps**: Generated internally by CPU execution (divide-by-zero, page fault, software system calls).

---

#### Part (b) [5 Marks] — DMA Cycle Stealing & Interrupt Reduction
- **DMA Cycle Stealing**: The DMA controller seizes memory bus cycles from the CPU to transfer data blocks directly between peripheral devices and physical RAM without CPU intervention.
- **For a 4 KB (4096-Byte) Transfer**:
  - **Byte-Level Interrupt-Driven I/O**: Generates **4,096 separate hardware interrupts**, thrashing CPU cache and context-switch registers.
  - **Direct Memory Access (DMA)**: CPU initializes DMA registers once; DMA controller transfers all 4,096 bytes and raises **exactly 1 completion interrupt**.`,
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
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [6 Marks] — Process Tree & Zombie/Orphan Definitions
- **Process Trace**:
  1. Root parent executes 1st \`fork()\` $\implies 2$ processes (Parent $P$, Child $C1$).
  2. Both execute 2nd \`fork()\` $\implies 4$ processes ($P, C1, C2, C3$).
  3. The condition \`if (fork() == 0)\` is satisfied ONLY by the children created in step 2 ($C2$ and $C3$).
  4. $C2$ and $C3$ each execute the 3rd \`fork()\`, creating 2 additional children ($C4, C5$).
  - **Total Processes**: **6 total processes** (1 original parent + 5 children).
- **Zombie vs Orphan**:
  - **Zombie**: Process has finished execution (\`exit()\`), but its parent has not yet called \`wait()\` / \`waitpid()\`. Its exit status remains in the OS Process Table.
  - **Orphan**: Parent terminated before child. The child continues running and is automatically adopted by \`init\` / \`systemd\` (PID 1).

---

#### Part (b) [4 Marks] — Amdahl’s Law Speedup Calculations
- **Formula**: $S(N) = \frac{1}{S + \frac{1 - S}{N}}$, where Serial fraction $S = 0.25$, Parallel fraction $P = 0.75$.
- **On 4 Cores ($N = 4$)**:
  $$S(4) = \frac{1}{0.25 + \frac{0.75}{4}} = \frac{1}{0.25 + 0.1875} = \frac{1}{0.4375} \approx \mathbf{2.29\times}$$
- **On Infinite Cores ($N \to \infty$)**:
  $$S(\infty) = \frac{1}{0.25 + 0} = \frac{1}{0.25} = \mathbf{4.00\times}$$`,
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
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [4 Marks] — CAS Semantics & Starvation
- \`compare_and_swap(int *val, int expected, int new_val)\` executes atomically: if \`*val == expected\`, sets \`*val = new_val\` and returns old value.
- A naive spinlock \`while (CAS(&lock, 0, 1) != 0);\` suffers from unbounded waiting: a fast thread can repeatedly win the arbitration while a slower thread starves indefinitely.

---

#### Part (b) [6 Marks] — Bounded-Waiting CAS Protocol & Proof
\`\`\`c
// Shared variables
boolean waiting[n] = {false};
int lock = 0;

// Process Pi Entry
waiting[i] = true;
int key = 1;
while (waiting[i] && key == 1) {
    key = compare_and_swap(&lock, 0, 1);
}
waiting[i] = false;
/* CRITICAL SECTION */

// Process Pi Exit
int j = (i + 1) % n;
while ((j != i) && !waiting[j]) {
    j = (j + 1) % n;
}
if (j == i) {
    lock = 0;             // No processes waiting: free lock
} else {
    waiting[j] = false;   // Hand critical section directly to Pj
}
\`\`\`
- **Proof**: On exit, $P_i$ scans circularly $j = (i + 1) \% n$. It passes permission directly to the first waiting process without releasing \`lock = 0\`. Thus, any process $P_k$ enters the critical section within at most **$n - 1$ turns**, strictly satisfying Bounded Waiting.`,
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
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [5 Marks] — Dining Philosophers Deadlock & Solutions
- **Naive Deadlock**: If all 5 philosophers become hungry simultaneously and each picks up their left chopstick (\`chopstick[i]\`), all 5 chopsticks are held. When each attempts to acquire their right chopstick (\`chopstick[(i+1)%5]\`), all block forever in a circular wait deadlock.
- **Three Deadlock-Free Solutions**:
  1. **Asymmetric Ordering**: Odd philosophers pick up left chopstick then right; even philosophers pick up right chopstick then left. Breaks circular wait!
  2. **Bounded Concurrency**: Allow at most 4 philosophers to sit at the 5-seat table concurrently using a counting semaphore \`seated = 4\`.
  3. **Atomic Both-or-None**: Use a Monitor where a philosopher can pick up chopsticks only if BOTH adjacent chopsticks are free simultaneously.

---

#### Part (b) [5 Marks] — First Readers-Writers Solution & Writer Starvation
\`\`\`c
semaphore rw_mutex = 1, mutex = 1;
int read_count = 0;

void Writer() {
    wait(rw_mutex);
    /* Writing */
    signal(rw_mutex);
}

void Reader() {
    wait(mutex);
    read_count++;
    if (read_count == 1) wait(rw_mutex); // First reader locks out writers
    signal(mutex);
    
    /* Reading */
    
    wait(mutex);
    read_count--;
    if (read_count == 0) signal(rw_mutex); // Last reader releases lock
    signal(mutex);
}
\`\`\`
- **Writer Starvation Cause**: If a continuous stream of overlapping readers arrives, \`read_count\` remains $\ge 1$ indefinitely. \`rw_mutex\` is never signaled, causing waiting writers to starve permanently.`,
        labPresetLink: { labTab: 'sync', note: 'Trace Dining Philosophers deadlock fix in Lab 3' },
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
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [5 Marks] — Comparison of File Allocation Strategies
| Metric | Contiguous Allocation | Linked / FAT Allocation | Indexed Allocation (Unix Inode) |
| :--- | :--- | :--- | :--- |
| **Sequential Access** | Extremely fast (single head seek). | Fast (follows sector links). | Fast. |
| **Random / Direct Access** | Fast ($O(1)$ block offset math). | **Extremely slow** ($O(N)$ link traversal). | **Fast** ($O(1)$ indirect index math). |
| **External Fragmentation** | **Severe** (requires defragmentation). | None (any free block can be used). | None. |
| **File Growth** | Difficult (requires relocation if hole fills). | Trivial (dynamically link blocks). | Dynamic (allocate indirect blocks). |

---

#### Part (b) [5 Marks] — Unix Inode Maximum File Size Calculation
- Block Size: $4\text{ KB} = 4096\text{ bytes}$. Pointer Size: $4\text{ bytes}$.
- **Pointers per Block**:
  $$P = \frac{4096\text{ B}}{4\text{ B}} = 1024 = 2^{10}\text{ block pointers}$$
- **Capacity Calculations**:
  1. **Direct Pointers (12)**: $12 \times 4\text{ KB} = \mathbf{48\text{ KB}}$.
  2. **Single Indirect (1)**: $1024 \times 4\text{ KB} = 2^{10} \times 2^{12}\text{ B} = 4\text{ MB}$.
  3. **Double Indirect (1)**: $1024^2 \times 4\text{ KB} = 2^{20} \times 4\text{ KB} = 4\text{ GB}$.
  4. **Triple Indirect (1)**: $1024^3 \times 4\text{ KB} = 2^{30} \times 4\text{ KB} = 4\text{ TB}$.
- **Total Maximum File Size**:
  $$\text{Max File Size} = 48\text{ KB} + 4\text{ MB} + 4\text{ GB} + 4\text{ TB} \approx \mathbf{4.004\text{ TB}}$$`,
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
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [5 Marks] — Stack Buffer Overflow & Mitigations
- In a classic stack smashing attack, un-bounded string inputs (\`strcpy\`) overwrite the local buffer, step over the saved frame pointer (EBP), and corrupt the **Saved Return Address (EIP)** to redirect execution to shellcode.
- **Three Mitigations**:
  1. **Stack Canaries**: Compiler inserts a random integer before saved EIP. Function prologue validates canary before \`ret\`; if altered, aborts immediately.
  2. **DEP / NX (Data Execution Prevention / No-Execute Bit)**: Marks stack and heap memory pages as non-executable, preventing shellcode execution.
  3. **ASLR (Address Space Layout Randomization)**: Randomizes stack, heap, and library base addresses on every program launch.

---

#### Part (b) [5 Marks] — Symmetric vs Asymmetric Crypto & Digital Signatures
- **Symmetric (AES)**: Single shared secret key for encryption and decryption; high throughput.
- **Asymmetric (RSA)**: Mathematically linked keypair: Public Key (shared) + Private Key (kept secret).
- **Digital Signature Workflow**:
  - **Signing**: Sender hashes message $H = \text{SHA-256}(M)$ and encrypts hash with **Sender's PRIVATE Key**: $S = E_{K_{\text{priv}}}(H)$.
  - **Verification**: Receiver decrypts signature with **Sender's PUBLIC Key**: $H' = D_{K_{\text{pub}}}(S)$ and asserts $H' == \text{SHA-256}(M)$. Guarantees authenticity, integrity, and non-repudiation.`,
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
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [5 Marks] — Access Matrix & Meta-Rights
- Rows represent **Protection Domains** (users/processes); Columns represent **Objects** (files, devices).
- **Special Meta-Rights**:
  - \`copy (*)\`: Allows a domain to propagate that right to other domains in the same column.
  - \`owner\`: Allows a domain to add or delete any right in that column.
  - \`control\`: Domain $D_i$ can modify access rights of domain $D_j$.
  - \`switch\`: Allows a process executing in domain $D_1$ to transition to domain $D_2$.

---

#### Part (b) [5 Marks] — Matrix Implementations & Revocation
- **Access Control Lists (ACL)**: Decomposes matrix **column-wise** (stored per object).
  - *Revocation*: **Instantaneous and trivial**; simply remove user from object's ACL.
- **Capability Lists (C-Lists)**: Decomposes matrix **row-wise** (stored per domain as unforgeable tickets).
  - *Revocation*: **Extremely difficult**; requires locating and invalidating tickets across all processes.
- **Lock-Key Mechanism**: Each object has a list of unique locks; each domain holds keys. Easy revocation by changing object lock.`,
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
        stem: 'Part I: SRTF on `P1(AT=0,BT=8), P2(1,4), P3(2,9), P4(3,5)`. Part II: Classic Banker’s 5 processes Total = (10,5,7), Alloc P0(0,1,0), P1(2,0,0), P2(3,0,2), P3(2,1,1), P4(0,0,2), Max P0(7,5,3), P1(3,2,2), P2(9,0,2), P3(2,2,2), P4(4,3,3).',
        subParts: [
          { id: 'pred-q8a', label: '(a)', prompt: 'Construct SRTF Gantt chart and compute exact Average Waiting Time.', maxMarks: 7, rubricCue: 'P1[0-1] P2[1-5] P4[5-10] P1[10-17] P3[17-26]; Avg WT = (9+0+15+2)/4 = 6.50 ms.' },
          { id: 'pred-q8b', label: '(b)', prompt: 'Find Available, Need, Safe Sequence, and evaluate `Request1 = (1, 0, 2)`.', maxMarks: 8, rubricCue: 'Avail=(3,3,2), Safe `<P1,P3,P4,P0,P2>`; Request1 GRANTED safely with `<P1,P3,P4,P0,P2>`!' },
        ],
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [7 Marks] — Shortest Remaining Time First (SRTF)
- $t=0$: $P1(8)$ runs $[0-1]$ (rem 7).
- $t=1$: $P2(4)$ arrives. $4 < 7 \implies P2$ preempts $P1$. Runs $[1-5]$ $\to$ **$P2$ completes at $5$**.
- $t=5$: Ready: $P4(5)$, $P1(7)$, $P3(9)$. Shortest is $P4$. Runs $[5-10]$ $\to$ **$P4$ completes at $10$**.
- $t=10$: Ready: $P1(7)$, $P3(9)$. Shortest is $P1$. Runs $[10-17]$ $\to$ **$P1$ completes at $17$**.
- $t=17$: $P3(9)$ runs $[17-26]$ $\to$ **$P3$ completes at $26$**.
- **Metrics Table**:
  - $P1$: $CT = 17, TAT = 17, WT = 17 - 8 = 9\text{ ms}$.
  - $P2$: $CT = 5, TAT = 5 - 1 = 4, WT = 4 - 4 = 0\text{ ms}$.
  - $P3$: $CT = 26, TAT = 26 - 2 = 24, WT = 24 - 9 = 15\text{ ms}$.
  - $P4$: $CT = 10, TAT = 10 - 3 = 7, WT = 7 - 5 = 2\text{ ms}$.
- **Average Waiting Time**:
  $$\text{Avg WT} = \frac{9 + 0 + 15 + 2}{4} = \frac{26}{4} = \mathbf{6.50\text{ ms}}$$

---

#### Part (b) [8 Marks] — Banker's Algorithm Safety & Request Evaluation
- Total Alloc $= (7, 2, 5) \implies \text{Available} = (10, 5, 7) - (7, 2, 5) = \mathbf{(3, 3, 2)}$.
- Need Matrix: $P0(7,4,3), P1(1,2,2), P2(6,0,0), P3(0,1,1), P4(4,3,1)$.
- **Initial Safe Sequence**: $\mathbf{\langle P1, P3, P4, P0, P2 \rangle}$.
- **Evaluate $Request_1 = (1, 0, 2)$**:
  1. $(1, 0, 2) \le \text{Need}[P1](1, 2, 2)$ (OK).
  2. $(1, 0, 2) \le \text{Available}(3, 3, 2)$ (OK).
  3. Tentative Available $= (3,3,2) - (1,0,2) = \mathbf{(2, 3, 0)}$.
  4. Safety test on tentative state: $P1$ runs (needs $0,2,0 \le 2,3,0$) $\to$ Work becomes $(4, 3, 0)$. Then $P3$ runs $\to$ Work becomes $(6, 4, 1)$. Safe sequence $\langle P1, P3, P4, P0, P2 \rangle$ exists!
  - **Verdict**: Request1 is **SAFE $\implies$ GRANTED**!`,
        labPresetLink: { labTab: 'bankers', note: 'Verify Silberschatz Ch 8 Banker’s in Lab 2 (Banker’s & RAG)' },
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
        stem: 'Part I: Prove Belady’s anomaly using FIFO on `1,2,3,4,1,2,5,1,2,3,4,5` (3 vs 4 frames). Part II: ma = 100 ns, page fault = 8 ms, p = 0.00001. Part III: Disk 0–199, head 53 moving down, queue 98,183,37,122,14,124,65,67 under SCAN.',
        subParts: [
          { id: 'pred-q9a', label: '(a)', prompt: 'Trace 3-frame vs 4-frame FIFO to prove Belady’s Anomaly and explain why LRU is immune.', maxMarks: 6, rubricCue: '3 frames = 9 faults < 4 frames = 10 faults; LRU stack inclusion property.' },
          { id: 'pred-q9b', label: '(b)', prompt: 'Compute Demand Paging EAT in nanoseconds.', maxMarks: 4, rubricCue: '8 ms = 8,000,000 ns -> EAT = 0.99999(100) + 0.00001(8,000,000) ≈ 180 ns.' },
          { id: 'pred-q9c', label: '(c)', prompt: 'Compute SCAN (downward toward 0) sequence and total head movement.', maxMarks: 5, rubricCue: '53->37->14->0->65->67->98->122->124->183 = 53 + 183 = 236 tracks.' },
        ],
        workedSolution: `### Step-by-Step Examiner Solution

#### Part (a) [6 Marks] — Belady’s Anomaly Proof on FIFO
- String: \`1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5\`
  - **With 3 Frames**: Yields **9 Page Faults**.
  - **With 4 Frames**: Yields **10 Page Faults**!
- **Belady’s Anomaly**: For certain page replacement algorithms (like FIFO), increasing allocated physical frames can paradoxically INCREASE total page faults.
- **LRU Immunity**: LRU is a **Stack Algorithm** satisfying the inclusion property ($B(t) \subseteq T(t)$), proving that adding frames can NEVER increase page faults.

---

#### Part (b) [4 Marks] — Demand Paging EAT
- Page Fault Service Time: $8\text{ ms} = 8,000,000\text{ ns}$. Memory Access: $100\text{ ns}$. Fault rate $p = 10^{-5}$.
  $$\text{EAT} = (1 - p) \times 100 + p \times 8,000,000 = 99.999 + 80 = \mathbf{180.0\text{ ns}}$$

---

#### Part (c) [5 Marks] — Disk SCAN Scheduling (Head at 53, Moving Down)
- Downward: $53 \to 37 \to 14 \to 0$. Reverses at 0 and sweeps upward: $0 \to 65 \to 67 \to 98 \to 122 \to 124 \to 183$.
- **Total Head Movement**:
  $$\text{Movement} = (53 - 0) + (183 - 0) = 53 + 183 = \mathbf{236\text{ cylinders}}$$`,
        labPresetLink: { labTab: 'memory', note: 'Verify Belady’s Anomaly in Lab 4 & Silberschatz Disk in Lab 5' },
      },
    ],
  },
];

// =========================================================================
// DYNAMIC F1 SLOT SCHEMA & INTEGRATION ENGINE
// =========================================================================

export interface F1QuestionSlot {
  slotNumber: number;
  qNo: string;
  moduleId: 'm1' | 'm2' | 'm3' | 'm4' | 'm5';
  co: string;
  bloom: 'K2' | 'K3' | 'K4' | 'K5';
  marks: number;
  targetTopicId: string;
  targetTopicTitle: string;
  expectedArchetype: string;
  candidateTopicIds: string[];
  placeholderPrompt: string;
  placeholderSubParts: PaperSubPart[];
  isEntered: boolean;
  liveQuestion?: PaperQuestion;
}

export interface F1SlotBlueprint {
  slotId: 'f1';
  slotLabel: string;
  structure: string;
  totalMarks: number;
  durationMinutes: number;
  slots: F1QuestionSlot[];
}

export const DEFAULT_F1_SLOT_BLUEPRINT: F1QuestionSlot[] = [
  {
    slotNumber: 1,
    qNo: 'Q1',
    moduleId: 'm1',
    co: 'CO1',
    bloom: 'K3',
    marks: 10,
    targetTopicId: 'm1-syscalls-services',
    targetTopicTitle: 'OS Services & Dual-Mode System Call Dispatch',
    expectedArchetype: 'Architecture Diagrams + Trap Mechanism',
    candidateTopicIds: ['m1-os-structures', 'm1-syscalls-services', 'm1-interrupts-dma'],
    placeholderPrompt: 'Analyze OS Dual-Mode Hardware Operation, Timer Interrupt Protection, and System Call Parameter Passing Mechanics.',
    placeholderSubParts: [
      { id: 'f1-q1a', label: '(a)', prompt: 'Explain dual-mode operation (Mode Bit 0 vs 1) and hardware timer protection against infinite user loops.', maxMarks: 5, rubricCue: 'Privilege bit flip + timer interrupt decrements to 0 generating hardware trap.' },
      { id: 'f1-q1b', label: '(b)', prompt: 'Detail 3 methods for passing system call parameters from user space to kernel space.', maxMarks: 5, rubricCue: 'Registers, memory block/table with pointer in register, and system stack.' },
    ],
    isEntered: false,
  },
  {
    slotNumber: 2,
    qNo: 'Q2',
    moduleId: 'm2',
    co: 'CO2',
    bloom: 'K3',
    marks: 10,
    targetTopicId: 'm2-process-operations',
    targetTopicTitle: 'POSIX fork() Hierarchy & Zombie/Orphan Handling',
    expectedArchetype: 'Process Tree Trace + Lifecycle Management',
    candidateTopicIds: ['m2-process-pcb', 'm2-process-operations', 'm2-threads'],
    placeholderPrompt: 'Trace Unix process tree creation, context preservation in PCB, and Zombie / Orphan process termination handling.',
    placeholderSubParts: [
      { id: 'f1-q2a', label: '(a)', prompt: 'Trace process creation in nested fork() snippets and illustrate PCB state transitions.', maxMarks: 5, rubricCue: 'Process tree diagram + PCB fields saved during context switch.' },
      { id: 'f1-q2b', label: '(b)', prompt: 'Distinguish Zombie vs Orphan processes and describe how systemd / init (PID 1) cleans orphans.', maxMarks: 5, rubricCue: 'Waitpid reaping exit status vs PID 1 re-parenting.' },
    ],
    isEntered: false,
  },
  {
    slotNumber: 3,
    qNo: 'Q3',
    moduleId: 'm2',
    co: 'CO2',
    bloom: 'K3',
    marks: 10,
    targetTopicId: 'm2-preemptive-scheduling',
    targetTopicTitle: 'Preemptive Round Robin (q = 4 ms) vs SRTF Scheduling',
    expectedArchetype: 'Dual Gantt Charts + Turnaround & Waiting Time Math',
    candidateTopicIds: ['m2-nonpreemptive-scheduling', 'm2-preemptive-scheduling'],
    placeholderPrompt: 'Compare Round Robin (time quantum q = 4 ms) against Shortest Remaining Time First (SRTF) across turnaround and waiting times.',
    placeholderSubParts: [
      { id: 'f1-q3a', label: '(a)', prompt: 'Construct Gantt charts for Round Robin (q = 4 ms) and SRTF on arriving processes.', maxMarks: 6, rubricCue: 'Accurate timelines and queue evolutions.' },
      { id: 'f1-q3b', label: '(b)', prompt: 'Compute and compare Average Turnaround Time and Average Waiting Time.', maxMarks: 4, rubricCue: 'Full mathematical derivation of CT, TAT, WT.' },
    ],
    isEntered: false,
  },
  {
    slotNumber: 4,
    qNo: 'Q4',
    moduleId: 'm2',
    co: 'CO2',
    bloom: 'K4',
    marks: 10,
    targetTopicId: 'm2-deadlock-handling',
    targetTopicTitle: "Banker's Algorithm Safety & Resource Request",
    expectedArchetype: '10M Multi-Resource Matrix + Safety Verification',
    candidateTopicIds: ['m2-deadlock-rag', 'm2-deadlock-handling'],
    placeholderPrompt: "Execute Banker's Algorithm safety check on allocation/max matrices and evaluate dynamic resource requests.",
    placeholderSubParts: [
      { id: 'f1-q4a', label: '(a)', prompt: 'Calculate Need matrix and determine if system is in a Safe State with step-by-step Work updates.', maxMarks: 5, rubricCue: 'Available vector + Need calculation + Safe sequence derivation.' },
      { id: 'f1-q4b', label: '(b)', prompt: 'Evaluate dynamic resource request: verify if it can be granted immediately without leading to deadlock.', maxMarks: 5, rubricCue: 'Request <= Need and Request <= Available check + tentative safety trace.' },
    ],
    isEntered: false,
  },
  {
    slotNumber: 5,
    qNo: 'Q5',
    moduleId: 'm3',
    co: 'CO3',
    bloom: 'K3',
    marks: 10,
    targetTopicId: 'm3-classical-problems',
    targetTopicTitle: 'Dining Philosophers Deadlock-Free Semaphore Protocol',
    expectedArchetype: 'Semaphore Pseudocode + Circular Wait Elimination Proof',
    candidateTopicIds: ['m3-mutex-semaphores', 'm3-classical-problems', 'm3-monitors'],
    placeholderPrompt: 'Formulate a deadlock-free and starvation-free semaphore protocol for the Dining Philosophers problem.',
    placeholderSubParts: [
      { id: 'f1-q5a', label: '(a)', prompt: 'Demonstrate how naive semaphore acquisition leads to circular wait deadlock.', maxMarks: 5, rubricCue: 'Show all 5 philosophers picking up left chopstick simultaneously.' },
      { id: 'f1-q5b', label: '(b)', prompt: 'Write asymmetric protocol pseudocode and prove mutual exclusion and deadlock freedom.', maxMarks: 5, rubricCue: 'Odd/even asymmetric pick order breaking circular wait.' },
    ],
    isEntered: false,
  },
  {
    slotNumber: 6,
    qNo: 'Q6',
    moduleId: 'm3',
    co: 'CO3',
    bloom: 'K4',
    marks: 10,
    targetTopicId: 'm3-critical-section-peterson',
    targetTopicTitle: "Peterson's Algorithm Formal Proof & Multicore Hardware Hazards",
    expectedArchetype: 'Mathematical Contradiction Proof + Memory Fence Analysis',
    candidateTopicIds: ['m3-critical-section-peterson', 'm3-hardware-sync'],
    placeholderPrompt: "Prove Mutual Exclusion in Peterson's solution and evaluate modern multicore CPU memory reordering hazards.",
    placeholderSubParts: [
      { id: 'f1-q6a', label: '(a)', prompt: 'Formulate rigorous contradiction proof establishing Mutual Exclusion in Peterson’s algorithm.', maxMarks: 5, rubricCue: 'Both in CS -> flag[0]=T & flag[1]=T -> turn must be 0 and 1 simultaneously -> Contradiction.' },
      { id: 'f1-q6b', label: '(b)', prompt: 'Explain why Peterson’s algorithm fails on modern superscalar CPUs without memory barriers (fences).', maxMarks: 5, rubricCue: 'Out-of-order store-load reordering breaking sequential consistency.' },
    ],
    isEntered: false,
  },
  {
    slotNumber: 7,
    qNo: 'Q7',
    moduleId: 'm4',
    co: 'CO4',
    bloom: 'K4',
    marks: 10,
    targetTopicId: 'm4-paging-tlb',
    targetTopicTitle: 'Multi-Level Paging Address Translation & TLB Access Time',
    expectedArchetype: 'Address Bit Splits + Two-Level Directory Traversal + EAT Math',
    candidateTopicIds: ['m4-contiguous-allocation', 'm4-paging-tlb'],
    placeholderPrompt: 'Compute 32-bit two-level paging directory bit splits and evaluate Translation Lookaside Buffer (TLB) effective access time.',
    placeholderSubParts: [
      { id: 'f1-q7a', label: '(a)', prompt: 'Calculate page directory, page table, and offset bits for 32-bit architecture with 4 KB pages.', maxMarks: 5, rubricCue: '10-bit outer directory, 10-bit inner page table, 12-bit page offset.' },
      { id: 'f1-q7b', label: '(b)', prompt: 'Compute Effective Access Time (EAT) under 85% and 98% TLB hit ratios with 120 ns memory access.', maxMarks: 5, rubricCue: 'Hit = 130 ns, Miss = 250 ns; exact EAT calculations.' },
    ],
    isEntered: false,
  },
  {
    slotNumber: 8,
    qNo: 'Q8',
    moduleId: 'm4',
    co: 'CO4',
    bloom: 'K3',
    marks: 10,
    targetTopicId: 'm4-page-replacement',
    targetTopicTitle: 'Page Replacement — FIFO vs LRU vs Second-Chance Clock',
    expectedArchetype: 'Frame Matrix Comparison + Belady Anomaly Evaluation',
    candidateTopicIds: ['m4-virtual-memory', 'm4-page-replacement', 'm4-thrashing-ws'],
    placeholderPrompt: 'Simulate page replacement policies on a multi-frame reference string and evaluate the Second-Chance Clock algorithm.',
    placeholderSubParts: [
      { id: 'f1-q8a', label: '(a)', prompt: 'Trace frame state for FIFO and LRU on given reference string and count page faults.', maxMarks: 5, rubricCue: 'Exact fault markers and hit ratios.' },
      { id: 'f1-q8b', label: '(b)', prompt: 'Explain Second-Chance Clock algorithm mechanics and reference bit transitions.', maxMarks: 5, rubricCue: 'Circular list pointer scan + clearing ref bit from 1 to 0.' },
    ],
    isEntered: false,
  },
  {
    slotNumber: 9,
    qNo: 'Q9',
    moduleId: 'm5',
    co: 'CO5',
    bloom: 'K3',
    marks: 10,
    targetTopicId: 'm5-disk-scheduling',
    targetTopicTitle: 'Disk Scheduling — C-SCAN vs LOOK (0–199 Cylinders)',
    expectedArchetype: 'Head Seek Trajectory Calculation + Rotational Latency',
    candidateTopicIds: ['m5-disk-scheduling', 'm5-raid'],
    placeholderPrompt: 'Analyze disk head seek trajectory for Circular SCAN (C-SCAN) and LOOK scheduling algorithms.',
    placeholderSubParts: [
      { id: 'f1-q9a', label: '(a)', prompt: 'Calculate head service order and total seek distance for C-SCAN and LOOK algorithms.', maxMarks: 5, rubricCue: 'Clear seek calculations and boundary turnaround handling.' },
      { id: 'f1-q9b', label: '(b)', prompt: 'Compute average rotational latency at 7200 RPM and contrast starvation vulnerabilities.', maxMarks: 5, rubricCue: '4.17 ms rotational latency + C-SCAN uniform wait time proof.' },
    ],
    isEntered: false,
  },
  {
    slotNumber: 10,
    qNo: 'Q10',
    moduleId: 'm5',
    co: 'CO5',
    bloom: 'K3',
    marks: 10,
    targetTopicId: 'm5-file-allocation',
    targetTopicTitle: 'Unix Inode File Indexing & Maximum File Size',
    expectedArchetype: 'Indirect Pointer Math + Contiguous vs Indexed File Systems',
    candidateTopicIds: ['m5-file-allocation', 'm5-security-crypto', 'm5-protection-matrix'],
    placeholderPrompt: 'Calculate maximum file size supported by a Unix Inode with direct, single, double, and triple indirect pointers.',
    placeholderSubParts: [
      { id: 'f1-q10a', label: '(a)', prompt: 'Sketch Unix Inode architecture showing direct, single, double, and triple indirect blocks.', maxMarks: 5, rubricCue: 'Detailed block pointer hierarchy diagram.' },
      { id: 'f1-q10b', label: '(b)', prompt: 'Compute exact maximum file size for 4 KB blocks and 4-byte block addresses.', maxMarks: 5, rubricCue: 'Sum of direct (48 KB) + single (4 MB) + double (4 GB) + triple (4 TB).' },
    ],
    isEntered: false,
  },
];

export const SAMPLE_LIVE_F1_QUESTIONS: PaperQuestion[] = [
  {
    id: 'f1-live-q1',
    qNo: 'Q1',
    moduleId: 'm1',
    topicId: 'm1-syscalls-services',
    co: 'CO1',
    bloom: 'K3',
    marks: 10,
    title: 'Dual-Mode Hardware Operation & System Call Parameter Passing',
    stem: 'Analyze how modern CPU hardware enforces protection boundaries and coordinates system call execution.',
    subParts: [
      { id: 'f1-q1a', label: '(a)', prompt: 'Explain dual-mode operation (Mode Bit 0 vs 1) and hardware timer protection.', maxMarks: 5, rubricCue: 'Privilege bit flip + timer interrupt decrements to 0 generating hardware trap.' },
      { id: 'f1-q1b', label: '(b)', prompt: 'Detail 3 methods for passing system call parameters from user space to kernel space.', maxMarks: 5, rubricCue: 'Registers, memory block/table with pointer in register, and system stack.' },
    ],
    workedSolution: `### Step-by-Step Examiner Solution
#### Part (a) [5 Marks]
- CPU hardware maintains a **Mode Bit**: User Mode (\`1\`) restricts access to I/O instructions and memory outside allocated bounds. Kernel Mode (\`0\`) grants full privilege.
- System calls trigger a software interrupt / TRAP (\`sysenter\` / \`syscall\`), switching Mode Bit from $1 \to 0$.
- **Hardware Timer Protection**: A timer decrements with every clock tick. When counter reaches 0, a hardware interrupt fires, forcing CPU control back to the OS scheduler and preventing infinite user loops.

#### Part (b) [5 Marks]
1. **CPU Registers**: Fastest; parameters placed directly in \`rdi, rsi, rdx\`. Limited by register count.
2. **Memory Block / Table**: Parameters written in memory; address pointer passed in a register (Linux \`sys_clone\`).
3. **User / Kernel Stack**: Parameters pushed onto stack by user program; popped by kernel handler.`,
  },
  {
    id: 'f1-live-q2',
    qNo: 'Q2',
    moduleId: 'm2',
    topicId: 'm2-process-operations',
    co: 'CO2',
    bloom: 'K3',
    marks: 10,
    title: 'Process Hierarchy, PCB State Preservation & Zombie / Orphan Reaping',
    stem: 'Trace Unix process creation and explain kernel process state table management.',
    subParts: [
      { id: 'f1-q2a', label: '(a)', prompt: 'Trace process creation in nested fork() snippets and illustrate PCB state transitions.', maxMarks: 5, rubricCue: 'Process tree diagram + PCB fields saved during context switch.' },
      { id: 'f1-q2b', label: '(b)', prompt: 'Distinguish Zombie vs Orphan processes and describe how systemd / init (PID 1) cleans orphans.', maxMarks: 5, rubricCue: 'Waitpid reaping exit status vs PID 1 re-parenting.' },
    ],
    workedSolution: `### Step-by-Step Examiner Solution
#### Part (a) [5 Marks]
- During context switch, OS saves CPU registers, Program Counter (PC), stack pointer, and memory management registers into the Process Control Block (PCB).
- A sequence of $k$ sequential \`fork()\` calls spawns $2^k$ total processes ($2^k - 1$ new children).

#### Part (b) [5 Marks]
- **Zombie Process**: Process has completed execution via \`exit()\`, but parent has not yet called \`waitpid()\`. Entry lingers in PCB table consuming process table slots.
- **Orphan Process**: Parent dies before child. Orphan is automatically adopted by \`init\` / \`systemd\` (PID 1), which periodically invokes \`wait()\` to reap terminated orphans.`,
  },
  {
    id: 'f1-live-q3',
    qNo: 'Q3',
    moduleId: 'm2',
    topicId: 'm2-preemptive-scheduling',
    co: 'CO2',
    bloom: 'K3',
    marks: 10,
    title: 'Round Robin (q = 4 ms) vs Shortest Remaining Time First (SRTF)',
    stem: 'Schedule processes P1(AT=0,BT=8), P2(1,4), P3(2,9), P4(3,5) under Round Robin (q=4) and SRTF.',
    subParts: [
      { id: 'f1-q3a', label: '(a)', prompt: 'Construct Gantt charts for Round Robin (q = 4 ms) and SRTF.', maxMarks: 6, rubricCue: 'Accurate timelines and queue evolutions.' },
      { id: 'f1-q3b', label: '(b)', prompt: 'Compute and compare Average Turnaround Time and Average Waiting Time.', maxMarks: 4, rubricCue: 'Full mathematical derivation of CT, TAT, WT.' },
    ],
    workedSolution: `### Step-by-Step Examiner Solution
#### Part (a) [6 Marks]
- **SRTF Gantt**: \`P1[0-1] P2[1-5] P4[5-10] P1[10-17] P3[17-26]\`.
- **RR (q=4) Gantt**: \`P1[0-4] P2[4-8] P3[8-12] P4[12-16] P1[16-20] P3[20-24] P4[24-25] P3[25-26]\`.

#### Part (b) [4 Marks]
- **SRTF**: WTs: $P1=9, P2=0, P3=15, P4=2 \implies \mathbf{\text{Avg WT} = 6.50\text{ ms}}$.
- **Round Robin (q=4)**: WTs: $P1=12, P2=3, P3=15, P4=17 \implies \mathbf{\text{Avg WT} = 11.75\text{ ms}}$.
- **Conclusion**: SRTF achieves optimal average waiting time; Round Robin guarantees fair interactive responsiveness.`,
    labPresetLink: { labTab: 'cpu', note: 'Compare RR vs SRTF in Lab 1 (CPU Scheduler)' },
  },
  {
    id: 'f1-live-q4',
    qNo: 'Q4',
    moduleId: 'm2',
    topicId: 'm2-deadlock-handling',
    co: 'CO2',
    bloom: 'K4',
    marks: 10,
    title: "Banker's Algorithm Multi-Resource Safety & Request Evaluation",
    stem: 'Evaluate 5 processes and 3 resources Total = (10, 5, 7) for safety and immediate grantability of Request1 = (1, 0, 2).',
    subParts: [
      { id: 'f1-q4a', label: '(a)', prompt: 'Calculate Need matrix and determine if system is in a Safe State with step-by-step Work updates.', maxMarks: 5, rubricCue: 'Available vector + Need calculation + Safe sequence derivation.' },
      { id: 'f1-q4b', label: '(b)', prompt: 'Evaluate dynamic resource request: verify if it can be granted immediately without leading to deadlock.', maxMarks: 5, rubricCue: 'Request <= Need and Request <= Available check + tentative safety trace.' },
    ],
    workedSolution: `### Step-by-Step Examiner Solution
#### Part (a) [5 Marks]
- Available $= (3, 3, 2)$. Needs: $P0(7,4,3), P1(1,2,2), P2(6,0,0), P3(0,1,1), P4(4,3,1)$.
- Work trace: $P1 \to (5,3,2) \to P3 \to (7,4,3) \to P4 \to (7,4,5) \to P0 \to (7,5,5) \to P2 \to (10,5,7)$.
- **Safe Sequence**: $\mathbf{\langle P1, P3, P4, P0, P2 \rangle}$.

#### Part (b) [5 Marks]
- $Request_1 = (1, 0, 2) \le Need_1(1, 2, 2)$ (OK) and $\le Available(3, 3, 2)$ (OK).
- Tentative Available $= (2, 3, 0)$. Safety trace on tentative state confirms safe sequence $\langle P1, P3, P4, P0, P2 \rangle$ remains valid.
- **Verdict**: **Request1 is safely GRANTED!**`,
    labPresetLink: { labTab: 'bankers', note: 'Verify Banker’s safety in Lab 2 (Banker’s & RAG)' },
  },
  {
    id: 'f1-live-q5',
    qNo: 'Q5',
    moduleId: 'm3',
    topicId: 'm3-classical-problems',
    co: 'CO3',
    bloom: 'K3',
    marks: 10,
    title: 'Dining Philosophers Synchronization Using Semaphores',
    stem: 'Formulate a deadlock-free semaphore solution for 5 philosophers sharing 5 chopsticks.',
    subParts: [
      { id: 'f1-q5a', label: '(a)', prompt: 'Demonstrate how naive semaphore acquisition leads to circular wait deadlock.', maxMarks: 5, rubricCue: 'Show all 5 philosophers picking up left chopstick simultaneously.' },
      { id: 'f1-q5b', label: '(b)', prompt: 'Write asymmetric protocol pseudocode and prove mutual exclusion and deadlock freedom.', maxMarks: 5, rubricCue: 'Odd/even asymmetric pick order breaking circular wait.' },
    ],
    workedSolution: `### Step-by-Step Examiner Solution
#### Part (a) [5 Marks]
- In naive protocol, each philosopher $P_i$ executes \`wait(chopstick[i])\`.
- If all 5 decide to eat concurrently, each takes their left chopstick. All chopsticks are held; all execute \`wait(chopstick[(i+1)%5])\` and block forever. Circular wait condition is satisfied $\implies$ Deadlock!

#### Part (b) [5 Marks]
\`\`\`c
void philosopher(int i) {
    while (true) {
        think();
        if (i % 2 == 0) {
            wait(chopstick[(i + 1) % 5]); // Even: right then left
            wait(chopstick[i]);
        } else {
            wait(chopstick[i]);           // Odd: left then right
            wait(chopstick[(i + 1) % 5]);
        }
        eat();
        signal(chopstick[i]);
        signal(chopstick[(i + 1) % 5]);
    }
}
\`\`\`
- Asymmetric ordering guarantees at least one philosopher can acquire both chopsticks, breaking circular wait and preventing deadlock.`,
    labPresetLink: { labTab: 'sync', note: 'Trace Dining Philosophers in Lab 3' },
  },
  {
    id: 'f1-live-q6',
    qNo: 'Q6',
    moduleId: 'm3',
    topicId: 'm3-critical-section-peterson',
    co: 'CO3',
    bloom: 'K4',
    marks: 10,
    title: "Peterson's Algorithm Software Mutual Exclusion Proof",
    stem: "Prove Mutual Exclusion formally for Peterson's solution and evaluate out-of-order CPU execution.",
    subParts: [
      { id: 'f1-q6a', label: '(a)', prompt: 'Formulate rigorous contradiction proof establishing Mutual Exclusion in Peterson’s algorithm.', maxMarks: 5, rubricCue: 'Both in CS -> flag[0]=T & flag[1]=T -> turn must be 0 and 1 simultaneously -> Contradiction.' },
      { id: 'f1-q6b', label: '(b)', prompt: 'Explain why Peterson’s algorithm fails on modern superscalar CPUs without memory barriers (fences).', maxMarks: 5, rubricCue: 'Out-of-order store-load reordering breaking sequential consistency.' },
    ],
    workedSolution: `### Step-by-Step Examiner Solution
#### Part (a) [5 Marks]
- Assume both $P0$ and $P1$ are in Critical Section simultaneously.
- Both executed \`flag[0]=T\` and \`flag[1]=T\`.
- To exit spin loop, $P0$ required \`turn == 0\` while $P1$ required \`turn == 1\`.
- Scalar \`turn\` cannot hold $0$ and $1$ simultaneously $\implies$ Contradiction $\implies$ Mutual Exclusion is unconditionally preserved.

#### Part (b) [5 Marks]
- Modern out-of-order CPUs reorder independent store-load instructions for performance.
- CPU may reorder \`turn = j\` before \`flag[i] = true\`.
- Both threads can observe \`flag[peer] == false\` before intent is visible in L1/L2 cache, allowing both into the CS!
- **Fix**: Mandatory hardware memory fence / barrier (\`mfence\` / \`smp_mb()\`).`,
    labPresetLink: { labTab: 'sync', note: 'Simulate Peterson’s algorithm in Lab 3' },
  },
  {
    id: 'f1-live-q7',
    qNo: 'Q7',
    moduleId: 'm4',
    topicId: 'm4-paging-tlb',
    co: 'CO4',
    bloom: 'K4',
    marks: 10,
    title: 'Two-Level Paging Address Bit Splits & TLB Effective Access Time',
    stem: '32-bit architecture, 4 KB page size, 15 ns TLB lookup, 120 ns RAM access.',
    subParts: [
      { id: 'f1-q7a', label: '(a)', prompt: 'Calculate page directory, page table, and offset bits for 32-bit architecture with 4 KB pages.', maxMarks: 5, rubricCue: '10-bit outer directory, 10-bit inner page table, 12-bit page offset.' },
      { id: 'f1-q7b', label: '(b)', prompt: 'Compute Effective Access Time (EAT) under 85% and 98% TLB hit ratios with 120 ns memory access.', maxMarks: 5, rubricCue: 'Hit = 135 ns, Miss = 255 ns; exact EAT calculations.' },
    ],
    workedSolution: `### Step-by-Step Examiner Solution
#### Part (a) [5 Marks]
- Page Size $= 4\text{ KB} = 2^{12}\text{ bytes} \implies \mathbf{d = 12\text{ offset bits}}$.
- Remaining Virtual Page Number $= 32 - 12 = 20\text{ bits}$.
- In a two-level scheme with 4-byte PTEs, each 4 KB page table holds $1024 = 2^{10}$ entries:
  - Outer Page Directory: **10 bits** ($p_1$).
  - Inner Page Table: **10 bits** ($p_2$).
  - Page Offset: **12 bits** ($d$).

#### Part (b) [5 Marks]
- TLB Hit: $15 + 120 = 135\text{ ns}$.
- TLB Miss (Two-Level Page Table): $15 + 120\text{ (dir)} + 120\text{ (table)} + 120\text{ (word)} = \mathbf{375\text{ ns}}$.
- **At 85%**: $EAT = 0.85(135) + 0.15(375) = 114.75 + 56.25 = \mathbf{171.0\text{ ns}}$.
- **At 98%**: $EAT = 0.98(135) + 0.02(375) = 132.30 + 7.50 = \mathbf{139.8\text{ ns}}$.`,
    labPresetLink: { labTab: 'memory', note: 'Verify TLB EAT in Lab 4 (Memory & Paging)' },
  },
  {
    id: 'f1-live-q8',
    qNo: 'Q8',
    moduleId: 'm4',
    topicId: 'm4-page-replacement',
    co: 'CO4',
    bloom: 'K3',
    marks: 10,
    title: 'Page Replacement — FIFO vs LRU vs Second-Chance Clock',
    stem: 'Reference string: 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5 under 3 frames.',
    subParts: [
      { id: 'f1-q8a', label: '(a)', prompt: 'Trace frame state for FIFO and LRU on given reference string and count page faults.', maxMarks: 5, rubricCue: 'Exact fault markers and hit ratios.' },
      { id: 'f1-q8b', label: '(b)', prompt: 'Explain Second-Chance Clock algorithm mechanics and reference bit transitions.', maxMarks: 5, rubricCue: 'Circular list pointer scan + clearing ref bit from 1 to 0.' },
    ],
    workedSolution: `### Step-by-Step Examiner Solution
#### Part (a) [5 Marks]
- **FIFO (3 frames)**: Produces **9 page faults** (compulsory on 1,2,3,4; hits on 1,2; faults on 5,3,4,5).
- **LRU (3 frames)**: Produces **10 page faults** (demonstrates that for some strings, LRU fault count differs from FIFO).

#### Part (b) [5 Marks]
- **Clock Algorithm**:
  - Maintains circular list of frames and a pointer (clock hand).
  - Each frame has a **Reference Bit** (set to 1 by hardware on read/write).
  - When replacement needed, pointer advances:
    - If $\text{Ref Bit} == 1$: Give second chance! Clear bit to $0$ and advance pointer.
    - If $\text{Ref Bit} == 0$: Evict this victim frame and insert new page with bit $= 1$.`,
    labPresetLink: { labTab: 'memory', note: 'Simulate Page Replacement in Lab 4' },
  },
  {
    id: 'f1-live-q9',
    qNo: 'Q9',
    moduleId: 'm5',
    topicId: 'm5-disk-scheduling',
    co: 'CO5',
    bloom: 'K3',
    marks: 10,
    title: 'Disk Scheduling Comparison — C-SCAN vs LOOK (0–199 Cylinders)',
    stem: 'Cylinders 0–199, Head currently at 100 moving upward. Requests: 55, 58, 39, 18, 90, 160, 150, 38, 184.',
    subParts: [
      { id: 'f1-q9a', label: '(a)', prompt: 'Calculate head service order and total seek distance for C-SCAN and LOOK algorithms.', maxMarks: 5, rubricCue: 'Clear seek calculations and boundary turnaround handling.' },
      { id: 'f1-q9b', label: '(b)', prompt: 'Compute average rotational latency at 7200 RPM and contrast starvation vulnerabilities.', maxMarks: 5, rubricCue: '4.17 ms rotational latency + C-SCAN uniform wait time proof.' },
    ],
    workedSolution: `### Step-by-Step Examiner Solution
#### Part (a) [5 Marks]
- **LOOK (Upward)**: $100 \to 150 \to 160 \to 184 \to 90 \to 58 \to 55 \to 39 \to 38 \to 18$.
  $$\text{Seek} = (184 - 100) + (184 - 18) = 84 + 166 = \mathbf{250\text{ tracks}}$$
- **C-SCAN (Upward to 199)**: $100 \to 150 \to 160 \to 184 \to 199 \to 0 \to 18 \to 38 \to 39 \to 55 \to 58 \to 90$.
  $$\text{Seek} = (199 - 100) + (199 - 0) + (90 - 0) = 99 + 199 + 90 = \mathbf{388\text{ tracks}}$$

#### Part (b) [5 Marks]
- At 7200 RPM $= 120\text{ rev/s} \implies 1\text{ rev} = 8.33\text{ ms}$.
- **Average Rotational Latency**: $\frac{8.33\text{ ms}}{2} = \mathbf{4.17\text{ ms}}$.
- C-SCAN provides the most uniform wait time distribution across tracks because cylinders at the start of the disk are not penalized by bi-directional sweeps.`,
    labPresetLink: { labTab: 'disk', note: 'Plot C-SCAN in Lab 5 (Disk & RAID)' },
  },
  {
    id: 'f1-live-q10',
    qNo: 'Q10',
    moduleId: 'm5',
    topicId: 'm5-file-allocation',
    co: 'CO5',
    bloom: 'K3',
    marks: 10,
    title: 'Unix Inode File Indexing & Maximum File Size',
    stem: 'Block size 4 KB, 4-byte pointers, 12 direct, 1 single, 1 double, 1 triple indirect pointers.',
    subParts: [
      { id: 'f1-q10a', label: '(a)', prompt: 'Sketch Unix Inode architecture showing direct, single, double, and triple indirect blocks.', maxMarks: 5, rubricCue: 'Detailed block pointer hierarchy diagram.' },
      { id: 'f1-q10b', label: '(b)', prompt: 'Compute exact maximum file size for 4 KB blocks and 4-byte block addresses.', maxMarks: 5, rubricCue: 'Sum of direct (48 KB) + single (4 MB) + double (4 GB) + triple (4 TB).' },
    ],
    workedSolution: `### Step-by-Step Examiner Solution
#### Part (a) [5 Marks]
- **Inode Layout**:
  - Direct Pointers (0 to 11): Point directly to data blocks.
  - Single Indirect: Points to block of $P = 1024$ data pointers.
  - Double Indirect: Points to block of 1024 single-indirect blocks ($1024^2$ pointers).
  - Triple Indirect: Points to block of 1024 double-indirect blocks ($1024^3$ pointers).

#### Part (b) [5 Marks]
- Pointers per block $P = \frac{4096}{4} = 1024 = 2^{10}$.
- Direct: $12 \times 4\text{ KB} = 48\text{ KB}$.
- Single Indirect: $1024 \times 4\text{ KB} = 4\text{ MB}$.
- Double Indirect: $1024^2 \times 4\text{ KB} = 4\text{ GB}$.
- Triple Indirect: $1024^3 \times 4\text{ KB} = 4\text{ TB}$.
- **Total Max File Size**: $48\text{ KB} + 4\text{ MB} + 4\text{ GB} + 4\text{ TB} \approx \mathbf{4.004\text{ TB}}$.`,
  },
];

export function convertF1SlotsToForensicItems(
  slots: F1QuestionSlot[]
): SlotAppearanceItem[] {
  return slots
    .filter((s) => s.isEntered && s.liveQuestion)
    .map((s) => {
      const q = s.liveQuestion!;
      return {
        slotId: 'f1',
        slotLabel: 'F1 Slot',
        questionNumber: q.qNo,
        marks: q.marks,
        moduleId: q.moduleId,
        topicId: q.topicId,
        topicTitle: q.title,
        bloom: q.bloom,
        archetype: s.expectedArchetype || q.title,
      };
    });
}

export function getEffectiveSlotForensics(
  liveF1Items: SlotAppearanceItem[] = []
): SlotAppearanceItem[] {
  return [...SLOT_FORENSIC_ITEMS, ...liveF1Items];
}

export function buildF1SlotPaper(
  slots: F1QuestionSlot[] = DEFAULT_F1_SLOT_BLUEPRINT,
  title = 'VIT Chennai Real FAT — Slot F1 (Morning Exam)'
): ExamPaper {
  const questions: PaperQuestion[] = slots.map((s) => {
    if (s.isEntered && s.liveQuestion) {
      return s.liveQuestion;
    }
    return {
      id: `f1-${s.qNo.toLowerCase()}`,
      qNo: s.qNo,
      moduleId: s.moduleId,
      topicId: s.targetTopicId,
      co: s.co,
      bloom: s.bloom,
      marks: s.marks,
      title: s.targetTopicTitle,
      stem: s.placeholderPrompt,
      subParts: s.placeholderSubParts,
      workedSolution: `*Placeholder for Slot F1 ${s.qNo}: Awaiting morning examination paper input.*`,
    };
  });

  return {
    id: 'paper-f1',
    code: 'F1 · Live',
    title,
    subtitle: '10 × 10M = 100M · Morning Slot Paper (Dynamically Feeds F2 Prediction Engine)',
    setter: 'VIT Chennai Faculty (Morning Slot F1)',
    structureLabel: '10×10M = 100M',
    totalMarks: 100,
    durationMinutes: 180,
    isRealSlot: true,
    questions,
  };
}

export const SAMPLE_F1_EXAM_PAPER: ExamPaper = {
  id: 'paper-f1-sample',
  code: 'F1 · Sample Live',
  title: 'VIT Chennai FAT — Slot F1 Live Demonstration',
  subtitle: '10 × 10M = 100M · Live Ingested Morning Slot Paper (Feeds Prediction Engine)',
  setter: 'VIT Chennai Faculty (Morning Slot F1)',
  structureLabel: '10×10M = 100M',
  totalMarks: 100,
  durationMinutes: 180,
  isRealSlot: true,
  questions: SAMPLE_LIVE_F1_QUESTIONS,
};

// =========================================================================
// FORENSIC QUESTION MATRIX (POWERS COVERAGE MATRIX & PREDICTION ENGINE)
// =========================================================================

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
