import { TopicNote } from './noteTypes';

export const MODULE_2_NOTES: TopicNote[] = [
  {
    topicId: 'm2-process-pcb',
    moduleId: 'm2',
    title: 'Process Concepts, Memory Layout, PCB & 5-State Lifecycle',
    summary:
      'A process is an active entity in execution represented in the kernel by a Process Control Block (PCB). This topic details virtual address space organization (Text, Data, BSS, Heap, Stack), the 5-state process lifecycle (and 7-state suspended extensions), kernel context-switch execution mechanics, and direct vs indirect context-switch overhead.',
    sourceDecks: [
      'Silberschatz 10e Ch 3 (§3.1–3.2)',
      'VITC Past Paper: C2 Q2a',
      'Linux Kernel Architecture: task_struct & MMU',
    ],
    keyPoints: [
      'A **program** is a passive binary file stored on disk; a **process** is an active entity executing in memory with a Program Counter (PC), CPU registers, and an isolated virtual address space.',
      'Virtual address space consists of: **Text** (read-only code), **Data** (initialized globals/statics), **BSS** (uninitialized globals/statics zeroed by kernel), **Heap** (dynamic allocations via `malloc` growing upward to higher addresses), and **Stack** (activation frames, local variables, return addresses growing downward to lower addresses).',
      'The **Process Control Block (PCB)** (`task_struct` in Linux) is the kernel’s metadata anchor storing: PID, PPID, execution state, PC, register set (SP, flags), scheduling priority/nice value, MMU base register (CR3 page table base), open file descriptor table, and wait/ready queue linkage pointers.',
      '**5-State Process Model**: **New**, **Ready**, **Running**, **Waiting (Blocked)**, and **Terminated**. Core invariant: a Waiting process CANNOT jump directly to Running; I/O completion moves it to Ready to await scheduler dispatch.',
      '**7-State Extended Model**: Adds **Ready Suspended** and **Blocked Suspended** swapped out to secondary storage (swap disk) by the medium-term scheduler to relieve RAM saturation.',
      '**Context Switch Sequence**: (1) Hardware interrupt or trap flips CPU mode bit `1 -> 0` (User -> Kernel); (2) Save outgoing process registers and PC into its PCB; (3) Short-term scheduler selects next process; (4) Reload MMU page directory base (CR3 register); (5) Restore incoming process registers and PC from its PCB; (6) Return from interrupt flipping mode bit `0 -> 1` (Kernel -> User).',
      '**Context-Switch Overhead**: Pure system overhead during which no user computation progresses. Comprises **Direct Costs** (saving/restoring registers, executing scheduler logic: 1–10 µs) and **Indirect Costs** (cache pollution, cold L1/L2/L3 cache misses, and TLB invalidation flushes unless CPU supports Address Space Identifiers / ASID).',
    ],
    sections: [
      {
        heading: '5-State Process Lifecycle & Transition Triggers',
        body: 'In modern multiprogrammed operating systems, every process transitions through a finite state machine governed by hardware interrupts and system call events. In a uniprocessor system, exactly ONE process can be in the Running state at any instant, while multiple processes may simultaneously reside in Ready and Waiting queues.',
        diagramId: 'm2-process-states',
        table: {
          headers: ['Transition', 'From State -> To State', 'Triggering Event / Mechanism', 'Subsystem Responsible'],
          rows: [
            ['Admit', 'New -> Ready', 'Process binary loaded into RAM; PCB allocated', 'Long-Term Scheduler (Job Scheduler)'],
            ['Dispatch', 'Ready -> Running', 'Highest-priority ready process selected for CPU', 'Short-Term Scheduler & Dispatcher'],
            ['Interrupt', 'Running -> Ready', 'Time quantum expires (timer interrupt) or higher priority arrives', 'Hardware Timer / Preemptive Scheduler'],
            ['Wait (Block)', 'Running -> Waiting', 'Process issues blocking system call (disk read, network I/O, sleep, lock)', 'Kernel Syscall Handler / Event Subsystem'],
            ['I/O Completion', 'Waiting -> Ready', 'Hardware device controller raises interrupt indicating data ready', 'Hardware Device Interrupt Handler'],
            ['Exit', 'Running -> Terminated', 'Process calls exit(), returns from main(), or killed by fatal signal', 'Kernel Process Management Subsystem'],
          ],
        },
      },
      {
        heading: 'Process Virtual Address Space Layout (Text, Data, BSS, Heap, Stack)',
        body: 'Every process is allocated an isolated virtual memory space divided into distinct segments with opposing growth directions to maximize utilization of the unallocated address space between them.',
        diagramId: 'm2-pcb-memory-layout',
        table: {
          headers: ['Memory Segment', 'Contents & Lifetime', 'Permissions', 'Growth Direction / Addressing'],
          rows: [
            ['Text (Code)', 'Compiled machine code instructions; read from executable binary', 'Read-Only + Execute', 'Fixed size at lowest virtual addresses (e.g. 0x00400000)'],
            ['Data (Initialized)', 'Global and static variables explicitly initialized by developer (e.g. `int x = 42;`)', 'Read-Write', 'Fixed size, immediately above Text'],
            ['BSS (Uninitialized)', 'Uninitialized global/static variables (e.g. `static char buf[1024];`); zero-filled by OS', 'Read-Write', 'Fixed size, immediately above Initialized Data'],
            ['Heap', 'Dynamically allocated memory via `malloc()`, `calloc()`, `new`; freed via `free()`/`delete`', 'Read-Write', 'Grows UPWARD toward higher memory addresses (`brk`/`sbrk`/`mmap`)'],
            ['Virtual Address Gap', 'Unmapped address space separating Heap and Stack; prevents mutual collisions', 'None (Faults on access)', 'Shrinks dynamically as Heap grows up and Stack grows down'],
            ['Stack', 'Function call activation records, local auto variables, parameters, return addresses', 'Read-Write', 'Grows DOWNWARD from highest user virtual addresses toward zero'],
          ],
        },
      },
      {
        heading: 'Anatomy of the Process Control Block (PCB / Linux task_struct)',
        body: 'The kernel represents each process through a centralized data structure called the Process Control Block (PCB), known in Linux as `struct task_struct` (defined in `<linux/sched.h>`). The PCB is allocated in kernel memory and is never directly accessible by user-space code.',
        table: {
          headers: ['PCB Field Component', 'Information Maintained', 'Hardware / Kernel Counterpart'],
          rows: [
            ['Process Identification', 'Unique Process ID (PID), Parent Process ID (PPID), User ID (UID), Group ID (GID)', 'Process table entry, credential tokens'],
            ['Process State', 'Current lifecycle state: New, Ready, Running, Waiting, Stopped, Zombie', 'Current runqueue or device wait-queue linkage'],
            ['Program Counter (PC)', 'Memory address of the next machine instruction to be fetched and executed', 'CPU Instruction Pointer (EIP / RIP register)'],
            ['CPU Registers', 'Accumulators, index registers, stack pointer, general-purpose registers, condition flags', 'Hardware CPU Register File & RSP/ESP register'],
            ['CPU-Scheduling Info', 'Dynamic priority, static priority, nice value, scheduling class (CFS/Real-Time)', 'Runqueue priority levels / red-black tree node'],
            ['Memory-Management Info', 'Page directory base pointer, segment tables, page table base register', 'Hardware MMU control register (CR3 in x86-64)'],
            ['Accounting Information', 'CPU time consumed (utime/stime), time limits, start timestamp, user accounting', 'Hardware APIC timer interrupt counters'],
            ['I/O & File Status Info', 'Open file descriptor table (FD table), current working directory, root directory', 'Kernel `struct files_struct` & VFS inode pointers'],
            ['Context Linkage Pointers', 'Pointers to next and previous PCBs in Ready Queue or Device Waiting Queues', 'Doubly linked circular list (`list_head`) in kernel'],
          ],
        },
      },
      {
        heading: 'Context-Switch Mechanics, Mode Transitions & Overhead Analysis',
        body: 'A Context Switch is the kernel procedure of stopping execution of the currently running process, saving its complete execution context to its PCB, and loading the saved execution context of another ready process to resume execution. Because the CPU executes OS switching instructions rather than user application instructions during this transition, context switching is pure computational overhead.',
        codeBlock: `// Hardware and Kernel Steps in a Context Switch:
1. Interrupt / Syscall Trap:
   - Hardware countdown timer fires (quantum expired) or process issues blocking syscall.
   - CPU hardware pushes Program Counter (PC) and CPU status flags (EFLAGS) onto kernel stack.
   - CPU flips hardware privilege Mode Bit from 1 (User Mode) to 0 (Kernel Mode).

2. State Preservation:
   - Kernel saves remaining general-purpose registers (RAX, RBX, RCX, RDX, RSI, RDI, RBP, R8-R15)
     into outgoing process's PCB (P_old->pcb.regs).
   - Kernel updates P_old->state from Running to Ready (if preempted) or Waiting (if I/O).

3. Scheduler Selection:
   - Short-term scheduler algorithm (e.g., CFS, Priority, RR) runs to select P_new from Ready Queue.
   - Kernel updates P_new->state to Running.

4. Address Space Switch:
   - Kernel loads MMU Page Directory Base Register (CR3 in x86-64) with P_new->page_table_base.
   - Crucial side effect: TLB (Translation Lookaside Buffer) entries are invalidated / flushed
     unless hardware supports Address Space Identifiers (ASID / PCID).

5. State Restoration & Dispatch:
   - Kernel restores P_new's general-purpose registers from P_new->pcb.regs.
   - Kernel sets hardware Stack Pointer (RSP) to P_new's saved stack top.
   - Kernel executes 'iret' (Interrupt Return) instruction:
     * Pops saved PC and EFLAGS of P_new.
     * Flips hardware privilege Mode Bit from 0 (Kernel Mode) back to 1 (User Mode).
   - CPU resumes user instruction execution at P_new's restored Program Counter.`,
      },
    ],
    workedExample: {
      title: 'Context-Switch Overhead Impact on Effective CPU Throughput',
      problem:
        'A time-sharing operating system employs a time quantum of q = 10 ms. The hardware context-switch overhead (register preservation, scheduler execution, and initial memory cache warmup) consumes CS = 0.5 ms per dispatch. (a) Calculate the percentage of total CPU time lost to context switching. (b) If the system administrator tunes the time quantum down to q = 1 ms to improve interactive GUI responsiveness, calculate the new percentage of CPU time wasted and explain the throughput vs responsiveness trade-off.',
      solution:
        '(a) Total time per scheduling cycle = q + CS = 10 ms + 0.5 ms = 10.5 ms.\nPercentage of CPU overhead = (CS / (q + CS)) * 100% = (0.5 / 10.5) * 100% = 4.76%.\nEffective CPU computation time = 95.24%.\n\n(b) With q = 1 ms: Total time per cycle = 1 ms + 0.5 ms = 1.5 ms.\nPercentage of CPU overhead = (0.5 / 1.5) * 100% = 33.33%!\nOne-third of total CPU capacity is wasted on switching overhead, dramatically reducing overall system throughput. While interactive response time drops from ~10 ms to ~1 ms, compute-heavy jobs take significantly longer to complete. System designers generally configure q such that context switch overhead consumes <= 1% to 5% of CPU time.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Slot C2+TC2 Q2(a) (5M)',
        promptSummary:
          'Analyze process states, scheduling queues, and context switching for a multi-user online banking server.',
        markBreakdown:
          '5-state diagram with transition labels (2M) + Ready vs Wait queues & PCB context switch (2M) + Banking transaction application (1M)',
        solutionSteps: [
          'Draw the complete 5-state lifecycle diagram: New -> Ready <-> Running -> Waiting -> Ready, and Running -> Terminated. Clearly label all 6 transition triggers (admit, dispatch, timer interrupt, I/O wait, I/O completion, exit).',
          'Differentiate Ready Queue (linked list of PCBs awaiting CPU dispatch) vs Device/Wait Queues (linked lists of PCBs waiting on specific disk I/O, database locks, or network socket packets).',
          'Detail PCB preservation: When a customer transaction thread initiates a database disk query, the kernel saves its registers/PC to its PCB, sets state to Waiting, and switches the CPU to another customer request in Ready Queue.',
          'State the non-preemptive rule: When the database disk read finishes, an interrupt moves the transaction PCB to Ready, NEVER directly to Running, preserving short-term scheduler authority.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m2-pcb-1',
        question:
          'Which state transition is strictly ILLEGAL in the standard 5-state operating system process lifecycle?',
        options: [
          'Running -> Ready (preemptive timer interrupt)',
          'Waiting -> Running (direct resumption upon I/O completion)',
          'Running -> Waiting (issuing a blocking read() system call)',
          'Ready -> Running (short-term scheduler dispatch)',
        ],
        correctIndex: 1,
        explanation:
          'Upon I/O completion, a Waiting process always transitions to the Ready queue first. Only the short-term CPU scheduler can transition a process from Ready to Running.',
      },
      {
        id: 'sc-m2-pcb-2',
        question:
          'In a standard process virtual memory layout, which two segments grow dynamically toward each other across the unallocated virtual address gap?',
        options: [
          'Text and Data',
          'Heap (grows upward) and Stack (grows downward)',
          'Text and Stack',
          'Data and BSS',
        ],
        correctIndex: 1,
        explanation:
          'The Heap grows upward toward higher memory addresses during dynamic memory allocation, while the Stack grows downward from high virtual memory toward lower addresses during nested function calls.',
      },
      {
        id: 'sc-m2-pcb-3',
        question:
          'Why does a context switch between two threads of the SAME process incur lower overhead than a context switch between two distinct processes?',
        options: [
          'Thread switching does not require saving any CPU registers',
          'Thread switching does not require reloading the MMU page table base register (CR3), avoiding TLB invalidation flushes',
          'Thread switching bypasses Kernel Mode and executes entirely in hardware',
          'Threads do not maintain their own private Call Stacks',
        ],
        correctIndex: 1,
        explanation:
          'Because threads of the same process share the identical virtual address space, the MMU page directory base register (CR3) remains unchanged, preserving cached Translation Lookaside Buffer (TLB) address translations and reducing cache misses.',
      },
    ],
    examTip:
      'In any 5-state process diagram question, you must explicitly label all six arrows (`admitted`, `scheduler dispatch`, `interrupt`, `I/O or event wait`, `I/O completion`, `exit`). Forgetting to label `interrupt` on the Running -> Ready arrow is a common -1M deduction!',
  },
  {
    topicId: 'm2-process-operations',
    moduleId: 'm2',
    title: 'Operations on Processes: fork(), exec(), wait(), Orphan & Zombie',
    summary:
      'POSIX process creation and lifecycle management via fork() (address space duplication with Copy-On-Write), the exec() family (in-place binary image replacement), and wait()/waitpid() (exit status harvesting and PCB reaping), alongside deep forensic analysis of Zombie processes and Orphan process reparenting to init/systemd (PID 1).',
    sourceDecks: [
      'Silberschatz 10e Ch 3 (§3.3–3.4)',
      'Linux man pages: fork(2), execve(2), waitpid(2)',
      'Core Lab Exp 3: Process Lifecycle & Inter-Process Coordination',
    ],
    keyPoints: [
      '`fork()` duplicates the calling process: returns **`0`** inside the child process, the **positive PID of the child (`child_pid > 0`)** inside the parent, and **`-1`** on error (setting `errno` to `EAGAIN` if process table is full or `ENOMEM`).',
      'Both parent and child resume execution from the **exact statement immediately following the `fork()` call**; the child does NOT re-execute from the beginning of `main()`.',
      '**Copy-On-Write (COW)**: Modern kernels do not duplicate physical RAM pages during `fork()`; instead, child receives a copy of parent’s page table with all pages marked read-only. A private physical copy is created only when either process attempts a write.',
      '`n` consecutive unconditional `fork()` calls generate **`2^n` total active processes** and spawn **`2^n - 1` newly created child processes**.',
      'The `exec()` family (`execl`, `execv`, `execle`, `execve`, `execlp`, `execvp`) overwrites the current process address space (Text, Data, BSS, Heap, Stack) with a new binary image from disk. It retains the same PID and does NOT return upon success.',
      '`wait(&status)` blocks the calling parent until ANY child terminates, releasing the child’s PCB from the kernel process table and returning the child PID. Macros `WIFEXITED(status)` and `WEXITSTATUS(status)` inspect the exit code.',
      '**Zombie Process (`<defunct>`)**: A process that has called `exit()`, releasing its memory and open files, but whose parent has NOT yet invoked `wait()`. Its entry in the kernel process table remains allocated to store its exit code. If parent loops indefinitely, process table exhaustion occurs.',
      '**Orphan Process**: A child process whose parent terminated while the child was still executing. In POSIX/Linux, orphans are automatically reparented to `init` / `systemd` (PID 1), which continuously executes `wait()` to reap them upon completion.',
    ],
    sections: [
      {
        heading: 'POSIX fork() System Call & Copy-on-Write (COW) Memory Architecture',
        body: 'The `fork()` system call creates a new execution context that is an exact clone of the caller. Under legacy Unix, `fork()` made a complete physical duplicate of the entire parent address space, which was prohibitively slow. Modern operating systems implement Copy-on-Write (COW), where physical page frames are shared as read-only until modified.',
        diagramId: 'm2-fork-tree',
        codeBlock: `// Canonical POSIX Process Spawning Pattern:
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/wait.h>

int main(void) {
    pid_t pid = fork();

    if (pid < 0) {
        // Fork failure (e.g. process limit reached, EAGAIN)
        perror("fork failed");
        exit(EXIT_FAILURE);
    } else if (pid == 0) {
        // CHILD PROCESS (returns 0)
        printf("[Child] PID: %d, PPID: %d. Replacing image via execvp...\\n", getpid(), getppid());
        char *args[] = {"/bin/ls", "-l", "/usr", NULL};
        execvp(args[0], args);

        // execvp only returns if an error occurred!
        perror("execvp failed");
        exit(EXIT_FAILURE);
    } else {
        // PARENT PROCESS (returns child's positive PID)
        printf("[Parent] PID: %d, Spawned Child PID: %d. Waiting for child...\\n", getpid(), pid);
        int status;
        pid_t reaped_pid = waitpid(pid, &status, 0); // Reaps child PCB from kernel

        if (WIFEXITED(status)) {
            printf("[Parent] Child %d terminated normally with exit status: %d\\n",
                   reaped_pid, WEXITSTATUS(status));
        } else if (WIFSIGNALED(status)) {
            printf("[Parent] Child %d killed by signal: %d\\n",
                   reaped_pid, WTERMSIG(status));
        }
    }
    return 0;
}`,
      },
      {
        heading: 'Process Tree Mathematics & Execution Tracing of Nested/Conditional fork()',
        body: 'Analyzing process hierarchy trees is a frequent 5M to 10M VIT Chennai FAT question archetype. Understanding how conditional branches prune the exponential fork tree is vital for exact counting.',
        table: {
          headers: ['Code Pattern', 'Branching Logic & Evaluation', 'Total Active Processes', 'New Children Created'],
          rows: [
            ['`fork(); fork();`', '2 unconditional levels: 2^2', '4', '3'],
            ['`fork(); fork(); fork();`', '3 unconditional levels: 2^3', '8', '7'],
            ['`for(i=0; i<n; i++) fork();`', 'n sequential unconditional forks: 2^n', '2^n', '2^n - 1'],
            ['`if (fork() == 0) { fork(); }`', 'P0 forks C1. Only C1 (ret=0) enters `if` body to fork C2. P0 skips.', '3 (P0, C1, C2)', '2 (C1, C2)'],
            ['`if (fork() > 0) { fork(); }`', 'P0 forks C1. Only P0 (ret>0) enters `if` body to fork C2. C1 skips.', '3 (P0, C1, C2)', '2 (C1, C2)'],
            ['`fork() && fork();`', 'Short-circuit AND: 1st fork runs (P0, C1). In C1 (ret 0), AND short-circuits. In P0 (ret >0), 2nd fork executes.', '3 total processes', '2 new children'],
            ['`fork() || fork();`', 'Short-circuit OR: 1st fork runs (P0, C1). In P0 (ret >0), OR short-circuits. In C1 (ret 0), 2nd fork executes.', '3 total processes', '2 new children'],
          ],
        },
      },
      {
        heading: 'The exec() System Call Family: Complete Image Replacement',
        body: 'While `fork()` duplicates the calling process, the `exec()` family of system calls replaces the current process address space with a completely new binary program loaded from disk. Crucially, the process ID (PID), open file descriptors (unless flagged with `FD_CLOEXEC`), and parent PID remain identical across an `exec()` call.',
        table: {
          headers: ['Function Suffix', 'Meaning', 'Parameter Passing Format', 'PATH Environment Search', 'Environment Inheritance'],
          rows: [
            ['`execl()`', 'List', 'Comma-separated argument list: `arg0, arg1, ..., NULL`', 'No (requires full path e.g. `/bin/ls`)', 'Inherits caller environment'],
            ['`execv()`', 'Vector', 'Array of string pointers: `char *argv[]` ending with `NULL`', 'No (requires full path)', 'Inherits caller environment'],
            ['`execlp()`', 'List + Path', 'Comma-separated argument list: `arg0, arg1, ..., NULL`', 'YES (searches `$PATH` e.g. `"ls"`)', 'Inherits caller environment'],
            ['`execvp()`', 'Vector + Path', 'Array of string pointers: `char *argv[]` ending with `NULL`', 'YES (searches `$PATH`)', 'Inherits caller environment'],
            ['`execle()`', 'List + Env', 'Comma-separated argument list followed by `char *envp[]`', 'No (requires full path)', 'Explicit environment array passed'],
            ['`execve()`', 'Vector + Env', 'Core POSIX syscall: `execve(path, argv, envp)`', 'No (requires full path)', 'Explicit environment array passed'],
          ],
        },
      },
      {
        heading: 'Zombie Processes vs Orphan Processes vs Cascading Termination',
        body: 'A process lifecycle mismatch between parent and child results in either a Zombie or an Orphan process. Understanding the kernel impact and resolution protocol is essential for systems engineering.',
        table: {
          headers: ['Dimension', 'Zombie Process (<defunct>)', 'Orphan Process', 'Cascading Termination'],
          rows: [
            ['Definition', 'Child has finished execution (`exit()`), but parent has not yet called `wait()`', 'Parent process terminated while child process is still actively running', 'OS forcibly terminates all child processes when the parent process terminates'],
            ['Process State', 'Terminated (`Z` state in `ps aux`); execution completed', 'Active (`Running`, `Ready`, or `Waiting`)', 'Terminated (`Dead`)'],
            ['Memory Footprint', 'Zero virtual memory (Text, Data, Heap, Stack are deallocated)', 'Full virtual memory actively allocated in RAM', 'All memory deallocated across the entire subtree'],
            ['Kernel Resources', 'Consumes 1 PID and 1 PCB slot in the kernel Process Table', 'Normal PCB and file descriptor consumption', 'All kernel tables and PIDs released'],
            ['System Hazard', 'Accumulation of zombies exhausts available system PIDs, causing `fork()` to fail with `EAGAIN`', 'None; continues useful computation in background', 'Abrupt termination may leave shared files or databases in corrupt state'],
            ['Resolution / Reaping', 'Parent calls `wait()`/`waitpid()`, or if parent terminates, orphan adoption reaps it', 'Automatically reparented to `init`/`systemd` (PID 1), which periodically invokes `wait()`', 'Enforced by OS kernel (e.g. VMS); NOT default behavior in Linux/POSIX'],
          ],
        },
      },
      {
        heading: 'Production C Implementations: Deliberate Zombie and Orphan Generators',
        body: 'These two practical laboratory implementations illustrate the exact mechanics of Zombie creation and Orphan reparenting.',
        codeBlock: `// Scenario A: Demonstrating a Zombie Process in C
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main(void) {
    pid_t pid = fork();
    if (pid == 0) {
        // Child exits immediately -> becomes a Zombie because parent hasn't reaped it!
        printf("[Child %d] Exiting now...\\n", getpid());
        exit(0);
    } else {
        // Parent sleeps for 30 seconds without calling wait()
        printf("[Parent %d] Sleeping for 30s. Inspect child with: ps aux | grep 'Z'\\n", getpid());
        sleep(30);
        printf("[Parent %d] Exiting without wait(); child will now be reparented to PID 1 and reaped.\\n", getpid());
    }
    return 0;
}

// Scenario B: Demonstrating an Orphan Process and Reparenting in C
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main(void) {
    pid_t pid = fork();
    if (pid == 0) {
        // Child sleeps while parent terminates
        printf("[Child %d] Initial Parent PID: %d\\n", getpid(), getppid());
        sleep(5); // Parent will exit while child sleeps
        printf("[Child %d] After parent death, my new PPID is: %d (init/systemd/subreaper)\\n",
               getpid(), getppid());
    } else {
        // Parent terminates immediately, abandoning the child
        printf("[Parent %d] Terminating immediately to orphan child %d...\\n", getpid(), pid);
        exit(0);
    }
    return 0;
}`,
      },
    ],
    workedExample: {
      title: 'Tracing Conditional fork() Tree Execution',
      problem:
        'Trace the following program line by line: How many total processes exist after completion, and what is printed? \n```c\nint main() {\n    pid_t p1 = fork();\n    if (p1 == 0) {\n        fork();\n    } else {\n        fork();\n    }\n    printf("X\\n");\n    return 0;\n}\n```',
      solution:
        '1. Initial process: P0 starts.\n2. Line 1: `p1 = fork();` splits execution into 2 processes:\n   - In Parent (P0): `p1 > 0`.\n   - In Child (C1): `p1 == 0`.\n3. Line 2 `if (p1 == 0)`:\n   - C1 enters the `if` body and executes `fork()`, spawning grandchild G1. Both C1 and G1 proceed to `printf("X\\n")`.\n   - P0 enters the `else` body and executes `fork()`, spawning child C2. Both P0 and C2 proceed to `printf("X\\n")`.\n4. Total active processes = 4 (P0, C1, G1, C2).\n5. Total new children created = 3 (C1, G1, C2).\n6. Each of the 4 processes executes `printf("X\\n")`, so `"X"` is printed exactly 4 times.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Alpha Gap High-Probability Prompt (10M)',
        promptSummary:
          'Trace fork() process tree count, write robust fork/exec/wait C snippet, and contrast Zombie vs Orphan.',
        markBreakdown:
          'fork() tree & process count derivation (4M) + C code for fork/exec/wait (3M) + Zombie vs Orphan contrast table (3M)',
        solutionSteps: [
          'Draw the process tree with horizontal generation levels. Show return values: 0 to child, positive PID to parent. Apply 2^n formula for unconditional forks, or step-by-step branching for conditional forks.',
          'Write production-grade C code demonstrating `fork()`, `execvp()`, and `waitpid()` with `WIFEXITED()` status checking.',
          'Construct a 5-dimension comparison table contrasting Zombie vs Orphan: Definition, Kernel State, Memory Footprint, System Danger (PID exhaustion), and Resolution protocol (wait vs reparenting to PID 1).',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m2-po-1',
        question:
          'In POSIX operating systems, what is the exact return value of a successful `fork()` system call inside the newly created CHILD process?',
        options: [
          'The parent process PID',
          '0',
          '-1',
          'The child process’s own PID',
        ],
        correctIndex: 1,
        explanation:
          'POSIX `fork()` returns 0 inside the child process, returns the child’s positive PID inside the parent process, and returns -1 on failure.',
      },
      {
        id: 'sc-m2-po-2',
        question:
          'Why does a Zombie process pose a danger to a production Linux server even though it consumes zero physical RAM?',
        options: [
          'It continues consuming CPU cycles in an infinite kernel loop',
          'It retains its entry in the kernel Process Table and occupies a PID; if many zombies accumulate, available system PIDs are exhausted and no new processes can be created',
          'It corrupts shared memory segments attached to parent processes',
          'It forces the kernel into single-user rescue mode',
        ],
        correctIndex: 1,
        explanation:
          'A zombie process has already terminated, releasing its virtual memory, but its PCB slot and PID remain in the kernel Process Table until reaped by wait(). Accumulating zombies exhaust the system PID space, causing subsequent fork() calls to fail with EAGAIN.',
      },
      {
        id: 'sc-m2-po-3',
        question:
          'When a parent process terminates before its child process, what kernel mechanism handles the resulting orphan process in modern Linux?',
        options: [
          'The orphan process is immediately killed with SIGKILL',
          'The orphan process is automatically reparented to `init`/`systemd` (PID 1), which periodically invokes `wait()` to harvest its exit status upon termination',
          'The orphan process is assigned PID 0',
          'The child’s execution is paused until a new user logs in',
        ],
        correctIndex: 1,
        explanation:
          'In Linux, orphan processes are adopted by PID 1 (`init` or `systemd`) or a designated subreaper process, ensuring that when the orphan terminates, it is reaped cleanly rather than lingering as a permanent zombie.',
      },
    ],
    examTip:
      'Always verify whether the question asks for **Total Processes** (`2^n`) or **New Child Processes Created** (`2^n - 1`). For $n=3$, total processes = 8, but new children = 7. Confusing these two costs 2 marks in FAT questions!',
  },
  {
    topicId: 'm2-threads',
    moduleId: 'm2',
    title: 'Threads, Multithreading Models (M:1, 1:1, M:M), Pthreads & Amdahl’s Law',
    summary:
      'Threads provide lightweight concurrent execution within a single address space. This topic covers process vs thread resource allocation, the four cardinal multithreading benefits, user vs kernel thread mapping architectures (Many-to-One, One-to-One, Many-to-Many, Two-Level), POSIX Pthreads programming, Thread Pools, and rigorous mathematical evaluation of Amdahl\'s Law speedup bounds.',
    sourceDecks: [
      'Silberschatz 10e Ch 4 (§4.1–4.6)',
      'VITC Past Paper: C2 Q2b',
      'POSIX IEEE Std 1003.1c Threads Reference',
    ],
    keyPoints: [
      'A **thread** is the basic unit of CPU utilization. Threads belonging to the same process **SHARE**: Code (Text), Data (globals), Heap (dynamically allocated memory), and open file descriptors/signals.',
      'Threads belonging to the same process maintain **PRIVATE**: Thread ID (TID), Program Counter (PC), CPU Register set, Call Stack (local variables/frames), Thread-Local Storage (TLS), and `errno`.',
      '4 Multithreading Benefits: **Responsiveness** (non-blocking interactive UI), **Resource Sharing** (direct memory access without IPC), **Economy** (thread creation is ~30× faster than `fork()`; thread context switch avoids TLB/page table flush), and **Scalability** (multicore true parallelism).',
      '**Concurrency vs Parallelism**: Concurrency is managing multiple execution streams over time on a single core via rapid context interleaving; Parallelism is executing multiple instructions simultaneously at the exact same physical instant across multiple CPU cores.',
      '**Many-to-One (M:1)**: User thread library multiplexes all user threads onto 1 kernel thread. Fast user-space switching, BUT if 1 thread issues a blocking syscall, the ENTIRE process blocks; cannot exploit multicore parallelism.',
      '**One-to-One (1:1)**: Each user thread maps directly to 1 kernel thread (Linux NPTL, Windows). Delivers true multicore parallelism; blocking syscall by one thread does not block others. Con: creating a user thread incurs kernel thread overhead (mitigated via Thread Pools).',
      '**Many-to-Many (M:M) & Two-Level**: Multiplexes $M$ user threads over $N$ kernel threads ($M \\ge N$). Flexible and scalable, but complex runtime requiring Scheduler Activations / upcalls.',
      '**Amdahl’s Law**: $\\text{Speedup} \\le \\frac{1}{S + \\frac{1 - S}{N}}$, where $S$ is the serial (non-parallelizable) fraction ($0 \\le S \\le 1$) and $N$ is the number of processing cores. As $N \\to \\infty$, the theoretical maximum speedup hits an impenetrable ceiling: $\\frac{1}{S}$.',
    ],
    sections: [
      {
        heading: 'Process vs Thread: Shared vs Private Architectural Partitioning',
        body: 'A process is an isolated resource allocation container, whereas a thread is a lightweight dispatchable stream of instructions executing within that container. Understanding what is shared versus what is private is crucial for concurrency and synchronization.',
        table: {
          headers: ['Resource / Subsystem', 'Scope (Shared vs Private)', 'Architectural Explanation'],
          rows: [
            ['Text Segment (Code)', 'SHARED across all threads', 'All threads execute functions compiled into the same program image'],
            ['Initialized & BSS Data', 'SHARED across all threads', 'Global and static variables are accessible by all threads (requires mutex synchronization)'],
            ['Heap Memory (`malloc`)', 'SHARED across all threads', 'Dynamic pointers allocated by one thread can be passed to and read/written by another'],
            ['Open File Descriptors', 'SHARED across all threads', 'If Thread 1 opens a file or network socket, Thread 2 can read/write to the same FD'],
            ['Signal Handlers', 'SHARED across all threads', 'A process-level signal handler catches signals delivered to the process'],
            ['Thread ID (TID)', 'PRIVATE to each thread', 'Unique numerical identifier for thread scheduling, joining, and signaling'],
            ['Program Counter (PC)', 'PRIVATE to each thread', 'Tracks the specific next instruction being fetched for this independent thread'],
            ['CPU Register Set', 'PRIVATE to each thread', 'Each thread maintains its own temporary computational state, flags, and accumulator values'],
            ['Call Stack', 'PRIVATE to each thread', 'Each thread has its own private stack for activation records, local auto variables, and return addresses'],
            ['Thread-Local Storage (TLS) & errno', 'PRIVATE to each thread', 'Thread-specific variables (`__thread`) and per-thread system call error codes (`errno`)'],
          ],
        },
      },
      {
        heading: 'Multithreading Models (Many-to-One, One-to-One, Many-to-Many, Two-Level)',
        body: 'Operating systems bridge user-level threads (managed by programmer libraries without kernel awareness) and kernel-level threads (managed directly by the OS scheduler) using three classic architectural models.',
        diagramId: 'm2-thread-models',
        table: {
          headers: ['Model', 'User : Kernel Mapping', 'Blocking Syscall Effect', 'Multicore Parallelism', 'Switch Overhead', 'Industry Implementations'],
          rows: [
            ['Many-to-One (M:1)', 'M user threads -> 1 kernel thread', 'Blocks the ENTIRE process; kernel sees only 1 execution context', 'NO (only 1 thread can execute in kernel at a time)', 'Lowest (user-space function call, no kernel trap)', 'Solaris Green Threads, GNU Portable Threads (Pth)'],
            ['One-to-One (1:1)', '1 user thread -> 1 kernel thread', 'Only the calling thread blocks; other threads continue', 'YES (true SMP multicore parallelism)', 'Moderate (requires user-to-kernel mode switch)', 'Linux (NPTL), Windows NT/10/11, macOS, Android'],
            ['Many-to-Many (M:M)', 'M user threads -> N kernel threads (M >= N)', 'Kernel schedules another kernel thread to continue ready user threads', 'YES (up to N threads execute simultaneously)', 'Moderate (managed by runtime + scheduler activations)', 'Go runtime (goroutines: M:N multiplexing), older Solaris'],
            ['Two-Level Model', 'Hybrid M:M with selective 1:1 binding', 'Critical threads bound 1:1 never stall on peer blocking', 'YES (flexible multicore binding)', 'High complexity', 'IRIX, HP-UX, Tru64 UNIX'],
          ],
        },
      },
      {
        heading: 'Amdahl’s Law: Mathematical Formulation, Scaling Limits & Multicore Ceilings',
        body: 'Amdahl’s Law provides the mathematical framework for evaluating the performance speedup obtained by adding processor cores to an application containing both serial (unparallelizable) and parallel portions.',
        codeBlock: `Mathematical Derivation of Amdahl's Law:
Let T_1 = Total execution time on a single core = 1.0 (normalized).
Let S   = Serial fraction of the workload that cannot be parallelized (0 <= S <= 1).
Let 1-S = Parallel fraction that can be split evenly across N processing cores.

Execution time on N cores:
  T(N) = S + (1 - S) / N

Speedup on N cores:
  Speedup(N) = T(1) / T(N) = 1 / [ S + (1 - S) / N ]

Theoretical Maximum Speedup Ceiling (as N -> infinity):
  lim_{N -> inf} Speedup(N) = 1 / [ S + 0 ] = 1 / S

Key Insight:
Even with an infinite number of CPU cores, the maximum possible acceleration
is strictly bounded by the reciprocal of the serial portion 1 / S.`,
        table: {
          headers: ['Serial Fraction S', 'Parallel Fraction (1-S)', 'Speedup (N = 2 cores)', 'Speedup (N = 4 cores)', 'Speedup (N = 8 cores)', 'Speedup (N = 16 cores)', 'Speedup (N -> inf)'],
          rows: [
            ['S = 0.50 (50% serial)', '0.50 (50% parallel)', '1.33×', '1.60×', '1.78×', '1.88×', '2.00× (Hard Upper Bound)'],
            ['S = 0.25 (25% serial)', '0.75 (75% parallel)', '1.60×', '2.29×', '2.91×', '3.37×', '4.00× (Hard Upper Bound)'],
            ['S = 0.10 (10% serial)', '0.90 (90% parallel)', '1.82×', '3.08×', '4.71×', '6.40×', '10.00× (Hard Upper Bound)'],
            ['S = 0.05 (5% serial)', '0.95 (95% parallel)', '1.90×', '3.48×', '5.93×', '9.14×', '20.00× (Hard Upper Bound)'],
            ['S = 0.01 (1% serial)', '0.99 (99% parallel)', '1.98×', '3.88×', '7.48×', '13.94×', '100.00× (Hard Upper Bound)'],
          ],
        },
      },
      {
        heading: 'POSIX Pthreads Implementation & Thread Pool Design Pattern',
        body: 'The IEEE POSIX 1003.1c standard defines the Pthreads C API for thread creation, joining, and synchronization.',
        codeBlock: `// Parallel Array Summation Using POSIX Pthreads
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>

#define NUM_THREADS 4
#define ARRAY_SIZE 1000000

int array[ARRAY_SIZE];
long partial_sums[NUM_THREADS];

typedef struct {
    int thread_id;
    int start_idx;
    int end_idx;
} ThreadData;

void *compute_sum(void *arg) {
    ThreadData *data = (ThreadData *)arg;
    long sum = 0;
    for (int i = data->start_idx; i < data->end_idx; i++) {
        sum += array[i];
    }
    partial_sums[data->thread_id] = sum;
    pthread_exit(NULL);
}

int main(void) {
    pthread_t threads[NUM_THREADS];
    ThreadData tdata[NUM_THREADS];
    int chunk = ARRAY_SIZE / NUM_THREADS;

    for (int i = 0; i < NUM_THREADS; i++) {
        tdata[i].thread_id = i;
        tdata[i].start_idx = i * chunk;
        tdata[i].end_idx = (i + 1) * chunk;
        pthread_create(&threads[i], NULL, compute_sum, (void *)&tdata[i]);
    }

    long total_sum = 0;
    for (int i = 0; i < NUM_THREADS; i++) {
        pthread_join(threads[i], NULL); // Wait for thread termination
        total_sum += partial_sums[i];
    }
    printf("Total Computed Sum: %ld\\n", total_sum);
    return 0;
}`,
      },
    ],
    workedExample: {
      title: 'Amdahl’s Law Multi-Core Speedup & Asymptotic Limit',
      problem:
        'A high-performance scientific simulation consists of 80% parallelizable code and 20% strictly serial code (S = 0.20). (a) Calculate the speedup achieved when running on an 8-core CPU. (b) Calculate the speedup on a 32-core CPU. (c) What is the theoretical maximum speedup possible even if an infinite number of CPU cores are provided? (d) If compiler engineers refactor the serial code such that S drops to 0.05 (5% serial), recalculate the speedup on 32 cores.',
      solution:
        '(a) For N = 8 cores, S = 0.20, (1 - S) = 0.80:\nSpeedup(8) = 1 / [ 0.20 + 0.80 / 8 ] = 1 / [ 0.20 + 0.10 ] = 1 / 0.30 = 3.33×.\n\n(b) For N = 32 cores:\nSpeedup(32) = 1 / [ 0.20 + 0.80 / 32 ] = 1 / [ 0.20 + 0.025 ] = 1 / 0.225 = 4.44×.\n\n(c) As N -> infinity:\nSpeedup(inf) = 1 / S = 1 / 0.20 = 5.00×.\nAdding more cores beyond 32 yields almost negligible improvement because the 20% serial fraction bounds speedup at 5×.\n\n(d) With S = 0.05 and N = 32 cores:\nSpeedup(32) = 1 / [ 0.05 + 0.95 / 32 ] = 1 / [ 0.05 + 0.0296875 ] = 1 / 0.0796875 = 12.55×.\nReducing the serial portion by 15% improved the 32-core speedup from 4.44× to 12.55× (nearly a 3-fold improvement), confirming Amdahl’s insight that optimizing serial bottlenecks is far more impactful than blindly adding cores.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Slot C2+TC2 Q2(b) (5M)',
        promptSummary:
          'Recommend a multithreading model (One-to-One vs Many-to-Many) for a concurrent banking web server.',
        markBreakdown:
          'User vs Kernel thread mapping explanation (2M) + Model architecture diagrams & comparison (2M) + Architectural recommendation & justification (1M)',
        solutionSteps: [
          'Contrast User-Level Threads (managed in user space by runtime library) vs Kernel-Level Threads (scheduled directly by OS kernel).',
          'Explain why Many-to-One fails for banking servers: when one thread executes a blocking disk or database socket read, the entire process freezes, preventing other customer logins.',
          'Recommend **One-to-One (1:1)** architecture combined with a bounded **Thread Pool** (pre-spawned worker threads).',
          'Justify: One-to-One guarantees true multicore parallelism and ensures blocking I/O on one transaction does not stall others, while the Thread Pool caps the total number of kernel threads to prevent memory exhaustion.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m2-th-1',
        question:
          'In the Many-to-One multithreading model, what occurs when a single user thread executes a blocking read() system call to fetch a file from disk?',
        options: [
          'Only the calling user thread blocks, and the user library switches to another user thread on the same kernel thread',
          'The entire process blocks because the operating system kernel sees only one kernel execution context',
          'The kernel automatically converts the process to the One-to-One model',
          'The thread is migrated to another CPU core',
        ],
        correctIndex: 1,
        explanation:
          'Because the kernel only manages a single kernel thread for the process in Many-to-One, a blocking system call made by any user thread puts that kernel thread to sleep, freezing all user threads in the process.',
      },
      {
        id: 'sc-m2-th-2',
        question:
          'According to Amdahl’s Law, if 25% of an application workload is strictly sequential (S = 0.25), what is the maximum theoretical speedup achievable on an enterprise server equipped with 256 physical CPU cores?',
        options: [
          '64×',
          '4.00× (approaching the 1/S ceiling)',
          '16×',
          '256×',
        ],
        correctIndex: 1,
        explanation:
          'As N becomes large, Speedup approaches 1 / S = 1 / 0.25 = 4.00×. For N = 256, Speedup = 1 / (0.25 + 0.75/256) = 1 / 0.2529 = 3.95×, bounded strictly below 4.00×.',
      },
      {
        id: 'sc-m2-th-3',
        question:
          'Which of the following resources is strictly PRIVATE to each individual thread within a multithreaded process?',
        options: [
          'Global variables located in the BSS segment',
          'Open file descriptors in the process file table',
          'The Call Stack and Program Counter (PC)',
          'Dynamically allocated heap memory pointers',
        ],
        correctIndex: 2,
        explanation:
          'Each thread must have its own private Call Stack (for local variables and return addresses) and Program Counter (to track its own instruction stream). The Heap, Code, Global Data, and Open File Descriptors are shared across all threads of the process.',
      },
    ],
    examTip:
      'In multithreading essay questions, always clearly distinguish Concurrency (interleaving progress on 1 core) from Parallelism (simultaneous execution on multiple cores). State Amdahl’s Law formula with all variables defined to secure full marks.',
  },
  {
    topicId: 'm2-nonpreemptive-scheduling',
    moduleId: 'm2',
    title: 'CPU Scheduling Criteria & Non-Preemptive Schedulers (FCFS, SJF, NP-Priority)',
    summary:
      'Non-preemptive CPU schedulers allow a process to run until it voluntarily yields the CPU or terminates. This topic covers the CPU-I/O burst cycle, formal scheduling criteria, First-Come First-Served (FCFS) with Convoy Effect forensics, Shortest Job First (SJF) with exponential burst prediction, and Non-Preemptive Priority scheduling with Aging.',
    sourceDecks: [
      'Silberschatz 10e Ch 5 (§5.1–5.3)',
      'VITC Past Papers: C1 1-2 Q2 & C2 Q3',
    ],
    keyPoints: [
      '**CPU-I/O Burst Cycle**: Process execution alternates between CPU computational bursts and I/O wait bursts. The frequency distribution of CPU bursts is hyperexponential (many short bursts, few very long bursts).',
      '**Non-Preemptive (Cooperative) Scheduling**: Once the CPU is allocated to a process, it retains the CPU until it either terminates or transitions to the Waiting state (e.g., requesting I/O). The scheduler cannot forcibly preempt it.',
      'Core formulas: **Completion Time ($CT$)**; **Turnaround Time ($TAT = CT - AT$)**; **Waiting Time ($WT = TAT - BT$)**; **Response Time ($RT = \\text{FirstExecution} - AT$)**. For non-preemptive schedulers with zero context switch overhead, **$WT = RT$**.',
      'Scheduling Optimization Criteria: **Maximize** CPU Utilization and Throughput; **Minimize** Turnaround Time, Waiting Time, and Response Time.',
      '**First-Come, First-Served (FCFS)**: Non-preemptive FIFO queue. Zero starvation, but suffers from the severe **Convoy Effect**, where short I/O-bound processes wait behind one long CPU-bound process, degrading device utilization and inflating average waiting time.',
      '**Shortest Job First (SJF)**: Assigns CPU to the process with the smallest CPU burst. **Provably optimal** for minimizing Average Waiting Time among non-preemptive algorithms, but vulnerable to Starvation of long processes and requires future burst prediction.',
      '**Exponential Smoothing Prediction**: $\\tau_{n+1} = \\alpha t_n + (1 - \\alpha) \\tau_n$, where $t_n$ is the actual burst length, $\\tau_n$ is historical prediction, and $\\alpha \\in [0, 1]$ is the smoothing weight.',
      '**Non-Preemptive Priority**: Allocates CPU to highest priority job (standard convention: lower integer = higher priority). Once a low-priority job starts at $t=0$, it runs to completion even if a higher-priority job arrives at $t=1$. Starvation is eliminated via **Aging**.',
    ],
    sections: [
      {
        heading: 'CPU-I/O Burst Cycles, Scheduling Criteria & Dispatcher Metrics',
        body: 'The short-term CPU scheduler selects a process from the Ready Queue whenever the CPU becomes idle. The Dispatcher module is the kernel component that actually gives control of the CPU to the selected process.',
        table: {
          headers: ['Scheduling Metric', 'Mathematical Definition', 'Optimization Target', 'System Impact'],
          rows: [
            ['CPU Utilization', 'Percentage of time the CPU is actively executing user/kernel code', 'Maximize (typically 40% to 90%)', 'Prevents expensive CPU hardware from sitting idle'],
            ['Throughput', 'Number of completed processes per unit time (e.g. processes / second)', 'Maximize', 'Measures overall computational productivity'],
            ['Turnaround Time (TAT)', '`TAT = CT - AT` (Elapsed time from arrival to completion)', 'Minimize', 'Total lifetime of the job in the system'],
            ['Waiting Time (WT)', '`WT = TAT - BT` (Total time spent waiting in Ready Queue)', 'Minimize', 'Pure scheduling delay caused by competition for CPU'],
            ['Response Time (RT)', '`RT = FirstExecutionTimestamp - AT`', 'Minimize', 'Crucial for interactive users; time until first output appears'],
            ['Dispatch Latency', 'Time required by Dispatcher to stop one process and start another', 'Minimize (1–10 µs)', 'Pure overhead including context switch, mode switch, and PC jump'],
          ],
        },
      },
      {
        heading: 'First-Come First-Served (FCFS) & The Convoy Effect Forensic',
        body: 'In FCFS, processes are assigned the CPU strictly in order of arrival. When a CPU-bound process with a huge burst (e.g., 100 ms) arrives first, all subsequent short I/O-bound processes (e.g., 2 ms bursts) must wait in the Ready Queue. While the CPU-bound job runs, all I/O devices sit idle. When the CPU-bound job finishes and blocks on I/O, all short jobs finish rapidly and block on I/O, leaving the CPU idle. This systemic inefficiency is the Convoy Effect.',
        table: {
          headers: ['Process', 'Arrival Time (AT)', 'Burst Time (BT)', 'CT (FCFS: P1 first)', 'TAT (FCFS)', 'WT (FCFS)', 'WT (SJF: Shortest first)'],
          rows: [
            ['P1 (CPU-bound)', '0 ms', '24 ms', '24 ms', '24 ms', '0 ms', '6 ms'],
            ['P2 (I/O-bound)', '0 ms', '3 ms', '27 ms', '27 ms', '24 ms', '0 ms'],
            ['P3 (I/O-bound)', '0 ms', '3 ms', '30 ms', '30 ms', '27 ms', '3 ms'],
            ['Average', '—', '—', '—', '27.00 ms', '17.00 ms', '3.00 ms'],
          ],
        },
      },
      {
        heading: 'Shortest Job First (SJF) & Exponential Burst Prediction',
        body: 'SJF is provably optimal because moving a short process before a long process decreases the waiting time of the short process by more than it increases the waiting time of the long process. Because future CPU bursts cannot be known in advance, operating systems estimate future bursts using exponential averaging of past bursts.',
        codeBlock: `Exponential Averaging Formula:
  tau_{n+1} = alpha * t_n + (1 - alpha) * tau_n

Where:
  t_n   = Actual duration of the n-th CPU burst
  tau_n = Predicted duration of the n-th CPU burst
  alpha = Smoothing parameter (0 <= alpha <= 1)

Special Cases:
  - alpha = 0: tau_{n+1} = tau_n (recent history has no effect; initial guess persists)
  - alpha = 1: tau_{n+1} = t_n (only the most recent burst matters; history is ignored)
  - alpha = 0.5: Recent history and past history are weighted equally`,
      },
      {
        heading: 'Verified FAT Benchmark: Slot C1 Set 1-2 Q2 (Non-Preemptive Priority vs FCFS)',
        body: 'Given 5 processes: `P1(AT=0, BT=7, Pri=3)`, `P2(1, 5, 1)`, `P3(2, 4, 4)`, `P4(3, 3, 2)`, `P5(5, 6, 5)` with `1 = highest priority`. At $t=0$, only `P1` is in the system, so `P1` runs non-preemptively until completion at $t=7$. At $t=7$, all other processes have arrived: `P2(Pri 1)`, `P4(Pri 2)`, `P3(Pri 4)`, `P5(Pri 5)`. They execute in strict priority order.',
        diagramId: 'm2-scheduling-queues',
        table: {
          headers: ['Process', 'AT', 'BT', 'Priority', 'CT (NP-Priority)', 'TAT = CT-AT', 'WT = TAT-BT', 'WT (FCFS)'],
          rows: [
            ['P1', '0', '7', '3', '7', '7 ms', '0 ms', '0 ms'],
            ['P2', '1', '5', '1 (Highest)', '12', '11 ms', '6 ms', '6 ms'],
            ['P3', '2', '4', '4', '19', '17 ms', '13 ms', '10 ms'],
            ['P4', '3', '3', '2', '15', '12 ms', '9 ms', '13 ms'],
            ['P5', '5', '6', '5 (Lowest)', '25', '20 ms', '14 ms', '14 ms'],
            ['Average', '—', '—', '—', '—', '13.40 ms', '8.40 ms', '8.60 ms'],
          ],
        },
        codeBlock: `Gantt Chart for NP-Priority:
|    P1    |    P2    |   P4   |   P3   |     P5     |
0          7          12       15       19          25

Gantt Chart for FCFS:
|    P1    |    P2    |   P3   |   P4   |     P5     |
0          7          12       16       19          25`,
      },
    ],
    workedExample: {
      title: 'Exponential Smoothing for CPU Burst Prediction',
      problem:
        'A process has an initial burst estimate of tau_0 = 10 ms. Its actual observed execution bursts are t_0 = 8 ms, t_1 = 4 ms, and t_2 = 12 ms. Using a smoothing factor of alpha = 0.6, calculate the predicted bursts tau_1, tau_2, and tau_3.',
      solution:
        'Using tau_{n+1} = alpha * t_n + (1 - alpha) * tau_n with alpha = 0.6 and (1 - alpha) = 0.4:\n\n1. For n = 0:\ntau_1 = 0.6 * t_0 + 0.4 * tau_0 = 0.6 * (8) + 0.4 * (10) = 4.8 + 4.0 = 8.8 ms.\n\n2. For n = 1:\ntau_2 = 0.6 * t_1 + 0.4 * tau_1 = 0.6 * (4) + 0.4 * (8.8) = 2.4 + 3.52 = 5.92 ms.\n\n3. For n = 2:\ntau_3 = 0.6 * t_2 + 0.4 * tau_2 = 0.6 * (12) + 0.4 * (5.92) = 7.2 + 2.368 = 9.568 ms.\n\nThe predicted burst for the 4th run is approximately 9.57 ms.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Slot C1 Set 1-2 Q2 (10M)',
        promptSummary:
          'Non-Preemptive Priority Gantt, WT/TAT averages, compare with FCFS, responsiveness, two limitations and aging resolution.',
        markBreakdown:
          'Gantt chart + CT/TAT/WT table (4M) + Comparison with FCFS (3M) + Starvation/Priority-Inversion & Aging fix (3M)',
        solutionSteps: [
          'Draw the Non-Preemptive Priority Gantt chart: `P1[0–7] | P2[7–12] | P4[12–15] | P3[15–19] | P5[19–25]`. Emphasize that P1 cannot be preempted at t=1.',
          'Tabulate CT, TAT = CT - AT, WT = TAT - BT for all 5 processes. Calculate Avg TAT = 67 / 5 = 13.40 ms and Avg WT = 42 / 5 = 8.40 ms.',
          'Draw the FCFS Gantt chart (`P1[0-7] | P2[7-12] | P3[12-16] | P4[16-19] | P5[19-25]`) and demonstrate FCFS Avg WT = 43 / 5 = 8.60 ms (NP-Priority reduces waiting by 0.20 ms).',
          'Cite 2 major limitations: (1) Starvation (Indefinite Blocking) of low-priority processes when high-priority jobs continually arrive; (2) Priority Inversion where a high-priority process waits for a resource held by a low-priority process.',
          'State the resolution: **Aging**, which gradually increases the priority of waiting processes by 1 level every $K$ milliseconds until they reach the highest priority.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m2-np-1',
        question:
          'Under Non-Preemptive Priority scheduling (where 1 = highest priority), process P1 arrives at t = 0 with burst 7 and priority 3. Process P2 arrives at t = 1 with burst 5 and priority 1. At what timestamp does P2 actually begin executing on the CPU?',
        options: [
          't = 1 ms (immediate preemption)',
          't = 5 ms',
          't = 7 ms (after P1 finishes its complete burst)',
          't = 12 ms',
        ],
        correctIndex: 2,
        explanation:
          'Because the scheduler is non-preemptive, P1 cannot be interrupted once dispatched. P2 must wait in the Ready Queue until P1 completes at t = 7 ms.',
      },
      {
        id: 'sc-m2-np-2',
        question:
          'What is the Convoy Effect in operating systems, and which scheduling algorithm is notoriously prone to it?',
        options: [
          'High-priority processes preempting low-priority processes in Round Robin',
          'Short processes queueing behind a long CPU-bound process in FCFS, causing poor device utilization',
          'Processes rapidly thrashing between virtual memory pages in SJF',
          'Deadlock cycles forming in Multi-Level Feedback Queues',
        ],
        correctIndex: 1,
        explanation:
          'The Convoy Effect occurs in FCFS when multiple short I/O-bound processes wait behind one long CPU-bound process, resulting in lower CPU and device utilization and higher average waiting times.',
      },
      {
        id: 'sc-m2-np-3',
        question:
          'In exponential burst prediction, setting the smoothing parameter alpha = 0 implies that:',
        options: [
          'Only the most recent actual burst length determines the next prediction',
          'The initial prediction tau_0 remains unchanged forever, completely ignoring recent history',
          'The burst prediction oscillates between 0 and infinity',
          'All processes are treated as having 0 ms burst time',
        ],
        correctIndex: 1,
        explanation:
          'When alpha = 0, tau_{n+1} = 0 * t_n + (1 - 0) * tau_n = tau_n. The historical estimate never updates and recent actual bursts are completely ignored.',
      },
    ],
    examTip:
      'In Non-Preemptive Priority questions, do not fall into the trap of preempting at t=1! Since it is non-preemptive, P1 runs until t=7 regardless of P2’s priority.',
  },
  {
    topicId: 'm2-preemptive-scheduling',
    moduleId: 'm2',
    title: 'Preemptive Schedulers: SRTF, Round Robin, Preemptive Priority (+CS) & MLFQ',
    summary:
      'Preemptive CPU schedulers interrupt running processes upon higher-priority arrivals, shorter burst arrivals, or time quantum expirations. This topic covers Shortest Remaining Time First (SRTF), Round Robin (RR) quantum dynamics, the verified 15M FAT benchmark for Preemptive Priority with 1 ms Context-Switch overhead, and Multilevel Feedback Queue (MLFQ) aging parameters.',
    sourceDecks: [
      'Silberschatz 10e Ch 5 (§5.3–5.4)',
      'VITC Past Papers: C1 2-2 Q5 (15M) & C2 Q3 (10M)',
    ],
    keyPoints: [
      '**Preemptive Scheduling Triggers**: (1) A higher-priority process arrives in the Ready Queue; (2) A process with shorter remaining burst time arrives (SRTF); (3) A hardware timer interrupt fires indicating time quantum expiration (Round Robin); (4) An I/O completion unblocks a high-priority job.',
      '**SRTF (Preemptive SJF)**: At every arrival timestamp $t$, the remaining burst time of the currently running process is compared against the incoming process’s burst time. If the incoming job has strictly smaller remaining burst, preemption occurs. Provably minimizes Average Waiting Time.',
      '**Round Robin (RR)**: Ready Queue is treated as a circular FIFO queue with time quantum $q$. When $q$ expires, timer interrupt preempts running process and appends it to queue tail.',
      '**RR Ready Queue Insertion Tie-Breaker**: When process $P_i$’s quantum expires at timestamp $t$ and another process $P_k$ arrives at timestamp $t$, **$P_k$ enters the Ready Queue BEFORE $P_i$ re-enters**!',
      '**Quantum Sizing Trade-Off**: $q \\to \\infty$ degrades to FCFS; $q \\to 0$ approaches Processor Sharing, but excessive context-switch overhead destroys CPU throughput. Standard heuristic: **80% of CPU bursts should be shorter than time quantum $q$**.',
      '**Preemptive Priority with Context-Switch Overhead (C1 Set 2-2 Q5)**: Insert a **1 ms CS overhead** block whenever switching between distinct processes $A \\to B$. Exclude initial dispatch at $t=0$ and final completion. **Re-evaluate arrivals at $t + \\text{CS}$**! Never preempt on equal priority (FCFS order).',
      '**Response Time vs Waiting Time**: In preemptive scheduling, $RT \\ne WT$. A process can achieve immediate initial response ($RT = 0$) yet endure significant total waiting time ($WT \\gg 0$) across multiple preemption rounds.',
      '**Multilevel Feedback Queue (MLFQ)**: Uses multiple priority queues ($Q_0, Q_1, Q_2$). New processes enter top queue $Q_0$ (small $q$). CPU-bound jobs consuming their entire quantum are demoted to lower queues ($Q_1, Q_2$). Starvation is prevented by **Aging** (promoting starving jobs after threshold $T_{\\text{age}}$ or via periodic global priority boosts).',
    ],
    sections: [
      {
        heading: 'Shortest Remaining Time First (SRTF) Scheduling & Preemption Logic',
        body: 'Shortest Remaining Time First (SRTF) is the preemptive variant of SJF. When a new process arrives, the scheduler compares the remaining burst time of the running process with the burst time of the newly arrived process. If the newcomer is strictly shorter, the CPU is immediately preempted.',
        table: {
          headers: ['Process', 'Arrival Time (AT)', 'Burst Time (BT)', 'CT (SRTF)', 'TAT = CT-AT', 'WT = TAT-BT', 'RT (FirstStart - AT)'],
          rows: [
            ['P1', '0 ms', '8 ms', '17 ms', '17 ms', '9 ms', '0 ms (starts 0, preempted at 1)'],
            ['P2', '1 ms', '4 ms', '5 ms', '4 ms', '0 ms', '0 ms (runs 1–5 without interruption)'],
            ['P3', '2 ms', '9 ms', '26 ms', '24 ms', '15 ms', '15 ms (starts at 17)'],
            ['P4', '3 ms', '5 ms', '10 ms', '7 ms', '2 ms', '2 ms (starts at 5)'],
            ['Average', '—', '—', '—', '13.00 ms', '6.50 ms', '4.25 ms'],
          ],
        },
        codeBlock: `SRTF Execution Trace:
- t=0: P1 arrives (rem=8). P1 starts [0–1].
- t=1: P2 arrives (BT=4). P1 rem is 7. Since 4 < 7, P1 is PREEMPTED. P2 runs [1–5].
- t=2: P3 arrives (BT=9). P2 rem is 3. P2 continues.
- t=3: P4 arrives (BT=5). P2 rem is 2. P2 continues.
- t=5: P2 completes. Ready queue: P4(rem=5), P1(rem=7), P3(rem=9). P4 runs [5–10].
- t=10: P4 completes. P1 runs [10–17].
- t=17: P1 completes. P3 runs [17–26]. Completed!`,
      },
      {
        heading: 'Round Robin (RR) Quantum Selection Dynamics & Tie-Breaking Rules',
        body: 'The performance of Round Robin depends critically on the size of the time quantum $q$. If $q$ is extremely large, RR degenerates into FCFS. If $q$ is extremely small (e.g., 1 µs), the system approaches Processor Sharing, but context switch latency overwhelms CPU processing.',
        table: {
          headers: ['Quantum Size (q)', 'Context Switches', 'Average Response Time', 'Average Turnaround Time', 'Suitability'],
          rows: [
            ['Very Small (q < 1 ms)', 'Massive (thousands/sec)', 'Extremely low (sub-millisecond)', 'High (bloated by CS overhead)', 'Theoretical only; unusable in practice'],
            ['Optimal (q = 10–20 ms)', 'Moderate (manageable)', 'Fast (sub-50 ms for interactive UI)', 'Balanced', 'Modern Desktop & Server OS default'],
            ['Very Large (q > 100 ms)', 'Minimal (approaches 0)', 'Slow (poor interactive feedback)', 'Approaches FCFS', 'Batch computing with long CPU bursts'],
          ],
        },
      },
      {
        heading: 'Verified 15M FAT Masterpiece: Slot C1 Set 2-2 Q5 (Preemptive Priority + 1 ms CS Overhead)',
        body: 'This benchmark is the definitive 15-mark numerical problem in VIT Chennai FAT exams. 10 processes with priority `1 = highest`, equal priority resolved via FCFS (no preemption on tie), and a **1 ms context switch overhead** incurred on every transition between distinct processes. Total CPU burst = 53 ms; 14 context switches = 14 ms; Total Makespan = 67 ms.',
        table: {
          headers: ['Proc', 'AT', 'BT', 'Pri', 'CT', 'TAT = CT - AT', 'WT = TAT - BT', 'RT = 1stStart - AT'],
          rows: [
            ['P1', '0', '9', '6', '58', '58 ms', '49 ms', '0 ms (starts at 0)'],
            ['P2', '1', '5', '4', '36', '35 ms', '30 ms', '1 ms (starts at 2)'],
            ['P3', '3', '8', '7', '67', '64 ms', '56 ms', '56 ms (starts at 59)'],
            ['P4', '4', '4', '2', '14', '10 ms', '6 ms', '1 ms (starts at 5)'],
            ['P5', '6', '6', '5', '49', '43 ms', '37 ms', '37 ms (starts at 43)'],
            ['P6', '8', '3', '1', '12', '4 ms', '1 ms', '1 ms (starts at 9)'],
            ['P7', '10', '7', '3', '32', '22 ms', '15 ms', '5 ms (starts at 15)'],
            ['P8', '12', '5', '4', '42', '30 ms', '25 ms', '25 ms (starts at 37)'],
            ['P9', '19', '2', '1', '22', '3 ms', '1 ms', '1 ms (starts at 20)'],
            ['P10', '17', '4', '2', '26', '9 ms', '5 ms', '1 ms (starts at 18)'],
            ['Average', '—', '5.3', '—', '—', '27.80 ms', '22.50 ms', '12.80 ms'],
          ],
        },
        codeBlock: `Complete Exact Gantt Timeline (67 ms Total Makespan, 14 Context Switches):
P1[0-1] -> CS[1-2] -> P2[2-4] -> CS[4-5] -> P4[5-8] -> CS[8-9] -> P6[9-12] -> CS[12-13] ->
P4[13-14] -> CS[14-15] -> P7[15-17] -> CS[17-18] -> P10[18-19] -> CS[19-20] -> P9[20-22] ->
CS[22-23] -> P10[23-26] -> CS[26-27] -> P7[27-32] -> CS[32-33] -> P2[33-36] -> CS[36-37] ->
P8[37-42] -> CS[42-43] -> P5[43-49] -> CS[49-50] -> P1[50-58] -> CS[58-59] -> P3[59-67]

Critical Forensic Rules Applied:
1. P1 starts at t=0 (no CS before initial dispatch).
2. At t=1, P2(pri 4) arrives. Pri 4 < 6 -> Preempts P1. CS occurs during [1-2]. P2 executes [2-4].
3. At t=4, P4(pri 2) arrives. Pri 2 < 4 -> Preempts P2. CS occurs during [4-5]. P4 executes [5-8].
4. At t=8, P6(pri 1) arrives. Pri 1 < 2 -> Preempts P4. CS occurs during [8-9]. P6 executes [9-12].
5. At t=12, P6 finishes. Switch back to P4 (rem 1). CS during [12-13]. P4 finishes [13-14].
6. Tie-breaking rule: P2 and P8 both have Priority 4. P2 arrived at t=1, P8 at t=12.
   FCFS tie-breaking gives P2 priority; P2 runs to completion before P8 starts.
7. Verification Sanity Check: Total Time = Sum(BT) + Sum(CS) = 53 + 14 = 67 ms. Matches!`,
      },
      {
        heading: 'Multilevel Feedback Queue (MLFQ): Parameters, Demotion & Aging Boost',
        body: 'Multilevel Feedback Queue (MLFQ) is the most versatile CPU scheduling algorithm in modern OS design. Unlike static priority scheduling, MLFQ dynamically observes process behavior and adjusts queue placement accordingly.',
        diagramId: 'm2-scheduling-queues',
        table: {
          headers: ['Queue Level', 'Scheduling Algorithm', 'Time Quantum', 'Priority & Target Workload', 'Demotion / Promotion Rule'],
          rows: [
            ['Queue 0 (Q0)', 'Round Robin (RR)', 'q = 8 ms', 'Highest Priority; New arrivals & highly interactive I/O jobs', 'If process consumes full 8 ms quantum without blocking, demote to Q1'],
            ['Queue 1 (Q1)', 'Round Robin (RR)', 'q = 16 ms', 'Medium Priority; Moderate burst interactive jobs', 'If process consumes full 16 ms quantum without blocking, demote to Q2'],
            ['Queue 2 (Q2)', 'First-Come, First-Served (FCFS)', 'Run to completion', 'Lowest Priority; Long CPU-bound batch computations', 'Processes wait for CPU; promoted back to Q1/Q0 via Aging'],
          ],
        },
        codeBlock: `Core MLFQ Governing Rules:
Rule 1: Priority(Q0) > Priority(Q1) > Priority(Q2).
        A process in Q1 runs ONLY when Q0 is empty.
        A process in Q2 runs ONLY when both Q0 and Q1 are empty.
Rule 2: When a process enters the system, it is placed in the highest queue (Q0).
Rule 3: Once a process uses up its time allotment at a given level (regardless of how
        many times it yields for I/O), its priority is reduced (it moves down one queue).
Rule 4 (Aging & Starvation Prevention):
        After some time period S (or when waiting time in Q2 exceeds T_age),
        the OS moves all processes in the system to the topmost queue (Q0).
        This periodic "Priority Boost" guarantees:
        (a) Starving CPU-bound processes are guaranteed CPU time.
        (b) If a previously CPU-bound process becomes interactive, it receives fast response.`,
      },
    ],
    workedExample: {
      title: 'SRTF Step-by-Step Gantt Construction & Metric Calculation',
      problem:
        'Given four processes arriving at different times: P1(AT=0, BT=7), P2(AT=2, BT=4), P3(AT=4, BT=1), P4(AT=5, BT=4). (a) Construct the SRTF Gantt chart. (b) Calculate the Completion Time (CT), Turnaround Time (TAT), and Waiting Time (WT) for each process. (c) Compute the Average Waiting Time.',
      solution:
        '(a) Execution Timeline:\n- t=0 to t=2: Only P1 is available. P1 executes for 2 ms (remaining burst = 5).\n- t=2: P2 arrives with burst 4. Remaining P1 is 5. Since 4 < 5, P1 is PREEMPTED. P2 starts.\n- t=2 to t=4: P2 executes for 2 ms (remaining burst = 2).\n- t=4: P3 arrives with burst 1. Remaining P2 is 2. Since 1 < 2, P2 is PREEMPTED. P3 executes [4–5] and completes at t=5!\n- t=5: P4 arrives with burst 4. Ready queue has: P2 (rem 2), P4 (rem 4), P1 (rem 5). Shortest is P2. P2 resumes [5–7] and completes at t=7!\n- t=7: Ready queue has: P4 (rem 4), P1 (rem 5). Shortest is P4. P4 executes [7–11] and completes at t=11!\n- t=11: P1 resumes [11–16] and completes at t=16!\n\nGantt Chart: | P1[0-2] | P2[2-4] | P3[4-5] | P2[5-7] | P4[7-11] | P1[11-16] |\n\n(b) Metrics Table:\n- P1: CT = 16 ms, TAT = 16 - 0 = 16 ms, WT = 16 - 7 = 9 ms\n- P2: CT = 7 ms,  TAT = 7 - 2 = 5 ms,   WT = 5 - 4 = 1 ms\n- P3: CT = 5 ms,  TAT = 5 - 4 = 1 ms,   WT = 1 - 1 = 0 ms\n- P4: CT = 11 ms, TAT = 11 - 5 = 6 ms,  WT = 6 - 4 = 2 ms\n\n(c) Average Waiting Time = (9 + 1 + 0 + 2) / 4 = 12 / 4 = 3.00 ms.\nAverage Turnaround Time = (16 + 5 + 1 + 6) / 4 = 28 / 4 = 7.00 ms.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Slot C1+TC1 Set 2-2 Q5 (15M)',
        promptSummary:
          'Preemptive Priority (10 processes, 1 ms CS overhead): Gantt chart (6M), CT values (2M), TAT/WT/RT table (5M), Avg TAT & Avg WT (2M).',
        markBreakdown:
          'Gantt chart with explicit CS overhead ticks (6M) + Correct CT column (2M) + TAT/WT/RT table (5M) + Exact averages (Avg TAT = 27.80, Avg WT = 22.50) (2M)',
        solutionSteps: [
          'Plot arrival points along scratch timeline: t=0(P1), 1(P2), 3(P3), 4(P4), 6(P5), 8(P6), 10(P7), 12(P8), 17(P10), 19(P9).',
          'Execute preemption: At t=1, P2 preempts P1 -> 1 ms CS block [1-2]. At t=4, P4 preempts P2 -> CS [4-5]. At t=8, P6 preempts P4 -> CS [8-9].',
          'Notice arrival during CS: P10 arrives at t=17 during CS [17-18]; P9 arrives at t=19 during CS [19-20]. Evaluate queue strictly at end of CS block.',
          'Verify makespan: Sum of all bursts (53 ms) + 14 CS blocks (14 ms) = 67 ms makespan.',
          'Tabulate all 10 processes: Sum TAT = 278 ms -> Avg TAT = 27.80 ms; Sum WT = 225 ms -> Avg WT = 22.50 ms; Avg RT = 12.80 ms.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m2-pr-1',
        question:
          'In Round Robin scheduling, if process P1’s quantum expires at t = 10 ms and process P2 arrives at t = 10 ms, what is the exact Ready Queue order at t = 10 ms?',
        options: [
          'P1 is re-enqueued first, then P2 is enqueued behind P1',
          'P2 (new arrival) is enqueued first, and P1 (preempted) is enqueued behind P2',
          'P1 immediately begins another quantum on the CPU',
          'The scheduler drops P1 from the queue',
        ],
        correctIndex: 1,
        explanation:
          'Standard OS scheduling rules specify that new arrivals at timestamp t enter the Ready Queue before a preempted process re-enters the tail of the queue.',
      },
      {
        id: 'sc-m2-pr-2',
        question:
          'In Preemptive Priority scheduling with 1 ms Context-Switch overhead, why is there NO context switch at timestamp t = 0?',
        options: [
          'The first process is exempt from operating system control',
          'Context switch overhead applies only when switching between two distinct executing processes; initial dispatch from an idle CPU has zero outgoing state to preserve',
          'Context switch overhead is subtracted from the first process’s burst time',
          'Hardware timers do not start until t = 1 ms',
        ],
        correctIndex: 1,
        explanation:
          'Context switch overhead represents the cost of saving the outgoing process state and loading the incoming process state. At t = 0, no previous process is running on the CPU, so there is no outgoing state to preserve.',
      },
      {
        id: 'sc-m2-pr-3',
        question:
          'In a Multilevel Feedback Queue (MLFQ) scheduler, how does the system prevent indefinite starvation of CPU-bound processes in the lowest-priority queue?',
        options: [
          'By terminating CPU-bound processes after 60 seconds',
          'By employing Aging (e.g. periodic priority boost where all processes are promoted back to the top queue Q0)',
          'By increasing the clock speed of the CPU',
          'By converting the lowest queue into Last-In First-Out (LIFO)',
        ],
        correctIndex: 1,
        explanation:
          'MLFQ implements Aging through periodic priority boosts (or wait-time thresholds), moving starving processes from lower queues back to Q0 so they are guaranteed CPU service.',
      },
    ],
    examTip:
      'Always double-check your Gantt chart makespan using the formula: Total Time = Sum(BT) + Total_CS_Time + Total_Idle_Time. In C1 Set 2-2 Q5, 53 + 14 + 0 = 67 ms. If your Gantt ends at anything other than 67, you have miscounted a CS block!',
  },
  {
    topicId: 'm2-deadlock-rag',
    moduleId: 'm2',
    title: 'Deadlock Characterization (4 Coffman Conditions), RAG & Wait-For Graphs',
    summary:
      'Deadlock occurs when a set of processes each holds resources while waiting cyclically for resources held by others in the set; Resource Allocation Graphs (RAG) and Wait-For Graphs (WFG) detect cycles visually.',
    sourceDecks: [
      'Silberschatz 10e Ch 8 (§8.1–8.4)',
      'VITC Past Papers: C2 Q4 & C1 1-2 Q8d',
    ],
    keyPoints: [
      '4 Coffman Necessary Conditions (ALL 4 must hold simultaneously): **1. Mutual Exclusion**, **2. Hold and Wait**, **3. No Preemption**, **4. Circular Wait**.',
      'RAG Edges: **Request Edge $P_i \\to R_j$** (process requests resource instance); **Assignment Edge $R_j \\to P_i$** (resource instance allocated to process).',
      '**Single-Instance RAG**: A cycle is **necessary AND sufficient** for deadlock. **Multi-Instance RAG**: A cycle is **necessary ONLY** (not sufficient).',
      '**Wait-For Graph (WFG)** collapses single-instance resources: directed edge $P_i \\to P_j$ exists if and only if $P_i$ waits for a resource held by $P_j$.',
      'Breaking any ONE of the 4 Coffman conditions structurally prevents deadlock entirely.',
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
            ['Circular Wait', 'Closed chain P0->P1->...->Pn->P0', 'Impose strict global numbering F(R_i) and request in increasing order', 'Most practical prevention rule in real kernels'],
          ],
        },
      },
    ],
    workedExample: {
      title: 'Why a Multi-Instance RAG Cycle May Not Be Deadlocked',
      problem:
        'Suppose R1 and R2 each have 2 instances. P1 holds R1 and requests R2; P3 holds R2 and requests R1; meanwhile P2 holds the second R1 and requests nothing; P4 holds the second R2 and requests nothing. Is there a deadlock?',
      solution:
        'A cycle P1 -> R2 -> P3 -> R1 -> P1 exists, but there is NO deadlock! P2 and P4 are not waiting on anything, will finish, and release their instances of R1 and R2 so P1 and P3 complete.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Slot C2+TC2 Q4 (10M)',
        promptSummary:
          'Draw Healthcare single-instance RAG, check Coffman conditions, identify deadlocked set (4M), 2 handling methods (4M), recovery/victim selection (2M).',
        markBreakdown:
          'RAG + WFG cycle + Coffman conditions (4M) + Prevention/Avoidance/Detection (4M) + Victim selection (2M)',
        solutionSteps: [
          'Draw circles P1..P4, squares R1..R3 (1 dot each), assignment arrows R1->P1, R2->P2, R3->P3, request arrows P1->R2, P2->R3, P3->R1, P4->R2.',
          'Identify single-instance cycle P1->R2->P2->R3->P3->R1->P1 -> deadlocked set = {P1, P2, P3} (P4 waits indefinitely on R2).',
          'State recovery: Process termination (abort all or one-at-a-time) or Resource preemption (victim chosen by priority, compute time spent, remaining need, rollback cost, starvation limit).',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m2-rag-1',
        question: 'In a Wait-For Graph, a directed edge P1 -> P2 means:',
        options: [
          'P1 created P2 via fork()',
          'P1 is waiting for a resource currently held by P2',
          'P2 is waiting for P1',
          'P1 has higher priority than P2',
        ],
        correctIndex: 1,
        explanation:
          'Wait-For Graph edges point from the waiting process to the process holding the requested resource.',
      },
      {
        id: 'sc-m2-rag-2',
        question:
          'Which Coffman condition is broken by requiring processes to acquire locks in strictly ascending lock-ID order?',
        options: [
          'Mutual Exclusion',
          'Hold and Wait',
          'No Preemption',
          'Circular Wait',
        ],
        correctIndex: 3,
        explanation:
          'Strict total ordering of resource types makes a closed circular wait chain mathematically impossible.',
      },
    ],
    examTip:
      'In C2 Q4, ALWAYS distinguish {P1, P2, P3} (inside the cycle) from P4 (blocked waiting on R2, outside the cycle).',
  },
  {
    topicId: 'm2-deadlock-handling',
    moduleId: 'm2',
    title: 'Deadlock Prevention, Avoidance (Banker’s Algorithm), Detection & Recovery',
    summary:
      'Banker’s Algorithm avoids deadlocks dynamically by ensuring the system never grants a resource request that transitions the state from Safe to Unsafe.',
    sourceDecks: [
      'Silberschatz 10e Ch 8 (§8.5–8.8)',
      'VITC Past Papers: C1 2-2 Q7 (15M) & C1 1-2 Q8 (15M)',
    ],
    keyPoints: [
      '**Safe State**: There exists at least one Safe Sequence `<P_i1, P_i2, ..., P_in>` where every process can obtain its remaining `Need` from `Work` and release its `Allocation`.',
      'Every Safe state is deadlock-free; an **Unsafe state** does NOT guarantee immediate deadlock, only that the OS can no longer prevent deadlock if processes request their Max.',
      '**Safety Algorithm** ($O(m \\cdot n^2)$): `Need = Max - Allocation`; `Work = Available`; repeatedly find unfinished $i$ with `Need[i] <= Work`, set `Work += Allocation[i]`, `Finish[i] = true`.',
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
        heading: 'Critical 6-Mark Trap: Evaluating Q7(c) Request2 = (0, 0, 1, 0)',
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
        promptSummary:
          'Compute Total Allocated, Available, Need (3M), Safety Work trace (6M), and evaluate Request2=(0,0,1,0) (6M).',
        markBreakdown:
          'Available & Need matrix (3M) + Safety trace + <P0,P1,P3,P4,P5,P2> (6M) + 3-step Request denial proof (6M)',
        solutionSteps: [
          'Verify `Final Work == Total Resources` (`(7,5,5,4)`) at the end of every safe sequence — instant arithmetic sanity check!',
          'In Q7(c), show all 3 checks explicitly and highlight `Work.C = 0` blocking `P2..P5` to prove UNSAFE -> DENY.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m2-bk-1',
        question:
          'In Banker’s Algorithm, what is the exact time complexity of the Safety Algorithm for `n` processes and `m` resource types?',
        options: ['O(n)', 'O(m * n)', 'O(m * n^2)', 'O(2^n)'],
        correctIndex: 2,
        explanation:
          'Up to `n` passes scan up to `n` processes comparing `m`-element vectors -> `O(m * n^2)`.',
      },
      {
        id: 'sc-m2-bk-2',
        question:
          'If a system transitions to an UNSAFE state, what does that strictly guarantee?',
        options: [
          'Deadlock has already occurred immediately',
          'Deadlock MAY occur if processes claim their remaining Max resources',
          'All processes are terminated immediately',
          'Available vector is negative',
        ],
        correctIndex: 1,
        explanation:
          'Unsafe means the OS can no longer guarantee avoidance; deadlock only happens if processes actually request resources in an unlucky order.',
      },
    ],
    examTip:
      'At the last step of your Banker’s Safety table, `Final Work` MUST equal `Total Resources` — if it doesn’t, re-check your column sums immediately!',
  },
];
