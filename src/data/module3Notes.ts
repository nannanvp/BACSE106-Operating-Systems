import { TopicNote } from './noteTypes';

export const MODULE_3_NOTES: TopicNote[] = [
  {
    topicId: 'm3-ipc',
    moduleId: 'm3',
    title: 'Inter-Process Communication: Shared Memory, Message Passing, Pipes, Sockets & RPC',
    summary:
      'Cooperating processes must exchange data and synchronize actions. The OS provides two fundamental models: Shared Memory (maximum throughput via direct RAM mapping, zero kernel copies in steady state, user-managed synchronization) and Message Passing (kernel-mediated packet exchange, zero shared-state race conditions, distributed scalability, but higher syscall and copy overhead).',
    sourceDecks: ['Silberschatz 10e Ch 3 (§3.4–3.8)', 'OVERDUE GAP — Lab Exp 6 IPC'],
    keyPoints: [
      '**Shared Memory** (`shm_open`, `ftruncate`, `mmap`, `shm_unlink`): Kernel intervenes ONLY during setup to establish page table mappings; subsequent reads and writes run at native memory bus speed without kernel traps. The programmer is strictly responsible for race-condition prevention (using mutexes or semaphores).',
      '**Message Passing** (`send`, `receive`, POSIX `mq_send`, `mq_receive`): Kernel mediates every transfer; eliminates shared-address race conditions and functions seamlessly across physical network boundaries, but incurs two memory copies (user buffer -> kernel buffer -> user buffer) plus two system call traps per transaction.',
      '**Communication Link Semantics**: Direct (symmetric `send(P, &m)` / asymmetric `receive(id, &m)`) vs Indirect (mailboxes/ports with port ownership); Synchronous (**blocking** send/receive = Rendezvous) vs Asynchronous (**non-blocking**); Zero capacity (no buffering, sender blocks until receiver arrives), Bounded capacity (queue length $N$, sender blocks when full), and Unbounded capacity (sender never blocks).',
      '**UNIX Pipes**: Ordinary Pipes (`pipe(int fd[2])`) are unidirectional byte streams requiring parent-child process ancestry (`fd[0]` = read end, `fd[1]` = write end; closing write end sends EOF to reader). Named Pipes (FIFOs via `mkfifo`) persist as filesystem nodes, support bidirectional or unidirectional I/O, and connect unrelated processes.',
      '**Sockets & Remote Procedure Calls (RPC)**: Sockets define network endpoints as `<IP_Address : Port_Number>` for Stream (TCP) or Datagram (UDP) channels. RPC abstracts distributed communication into standard procedure invocations using client/server **stubs** that marshal and unmarshal parameters (e.g., using External Data Representation - XDR) to neutralize byte-order endianness differences.',
    ],
    sections: [
      {
        heading: 'Shared Memory vs Message Passing Architecture',
        body: 'The primary architectural distinction between Shared Memory and Message Passing lies in where the OS kernel sits during steady-state data transfer. In Shared Memory, the kernel maps the same physical RAM frame into the virtual address spaces of both processes during initialization; after that, processes read and write directly to RAM. In Message Passing, the kernel maintains an internal message queue and must copy data between user space and kernel space on every single operation.',
        diagramId: 'm3-ipc-models',
        table: {
          headers: ['Architectural Dimension', 'Shared Memory (`mmap`)', 'Message Passing (`send`/`recv`)'],
          rows: [
            ['Kernel Involvement', 'Only during initial segment setup and teardown', 'Present on every message transfer via system call trap'],
            ['Data Transfer Speed', 'Maximum throughput (direct RAM bus clock speed)', 'Lower throughput (bounded by kernel copy & context switch overhead)'],
            ['Synchronization Responsibility', 'Programmer MUST implement explicit locks/semaphores', 'OS kernel inherently synchronizes message queue operations'],
            ['Network / Distributed Support', 'Limited to processes sharing physical hardware memory', 'Inherently distributed; spans local hosts, LANs, and WANs'],
            ['Buffer Management', 'User structures memory buffer (e.g., circular array)', 'Kernel manages system message queue and capacity limits'],
            ['Cache Coherence', 'Requires hardware cache-coherency protocols across cores', 'Managed naturally by kernel memory buffer invalidations'],
          ],
        },
      },
      {
        heading: 'POSIX Shared Memory Implementation Pattern',
        body: 'A robust POSIX shared memory pipeline involves four distinct system calls: (1) `shm_open()` creates or opens a POSIX shared memory object in the `tmpfs` virtual file system; (2) `ftruncate()` configures the size of the shared memory object in bytes; (3) `mmap()` maps the object into the process’s virtual address space; and (4) `shm_unlink()` removes the shared memory link from the system.',
        codeBlock: `// === POSIX SHARED MEMORY: PRODUCER WRITING TO CONSUMER ===
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>
#include <sys/shm.h>
#include <sys/stat.h>
#include <sys/mman.h>
#include <unistd.h>

int main() {
    const int SIZE = 4096;
    const char *name = "/os_shm_channel";
    int shm_fd;
    void *ptr;

    // 1. Create the shared memory segment (Read/Write, create if missing, 0666 permissions)
    shm_fd = shm_open(name, O_CREAT | O_RDWR, 0666);
    if (shm_fd == -1) { perror("shm_open"); exit(1); }

    // 2. Configure the size of the segment to 4096 bytes
    ftruncate(shm_fd, SIZE);

    // 3. Map shared memory into process address space
    ptr = mmap(0, SIZE, PROT_READ | PROT_WRITE, MAP_SHARED, shm_fd, 0);
    if (ptr == MAP_FAILED) { perror("mmap"); exit(1); }

    // 4. Write data directly to RAM without kernel syscall copy
    sprintf((char *)ptr, "BACSE106: Operating Systems High-Yield IPC Segment");

    printf("Producer wrote: %s\\n", (char *)ptr);
    // Consumer later accesses via: shm_open(name, O_RDONLY, 0666) -> mmap -> printf -> shm_unlink(name)
    return 0;
}`,
      },
      {
        heading: 'UNIX Pipes: Ordinary (Anonymous) vs Named Pipes (FIFOs)',
        body: 'Pipes represent one of the earliest and most elegant IPC mechanisms in UNIX. An Ordinary Pipe is created in memory via `pipe(int fd[2])`. It is strictly unidirectional: `fd[0]` is the read descriptor and `fd[1]` is the write descriptor. Because ordinary pipes are anonymous (having no path in the filesystem), they can only be used between processes that share a common ancestor that created the pipe prior to `fork()`. When the write end is closed, the reader receives `0` (EOF). Conversely, Named Pipes (FIFOs, created via `mkfifo(path, mode)`) possess a directory entry, persist across process terminations, allow bidirectional communication, and can connect completely unrelated processes.',
        table: {
          headers: ['Characteristic', 'Ordinary Pipe (`pipe()`)', 'Named Pipe / FIFO (`mkfifo()`)'],
          rows: [
            ['Filesystem Presence', 'No filesystem entry (exists only in kernel memory)', 'Has a directory entry in the filesystem hierarchy'],
            ['Process Relationship', 'Requires parent-child ancestry established via `fork()`', 'Can connect arbitrary, unrelated processes across different UIDs'],
            ['Directionality', 'Strictly unidirectional (half-duplex); 2 pipes needed for 2-way', 'Unidirectional or bidirectional (half-duplex or full-duplex)'],
            ['Lifecycle / Persistence', 'Destroyed immediately when all referencing processes terminate', 'Persists on disk like a file until explicitly deleted with `unlink()`'],
            ['Descriptor Convention', 'fd[0] = Read end (like stdin 0), fd[1] = Write end (like stdout 1)', 'Opened like a normal file via standard `open(fifo_path, O_RDONLY/WRONLY)`'],
          ],
        },
      },
      {
        heading: 'Sockets & Remote Procedure Calls (RPC)',
        body: 'Sockets provide endpoint abstraction `<IP_Address : Port>` for communication across networks. Connection-oriented sockets use TCP (`SOCK_STREAM`), guaranteeing in-order, reliable byte streams with flow and congestion control. Connectionless sockets use UDP (`SOCK_DGRAM`), providing packet-based, low-latency, unreliable delivery without connection setup.\n\nRemote Procedure Calls (RPC) elevate network messaging to procedural semantics. A client invokes what looks like a local subroutine; the **Client Stub** intercepts the call, marshals procedure parameters into a standardized network format (such as External Data Representation - XDR or Protocol Buffers) to resolve Big-Endian vs Little-Endian hardware mismatches, and transmits the payload over a socket. The **Server Stub** unmarshals the parameters, executes the actual function on the server, and returns the marshalled result back to the client stub.',
      },
    ],
    workedExample: {
      title: 'Blocking vs Non-Blocking Rendezvous Analysis',
      problem:
        'Explain the exact behavior when Process A executes `send(B, msg)` and Process B executes `receive(A, msg)` on a zero-capacity communication link. What is this synchronization condition called, and what happens if Process A calls `send()` 5 seconds before Process B calls `receive()`?',
      solution:
        'A zero-capacity link has no buffer queue ($N = 0$). Therefore, the sender cannot deposit the message and move on. Process A executing `send(B, msg)` is forced to block (sleep) in kernel space. When Process B finally executes `receive(A, msg)` 5 seconds later, the kernel performs an immediate direct point-to-point copy of the message from Process A’s memory buffer to Process B’s memory buffer, and awakens Process A. This mutual, simultaneous synchronization point where both sender and receiver block until both have arrived is formally known as a **Rendezvous**.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Alpha Gap High-Probability Prompt (10M)',
        promptSummary: 'Compare Shared Memory vs Message Passing with diagrams (4M), contrast Ordinary Pipes vs Named Pipes (3M), and explain RPC stubs & parameter marshalling (3M).',
        markBreakdown: 'Architectural comparison + diagram (4M) + Pipes comparison & descriptor mechanics (3M) + RPC stubs & marshalling (3M)',
        solutionSteps: [
          'Draw the dual-panel diagram: Shared Memory showing virtual address spaces mapping to common physical RAM outside kernel steady-state, versus Message Passing showing user buffers copying into kernel-space message queues.',
          'Construct the 6-row comparison table highlighting kernel traps, data copy frequency, synchronization responsibility, and network distribution.',
          'Define `pipe(int fd[2])` showing `fd[0]` as read and `fd[1]` as write, noting that ordinary pipes require parent-child ancestry and die with the process, whereas Named Pipes (`mkfifo`) exist in the filesystem and connect unrelated processes.',
          'Explain RPC client/server stubs: client stub marshals arguments into canonical XDR format to eliminate endianness mismatches, transmits via socket, server stub unmarshals and invokes target function, and returns marshalled response.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m3-ipc-1',
        question: 'In a UNIX ordinary pipe created via `pipe(int fd[2])`, which file descriptor is used to READ and which is used to WRITE?',
        options: ['fd[0] = write, fd[1] = read', 'fd[0] = read, fd[1] = write', 'Both fd[0] and fd[1] are bidirectional', 'fd[0] = control, fd[1] = data'],
        correctIndex: 1,
        explanation: 'Mnemonic matches standard POSIX stream numbers: stdin is descriptor 0 (read end = fd[0]), stdout is descriptor 1 (write end = fd[1]).',
      },
      {
        id: 'sc-m3-ipc-2',
        question: 'Which of the following scenarios strictly forces a sender process to block in a message-passing system?',
        options: [
          'Sending a message to a mailbox with an unbounded buffer',
          'Executing an asynchronous non-blocking send to an empty queue',
          'Executing a blocking send on a zero-capacity link before the receiver executes receive()',
          'Reading from a shared memory segment that has already been mapped via mmap()',
        ],
        correctIndex: 2,
        explanation: 'A zero-capacity link has no intermediate queue; a blocking send cannot complete until a corresponding receive is executed, enforcing a Rendezvous.',
      },
      {
        id: 'sc-m3-ipc-3',
        question: 'Why does Remote Procedure Call (RPC) require parameter marshalling (e.g., via XDR or Protobuf)?',
        options: [
          'To encrypt the payload for TLS transmission',
          'To convert architecture-specific binary representations (e.g., Big-Endian vs Little-Endian integer encoding) into an architecture-neutral format',
          'To convert user-mode threads into kernel-mode threads',
          'To eliminate the need for network sockets entirely',
        ],
        correctIndex: 1,
        explanation: 'Different computer architectures store numbers differently (Little-Endian on x86 vs Big-Endian on ARM network chips). Marshalling serializes parameters into a canonical format so the remote stub can unmarshal them correctly.',
      },
    ],
    examTip: 'In any IPC question, always emphasize the **kernel boundary crossing**: Shared Memory traps into the kernel ONLY during `mmap` initialization, whereas Message Passing traps into the kernel on EVERY `send()` and `receive()`.',
  },
  {
    topicId: 'm3-critical-section-peterson',
    moduleId: 'm3',
    title: 'Race Conditions, Critical Section Criteria, Peterson’s Proof & Bakery Algorithm',
    summary:
      'Concurrent access to shared resources without synchronization leads to race conditions where the final state depends on unpredictable instruction interleaving. Every valid solution to the Critical Section problem must strictly satisfy three criteria: Mutual Exclusion, Progress, and Bounded Waiting. Peterson’s Solution achieves this for two processes in software, while Lamport’s Bakery Algorithm generalizes it to N processes.',
    sourceDecks: ['Silberschatz 10e Ch 6 (§6.1–6.3)', 'VITC Past Papers: C1 1-2 Q3 & C2 Q5'],
    keyPoints: [
      '**Race Condition**: A flaw occurring when multiple execution threads manipulate shared state concurrently, where the final outcome depends on the exact non-deterministic interleaving of low-level machine instructions (`load`, `modify`, `store`).',
      '**3 Critical Section Requirements**: (1) **Mutual Exclusion**: If process $P_i$ executes in its critical section, no other process can execute in its critical section; (2) **Progress**: If no process is in its critical section and some wish to enter, only processes NOT in their remainder section participate in deciding who enters next, and selection cannot be postponed indefinitely; (3) **Bounded Waiting**: There exists a strict upper bound on the number of times other processes may enter their critical sections after a process has requested entry before that request is granted (eliminates starvation).',
      '**Peterson’s Solution** (2 processes $P_0, P_1$): Employs shared state `boolean flag[2]` (indicating intent to enter) and `int turn` (acting as a polite tie-breaker yielding priority to the competitor). Provably satisfies Mutual Exclusion, Progress, and Bounded Waiting under sequential memory consistency.',
      '**Contradiction Proof of Mutual Exclusion**: If both $P_0$ and $P_1$ enter CS simultaneously, then `flag[0] == true` and `flag[1] == true`. But entering requires passing `while (flag[j] && turn == j)`. Thus $P_0$ saw `turn == 0` and $P_1$ saw `turn == 1`. Because `turn` is a single scalar variable in shared RAM, it cannot simultaneously equal 0 and 1 — contradiction! Whichever wrote `turn` last overwrote the value to yield to the other.',
      '**Lamport’s Bakery Algorithm**: Extends software mutual exclusion to $n$ processes using customer ticket ordering `(number[i], i) < (number[j], j)` with lexicographical tie-breaking, ensuring strict FIFO fairness.',
      '**Memory Barriers & Modern CPUs**: On modern out-of-order processors with store buffers, independent writes (`flag[i] = true` and `turn = j`) can be reordered at runtime, breaking Peterson’s solution unless explicit hardware memory fences (`smp_mb()` or `mfence`) are inserted.',
    ],
    sections: [
      {
        heading: 'The Critical Section Framework & The 3 Strict Criteria',
        body: 'A critical section is a sequence of code in which a thread accesses shared resources (memory variables, files, tables, or peripheral devices). To prevent race conditions, entry must be mediated by an entry section and closed by an exit section.\n\nEvery algorithm attempting to solve the Critical Section problem must satisfy three mandatory criteria established by Edsger Dijkstra and formalized in Silberschatz Chapter 6:\n\n1. **Mutual Exclusion**: If process $P_i$ is executing in its critical section, then no other processes can be executing in their critical sections.\n2. **Progress**: If no process is executing in its critical section and there exist some processes that wish to enter their critical section, then only those processes that are not executing in their remainder sections can participate in deciding which will enter its critical section next, and this selection cannot be postponed indefinitely (no deadlock).\n3. **Bounded Waiting**: There exists a bound, or limit, on the number of times that other processes are allowed to enter their critical sections after a process has made a request to enter its critical section and before that request is granted (no indefinite postponement or starvation).',
        diagramId: 'm3-critical-section',
      },
      {
        heading: "Peterson's Algorithm & Mathematical Contradiction Proof (C1 1-2 Q3 & C2 Q5)",
        body: 'Peterson’s algorithm is the classic two-process software synchronization protocol. It maintains two shared variables: `boolean flag[2] = {false, false};` where `flag[i] = true` denotes that process $P_i$ is ready to enter its critical section, and `int turn;` where `turn = j` politely yields priority to the other process $P_j$.',
        diagramId: 'm3-peterson-flow',
        codeBlock: `// Shared Variables
boolean flag[2] = {false, false}; // flag[i] = true means Pi wants to enter CS
int turn;                          // turn == i means Pi has priority to enter CS

// === Process Pi (competitor is Pj, where j = 1 - i) ===
do {
    flag[i] = true;                 // 1. Declare intent: "I want to enter CS"
    turn = j;                       // 2. Polite yield: "After you, Pj"
    
    // 3. Entry Section: Busy wait while Pj wants to enter AND it is Pj's turn
    while (flag[j] && turn == j)
        ; // spin-wait (no-op)
    
    /* ========================================================
     * CRITICAL SECTION: Shared memory access (e.g. seats -= 2)
     * ======================================================== */
    
    flag[i] = false;                // 4. Exit Section: "I have finished CS"
    
    /* ========================================================
     * REMAINDER SECTION: Independent local computation
     * ======================================================== */
} while (true);`,
      },
      {
        heading: 'Formal Proof of Correctness (Mutual Exclusion, Progress & Bounded Waiting)',
        body: 'To score full marks on university exams (such as VITC C1 Set 1-2 Q3 and C2 Q5), you must prove all three criteria formally:\n\n**1. Proof of Mutual Exclusion (by Contradiction)**:\nAssume for contradiction that both $P_0$ and $P_1$ execute inside their critical sections simultaneously at time $T$.\n- For $P_0$ to enter CS, its while-loop condition `flag[1] && turn == 1` must have evaluated to `false`. Since $P_1$ is inside CS, $P_1$ must have already set `flag[1] = true`. Therefore, for $P_0$’s while condition to be `false`, it must be that `turn == 0`.\n- By symmetry, for $P_1$ to enter CS, its while-loop condition `flag[0] && turn == 0` must have evaluated to `false`. Since $P_0$ is inside CS, `flag[0] == true`. Therefore, it must be that `turn == 1`.\n- Thus, at time $T$, `turn` must simultaneously equal `0` AND `1`.\n- However, `turn` is a single scalar variable in shared RAM whose state is governed by sequential memory consistency. It can hold only one value at any instant. **Contradiction!** Therefore, both processes cannot occupy the critical section simultaneously.\n\n**2. Proof of Progress**:\nSuppose neither process is in its CS and $P_0$ wants to enter. If $P_1$ is in its remainder section, `flag[1] == false`. $P_0$ checks `while (flag[1] && turn == 1)`. Since `flag[1]` is `false`, the condition is immediately `false` and $P_0$ enters without delay. If both $P_0$ and $P_1$ attempt to enter simultaneously, both set their flags to `true`, and both write to `turn`. Whichever write to `turn` happens second overwrites the previous write. If `turn` ends up being `0`, $P_0$’s while condition is `false` (since `turn != 1`), so $P_0$ enters. Thus, one process is guaranteed to enter without indefinite postponement.\n\n**3. Proof of Bounded Waiting**:\nOnce $P_0$ sets `flag[0] = true` and `turn = 1`, it waits at most while $P_1$ executes its CS. When $P_1$ exits, it sets `flag[1] = false`, which immediately breaks $P_0$’s while loop. Even if $P_1$ immediately attempts to re-enter, it must execute `turn = 0`, handing priority directly back to $P_0$. Therefore, $P_0$ waits for at most **one single turn** ($N - 1 = 1$). Bounded waiting holds strictly.',
        table: {
          headers: ['Step Trace (C2 Q5: 10 Seats, P0 & P1 Book 2 Each)', 'flag[0]', 'flag[1]', 'turn', 'System Outcome'],
          rows: [
            ['Initial State', 'false', 'false', '0', 'Shared seats = 10; both in remainder'],
            ['P0 declares intent & yields: `flag[0]=T; turn=1;`', 'true', 'false', '1', 'P0 prepares to test entry loop'],
            ['P1 declares intent & yields: `flag[1]=T; turn=0;`', 'true', 'true', '0', 'P1 overwrites turn=0! P0’s yield is superseded'],
            ['Both evaluate `while` condition concurrently', 'true', 'true', '0', 'P0 tests `(T && 0==1)` = FALSE -> **P0 ENTERS CS!** P1 tests `(T && 0==0)` = TRUE -> P1 spins'],
            ['P0 executes CS (`seats = seats - 2`)', 'true', 'true', '0', 'seats decrements from 10 to 8; P1 continues spinning'],
            ['P0 exits CS (`flag[0] = false`)', 'false', 'true', '0', 'P1’s test `(F && 0==0)` becomes FALSE -> **P1 ENTERS CS!**'],
            ['P1 executes CS (`seats = seats - 2`) & exits', 'false', 'false', '0', 'seats decrements from 8 to 6; **Final seats = 6** (Zero lost updates!)'],
          ],
        },
      },
      {
        heading: 'Lamport’s Bakery Algorithm for N Processes',
        body: 'Leslie Lamport generalized software mutual exclusion to $n$ processes with the Bakery Algorithm, inspired by the ticketing systems in retail bakeries. When a customer enters, they take a ticket number that is strictly greater than all outstanding ticket numbers. The process with the lowest ticket number is served first. If two processes receive the same ticket number simultaneously, the tie is broken lexicographically by their process ID: $(a, b) < (c, d)$ if $a < c$, or if $a == c$ and $b < d$.',
        codeBlock: `// Shared data structures for N processes
boolean choosing[n] = {false};
int number[n] = {0};

// Process Pi entry and exit protocol:
do {
    // 1. Take a ticket number
    choosing[i] = true;
    number[i] = 1 + max(number[0], number[1], ..., number[n-1]);
    choosing[i] = false;

    // 2. Wait until all processes with smaller tickets have finished
    for (int j = 0; j < n; j++) {
        while (choosing[j]) ; // Wait if process Pj is currently choosing a ticket
        while ((number[j] != 0) &&
               ((number[j] < number[i]) || (number[j] == number[i] && j < i)))
            ; // Spin-wait while Pj holds a higher-priority ticket
    }

    /* CRITICAL SECTION */

    // 3. Exit section: relinquish ticket
    number[i] = 0;

    /* REMAINDER SECTION */
} while (true);`,
      },
      {
        heading: 'Modern Hardware Reordering & Memory Barriers',
        body: 'On modern multi-core processors (such as Intel x86 or ARM64), memory operations are not executed in strict sequential order. CPUs employ store buffers and out-of-order execution pipelines. In Peterson’s entry section:\n```c\nflag[i] = true;  // Store to flag[i]\nturn = j;        // Store to turn\n```\nBecause `flag[i]` and `turn` are independent memory locations, the CPU or optimizing compiler may reorder the store to `turn` before `flag[i]`, or delay the visibility of `flag[i] = true` in the store buffer while speculatively reading `flag[j]`. If both processors reorder these instructions, both $P_0$ and $P_1$ read `flag[j] == false` simultaneously and enter the Critical Section together — catastrophic mutual exclusion failure!\n\nTo prevent this, systems insert a **Memory Barrier (Memory Fence)**:\n```c\nflag[i] = true;\n__atomic_thread_fence(__ATOMIC_SEQ_CST); // or asm volatile("mfence" ::: "memory");\nturn = j;\n__atomic_thread_fence(__ATOMIC_SEQ_CST);\nwhile (flag[j] && turn == j) ;\n```\nA memory barrier forces all pending stores in local CPU store buffers to be drained and committed to cache before any subsequent instructions can execute, restoring sequential consistency across cores.',
      },
    ],
    workedExample: {
      title: 'Peterson’s Tie-Breaking Trace with Inverted Turn',
      problem:
        'In Peterson’s algorithm, suppose Process P0 and Process P1 both wish to enter the CS. P0 executes `flag[0] = true; turn = 1;`. Then P1 executes `flag[1] = true; turn = 0;`. Trace the exact while-loop condition for both processes and state which process enters the critical section first, and why.',
      solution:
        '1. P0 evaluates: `while (flag[1] && turn == 1)`. Since P1 set `flag[1] = true`, the first term is TRUE. However, P1’s subsequent write set `turn = 0`. Thus, `turn == 1` is FALSE. Since `TRUE && FALSE` is FALSE, P0 exits its while-loop immediately and **ENTERS THE CRITICAL SECTION FIRST**.\n2. Simultaneously, P1 evaluates: `while (flag[0] && turn == 0)`. Here, `flag[0] == true` (TRUE) and `turn == 0` (TRUE). Since `TRUE && TRUE` is TRUE, P1 is trapped in its spin-wait loop.\n3. P1 continues spinning until P0 finishes its critical section and executes its exit section: `flag[0] = false`. At that exact moment, P1’s condition `flag[0] && turn == 0` evaluates to `FALSE && TRUE` = FALSE, allowing P1 to enter the critical section next.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Slot C1 Set 1-2 Q3 (10M) & Slot C2 Q5 (10M)',
        promptSummary: 'Explain the roles of `flag` and `turn` (3M), write the formal contradiction proof of Mutual Exclusion (4M), and trace the execution of two processes updating shared seats from 10 to 6 (3M).',
        markBreakdown: 'Variables definition & pseudocode (3M) + Contradiction proof (4M) + Step-by-step state trace table (3M)',
        solutionSteps: [
          'State that `flag[i]` is a boolean indicating intent to enter CS, while `turn` is an integer serving as an altruistic tie-breaker giving the competitor priority.',
          'Write the complete 4-line entry/exit protocol for process Pi with competitor Pj (j = 1 - i).',
          'Execute the formal proof by contradiction: assume both P0 and P1 in CS simultaneously -> flag[0]=flag[1]=true -> turn must be 0 for P0 and 1 for P1 -> turn cannot equal 0 and 1 simultaneously -> Contradiction!',
          'Build the 7-row trace table for C2 Q5 (seats = 10, both booking 2): show P0 declaring intent, P1 overwriting turn to 0, P0 entering first (10 -> 8), exiting (flag[0]=false), P1 entering (8 -> 6), and terminating with final seats = 6.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m3-pet-1',
        question: 'In Peterson’s algorithm for two processes P0 and P1, if `flag[0] = true`, `flag[1] = true`, and `turn = 0`, which process enters the critical section?',
        options: ['P0 enters first', 'P1 enters first', 'Both processes deadlock indefinitely', 'Both processes enter simultaneously'],
        correctIndex: 0,
        explanation: 'P0 evaluates `while (flag[1] && turn == 1)`. Since `turn == 0`, `turn == 1` is false, so P0 exits the loop and enters the critical section. P1 spins because `flag[0] && turn == 0` is true.',
      },
      {
        id: 'sc-m3-pet-2',
        question: 'Which of the three Critical Section criteria prevents a process that is running in its REMAINDER section from blocking other processes from entering the Critical Section?',
        options: ['Mutual Exclusion', 'Progress', 'Bounded Waiting', 'Aging'],
        correctIndex: 1,
        explanation: 'The Progress requirement explicitly specifies that only processes not executing in their remainder sections can participate in deciding which process enters next.',
      },
      {
        id: 'sc-m3-pet-3',
        question: 'Why does Peterson’s algorithm fail on modern multi-core x86 and ARM processors without explicit memory barrier instructions?',
        options: [
          'Because modern CPUs do not have enough registers to store flag and turn',
          'Because CPU store buffers and out-of-order execution engines may reorder memory writes so flag stores become visible after turn writes',
          'Because modern operating systems disable interrupts automatically',
          'Because Peterson’s algorithm requires at least 3 processes to work',
        ],
        correctIndex: 1,
        explanation: 'Modern CPUs execute memory writes out-of-order for performance. Without a memory barrier, independent stores to `flag` and `turn` can be reordered, allowing both cores to read false for the other’s flag and violate mutual exclusion.',
      },
    ],
    examTip: 'Examiner trap check: Remember that `turn` points to who has PRIORITY to enter. If `turn == 0`, **P0** enters first because P0 spins only while `turn == 1`!',
  },
  {
    topicId: 'm3-hardware-sync',
    moduleId: 'm3',
    title: 'Hardware Sync: Memory Barriers, Test-and-Set & Bounded-Waiting Compare-and-Swap',
    summary:
      'Because pure software solutions (like Peterson’s and Bakery) suffer from instruction reordering and high software complexity on multi-core architectures, modern CPUs provide low-level atomic instructions executed indivisibly at the hardware bus level. While naive spinlocks using Test-and-Set or Compare-and-Swap guarantee Mutual Exclusion and Progress, they VIOLATE Bounded Waiting. Silberschatz’s Bounded-Waiting CAS algorithm restores Bounded Waiting using a waiting array and cyclic handoff.',
    sourceDecks: ['Silberschatz 10e Ch 6 (§6.4)', 'OVERDUE GAP — 0 Qs across C1 & C2'],
    keyPoints: [
      '**Hardware Atomicity**: An instruction is atomic if it executes as a single, indivisible hardware unit without interruption. The memory controller locks the bus or cache line across all CPU cores during the read-modify-write cycle.',
      '**`test_and_set(boolean *target)`**: Atomically returns the original value of `*target` and overwrites `*target = true`. Used to construct simple spinlocks, but naive spinlocks violate Bounded Waiting because lock acquisition upon release is an unconstrained race.',
      '**`compare_and_swap(int *val, int expected, int new_val)`**: Atomically returns the original value of `*val`, and updates `*val = new_val` IF AND ONLY IF `*val == expected`. Serves as the foundation for modern lock-free data structures.',
      '**Bounded-Waiting CAS Algorithm**: Eliminates starvation by combining CAS with a shared `boolean waiting[n]` array. Upon exiting the CS, process $P_i$ cyclically scans `(i + 1) % n` for the first waiting process and directly hands off entry by setting `waiting[j] = false` without clearing the global lock, strictly guaranteeing entry within at most **$n - 1$ turns**.',
      '**Memory Barriers / Fences**: Strongly ordered memory architectures (where memory modifications are immediately visible to all processors) vs weakly ordered memory architectures (where modifications may be deferred in local store buffers). Fences (`smp_mb()`) force store buffers to drain before subsequent instructions execute.',
      '**Lock-Free Synchronization & ABA Problem**: In CAS-based lock-free stacks or queues, a pointer reading A may transition to B and back to A, causing naive CAS to succeed despite intermediate modifications; resolved using tagged pointers / double-word CAS (`cmpxchg16b`).',
    ],
    sections: [
      {
        heading: 'Hardware Atomic Primitives: Test-and-Set vs Compare-and-Swap',
        body: 'On multiprocessor systems, disabling interrupts globally is unfeasible because the disable signal must propagate to all cores, degrading throughput and causing system clock drift. Instead, hardware designers implement atomic read-modify-write instructions that lock the memory bus or cache line for a single machine cycle.',
        codeBlock: `// === 1. ATOMIC TEST-AND-SET PRIMITIVE (Indivisible Hardware Semantic) ===
boolean test_and_set(boolean *target) {
    boolean rv = *target;   // Read old value
    *target = true;         // Set target to true
    return rv;              // Return old value
}

// Naive Spinlock using test_and_set (Satisfies ME & Progress; FAILS Bounded Waiting!)
do {
    while (test_and_set(&lock))
        ; // Busy-wait (burns CPU cycles spinning)
    /* CRITICAL SECTION */
    lock = false;
    /* REMAINDER SECTION */
} while (true);

// === 2. ATOMIC COMPARE-AND-SWAP PRIMITIVE (Indivisible Hardware Semantic) ===
int compare_and_swap(int *value, int expected, int new_value) {
    int temp = *value;
    if (*value == expected)
        *value = new_value;
    return temp;            // Always returns original value before potential swap
}

// Naive Spinlock using compare_and_swap (FAILS Bounded Waiting!)
do {
    while (compare_and_swap(&lock, 0, 1) != 0)
        ; // Spin while lock is held (lock == 1)
    /* CRITICAL SECTION */
    lock = 0;
    /* REMAINDER SECTION */
} while (true);`,
      },
      {
        heading: 'Why Naive Spinlocks Violate Bounded Waiting',
        body: 'In both naive implementations above, when a process releases the lock (`lock = false` or `lock = 0`), the next process to acquire the lock is determined entirely by which CPU core executes the atomic instruction first on the memory bus. If three processes $P_0, P_1, P_2$ compete, $P_0$ could repeatedly release and re-acquire the lock before $P_2$ ever wins a memory arbitration cycle. Because there is no queue or fairness mechanism, a waiting process could be indefinitely postponed (starvation), strictly violating the Bounded Waiting criterion.',
      },
      {
        heading: 'Silberschatz Bounded-Waiting CAS Algorithm (The Gold-Standard Solution)',
        body: 'To satisfy Bounded Waiting using hardware primitives, Silberschatz presents the bounded-waiting CAS algorithm. It introduces a shared array `boolean waiting[n] = {false}` and an integer `lock = 0`. Each process announces its desire to enter the CS by setting `waiting[i] = true`.',
        diagramId: 'm3-critical-section',
        codeBlock: `// Shared Variables
boolean waiting[n] = {false};
int lock = 0;

// === Process Pi Protocol ===
do {
    // --- ENTRY SECTION ---
    waiting[i] = true;
    int key = 1;
    while (waiting[i] && key == 1) {
        key = compare_and_swap(&lock, 0, 1);
    }
    waiting[i] = false; // Pi has acquired entry permission!

    /* ========================================================
     * CRITICAL SECTION
     * ======================================================== */

    // --- EXIT SECTION (Cyclic Handoff) ---
    int j = (i + 1) % n;
    while ((j != i) && !waiting[j]) {
        j = (j + 1) % n;    // Cyclically search for next waiting process
    }

    if (j == i) {
        lock = 0;           // No other process is waiting -> release global lock
    } else {
        waiting[j] = false; // Directly pass CS permission to Pj without releasing lock!
    }

    /* ========================================================
     * REMAINDER SECTION
     * ======================================================== */
} while (true);`,
      },
      {
        heading: 'Formal Proof of Bounded Waiting (<= n - 1 Waiting Bound)',
        body: 'The Bounded-Waiting CAS algorithm provably satisfies all three Critical Section requirements:\n\n1. **Mutual Exclusion**: Process $P_i$ can enter the critical section only if either `waiting[i] == false` or `key == 0`. When `lock == 0`, only the first process executing CAS receives `key = 0` (setting `lock = 1`). All other processes receive `key = 1` and remain blocked in their while loops. While $P_i$ is in CS, `lock == 1`. Thus, no other process can enter unless $P_i$ explicitly sets `waiting[j] = false`. At most one process can have its waiting flag cleared at any instant. Mutual exclusion is guaranteed.\n\n2. **Progress**: If `lock == 0`, any process executing CAS immediately receives `key = 0` and enters the CS. If a process exits the CS, it either resets `lock = 0` (allowing free contention among arriving processes) or clears `waiting[j] = false` (directly granting entry to $P_j$). Thus, progress is guaranteed.\n\n3. **Bounded Waiting**: When process $P_i$ leaves the critical section, it scans the `waiting` array in cyclic order: $(i + 1) \% n, (i + 2) \% n, \dots$. It selects the very first waiting process $P_j$ it encounters and sets `waiting[j] = false`, allowing $P_j$ to enter without competing for `lock`. Because the scan is cyclic and examines every process index in sequence, any waiting process is guaranteed to enter the critical section after at most **$n - 1$ turns**. Starvation is mathematically impossible.',
      },
    ],
    workedExample: {
      title: 'CAS Loop Implementation of Atomic Counter',
      problem:
        'Implement an atomic increment function `void atomic_inc(int *v)` using a `compare_and_swap` loop without using a mutex. Explain how it guarantees progress even when multiple threads update `*v` simultaneously.',
      solution:
        '```c\nvoid atomic_inc(int *v) {\n    int current;\n    do {\n        current = *v;\n    } while (compare_and_swap(v, current, current + 1) != current);\n}\n```\n**Mechanism & Progress Guarantee**: Each thread reads the current value into a local variable `current` and attempts to swap `current + 1` into `*v` provided `*v` still equals `current`. If another thread updated `*v` in the interim, the CAS fails (returns the new value, which does not equal `current`), causing the loop to re-read and retry. At least one thread succeeds on every CAS attempt, guaranteeing system-wide lock-free progress.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Alpha Gap High-Probability Prompt (10M)',
        promptSummary: 'Define atomic Test-and-Set and Compare-and-Swap primitives (4M), explain why basic spinlocks violate Bounded Waiting (2M), and present the Bounded-Waiting CAS algorithm with correctness proof (4M).',
        markBreakdown: 'Atomic instruction semantics (4M) + Starvation proof of basic spinlocks (2M) + waiting[n] cyclic scan algorithm & n-1 bound proof (4M)',
        solutionSteps: [
          'Write the C pseudocode definitions for `test_and_set` and `compare_and_swap`, stating that both execute indivisibly on the memory bus.',
          'Demonstrate that basic spinlocks (`while(CAS(&lock, 0, 1) != 0);`) fail Bounded Waiting because lock release triggers an unconstrained race where one unlucky process can be starved indefinitely.',
          'Write the complete Bounded-Waiting CAS code with `waiting[n]` array, `key`, and cyclic exit scan `j = (i + 1) % n`.',
          'Prove that if j != i, Pi sets `waiting[j] = false` leaving `lock = 1`, guaranteeing that Pj enters next without competing and bounding the waiting time to at most n - 1 turns.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m3-hw-1',
        question: 'In the Silberschatz Bounded-Waiting CAS algorithm, what does process Pi execute in its exit section if it finds that process Pj is waiting?',
        options: [
          'lock = 0',
          'waiting[j] = false (leaving lock = 1 so only Pj enters next)',
          'waiting[i] = true',
          'compare_and_swap(&lock, 1, 0)',
        ],
        correctIndex: 1,
        explanation: 'Setting `waiting[j] = false` directly transfers critical section ownership to Pj while keeping `lock = 1`, preventing any third process from grabbing the lock.',
      },
      {
        id: 'sc-m3-hw-2',
        question: 'What is the return value of `compare_and_swap(&val, 0, 1)` if the variable `val` currently holds the value 5?',
        options: ['1', '0', '5 (and val remains 5)', 'true'],
        correctIndex: 2,
        explanation: 'CAS always returns the ORIGINAL value of the target variable. Since 5 != 0 (expected), the swap does not occur, `val` remains 5, and CAS returns 5.',
      },
      {
        id: 'sc-m3-hw-3',
        question: 'What is the maximum number of times other processes can enter their critical sections before a waiting process Pi enters in the Bounded-Waiting CAS algorithm?',
        options: ['1 time', 'n - 1 times', 'n times', 'Unlimited (it can starve)'],
        correctIndex: 1,
        explanation: 'Because the exit section cyclically scans `(i + 1) % n, (i + 2) % n, ...`, every waiting process is served within at most n - 1 turns.',
      },
    ],
    examTip: 'Examiner alert: When writing the exit section of Bounded-Waiting CAS, DO NOT write `lock = 0` inside the `else` branch! You must write `if (j == i) lock = 0; else waiting[j] = false;`. Clearing `lock` when a process is waiting breaks the direct handoff!',
  },
  {
    topicId: 'm3-mutex-semaphores',
    moduleId: 'm3',
    title: 'Mutex Locks & Semaphores: Binary/Counting, Wait Queues, Priority Inversion & Priority Inheritance',
    summary:
      'To overcome the CPU-burning drawback of hardware spinlocks, operating systems provide higher-level synchronization abstractions. Mutex locks provide strict owner-bound mutual exclusion. Semaphores (invented by Dijkstra) use atomic wait() and signal() operations paired with kernel PCB wait queues to eliminate busy waiting. Understanding the exact mathematical invariants of blocking semaphores and the Mars Pathfinder priority inversion dilemma is vital for university exams.',
    sourceDecks: ['Silberschatz 10e Ch 6 (§6.5–6.6)', 'VITC BACSE106 Module 3'],
    keyPoints: [
      '**Mutex Lock**: A boolean flag (`available`) accessed via atomic `acquire()` and `release()` operations. Enforces strict **ownership**: only the specific thread that acquired the mutex is permitted to release it.',
      '**Spinlock vs Sleeping Mutex**: A spinlock busy-waits in a CPU loop; ideal when locks are held for short durations (< 2 context-switch overheads) on multiprocessors. A sleeping mutex suspends the thread via `block()`, yielding the CPU to other ready processes.',
      '**Counting vs Binary Semaphores**: A **Counting Semaphore** ranges over an unrestricted integer domain (pool of $N$ identical resources); a **Binary Semaphore** ranges between 0 and 1, functioning as a lock without ownership constraints (any thread can signal it).',
      '**Blocking Semaphore Invariant**: In the Silberschatz wait-queue implementation, `wait()` decrements `S->value` and blocks if `S->value < 0`. If `S->value < 0`, the magnitude **$|S->value|$ equals the exact count of processes currently blocked in `S->list`**!',
      '**Priority Inversion**: A high-priority process $H$ is indirectly blocked by a low-priority process $L$ holding a shared lock, because an intermediate medium-priority process $M$ (not needing the lock) preempts $L$.',
      '**Priority Inheritance Protocol**: Solves priority inversion by temporarily elevating $L$’s priority to match $H$’s priority until $L$ releases the shared lock, preventing medium-priority tasks like $M$ from preempting $L$.',
    ],
    sections: [
      {
        heading: 'Mutex Locks: Spinlocks vs Sleeping Locks & Ownership Rules',
        body: 'A Mutex (Mutual Exclusion) lock is the simplest synchronization tool provided by operating systems. A thread must acquire the lock before entering a critical section and release it upon exit.\n\nUnlike semaphores, a mutex possesses strict **ownership semantics**: only the thread that executed `acquire()` is legally allowed to call `release()`. If a thread attempts to unlock a mutex it does not own, the OS throws an error or aborts the thread.\n\nWhen contention occurs, locks can either spin or sleep:\n- **Spinlocks**: The blocked thread continuously loops testing the lock variable. While this wastes CPU cycles, it incurs zero context-switch overhead. On modern multi-core servers, spinlocks are preferred if the critical section executes in fewer microseconds than the time required to perform two full context switches.\n- **Sleeping Mutexes**: The blocked thread yields the CPU immediately, transitioning to the `WAITING` state. This saves CPU energy but incurs context-switch latency (typically 1–5 microseconds).',
      },
      {
        heading: 'Counting Semaphores vs Binary Semaphores',
        body: 'Invented by Edsger Dijkstra in 1965, a Semaphore is an integer variable accessed exclusively through two standard atomic operations: `wait()` (originally named $P$ from Dutch *proberen*, to test) and `signal()` (originally named $V$ from Dutch *verhogen*, to increment).\n\n- **Counting Semaphore**: Its value can range over an unrestricted integer domain. It is initialized to $N$ to control access to a resource pool containing $N$ identical resource units. Each `wait()` allocates a resource unit; each `signal()` releases a resource unit. If a process calls `wait()` when the value is 0, it blocks until a resource is freed.\n- **Binary Semaphore**: Its value is restricted to 0 and 1. It operates similarly to a mutex lock, but without ownership restrictions. In a binary semaphore, Process A can call `wait(S)` and Process B can call `signal(S)`, making binary semaphores the ideal tool for event signaling and inter-thread rendezvous.',
      },
      {
        heading: 'Blocking Semaphore Implementation with Kernel Wait Queues',
        body: 'To eliminate busy waiting, the OS associates each semaphore with a FIFO queue of Process Control Blocks (PCBs). When a thread must wait, the OS removes it from the CPU Ready queue, appends its PCB to the semaphore’s `list`, and invokes the scheduler via `block()`. When another thread signals the semaphore, the OS removes a PCB from `list` and places it back onto the Ready queue via `wakeup()`.',
        diagramId: 'm3-semaphore-queue',
        codeBlock: `// POSIX/Silberschatz Blocking Semaphore Data Structure
typedef struct {
    int value;              // Integer resource counter / waiting tally
    struct process *list;   // FIFO queue of blocked process PCBs
} semaphore;

// Atomic wait() - Decrement first, then check if negative
void wait(semaphore *S) {
    S->value--;
    if (S->value < 0) {
        add_process_to_queue(&(S->list), current_process);
        block();            // Suspend thread: transitions from RUNNING -> WAITING
    }
}

// Atomic signal() - Increment first, then check if someone is waiting
void signal(semaphore *S) {
    S->value++;
    if (S->value <= 0) {
        struct process *P = remove_process_from_queue(&(S->list));
        wakeup(P);          // Awaken thread: transitions from WAITING -> READY
    }
}`,
      },
      {
        heading: 'The Semaphore Negative Value Invariant Proof',
        body: 'Notice the crucial difference between the classic busy-waiting semaphore and the blocking semaphore:\n\n- In a busy-waiting semaphore, the value NEVER drops below 0 (`while (S <= 0); S--;`).\n- In a blocking semaphore, `S->value` CAN become negative!\n\n**The Invariant Law**:\n1. If `S->value >= 0`: The value represents the exact number of resource units currently available for allocation.\n2. If `S->value < 0`: Exactly zero resources are available, and the magnitude $|S->value|$ represents the **exact count of processes currently sleeping in `S->list`**.\n\n*Why does `signal()` check `<= 0`?*\nIf `S->value` was `-3` (3 processes blocked), calling `signal()` increments `value` to `-2`. Because `-2 <= 0`, there are still blocked processes waiting, so `wakeup(P)` MUST be invoked to unblock one of them!',
      },
      {
        heading: 'Priority Inversion & The Mars Pathfinder Case Study',
        body: 'Priority Inversion is a catastrophic scheduling anomaly where a low-priority process indirectly delays the execution of a high-priority process.\n\n**The Classical 3-Task Trap**:\n1. Low-priority task $L$ acquires a shared mutex $M$.\n2. High-priority task $H$ preempts $L$, requires mutex $M$, and calls `acquire(M)`. Because $M$ is held by $L$, $H$ blocks.\n3. Before $L$ can finish its critical section and release $M$, a medium-priority task $M$ arrives. Task $M$ does NOT need mutex $M$, but its priority is higher than $L$. The CPU scheduler preempts $L$ to run $M$.\n4. **Result**: Task $H$ is now blocked waiting for task $M$ to complete, even though $H$ has higher priority than $M$!\n\n**The 1997 Mars Pathfinder Incident**:\nOn Mars, the Pathfinder spacecraft suffered recurring total system resets. The high-priority Information Bus thread was blocked by a low-priority meteorological task holding a shared mutex, while intermediate communications tasks preempted the meteorological task. The system’s real-time watchdog timer noticed that the high-priority thread had not executed for too long and rebooted the entire spacecraft.\n\n**The Fix: Priority-Inheritance Protocol**:\nAny process $L$ that currently holds a resource needed by a higher-priority process $H$ temporarily inherits $H$’s higher priority. This prevents medium-priority processes from preempting $L$. As soon as $L$ releases the lock, its priority drops back to its original baseline.',
      },
    ],
    workedExample: {
      title: 'Semaphore Trace & Blocked Count Calculation',
      problem:
        'A system initializes a blocking semaphore to `S = 4`. A sequence of operations occurs: 9 `wait(S)` operations and 3 `signal(S)` operations. What is the final value of `S.value`, how many resource units are available, and how many processes are currently sleeping in `S.list`?',
      solution:
        '1. Initial value: `S = 4`.\n2. 9 `wait(S)` calls decrement the semaphore by 9: `4 - 9 = -5`.\n3. 3 `signal(S)` calls increment the semaphore by 3: `-5 + 3 = -2`.\n4. **Final S.value = -2**.\n5. Because `S.value < 0`, there are **0 available resources**.\n6. The number of blocked processes is $|S.value| = |-2| =$ **2 processes sleeping in the wait queue**.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'High-Yield M3 Theory Component (10M)',
        promptSummary: 'Compare Mutex Locks vs Counting Semaphores (3M), provide blocking wait/signal pseudocode with PCB queue (4M), and explain Priority Inversion with Priority Inheritance (3M).',
        markBreakdown: 'Comparison table & ownership (3M) + Semaphore struct & wait/signal logic (4M) + Priority Inversion scenario & inheritance solution (3M)',
        solutionSteps: [
          'Distinguish Mutex (ownership-bound binary lock) from Semaphore (unrestricted integer domain, Dijkstra P/V, event signaling without ownership).',
          'Write the blocking `semaphore` struct with `int value` and `struct process *list`.',
          'Write `wait()` showing `S->value--; if (S->value < 0) block();` and `signal()` showing `S->value++; if (S->value <= 0) wakeup();`.',
          'Illustrate Priority Inversion using tasks L, M, H: explain why task M delays task H indefinitely, cite the Mars Pathfinder bug, and describe how Priority Inheritance elevates L to H’s priority during lock contention.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m3-sem-1',
        question: 'In a blocking semaphore implementation, if `S.value == -5`, what does the negative number indicate?',
        options: [
          'An invalid arithmetic underflow error has occurred',
          'Exactly 5 processes are currently suspended in the semaphore’s waiting queue',
          '5 resources are available for immediate allocation',
          'The semaphore has been destroyed by the kernel',
        ],
        correctIndex: 1,
        explanation: 'In the Silberschatz blocking semaphore specification, when value is negative, its magnitude `|-k| = k` represents the exact count of processes blocked in `S.list`.',
      },
      {
        id: 'sc-m3-sem-2',
        question: 'Which inequality sign must be used inside the blocking `signal(semaphore *S)` function after incrementing `S->value++`?',
        options: ['if (S->value < 0)', 'if (S->value <= 0)', 'if (S->value > 0)', 'if (S->value == 0)'],
        correctIndex: 1,
        explanation: 'If `value` after increment is `<= 0`, it means `value` was negative before the increment, proving at least one process was blocked and must be awakened.',
      },
      {
        id: 'sc-m3-sem-3',
        question: 'How does the Priority-Inheritance Protocol resolve the Priority Inversion problem?',
        options: [
          'It permanently promotes low-priority processes to real-time priority',
          'It terminates intermediate medium-priority processes',
          'It temporarily boosts the priority of a lock-holding lower-priority process to that of the highest-priority process waiting for the lock',
          'It converts all mutex locks into counting semaphores',
        ],
        correctIndex: 2,
        explanation: 'Priority Inheritance temporarily elevates the lock-holder’s priority to match the highest waiting process, preventing medium-priority tasks from preempting the lock holder.',
      },
    ],
    examTip: 'Watch the signs in blocking semaphores: `wait()` checks **`< 0`**, whereas `signal()` checks **`<= 0`**! Swapping these signs is an immediate 2-mark deduction.',
  },
  {
    topicId: 'm3-classical-problems',
    moduleId: 'm3',
    title: 'Classical Sync Problems: Bounded Buffer, Readers-Writers, Dining Philosophers & Sleeping Barber',
    summary:
      'Master the four canonical synchronization problems that form the benchmark for concurrent algorithm design: Bounded Buffer (Producer-Consumer), Readers-Writers, Dining Philosophers (deadlock vs asymmetric solution), and Sleeping Barber. These problems expose critical race conditions, starvation hazards, semaphore ordering dependencies, and deadlock characterization.',
    sourceDecks: ['Silberschatz 10e Ch 7 (§7.1)', 'VITC Past Papers: C1 2-2 Q2 & C2 Q6'],
    keyPoints: [
      '**Bounded Buffer (`N` slots, C2 Q6)**: Uses 3 semaphores: `mutex = 1` (mutual exclusion), `empty = N` (unfilled slots), and `full = 0` (occupied slots). **CRITICAL ORDER**: Producer must call `wait(empty)` BEFORE `wait(mutex)`; Consumer must call `wait(full)` BEFORE `wait(mutex)`. Reversing this order produces immediate permanent deadlock when the buffer is empty or full!',
      '**First Readers-Writers Problem**: Allows concurrent readers without blocking each other, but grants exclusive access to writers. Implemented using `rw_mutex = 1`, `mutex = 1`, and `read_count = 0`. The first reader locks `rw_mutex`, and the last reader releases it. **Flaw**: Writers can starve if new readers continuously arrive.',
      '**Dining Philosophers Problem**: 5 philosophers sharing 5 chopsticks (`chopstick[5] = {1,1,1,1,1}`). If all 5 pick up their left chopstick simultaneously, all right chopsticks are occupied -> Circular Wait Deadlock! Solved via: (1) Asymmetric pickup (odd philosophers pick left first, even pick right first); (2) Table capacity limiter (at most 4 seated); or (3) Monitor / state array.',
      '**Sleeping Barber Problem (C1 Set 2-2 Q2)**: 1 barber, $N$ waiting chairs. Uses `customers = 0` (wakes barber), `barber = 0` (signals customer haircut ready), `mutex = 1` (protects `waiting` chair count), and `int waiting = 0`. Arriving customer checks `waiting < N`; if full, customer releases `mutex` and leaves cleanly.',
      '**Deadlock Characterization in Synchronization**: A deadlock occurs when every process in a set is waiting for an event that only another process in the set can cause. The 4 Coffman conditions (Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait) must hold simultaneously.',
      '**Resource Allocation Graphs & Banker’s Algorithm**: In synchronization systems, lock acquisition dependencies map directly to RAGs (where single-instance cycles indicate deadlock) and can be formally analyzed using Banker’s Algorithm safety proofs.',
    ],
    sections: [
      {
        heading: '1. Bounded Buffer Problem (C2 Q6 Food Ordering System, Capacity N = 5)',
        body: 'The Bounded-Buffer (Producer-Consumer) problem models an $N$-element circular buffer shared between producer threads depositing items and consumer threads removing them.',
        diagramId: 'm3-bounded-buffer',
        codeBlock: `// Shared Variables
#define BUFFER_SIZE 5
item_t buffer[BUFFER_SIZE];
int in = 0, out = 0;

semaphore mutex = 1; // Binary semaphore: protects buffer index manipulation
semaphore empty = 5; // Counting semaphore: tracks free buffer slots (initially N)
semaphore full  = 0; // Counting semaphore: tracks occupied buffer slots (initially 0)

// === PRODUCER PROCESS ===
void producer() {
    item_t next_produced;
    while (true) {
        // ... produce an item in next_produced ...

        wait(&empty);       // 1. Wait for an available empty slot (MUST BE FIRST!)
        wait(&mutex);       // 2. Acquire exclusive access to buffer

        buffer[in] = next_produced;
        in = (in + 1) % BUFFER_SIZE;

        signal(&mutex);     // 3. Release exclusive buffer access
        signal(&full);      // 4. Increment count of filled slots (wakes consumer)
    }
}

// === CONSUMER PROCESS ===
void consumer() {
    item_t next_consumed;
    while (true) {
        wait(&full);        // 1. Wait for an available filled slot (MUST BE FIRST!)
        wait(&mutex);       // 2. Acquire exclusive access to buffer

        next_consumed = buffer[out];
        out = (out + 1) % BUFFER_SIZE;

        signal(&mutex);     // 3. Release exclusive buffer access
        signal(&empty);     // 4. Increment count of free slots (wakes producer)

        // ... consume the item in next_consumed ...
    }
}`,
      },
      {
        heading: 'The Deadlock Trap in Bounded Buffer: Why Order Matters',
        body: 'Consider what occurs if an inexperienced developer swaps the order of `wait()` calls in the Producer:\n```c\nwait(&mutex); // WRONG ORDER!\nwait(&empty);\n```\nSuppose the buffer is full (`empty.value == 0`).\n1. The Producer executes `wait(&mutex)`, successfully acquiring the lock.\n2. The Producer then executes `wait(&empty)`. Because `empty == 0`, the producer is suspended in `empty.list`, **while still holding `mutex`**!\n3. The Consumer arrives, attempting to consume an item to create an empty slot. It executes `wait(&mutex)`. Because the Producer holds `mutex`, the Consumer blocks on `mutex.list`!\n4. **DEADLOCK**: The Producer is sleeping waiting for the Consumer to signal `empty`, while the Consumer is sleeping waiting for the Producer to release `mutex`! Neither can ever proceed.',
      },
      {
        heading: '2. The Readers-Writers Problem (First vs Second vs Starvation-Free)',
        body: 'In a shared database, multiple concurrent reader processes may read simultaneously without interference. However, if a writer and any other process (reader or writer) access the database concurrently, memory corruption occurs. Writers require exclusive access.',
        codeBlock: `// First Readers-Writers: Reader Preference (Writers May Starve)
semaphore rw_mutex = 1; // Binary semaphore: mutual exclusion for writers / first reader
semaphore mutex = 1;    // Binary semaphore: protects read_count integer
int read_count = 0;     // Number of readers currently reading database

// === WRITER PROCESS ===
void writer() {
    while (true) {
        wait(&rw_mutex);    // Request exclusive access to shared database
        
        /* WRITING IS PERFORMED */
        
        signal(&rw_mutex);  // Release exclusive access
    }
}

// === READER PROCESS ===
void reader() {
    while (true) {
        wait(&mutex);       // Protect read_count update
        read_count++;
        if (read_count == 1)
            wait(&rw_mutex);// First reader locks database from writers!
        signal(&mutex);

        /* READING IS PERFORMED (Concurrent readers allowed!) */

        wait(&mutex);       // Protect read_count update
        read_count--;
        if (read_count == 0)
            signal(&rw_mutex);// Last reader unlocks database for writers!
        signal(&mutex);
    }
}`,
      },
      {
        heading: '3. Dining Philosophers: Deadlock Analysis & Asymmetric Solution',
        body: 'Five philosophers sit around a circular table. Between each adjacent pair of philosophers lies a single chopstick. To eat, a philosopher requires both their left and right chopsticks.',
        diagramId: 'm3-dining-philosophers',
        codeBlock: `// Shared Chopsticks
semaphore chopstick[5] = {1, 1, 1, 1, 1};

// === 1. DEADLOCK-PRONE NAIVE SOLUTION ===
// If all 5 philosophers sit down simultaneously and grab their left chopstick:
// P0 holds chopstick[0], P1 holds chopstick[1], ..., P4 holds chopstick[4]
// Every philosopher then attempts to grab chopstick[(i+1)%5] and blocks forever!
// Circular Wait: P0 -> P1 -> P2 -> P3 -> P4 -> P0 (DEADLOCK!)

// === 2. VERIFIED ASYMMETRIC SOLUTION (Breaks Circular Wait) ===
// Odd philosophers pick Left then Right; Even philosophers pick Right then Left
void philosopher(int i) {
    while (true) {
        /* THINKING */

        if (i % 2 == 1) { // Odd Philosopher: Left then Right
            wait(&chopstick[i]);
            wait(&chopstick[(i + 1) % 5]);
        } else {          // Even Philosopher: Right then Left
            wait(&chopstick[(i + 1) % 5]);
            wait(&chopstick[i]);
        }

        /* EATING */

        signal(&chopstick[i]);
        signal(&chopstick[(i + 1) % 5]);
    }
}`,
      },
      {
        heading: '4. Sleeping Barber Problem (Verified C1 Set 2-2 Q2 Implementation)',
        body: 'A barber shop contains 1 barber chair and $N$ waiting chairs. If there are no customers, the barber sleeps in the barber chair. When a customer arrives, if all $N$ chairs are occupied, the customer leaves the shop immediately. If chairs are free, the customer sits in a waiting chair and wakes the barber.',
        codeBlock: `// Shared Variables
#define CHAIRS 5            // N = 5 waiting chairs
semaphore customers = 0;   // Number of customers waiting for haircut (wakes barber)
semaphore barber = 0;      // Barber status (customer waits until barber is ready)
semaphore mutex = 1;       // Protects access to waiting count
int waiting = 0;           // Number of customers currently sitting in waiting chairs

// === BARBER PROCESS ===
void barber_thread() {
    while (true) {
        wait(&customers);   // Sleep if no customers are waiting (customers == 0)
        wait(&mutex);       // Acquire lock to update waiting count
        waiting--;          // Customer moves from waiting chair to barber chair
        signal(&barber);    // Signal customer: "I am ready to cut your hair"
        signal(&mutex);     // Release lock

        cut_hair();         // Cut hair outside critical section
    }
}

// === CUSTOMER PROCESS ===
void customer_thread() {
    wait(&mutex);           // Acquire lock to inspect waiting chairs
    if (waiting < CHAIRS) {
        waiting++;          // Claim a waiting chair
        signal(&customers); // Wake barber (or increment waiting customer count)
        signal(&mutex);     // CRITICAL: Release lock before waiting for barber!

        wait(&barber);      // Wait until barber calls you into the barber chair
        get_haircut();
    } else {
        // Shop is full! Customer leaves cleanly without waiting
        signal(&mutex);     // CRITICAL: MUST release mutex before leaving!
    }
}`,
      },
      {
        heading: 'Deadlock Characterization in Synchronization: Coffman Conditions & RAGs',
        body: 'Deadlocks in concurrent synchronization systems are characterized by four necessary and sufficient conditions known as the **Coffman Conditions** (1971). All four conditions must hold simultaneously for a deadlock to exist:\n\n1. **Mutual Exclusion**: At least one resource (mutex, semaphore, chopstick) must be held in a non-shareable mode.\n2. **Hold and Wait**: A thread must currently hold at least one resource while waiting to acquire additional resources held by other threads.\n3. **No Preemption**: Resources cannot be forcibly seized from a thread; they can only be released voluntarily by the thread holding them.\n4. **Circular Wait**: A closed chain of threads $\{T_0, T_1, \dots, T_n\}$ exists such that $T_0$ is waiting for a resource held by $T_1$, $T_1$ is waiting for a resource held by $T_2$, and $T_n$ is waiting for a resource held by $T_0$.\n\n**Breaking Deadlock in Classical Synchronization**:\n- In **Dining Philosophers**, the asymmetric solution ($i \% 2$) establishes a partial ordering on chopstick acquisition, mathematically breaking the **Circular Wait** condition.\n- In **Bounded Buffer**, adhering to `wait(empty)` before `wait(mutex)` breaks the **Hold and Wait** circular dependency where a process sleeps holding `mutex`.\n- In **Banker’s Algorithm**, dynamic resource allocation ensures the system never grants a resource request that could lead to an unsafe state, ensuring at least one safe sequence $<P_1, P_2, \dots, P_n>$ always exists.',
      },
    ],
    workedExample: {
      title: 'Formal Proof: Why Asymmetric Dining Philosophers Prevents Deadlock',
      problem:
        'Prove mathematically why the asymmetric chopstick pickup rule (odd philosophers pick up Left then Right; even philosophers pick up Right then Left) prevents deadlock for N = 5 philosophers.',
      solution:
        'Let philosophers be numbered 0 to 4. Chopsticks are numbered 0 to 4.\n- Even philosophers are P0, P2, P4. By rule, they pick up Right chopstick `(i+1)%5` first, then Left chopstick `i`.\n  - P0 picks up C1 first, then C0.\n  - P2 picks up C3 first, then C2.\n  - P4 picks up C0 first, then C4.\n- Odd philosophers are P1, P3. By rule, they pick up Left chopstick `i` first, then Right chopstick `(i+1)%5`.\n  - P1 picks up C1 first, then C2.\n  - P3 picks up C3 first, then C4.\n\nNotice chopstick C1: Both P0 and P1 attempt to pick up C1 as their very first chopstick! Because C1 is a binary semaphore, only one of them (say P0) can acquire C1. The other (P1) is blocked before picking up any chopstick at all. Similarly, for C3, both P2 and P3 compete for C3 first; one wins, the other blocks holding nothing.\nBecause at most 3 philosophers can hold their first chopstick, and there are 5 chopsticks in total, by the Pigeonhole Principle at least one philosopher will find both chopsticks available, eat, and release them. A circular wait chain of all 5 philosophers holding 1 chopstick cannot form. Deadlock is mathematically impossible.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Slot C1 Set 2-2 Q2 (10M) & Slot C2 Q6 (10M)',
        promptSummary: 'Provide complete semaphore pseudocode for Sleeping Barber (5M) with race/deadlock analysis (5M); OR Food Ordering Bounded Buffer capacity 5 (10M).',
        markBreakdown: 'Semaphore initialization & roles (3M) + Correct wait/signal pseudocode (4M) + Race conditions & deadlock prevention proof (3M)',
        solutionSteps: [
          'List all semaphores with types (binary vs counting), initial values, and purposes BEFORE writing pseudocode.',
          'For Sleeping Barber: declare `customers = 0`, `barber = 0`, `mutex = 1`, and `waiting = 0`. Write Barber thread calling `wait(customers)` and Customer thread checking `waiting < CHAIRS`.',
          'Highlight the `else` branch in Customer: explain that omitting `signal(mutex)` before exiting leaves `mutex` locked forever, causing all future customers to block (instant deadlock deduction).',
          'For Bounded Buffer: show `wait(empty)` / `wait(full)` preceding `wait(mutex)`. Prove that reversing the order causes deadlock when buffer is full or empty.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m3-cp-1',
        question: 'In the Sleeping Barber problem, what critical failure occurs if a customer arrives when the shop is full (waiting == CHAIRS) and executes `return;` without calling `signal(&mutex)`?',
        options: [
          'The customer gets a haircut anyway',
          'The mutex remains permanently locked at 0, deadlocking all future arriving customers and the barber',
          'The barber chair breaks',
          'The customer array underflows',
        ],
        correctIndex: 1,
        explanation: 'Failing to release `mutex` in the `else` branch leaves the binary mutex held forever. No other customer can ever inspect the waiting chairs, freezing the shop permanently.',
      },
      {
        id: 'sc-m3-cp-2',
        question: 'Which of the 4 Coffman conditions is directly broken by the asymmetric pickup solution to the Dining Philosophers problem?',
        options: ['Mutual Exclusion', 'Hold and Wait', 'No Preemption', 'Circular Wait'],
        correctIndex: 3,
        explanation: 'Reversing the order of chopstick acquisition for odd versus even philosophers ensures that a closed circular dependency chain cannot be completed.',
      },
      {
        id: 'sc-m3-cp-3',
        question: 'In the Bounded Buffer producer-consumer problem with buffer capacity N, what happens if the Producer executes `wait(&mutex)` BEFORE `wait(&empty)` when the buffer is full?',
        options: [
          'The buffer safely expands in dynamic RAM',
          'The producer overwrites the oldest item without error',
          'The producer blocks holding mutex, and the consumer then blocks on mutex, causing permanent deadlock',
          'The consumer receives an EOF interrupt',
        ],
        correctIndex: 2,
        explanation: 'If the producer acquires `mutex` when the buffer is full, it blocks on `wait(empty)` while holding `mutex`. When the consumer tries to consume, it blocks on `wait(mutex)`. Neither can proceed.',
      },
    ],
    examTip: 'In Bounded Buffer, ALWAYS verify: counting semaphores (`empty`/`full`) MUST appear OUTSIDE the binary lock (`mutex`). Writing `wait(mutex)` first is the most common 5-mark trap on the exam!',
  },
  {
    topicId: 'm3-monitors',
    moduleId: 'm3',
    title: 'Monitors, Condition Variables (Hoare vs Mesa) & Scenario Monitor Design',
    summary:
      'A Monitor is an advanced language-level synchronization construct (encapsulated Abstract Data Type) that automatically enforces mutual exclusion around its shared state variables. Synchronization within a monitor is coordinated via Condition Variables. Understanding the fundamental architectural divergence between Hoare semantics (Signal-and-Wait) and Mesa semantics (Signal-and-Continue) is essential for mastering monitor design and real-world scenario prompts like hospital surgical suites.',
    sourceDecks: ['Silberschatz 10e Ch 6 (§6.7–6.8)', 'VITC Past Paper: C1 Set 1-2 Q4 (10M)'],
    keyPoints: [
      '**Monitor Concept**: An Abstract Data Type (ADT) containing private shared variables and public synchronized methods. The compiler/runtime strictly guarantees that **only ONE process can be active inside the monitor at any given instant** (eliminating accidental lock-omission bugs).',
      '**Condition Variables (`condition x;`)**: Support two operations: `x.wait()` (suspends calling thread and atomically relinquishes monitor lock) and `x.signal()` (resumes exactly one suspended thread). **CRUCIAL DIFFERENCE FROM SEMAPHORES**: If no thread is waiting on `x`, `x.signal()` is **lost without trace (no-op)**; it does not increment any counter!',
      '**Hoare Semantics (Signal-and-Wait)**: When thread $P$ signals condition `x`, waking thread $Q$, $P$ immediately yields the monitor lock and suspends on an urgent queue; $Q$ runs immediately. Because no intervening thread can run, the condition $Q$ waited for is **guaranteed to be true** -> `if (!condition) x.wait();` is valid.',
      '**Mesa Semantics (Signal-and-Continue)**: When thread $P$ signals `x`, $P$ continues executing inside the monitor. Woken thread $Q$ is placed onto the monitor Entry Queue. By the time $Q$ re-acquires the monitor lock, another thread may have entered and altered state. Therefore, $Q$ **MUST re-evaluate the predicate in a `while` loop**: `while (!condition) x.wait();`. (Used by Java, POSIX `pthread_cond_wait`, C#, Python).',
      '**Scenario Monitor Design (C1 Set 1-2 Q4 Hospital Operating Theatres)**: Multi-resource allocation with priority (`emergency > scheduled`), anti-starvation threshold (`MAX_CONSECUTIVE_EMERGENCIES = 2`), and mandatory post-surgery cleaning before theatre reuse.',
      '**Monitor Implementation using Semaphores**: Built using `semaphore mutex = 1` (entry), `semaphore next = 0` (urgent signaler queue), `int next_count = 0`, and per-condition `semaphore x_sem = 0` with `int x_count = 0`.',
    ],
    sections: [
      {
        heading: 'Monitor Internal Architecture: Entry Queue vs Condition Queues',
        body: 'A monitor guarantees mutual exclusion at the language syntax level. Processes wishing to invoke any method on the monitor must first wait in the **Monitor Entry Queue**. Only one process is granted entry by the compiler-generated lock wrapper.\n\nInside the monitor, if a process discovers that a prerequisite condition is not satisfied (e.g., no buffer slots free, or no operating theatres available), it calls `x.wait()`. This atomically releases the monitor lock and suspends the process in `x`’s private **Condition Queue**. The monitor lock is now free for other processes.',
        diagramId: 'm3-monitor-structure',
      },
      {
        heading: 'Condition Variables: Semaphores vs Monitor Variables',
        body: 'Students frequently confuse condition variables with semaphores. Contrast their semantics carefully:',
        table: {
          headers: ['Feature', 'Condition Variable (`condition x`)', 'Counting Semaphore (`semaphore S`)'],
          rows: [
            ['Internal State', 'None (pure queue of waiting threads; no integer counter)', 'Maintains an integer counter value (`S.value`)'],
            ['Signal Behavior with Empty Queue', 'Signal is completely LOST (no-op). Has no future memory.', 'Signal increments counter (`S.value++`). Stored for future waits.'],
            ['Wait Behavior', 'Always blocks calling thread unconditionally', 'Blocks only if `S.value < 0` (or `<= 0` in busy-waiting)'],
            ['Mutual Exclusion', 'Must be called while already inside a monitor', 'Provides its own mutual exclusion via `wait(mutex)`'],
            ['Broadcast Capability', 'Supports `x.broadcast()` / `notifyAll()` to wake all waiting threads', 'Requires calling `signal()` in a loop $k$ times'],
          ],
        },
      },
      {
        heading: 'Hoare vs Mesa vs Brinch Hansen Signaling Semantics',
        body: 'When thread $P$ executes `x.signal()`, awakening thread $Q$ from condition queue `x`, who owns the monitor lock next? Three distinct semantic models exist in computer science:\n\n1. **Hoare Semantics (Signal-and-Wait)**:\n- The signaling thread $P$ is immediately suspended and placed onto an urgent queue (`next`).\n- The awakened thread $Q$ takes immediate ownership of the monitor lock and executes.\n- **Consequence**: The condition that $Q$ was waiting for is guaranteed to be true when $Q$ runs. An `if` statement is sufficient:\n```c\nif (!resource_available)\n    x.wait();\n```\n\n2. **Mesa Semantics (Signal-and-Continue — Java & POSIX)**:\n- The signaling thread $P$ retains the monitor lock and continues running until it exits the monitor or calls `wait()`.\n- The awakened thread $Q$ is simply moved from condition queue `x` to the monitor Entry Queue.\n- **The "Stolen Wakeup" Hazard**: Before $Q$ gets scheduled and re-acquires the monitor lock, another thread $R$ may enter the monitor and consume the resource! Furthermore, spurious wakeups can occur.\n- **Consequence**: Awakened threads MUST re-test the condition in a `while` loop:\n```c\nwhile (!resource_available)\n    x.wait();\n```\n\n3. **Brinch Hansen Semantics (Signal-and-Exit)**:\n- A thread $P$ may execute `x.signal()` ONLY as its very last statement before exiting the monitor.',
        table: {
          headers: ['Semantic Dimension', 'Hoare (Signal-and-Wait)', 'Mesa (Signal-and-Continue)'],
          rows: [
            ['Signaler Execution', 'Signaler P suspends immediately on urgent queue', 'Signaler P continues executing inside monitor'],
            ['Awakened Thread', 'Awakened thread Q runs immediately inside monitor', 'Thread Q transitions to monitor Entry Queue'],
            ['Predicate Checking', '`if (!condition) x.wait();` is mathematically sound', '`while (!condition) x.wait();` is MANDATORY'],
            ['Context Switch Cost', 'High (forces two immediate context switches P -> Q -> P)', 'Low (signaler finishes its quantum naturally)'],
            ['Real-World Systems', 'Theoretical OS literature (Cedar, Xerox PARC)', 'Java (`synchronized`, `wait()`), POSIX (`pthread_cond_wait`)'],
          ],
        },
      },
      {
        heading: 'Implementing Monitors Using Semaphores (Silberschatz §6.7.2)',
        body: 'Silberschatz details how a compiler converts high-level monitor methods into low-level semaphore calls under Hoare semantics. The monitor uses a binary semaphore `mutex = 1` for entry, an urgent semaphore `next = 0` for signalers, and an integer `next_count = 0`. Each condition variable `x` has a semaphore `x_sem = 0` and integer `x_count = 0`.',
        codeBlock: `// Monitor Implementation Variables
semaphore mutex = 1;       // Protects monitor entry
semaphore next = 0;        // Signalers sleep here under Hoare semantics
int next_count = 0;        // Number of suspended signalers

// Condition Variable x Implementation
typedef struct {
    semaphore x_sem;       // Initialized to 0
    int x_count;           // Initialized to 0 (count of threads waiting on x)
} x_condition;

// === x.wait() ===
void x_wait(x_condition *x) {
    x->x_count++;
    if (next_count > 0)
        signal(&next);     // Wake an urgent signaler if one exists
    else
        signal(&mutex);    // Otherwise release the monitor entry lock
    wait(&(x->x_sem));     // Suspend calling thread on condition queue
    x->x_count--;
}

// === x.signal() ===
void x_signal(x_condition *x) {
    if (x->x_count > 0) {
        next_count++;
        signal(&(x->x_sem));// Wake one waiting thread on condition x
        wait(&next);       // Suspend signaler on urgent queue (Hoare semantics!)
        next_count--;
    }
}`,
      },
      {
        heading: 'Solved FAT Masterpiece: C1 Set 1-2 Q4 Hospital Operating Theatre Monitor',
        body: 'In C1 Set 1-2 Q4, students were asked to design an object-oriented Monitor managing 3 Hospital Operating Theatres shared across 5 surgical teams. Requirements:\n1. **Emergency vs Scheduled Priority**: Emergency surgeries preempt scheduled surgeries.\n2. **Anti-Starvation Bound**: Continuous emergency arrivals must not starve scheduled surgeries indefinitely (cap at `THRESHOLD = 2` consecutive emergency surgeries).\n3. **Post-Surgery Cleaning Phase**: A theatre cannot be reused immediately upon release; cleaning staff must sanitize the room before `freeTheatres` is incremented!',
        codeBlock: `monitor HospitalOperatingSuites {
    // Shared State Variables
    int freeTheatres = 3;           // Total 3 surgical theatres
    int waitingEmergency = 0;       // Number of waiting emergency teams
    int waitingScheduled = 0;       // Number of waiting scheduled teams
    int consecutiveEmergencies = 0; // Anti-starvation counter
    const int STARVATION_LIMIT = 2; // Threshold: Max consecutive emergencies allowed

    condition emergencyQueue;       // Condition queue for emergency surgeries
    condition scheduledQueue;       // Condition queue for scheduled surgeries

    // === METHOD 1: REQUEST THEATRE ===
    void requestTheatre(bool isEmergency) {
        if (isEmergency) {
            waitingEmergency++;
            // Wait if no theatres free OR if scheduled surgeries are starving
            while (freeTheatres == 0 ||
                   (waitingScheduled > 0 && consecutiveEmergencies >= STARVATION_LIMIT)) {
                emergencyQueue.wait();
            }
            waitingEmergency--;
            consecutiveEmergencies++;
        } else {
            waitingScheduled++;
            // Wait if no theatres free OR if emergency surgeries have priority
            while (freeTheatres == 0 ||
                   (waitingEmergency > 0 && consecutiveEmergencies < STARVATION_LIMIT)) {
                scheduledQueue.wait();
            }
            waitingScheduled--;
            consecutiveEmergencies = 0; // Reset consecutive counter after serving scheduled
        }
        freeTheatres--; // Allocate theatre
    }

    // === METHOD 2: RELEASE THEATRE (Enters Cleaning Phase) ===
    void releaseTheatre() {
        // Theatre is NOT yet free! It must undergo biohazard cleaning
        dispatchCleaningCrew();
    }

    // === METHOD 3: COMPLETE CLEANING (Theatre Ready for Reuse) ===
    void completeCleaning() {
        freeTheatres++; // Increment ONLY after sanitation is complete!

        // Awaken waiting surgical teams adhering strictly to priority & fairness
        if (waitingScheduled > 0 &&
            (waitingEmergency == 0 || consecutiveEmergencies >= STARVATION_LIMIT)) {
            scheduledQueue.signal();
        } else if (waitingEmergency > 0) {
            emergencyQueue.signal();
        }
    }
}`,
      },
      {
        heading: 'Dining Philosophers Monitor Solution (Silberschatz §6.7.1)',
        body: 'Silberschatz provides an elegant, deadlock-free solution to the Dining Philosophers problem using a Monitor. Each philosopher has a state variable (`THINKING`, `HUNGRY`, `EATING`) and a condition variable `self[5]`. A philosopher may transition to `EATING` if and only if both neighbors are not eating: `state[(i+4)%5] != EATING && state[(i+1)%5] != EATING`.',
        codeBlock: `monitor DiningPhilosophers {
    enum { THINKING, HUNGRY, EATING } state[5];
    condition self[5];

    void pickup(int i) {
        state[i] = HUNGRY;
        test(i); // Attempt to claim both chopsticks
        if (state[i] != EATING)
            self[i].wait(); // Wait if either neighbor is eating
    }

    void putdown(int i) {
        state[i] = THINKING;
        // Test left neighbor and right neighbor to see if they can now eat
        test((i + 4) % 5); // Test left neighbor (i - 1)
        test((i + 1) % 5); // Test right neighbor (i + 1)
    }

    void test(int i) {
        if ((state[(i + 4) % 5] != EATING) &&
            (state[i] == HUNGRY) &&
            (state[(i + 1) % 5] != EATING)) {
            state[i] = EATING;
            self[i].signal(); // Has no effect if philosopher is not waiting
        }
    }

    initialization_code() {
        for (int i = 0; i < 5; i++)
            state[i] = THINKING;
    }
}`,
      },
    ],
    workedExample: {
      title: 'The Mesa Semantics "Stolen Wakeup" Phenomenon',
      problem:
        'Explain why using `if (!condition) cond.wait();` instead of `while (!condition) cond.wait();` in Java or POSIX threads (Mesa semantics) causes data corruption. Provide a concrete scenario with Threads A, B, and C.',
      solution:
        '1. Suppose a shared buffer has capacity 1 and currently contains 0 items. Thread A calls `get()`: it checks `if (count == 0)`, sees 0, and executes `cond.wait()`, releasing the monitor lock.\n2. Thread B arrives, calls `put()`, places 1 item into the buffer, sets `count = 1`, and calls `cond.signal()`. Under Mesa semantics, Thread B continues executing and Thread A is moved to the Entry Queue.\n3. Before Thread A re-acquires the monitor lock, a newly arrived Thread C executes `get()`. The monitor lock is free, so Thread C enters immediately, sees `count == 1`, consumes the item, sets `count = 0`, and exits!\n4. Now Thread A finally re-acquires the monitor lock. If Thread A used `if`, it resumes immediately AFTER `cond.wait()` and assumes `count == 1`! Thread A attempts to consume from an empty buffer (`count` decrements to -1), causing a buffer underflow crash!\n5. **The Fix**: If Thread A used `while (count == 0) cond.wait();`, upon waking it re-tests `count == 0`. Seeing that Thread C consumed the item, Thread A safely loops and calls `cond.wait()` again.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Slot C1 Set 1-2 Q4 (10M)',
        promptSummary: 'Design a Hospital Operating Suite Monitor with 3 theatres, priority for emergency surgeries, anti-starvation threshold for scheduled surgeries, and post-surgery cleaning (6M), plus explain Mesa vs Hoare semantics (4M).',
        markBreakdown: 'State variables & condition queues (2M) + 3 methods with while-loop predicates (4M) + Mesa vs Hoare semantics & while loop proof (4M)',
        solutionSteps: [
          'Declare state variables: `freeTheatres = 3`, `waitingEmergency`, `waitingScheduled`, `consecutiveEmergencies`, `STARVATION_LIMIT = 2`, and condition variables `emergencyQueue`, `scheduledQueue`.',
          'Write `requestTheatre(bool isEmergency)`: use Mesa-safe `while` loop blocking emergency surgeries if theatres are full OR consecutive emergencies exceed threshold while scheduled surgeries wait.',
          'Write `releaseTheatre()`: note that releasing starts biohazard cleaning and DOES NOT increment `freeTheatres`.',
          'Write `completeCleaning()`: increment `freeTheatres++` and signal scheduled or emergency queue based on priority and the anti-starvation threshold.',
          'Contrast Hoare (signal-and-wait, immediate switch, if-condition valid) with Mesa (signal-and-continue, stolen wakeup hazard, while-condition mandatory).',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m3-mon-1',
        question: 'Under Mesa semantics (used by Java and POSIX pthread_cond_wait), why MUST a thread check its condition in a `while` loop rather than an `if` statement?',
        options: [
          'Because compilers do not allow `if` statements inside synchronized blocks',
          'Because the signaling thread continues executing, and another thread may enter and invalidate the condition before the awakened thread re-acquires the lock',
          'Because condition variables cannot store boolean values',
          'Because Mesa semantics automatically disables compiler optimization',
        ],
        correctIndex: 1,
        explanation: 'In Mesa semantics (Signal-and-Continue), an intervening thread can steal the resource before the awakened thread re-acquires the monitor lock. The while-loop forces the awakened thread to re-validate the predicate.',
      },
      {
        id: 'sc-m3-mon-2',
        question: 'What happens if a process executes `x.signal()` on a monitor condition variable `x` when no process is currently waiting in `x`’s condition queue?',
        options: [
          'The signal is remembered and increments `x`’s internal counter to 1',
          'The monitor crashes with a NullPointerException',
          'The signal is completely lost and has no future effect (no-op)',
          'The calling thread is moved to the Entry Queue',
        ],
        correctIndex: 2,
        explanation: 'Condition variables inside monitors have no integer memory. A signal executed on an empty condition queue is silently discarded as a no-op.',
      },
      {
        id: 'sc-m3-mon-3',
        question: 'In the Hospital Operating Theatre Monitor (C1 Set 1-2 Q4), which method increments `freeTheatres`?',
        options: [
          'requestTheatre()',
          'releaseTheatre()',
          'completeCleaning()',
          'Both releaseTheatre() and completeCleaning()',
        ],
        correctIndex: 2,
        explanation: 'A released theatre must undergo sanitation before it can be used by another surgical team; therefore, `freeTheatres++` is executed exclusively inside `completeCleaning()`.',
      },
    ],
    examTip: 'Examiner favorite: In any Monitor question on university exams, ALWAYS write `while (!condition) cond.wait();` and explicitly state: "Under Mesa semantics (Signal-and-Continue), the while loop is mandatory to defend against stolen wakeups and spurious wakeups." This guarantees maximum marks.',
  },
];
