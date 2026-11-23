import { TopicNote } from './noteTypes';

export const MODULE_2_NOTES: TopicNote[] = [
  {
    topicId: 'm2-process-pcb',
    moduleId: 'm2',
    title: 'Process Concepts, Memory Layout, PCB & 5-State Lifecycle',
    summary:
      'A process is a program in execution represented in the kernel by a Process Control Block (PCB) that tracks its 5-state lifecycle and enables context switching.',
    sourceDecks: ['Silberschatz 10e Ch 3 (§3.1–3.2)', 'VITC Past Paper: C2 Q2a'],
    keyPoints: [
      'A program is a passive file on disk; a **process** is an active entity with a Program Counter (PC), registers, and memory layout (**Text, Data, Heap, Stack**).',
      'Heap (dynamic `malloc`) grows **upward**; Stack (function frames/locals) grows **downward** toward each other.',
      '5 Process States: **New, Ready, Running, Waiting (Blocked), Terminated**.',
      '**Context Switch** saves the outgoing process’s registers/PC/state into its PCB and loads the incoming process’s PCB — pure overhead (no useful user work).',
    ],
    sections: [
      {
        heading: '5-State Process Transition Diagram',
        body: 'Only **Running** processes can move to **Waiting** (on I/O or event wait) or **Terminated**. A **Waiting** process NEVER jumps directly to **Running** — once I/O completes, it moves to **Ready** and waits for the CPU scheduler.',
        diagramId: 'm2-process-states',
      },
      {
        heading: 'Process Memory Layout & Process Control Block (PCB)',
        body: 'Every process owns a kernel-managed PCB holding PID, state, PC, CPU registers, scheduling priority, memory-management pointers (page table base), accounting info, and open file descriptors.',
        diagramId: 'm2-pcb-memory-layout',
      },
    ],
    workedExample: {
      title: 'Why Waiting Cannot Transition Directly to Running',
      problem:
        'A banking transaction process completes a disk write interrupt. Does it immediately resume on the CPU?',
      solution:
        'No. The I/O completion interrupt moves the process from the **Device Wait Queue** (`Waiting`) to the **Ready Queue** (`Ready`). The short-term CPU scheduler then decides when to dispatch it to `Running` according to priority/quantum.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Slot C2+TC2 Q2(a) (5M)',
        promptSummary: 'Analyze process states, scheduling queues, and context switching for a multi-user online banking server.',
        markBreakdown: '5-state diagram (2M) + Ready/Wait queues & PCB context switch (2M) + Banking application (1M)',
        solutionSteps: [
          'Draw the 5-state diagram (New -> Ready <-> Running -> Waiting -> Ready, Running -> Terminated).',
          'Explain Ready Queue (waiting for CPU) vs Wait/Device Queues (waiting for DB disk I/O or network socket) linked via PCB pointers.',
          'Tie to banking: authentication spawns a child/thread; DB queries move the worker to Waiting so another customer’s request uses the CPU immediately.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m2-pcb-1',
        question: 'Which transition is ILLEGAL in the standard 5-state process model?',
        options: ['Running -> Ready (timer interrupt)', 'Waiting -> Running (directly upon I/O completion)', 'Running -> Waiting (I/O request)', 'Ready -> Running (scheduler dispatch)'],
        correctIndex: 1,
        explanation: 'Upon I/O completion, a Waiting process always transitions to Ready first, never directly to Running.',
      },
      {
        id: 'sc-m2-pcb-2',
        question: 'Which two sections of a process’s virtual memory grow toward each other?',
        options: ['Text and Data', 'Heap and Stack', 'Text and Stack', 'Data and PCB'],
        correctIndex: 1,
        explanation: 'Heap grows upward for dynamic allocations while Stack grows downward for function calls.',
      },
    ],
    examTip: 'Label EVERY arrow on the 5-state diagram (`admitted`, `scheduler dispatch`, `interrupt`, `I/O or event wait`, `I/O completion`, `exit`).',
  },
  {
    topicId: 'm2-process-operations',
    moduleId: 'm2',
    title: 'Operations on Processes: fork(), exec(), wait(), Orphan & Zombie',
    summary:
      'POSIX creates processes hierarchically via `fork()` (clone) + `exec()` (replace image) + `wait()` (reap exit status), creating distinct Orphan and Zombie states when lifecycle order varies.',
    sourceDecks: ['Silberschatz 10e Ch 3 (§3.3)', 'OVERDUE GAP — Core Lab Exp 3'],
    keyPoints: [
      '`fork()` duplicates the calling process: returns **`0`** to the child, **`child_pid > 0`** to the parent, and **`-1`** on failure.',
      '`n` consecutive unconditional `fork()` calls yield **`2^n` total processes** (`2^n - 1` newly created children).',
      '**Zombie Process**: child called `exit()` but parent has NOT called `wait()` -> process is dead yet its PCB entry stays in the process table (`<defunct>`).',
      '**Orphan Process**: parent exits BEFORE child -> `init`/`systemd` (PID 1) adopts the child and calls `wait()` when it finishes.',
    ],
    sections: [
      {
        heading: 'fork() Process Tree & Return Values',
        body: 'Each `fork()` doubles the number of active processes at that line. Remember that child execution resumes at the exact statement *after* `fork()`, not from `main()`.',
        diagramId: 'm2-fork-tree',
        codeBlock: `pid_t pid = fork();
if (pid < 0) {
    fprintf(stderr, "Fork failed\\n");
} else if (pid == 0) {
    // Child process: replace address space with /bin/ls
    execlp("/bin/ls", "ls", "-l", NULL);
} else {
    // Parent process: block until child terminates and reap its PCB
    int status;
    wait(&status);
    printf("Child %d completed cleanly.\\n", pid);
}`,
      },
      {
        heading: 'Zombie vs Orphan vs Cascading Termination',
        body: 'Differentiate these three lifecycle edge cases clearly in short-answer and trace questions.',
        table: {
          headers: ['Concept', 'Cause', 'Kernel Impact', 'Resolution'],
          rows: [
            ['Zombie', 'Child exits; parent does NOT call `wait()`', 'Consumes PID & PCB slot (no RAM pages)', 'Parent calls `wait()` or parent exits (PID 1 reaps)'],
            ['Orphan', 'Parent exits while child still runs', 'Child continues running normally', 'Adopted immediately by `init`/`systemd` (PID 1)'],
            ['Cascading Termination', 'Parent terminates in OSes forbidding orphans (e.g., VMS)', 'OS forcibly terminates all descendants', 'Not automatic in POSIX/Linux'],
          ],
        },
      },
    ],
    workedExample: {
      title: 'Tracing Conditional fork() Count',
      problem:
        'How many total processes exist after executing: `fork(); if (fork() == 0) { fork(); }`?',
      solution:
        '1. Initial process P0. After first `fork()`: **2** processes (P0, C1). 2. Both execute `fork()` inside `if`: **4** processes total; the 2 newly spawned children receive `0` and enter the `if` body. 3. Those 2 children each call `fork()`, creating **2** more processes -> **6 total processes** (5 new children).',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Alpha Gap High-Probability Prompt (10M)',
        promptSummary: 'Trace fork() process tree count, write fork/exec/wait C snippet, and contrast Zombie vs Orphan.',
        markBreakdown: 'fork() tree & count (4M) + C code (3M) + Zombie vs Orphan table (3M)',
        solutionSteps: [
          'Draw each `fork()` level horizontally with parent->child arrows and PID return values (`0` vs `>0`).',
          'Show `wait()` reaping the child PCB so it does not linger as a Zombie.',
          'Contrast Zombie (dead child, living parent forgot `wait()`) vs Orphan (living child, dead parent -> adopted by PID 1).',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m2-po-1',
        question: 'What does `fork()` return inside the newly created CHILD process?',
        options: ['The parent’s PID', '0', '-1', 'The child’s own PID'],
        correctIndex: 1,
        explanation: 'In POSIX, `fork()` returns 0 to the child and the child’s positive PID to the parent.',
      },
      {
        id: 'sc-m2-po-2',
        question: 'Which system process adopts an Orphan process in Linux?',
        options: ['The shell parent', 'init / systemd (PID 1)', 'The BIOS', 'The swapper daemon'],
        correctIndex: 1,
        explanation: 'PID 1 (`init`/`systemd`) reparents orphan processes and periodically calls `wait()` to reap them.',
      },
    ],
    examTip: 'Read carefully whether the question asks for **total processes** (`2^n`) or **NEW child processes created** (`2^n - 1`)!',
  },
  {
    topicId: 'm2-threads',
    moduleId: 'm2',
    title: 'Threads, Multithreading Models (M:1, 1:1, M:M), Pthreads & Amdahl’s Law',
    summary:
      'Threads are lightweight execution units inside a process that share code, data, and open files while maintaining private stacks and registers to exploit multicore CPUs.',
    sourceDecks: ['Silberschatz 10e Ch 4 (§4.1–4.5)', 'VITC Past Paper: C2 Q2b'],
    keyPoints: [
      '**Shared per process**: Code (Text), Data (globals), Heap, Open Files. **Private per thread**: Thread ID, Program Counter (PC), Registers, Stack.',
      '4 Multithreading Benefits: **Responsiveness**, **Resource Sharing**, **Economy** (faster creation & context switch than `fork()`), **Scalability** (multicore parallelism).',
      'Mapping models: **Many-to-One** (1 blocking syscall blocks whole process, no multicore), **One-to-One** (Linux/Windows, true parallelism, higher kernel overhead), **Many-to-Many / Two-Level** (flexible multiplexing).',
      '**Amdahl’s Law**: `Speedup <= 1 / (S + (1 - S)/N)` where `S` = serial fraction and `N` = cores. As `N -> ∞`, max speedup hits hard ceiling `1 / S`.',
    ],
    sections: [
      {
        heading: 'Multithreading Models (M:1, 1:1, M:M)',
        body: 'User threads are managed in user space without kernel awareness; Kernel threads are scheduled directly by the OS onto physical CPU cores.',
        diagramId: 'm2-thread-models',
        table: {
          headers: ['Model', 'Blocking Syscall Impact', 'Multicore Parallelism', 'OS Examples'],
          rows: [
            ['Many-to-One (M:1)', 'Blocks ENTIRE process', 'No (only 1 thread in kernel at a time)', 'Solaris Green Threads, GNU Portable Threads'],
            ['One-to-One (1:1)', 'Only calling thread blocks', 'Yes (full SMP parallelism)', 'Linux, Windows, macOS'],
            ['Many-to-Many (M:M)', 'Kernel schedules another thread', 'Yes (up to kernel-thread pool size)', 'Go goroutines (M:N runtime), older Solaris'],
          ],
        },
      },
      {
        heading: 'POSIX Pthreads & Implicit Threading',
        body: 'Modern servers use **Thread Pools** (pre-spawned workers bound to a task queue) to cap thread count and eliminate per-request creation latency, alongside OpenMP and Grand Central Dispatch.',
        codeBlock: `// POSIX Pthreads skeleton (Lab Exp 4)
void *worker(void *arg) {
    int id = *(int *)arg;
    printf("Thread %d executing\\n", id);
    pthread_exit(NULL);
}
pthread_t tid;
pthread_create(&tid, NULL, worker, &thread_id);
pthread_join(tid, NULL);`,
      },
    ],
    workedExample: {
      title: "Amdahl's Law Speedup Ceiling",
      problem:
        'An application is 75% parallel and 25% serial (`S = 0.25`). Compute maximum speedup on (a) 2 cores, (b) 4 cores, and (c) infinite cores.',
      solution:
        '(a) `N=2`: `1 / (0.25 + 0.75/2) = 1 / 0.625 = 1.60×`. (b) `N=4`: `1 / (0.25 + 0.75/4) = 1 / 0.4375 = 2.29×`. (c) `N->∞`: `1 / 0.25 = 4.00×` hard upper bound.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Slot C2+TC2 Q2(b) (5M)',
        promptSummary: 'Recommend a multithreading model (One-to-One vs Many-to-Many) for a concurrent banking web server.',
        markBreakdown: 'User vs Kernel thread contrast (2M) + Model diagrams & comparison (2M) + Recommendation (1M)',
        solutionSteps: [
          'Contrast user-level vs kernel-level threads and note that Many-to-One fails immediately on blocking database I/O.',
          'Recommend **One-to-One** (Linux/Windows standard) combined with a **Thread Pool** to achieve full multicore parallelism without unbounded kernel thread creation.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m2-th-1',
        question: 'In a Many-to-One multithreading model, what happens when one user thread issues a blocking disk read?',
        options: ['Only that thread blocks', 'The entire process blocks because the kernel sees only one kernel thread', 'Another core picks up the remaining threads', 'The kernel automatically switches to 1:1'],
        correctIndex: 1,
        explanation: 'With only one kernel thread backing all user threads, a blocking syscall stalls the entire process.',
      },
      {
        id: 'sc-m2-th-2',
        question: 'If 20% of a workload is strictly serial (`S = 0.20`), what is the theoretical maximum speedup with unlimited CPU cores?',
        options: ['2×', '4×', '5×', '20×'],
        correctIndex: 2,
        explanation: 'Max speedup = `1 / S = 1 / 0.20 = 5×`.',
      },
    ],
    examTip: 'Always contrast **Concurrency** (making progress on multiple tasks on 1 core via interleaving) vs **Parallelism** (simultaneous execution on multiple cores).',
  },
  {
    topicId: 'm2-nonpreemptive-scheduling',
    moduleId: 'm2',
    title: 'CPU Scheduling Criteria & Non-Preemptive Schedulers (FCFS, SJF, NP-Priority)',
    summary:
      'Non-preemptive schedulers retain the CPU until a process terminates or blocks on I/O, trading simplicity against convoy effects (FCFS) or starvation (SJF/Priority).',
    sourceDecks: ['Silberschatz 10e Ch 5 (§5.1–5.3)', 'VITC Past Papers: C1 1-2 Q2 & C2 Q3'],
    keyPoints: [
      'Core formulas: **`TAT = CT - AT`**, **`WT = TAT - BT`**, **`RT = FirstStart - AT`** (for non-preemptive scheduling with 0 CS, `WT == RT`).',
      'Optimization goals: **Maximize** CPU Utilization & Throughput; **Minimize** Turnaround Time, Waiting Time, and Response Time.',
      '**FCFS**: zero starvation, but suffers severe **Convoy Effect** when short jobs queue behind one long CPU-bound job.',
      '**SJF** gives provably minimal Average Waiting Time; **Non-Preemptive Priority** requires **Aging** to prevent starvation of low-priority processes.',
    ],
    sections: [
      {
        heading: 'Scheduling Queues & Dispatcher Role',
        body: 'The **Dispatcher** performs context switching, switches to User Mode, and jumps to the process’s saved PC. The time it takes is **Dispatch Latency**.',
        diagramId: 'm2-scheduling-queues',
      },
      {
        heading: 'Verified FAT Benchmark: C1 Set 1-2 Q2 (Non-Preemptive Priority vs FCFS)',
        body: 'Given `P1(AT=0,BT=7,Pr=3)`, `P2(1,5,1)`, `P3(2,4,4)`, `P4(3,3,2)`, `P5(5,6,5)` with `1 = highest priority`. Because `P1` is the only job at `t=0`, it runs to completion `[0–7]`. At `t=7`, all other jobs have arrived and run in strict priority order: `P2 -> P4 -> P3 -> P5`.',
        table: {
          headers: ['Process', 'AT', 'BT', 'Priority', 'CT (NP-Pri)', 'TAT', 'WT', 'WT (FCFS)'],
          rows: [
            ['P1', '0', '7', '3', '7', '7', '0', '0'],
            ['P2', '1', '5', '1 (High)', '12', '11', '6', '6'],
            ['P3', '2', '4', '4', '19', '17', '13', '10'],
            ['P4', '3', '3', '2', '15', '12', '9', '13'],
            ['P5', '5', '6', '5 (Low)', '25', '20', '14', '14'],
            ['Average', '—', '—', '—', '—', '13.40 ms', '8.40 ms', '8.60 ms'],
          ],
        },
      },
    ],
    workedExample: {
      title: 'Exponential Averaging for SJF Burst Prediction',
      problem:
        'Given previous prediction `τ_0 = 10 ms`, actual burst `t_0 = 6 ms`, and smoothing factor `α = 0.5`, compute next predicted burst `τ_1`.',
      solution:
        '`τ_{n+1} = α * t_n + (1 - α) * τ_n = 0.5(6) + 0.5(10) = 3 + 5 = 8 ms`.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Slot C1 Set 1-2 Q2 (10M)',
        promptSummary: 'Non-Preemptive Priority Gantt, WT/TAT, averages (4M), compare with FCFS, responsiveness, 2 limitations + aging (6M).',
        markBreakdown: 'Gantt + CT/TAT/WT table (4M) + FCFS comparison (3M) + Starvation/Priority-Inversion + Aging fix (3M)',
        solutionSteps: [
          'Draw Gantt: `P1[0–7] | P2[7–12] | P4[12–15] | P3[15–19] | P5[19–25]`.',
          'Compute exact Avg WT = `42/5 = 8.40 ms`, Avg TAT = `67/5 = 13.40 ms` (vs FCFS Avg WT = `43/5 = 8.60 ms`).',
          'Cite 2 limitations: (1) Indefinite blocking / Starvation of low-priority jobs -> fix with **Aging** (increment priority over wait time); (2) Priority Inversion -> fix with **Priority Inheritance**.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m2-np-1',
        question: 'In Non-Preemptive Priority (1=highest), if P1(AT=0, BT=7, Pr=3) starts at t=0 and P2(AT=1, BT=5, Pr=1) arrives at t=1, when does P2 begin executing?',
        options: ['t = 1', 't = 5', 't = 7 (after P1 completes)', 't = 12'],
        correctIndex: 2,
        explanation: 'Because scheduling is non-preemptive, P1 retains the CPU until it finishes at t=7.',
      },
      {
        id: 'sc-m2-np-2',
        question: 'How does Aging eliminate starvation in Priority scheduling?',
        options: ['Kills low-priority jobs after 10 seconds', 'Gradually raises the priority of processes waiting in the ready queue over time', 'Converts all priorities to FCFS', 'Reduces CPU burst length'],
        correctIndex: 1,
        explanation: 'Aging ensures every waiting process eventually reaches the highest priority level and executes.',
      },
    ],
    examTip: 'Always double-check whether `P1` at `t=0` must finish before `P2` runs in non-preemptive scheduling — never preempt at `t=1`!',
  },
  {
    topicId: 'm2-preemptive-scheduling',
    moduleId: 'm2',
    title: 'Preemptive Schedulers: SRTF, Round Robin, Preemptive Priority (+CS) & MLFQ',
    summary:
      'Preemptive schedulers interrupt the running process when a higher-priority/shorter job arrives or a time quantum expires, delivering superior responsiveness at the cost of context-switch overhead.',
    sourceDecks: ['Silberschatz 10e Ch 5 (§5.3–5.4)', 'VITC Past Papers: C1 2-2 Q5 (15M) & C2 Q3 (10M)'],
    keyPoints: [
      '**SRTF (Preemptive SJF)**: always runs the ready job with smallest *remaining* burst time; provably optimal minimum Average Waiting Time.',
      '**Round Robin (RR)**: circular FIFO queue with quantum `q`. Too small `q` -> excessive CS overhead; too large `q` -> degrades into FCFS. Rule of thumb: 80% of CPU bursts should be `< q`.',
      '**Context-Switch Overhead Rule (C1 Set 2-2 Q5)**: insert a `1 ms CS` block whenever switching from process `A` to distinct process `B` (exclude initial dispatch & final completion); **re-evaluate arrivals at `t + CS`**!',
      '**MLFQ (Multilevel Feedback Queue)**: dynamically moves processes between priority queues — CPU-bound jobs sink to lower queues with larger quanta, while aging promotes starving jobs.',
    ],
    sections: [
      {
        heading: 'Verified 15M FAT Masterpiece: C1 Set 2-2 Q5 (Preemptive Priority + 1 ms CS)',
        body: '10 processes with `1 = highest priority`, equal priority -> FCFS (no preemption), `1 ms CS overhead` (arrivals during CS considered). Total Burst = `53 ms`, Total CS = `14` switches (`14 ms`), Makespan = `67 ms`. Verify interactively in **Lab 1 (CPU Scheduler)**!',
        table: {
          headers: ['Proc', 'AT', 'BT', 'Pri', 'CT', 'TAT = CT-AT', 'WT = TAT-BT', 'RT = 1stStart-AT'],
          rows: [
            ['P1', '0', '9', '6', '58', '58', '49', '0'],
            ['P2', '1', '5', '4', '36', '35', '30', '1'],
            ['P3', '3', '8', '7', '67', '64', '56', '56'],
            ['P4', '4', '4', '2', '14', '10', '6', '1'],
            ['P5', '6', '6', '5', '49', '43', '37', '37'],
            ['P6', '8', '3', '1', '12', '4', '1', '1'],
            ['P7', '10', '7', '3', '32', '22', '15', '5'],
            ['P8', '12', '5', '4', '42', '30', '25', '25'],
            ['P9', '19', '2', '1', '22', '3', '1', '1'],
            ['P10', '17', '4', '2', '26', '9', '5', '1'],
            ['Avg', '—', '5.3', '—', '—', '27.80 ms', '22.50 ms', '12.80 ms'],
          ],
        },
        codeBlock: `Exact Gantt Timeline (67 ms total, 14 CS blocks):
P1[0-1] CS[1-2] P2[2-4] CS[4-5] P4[5-8] CS[8-9] P6[9-12] CS[12-13]
P4[13-14] CS[14-15] P7[15-17] CS[17-18] P10[18-19] CS[19-20] P9[20-22]
CS[22-23] P10[23-26] CS[26-27] P7[27-32] CS[32-33] P2[33-36] CS[36-37]
P8[37-42] CS[42-43] P5[43-49] CS[49-50] P1[50-58] CS[58-59] P3[59-67]`,
      },
      {
        heading: 'Verified FAT Benchmark: C2 Q3 (3D Printer FCFS vs RR q=10)',
        body: 'Jobs: `S1(0,25), S2(5,35), S3(10,15), S4(15,45)`. Remember the RR arrival rule: jobs arriving at or before `t` enter the ready queue BEFORE the preempted job re-enters.',
        table: {
          headers: ['Algorithm', 'Gantt Sequence Summary', 'Avg WT', 'Avg TAT', 'Best For'],
          rows: [
            ['FCFS', 'S1[0-25] S2[25-60] S3[60-75] S4[75-120]', '32.50 ms', '62.50 ms', 'Lower Avg WT for batch jobs'],
            ['RR (q=10)', 'S1[0-10] S2[10-20] S3[20-30] S1[30-40] S4[40-50] ... S4[105-120]', '52.50 ms', '82.50 ms', 'Fair sharing & fast initial Response Time'],
          ],
        },
      },
    ],
    workedExample: {
      title: 'Why Response Time Differs From Waiting Time in Preemptive Scheduling',
      problem:
        'In C1 Set 2-2 Q5, P1 starts at `t=0`, gets preempted at `t=1`, and resumes at `t=50` until `t=58`. Compute P1’s RT vs WT.',
      solution:
        '`RT = FirstStart - AT = 0 - 0 = 0 ms`. `TAT = CT - AT = 58 - 0 = 58 ms`. `WT = TAT - BT = 58 - 9 = 49 ms`. P1 responded immediately (`0 ms`), yet waited `49 ms` total across preemptions and context switches!',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Slot C1+TC1 Set 2-2 Q5 (15M)',
        promptSummary: 'Preemptive Priority (10 processes, 1 ms CS overhead): Gantt (6M), CT (2M), TAT/WT/RT (5M), Avg TAT/WT (2M).',
        markBreakdown: 'Gantt w/ explicit CS ticks (6M) + CT column (2M) + TAT/WT/RT table (5M) + Avg TAT=27.80, Avg WT=22.50 (2M)',
        solutionSteps: [
          'Mark every arrival timestamp cleanly along a scratch timeline before drawing the Gantt chart.',
          'Insert a 1 ms `CS` box on every switch between distinct processes (14 total); check if any higher-priority job arrived by `t+1`.',
          'Never preempt on equal priority (e.g., P2 and P8 both have priority 4 — P2 finishes first by FCFS).',
          'Sum TAT = 278 -> Avg TAT = 27.80 ms; Sum WT = 225 -> Avg WT = 22.50 ms.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m2-pr-1',
        question: 'In Round Robin, if time quantum `q` is chosen to be larger than every process’s burst time, RR behaves identically to:',
        options: ['SRTF', 'FCFS', 'Preemptive Priority', 'MLFQ'],
        correctIndex: 1,
        explanation: 'When no process exceeds quantum `q`, every job runs to completion in arrival order — identical to FCFS.',
      },
      {
        id: 'sc-m2-pr-2',
        question: 'In Preemptive Priority with 1 ms CS overhead, P1 completes at t=12 and P4 is ready. Does a 1 ms CS occur at t=12?',
        options: ['No, CS only happens on preemption', 'Yes, switching from P1 to P4 incurs 1 ms CS (only initial dispatch at t=0 and final completion are excluded)', 'Only if P4 has lower priority', 'CS subtracts 1 ms from P4 burst'],
        correctIndex: 1,
        explanation: 'Every transition between two distinct processes incurs a context switch; only t=0 initial dispatch and final completion are excluded.',
      },
    ],
    examTip: 'Always double-check `Total Time = Sum(BT) + Total_CS_Time + Total_Idle_Time` on your Gantt chart (`53 + 14 + 0 = 67` in C1 2-2 Q5)!',
  },
  {
    topicId: 'm2-deadlock-rag',
    moduleId: 'm2',
    title: 'Deadlock Characterization (4 Coffman Conditions), RAG & Wait-For Graphs',
    summary:
      'Deadlock occurs when a set of processes each holds resources while waiting cyclically for resources held by others in the set; Resource Allocation Graphs (RAG) and Wait-For Graphs (WFG) detect cycles visually.',
    sourceDecks: ['Silberschatz 10e Ch 8 (§8.1–8.4)', 'VITC Past Papers: C2 Q4 & C1 1-2 Q8d'],
    keyPoints: [
      '4 Coffman Necessary Conditions (ALL 4 must hold simultaneously): **1. Mutual Exclusion**, **2. Hold and Wait**, **3. No Preemption**, **4. Circular Wait**.',
      'RAG Edges: **Request Edge `P_i -> R_j`** (process requests resource); **Assignment Edge `R_j -> P_i`** (resource instance allocated to process).',
      '**Single-Instance RAG**: a cycle is **necessary AND sufficient** for deadlock. **Multi-Instance RAG**: a cycle is **necessary ONLY** (not sufficient).',
      '**Wait-For Graph (WFG)** collapses single-instance resources: edge `P_i -> P_j` exists iff `P_i` waits for a resource currently held by `P_j`.',
    ],
    sections: [
      {
        heading: 'RAG to Wait-For Graph Reduction (C2 Q4 Healthcare Case)',
        body: 'In C2 Q4: `P1 holds R1 & requests R2`, `P2 holds R2 & requests R3`, `P3 holds R3 & requests R1`, `P4 holds nothing & requests R2`. Collapsing resources reveals the Wait-For cycle `P1 -> P2 -> P3 -> P1` (deadlocked set `{P1, P2, P3}`), while `P4 -> P2` is blocked outside the cycle.',
        diagramId: 'm2-rag-wfg',
      },
      {
        heading: 'The 4 Coffman Conditions & Direct Prevention Counters',
        body: 'Deadlock Prevention breaks at least one Coffman condition structurally (often at the expense of device utilization).',
        table: {
          headers: ['Coffman Condition', 'Meaning', 'Prevention Strategy', 'Practical Limitation'],
          rows: [
            ['Mutual Exclusion', 'At least one resource is non-sharable', 'Make resources sharable (e.g., read-only files)', 'Impossible for intrinsically exclusive devices (printers, mutexes)'],
            ['Hold and Wait', 'Process holds >=1 resource while waiting for more', 'Request ALL resources upfront OR release all before new request', 'Low resource utilization & starvation'],
            ['No Preemption', 'Resources cannot be forcibly taken away', 'Preempt held resources if a new request cannot be granted', 'Works only for savable state (CPU/RAM), not printers/locks'],
            ['Circular Wait', 'Closed chain P0->P1->...->Pn->P0', 'Impose strict global numbering `F(R_i)` and request in increasing order', 'Most practical prevention rule in real kernels'],
          ],
        },
      },
    ],
    workedExample: {
      title: 'Why a Multi-Instance RAG Cycle May Not Be Deadlocked',
      problem:
        'Suppose `R1` and `R2` each have 2 instances. `P1` holds `R1` and requests `R2`; `P3` holds `R2` and requests `R1`; meanwhile `P2` holds the second `R1` and requests nothing; `P4` holds the second `R2` and requests nothing. Is there a deadlock?',
      solution:
        'A cycle `P1 -> R2 -> P3 -> R1 -> P1` exists, **but there is NO deadlock!** `P2` and `P4` are not waiting on anything, will finish, and release their instances of `R1` and `R2` so `P1` and `P3` complete.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Slot C2+TC2 Q4 (10M)',
        promptSummary: 'Draw Healthcare single-instance RAG, check Coffman conditions, identify deadlocked set (4M), 2 handling methods (4M), recovery/victim selection (2M).',
        markBreakdown: 'RAG + WFG cycle + Coffman conditions (4M) + Prevention/Avoidance/Detection (4M) + Victim selection (2M)',
        solutionSteps: [
          'Draw circles `P1..P4`, squares `R1..R3` (1 dot each), assignment arrows `R1->P1, R2->P2, R3->P3`, request arrows `P1->R2, P2->R3, P3->R1, P4->R2`.',
          'Identify single-instance cycle `P1->R2->P2->R3->P3->R1->P1` -> deadlocked set = `{P1, P2, P3}` (`P4` waits indefinitely on `R2`).',
          'State recovery: Process termination (abort all or one-at-a-time) or Resource preemption (victim chosen by priority, compute time spent, remaining need, rollback cost, starvation limit).',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m2-rag-1',
        question: 'In a Wait-For Graph, a directed edge `P1 -> P2` means:',
        options: ['P1 created P2 via fork()', 'P1 is waiting for a resource currently held by P2', 'P2 is waiting for P1', 'P1 has higher priority than P2'],
        correctIndex: 1,
        explanation: 'Wait-For Graph edges point from the waiting process to the process holding the requested resource.',
      },
      {
        id: 'sc-m2-rag-2',
        question: 'Which Coffman condition is broken by requiring processes to acquire locks in strictly ascending lock-ID order?',
        options: ['Mutual Exclusion', 'Hold and Wait', 'No Preemption', 'Circular Wait'],
        correctIndex: 3,
        explanation: 'Strict total ordering of resource types makes a closed circular wait chain mathematically impossible.',
      },
    ],
    examTip: 'In C2 Q4, ALWAYS distinguish `{P1, P2, P3}` (inside the cycle) from `P4` (blocked waiting on `R2`, outside the cycle).',
  },
  {
    topicId: 'm2-deadlock-handling',
    moduleId: 'm2',
    title: 'Deadlock Prevention, Avoidance (Banker’s Algorithm), Detection & Recovery',
    summary:
      'Banker’s Algorithm avoids deadlocks dynamically by ensuring the system never grants a resource request that transitions the state from Safe to Unsafe.',
    sourceDecks: ['Silberschatz 10e Ch 8 (§8.5–8.8)', 'VITC Past Papers: C1 2-2 Q7 (15M) & C1 1-2 Q8 (15M)'],
    keyPoints: [
      '**Safe State**: there exists at least one Safe Sequence `<P_i1, P_i2, ..., P_in>` where every process can obtain its remaining `Need` from `Work` and release its `Allocation`.',
      'Every Safe state is deadlock-free; an **Unsafe state** does NOT guarantee immediate deadlock, only that the OS can no longer prevent deadlock if processes request their Max.',
      '**Safety Algorithm** (`O(m * n^2)`): `Need = Max - Allocation`; `Work = Available`; repeatedly find unfinished `i` with `Need[i] <= Work`, set `Work += Allocation[i]`, `Finish[i] = true`.',
      '**Resource-Request Algorithm**: (1) Check `Req <= Need`; (2) Check `Req <= Avail`; (3) Pretend allocate (`Avail-=Req, Alloc+=Req, Need-=Req`) and run Safety — **DENY and roll back if unsafe!**',
    ],
    sections: [
      {
        heading: 'Verified 15M FAT Masterpiece: C1 Set 2-2 Q7 (6 Processes × 4 Resources)',
        body: 'Total = `(7, 5, 5, 4)`. Sum(Allocation) = `(5, 4, 4, 3)` => **`Available = (2, 1, 1, 1)`**. Initial state is **SAFE** with sequence **`<P0, P1, P3, P4, P5, P2>`**. Verify live in **Lab 2 (Banker’s & RAG)**!',
        table: {
          headers: ['Proc', 'Allocation (A B C D)', 'Max (A B C D)', 'Need = Max - Alloc', 'Safety Step (Work After)'],
          rows: [
            ['P0', '1 0 0 1', '2 1 0 2', '1 1 0 1', 'Step 1: Need<=(2,1,1,1) -> Work=(3,1,1,2)'],
            ['P1', '1 1 0 0', '2 2 0 1', '1 1 0 1', 'Step 2: Need<=(3,1,1,2) -> Work=(4,2,1,2)'],
            ['P2', '1 1 1 0', '2 2 3 1', '1 1 2 1', 'Step 6: Need<=(6,4,4,4) -> Work=(7,5,5,4)'],
            ['P3', '0 1 1 1', '1 2 2 2', '1 1 1 1', 'Step 3: Need<=(4,2,1,2) -> Work=(4,3,2,3)'],
            ['P4', '2 0 0 1', '3 1 1 2', '1 1 1 1', 'Step 4: Need<=(4,3,2,3) -> Work=(6,3,2,4)'],
            ['P5', '0 1 2 0', '1 2 3 1', '1 1 1 1', 'Step 5: Need<=(6,3,2,4) -> Work=(6,4,4,4)'],
          ],
        },
      },
      {
        heading: 'Critical 6-Mark Trap: Evaluating Q7(c) `Request2 = (0, 0, 1, 0)`',
        body: 'Most students lose 4–6 marks here by stopping after Step 2 (`Request <= Available`)! Watch what happens when you run Step 3 (Tentative Safety):',
        codeBlock: `Step 1: Request2 (0,0,1,0) <= Need2 (1,1,2,1)?        YES (valid claim)
Step 2: Request2 (0,0,1,0) <= Available (2,1,1,1)?    YES (resources exist)
Step 3: Pretend to allocate to P2:
  New Available = (2,1,1,1) - (0,0,1,0) = (2, 1, 0, 1)  <-- Notice C = 0!
  New Alloc[P2] = (1,1,2,0),  New Need[P2] = (1,1,1,1)
Run Safety Algorithm with Work = (2, 1, 0, 1):
  - P0 Need (1,1,0,1) <= (2,1,0,1) -> OK! Work = (3, 1, 0, 2)
  - P1 Need (1,1,0,1) <= (3,1,0,2) -> OK! Work = (4, 2, 0, 2)
  - Remaining: P2(1,1,1,1), P3(1,1,1,1), P4(1,1,1,1), P5(1,1,1,1)
    ALL four require C = 1, but Work.C = 0!
Conclusion: UNSAFE STATE -> REQUEST MUST BE DENIED (roll back; P2 waits).`,
      },
    ],
    workedExample: {
      title: 'C1 Set 1-2 Q8 (4 Processes × 3 Resources) Quick Check',
      problem:
        'Total `(6,4,5)`, Alloc: `P0(1,0,1), P1(1,1,0), P2(1,1,1), P3(0,0,1)`, Max: `P0(3,2,2), P1(2,2,1), P2(4,2,2), P3(2,1,2)`. Find Available, Need, and Safe Sequence.',
      solution:
        'Total Alloc = `(3,2,3)` -> `Available = (3,2,2)`. Needs: `P0(2,2,1), P1(1,1,1), P2(3,1,1), P3(2,1,1)`. `P0` finishes -> `Work=(4,2,3)`; `P1` -> `(5,3,3)`; `P2` -> `(6,4,4)`; `P3` -> `(6,4,5)`. Safe sequence: **`<P0, P1, P2, P3>`**.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Slot C1+TC1 Set 2-2 Q7 (15M) & C1 Set 1-2 Q8 (15M)',
        promptSummary: 'Compute Total Allocated, Available, Need (3M), Safety Work trace (6M), and evaluate Request2=(0,0,1,0) (6M).',
        markBreakdown: 'Available & Need matrix (3M) + Safety trace + <P0,P1,P3,P4,P5,P2> (6M) + 3-step Request denial proof (6M)',
        solutionSteps: [
          'Verify `Final Work == Total Resources` (`(7,5,5,4)`) at the end of every safe sequence — instant arithmetic sanity check!',
          'In Q7(c), show all 3 checks explicitly and highlight `Work.C = 0` blocking `P2..P5` to prove UNSAFE -> DENY.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m2-bk-1',
        question: 'In Banker’s Algorithm, what is the exact time complexity of the Safety Algorithm for `n` processes and `m` resource types?',
        options: ['O(n)', 'O(m * n)', 'O(m * n^2)', 'O(2^n)'],
        correctIndex: 2,
        explanation: 'Up to `n` passes scan up to `n` processes comparing `m`-element vectors -> `O(m * n^2)`.',
      },
      {
        id: 'sc-m2-bk-2',
        question: 'If a system transitions to an UNSAFE state, what does that strictly guarantee?',
        options: ['Deadlock has already occurred immediately', 'Deadlock MAY occur if processes claim their remaining Max', 'All processes are terminated immediately', 'Available vector is negative'],
        correctIndex: 1,
        explanation: 'Unsafe means the OS can no longer guarantee avoidance; deadlock only happens if processes actually request resources in an unlucky order.',
      },
    ],
    examTip: 'At the last step of your Banker’s Safety table, `Final Work` MUST equal `Total Resources` — if it doesn’t, re-check your column sums immediately!',
  },
];
