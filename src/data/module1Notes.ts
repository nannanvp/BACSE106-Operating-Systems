import { TopicNote } from './noteTypes';

export const MODULE_1_NOTES: TopicNote[] = [
  {
    topicId: 'm1-basics-history',
    moduleId: 'm1',
    title: 'OS Basics, Dual-Mode Operation & Multiprogramming vs Time-Sharing',
    summary:
      'An Operating System is both a resource allocator (CPU, RAM, files, I/O) and a control program protecting hardware via Dual-Mode execution and hardware timers.',
    sourceDecks: ['Silberschatz 10e Ch 1 (§1.1–1.5)', 'VITC BACSE106 Syllabus Module 1'],
    keyPoints: [
      'Dual-Mode hardware adds a **mode bit**: `0 = Kernel (Supervisor) Mode` for privileged instructions and `1 = User Mode` for application code.',
      'Privileged instructions (disable interrupts, modify timer, base/limit registers, halt, direct I/O) trap to the OS if attempted in User Mode.',
      '**Multiprogramming** keeps multiple jobs in RAM so the CPU switches only when a job waits for I/O (maximizes CPU utilization).',
      '**Time-Sharing (Multitasking)** switches the CPU rapidly via periodic hardware timer interrupts (time quanta) so every interactive user gets sub-second response time.',
    ],
    sections: [
      {
        heading: 'Dual-Mode Protection & Timer Transition Cycle',
        body: 'At system boot, hardware starts in **Kernel Mode (`bit = 0`)**. Once the OS initializes, it loads a user process and flips the bit to **User Mode (`bit = 1`)**. Whenever a user process requests an OS service (system call), hits an exception, or a hardware timer expires, the CPU traps back to Kernel Mode, executes the kernel handler, and returns to User Mode.',
        diagramId: 'm1-dual-mode-trap',
      },
      {
        heading: 'Evolution: Batch vs Multiprogramming vs Time-Sharing',
        body: 'VIT Chennai FAT questions (e.g., C1 Set 1-2 Q1b) frequently ask you to justify **Time-Sharing** over **Multiprogramming** for real-time interactive or patient-monitoring workloads.',
        table: {
          headers: ['Dimension', 'Multiprogramming', 'Time-Sharing (Multitasking)'],
          rows: [
            ['Primary Goal', 'Maximize CPU utilization', 'Minimize interactive response time'],
            ['Switching Trigger', 'Only when running process blocks on I/O', 'Preemptive hardware timer quantum expiry'],
            ['User Interaction', 'Minimal / batch-oriented', 'Interactive terminals, dashboards, live sensors'],
            ['Patient Monitor Suitability', 'Poor — compute-heavy task can delay ECG alarm', 'Ideal — guarantees bounded response for vital alerts'],
          ],
        },
      },
    ],
    workedExample: {
      title: 'Timer Protection Against Infinite User Loops',
      problem:
        'A buggy student C program executes `while (1) ;` in User Mode. How does the OS guarantee the machine does not freeze permanently?',
      solution:
        'Before dispatching the process, the kernel sets a hardware countdown timer (e.g., 10 ms) in Kernel Mode and switches to User Mode (`bit = 1`). The user code cannot modify the timer (privileged instruction). After 10 ms, the timer decrements to 0 and fires a hardware interrupt, flipping `bit = 0` and returning control to the kernel scheduler.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Slot C1 Set 1-2 Q1(b) (5M)',
        promptSummary: 'Compare Multiprogramming vs Time-Sharing for a hospital multi-patient monitoring system.',
        markBreakdown: 'Core definitions (2M) + Comparison table (2M) + Hospital recommendation (1M)',
        solutionSteps: [
          'Define Multiprogramming (I/O-driven switching, throughput focus) vs Time-Sharing (timer-quantum preemption, low response time).',
          'Contrast CPU switching trigger, response latency, and starvation risk in a 4-row table.',
          'Conclude Time-Sharing is mandatory so critical patient vital-sign alarms are processed within milliseconds regardless of background logging.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m1-bh-1',
        question: 'When a user process executes a system call trap instruction, what happens to the CPU mode bit?',
        options: ['Stays 1 throughout', 'Changes from 1 (User) to 0 (Kernel), then back to 1 on return', 'Changes from 0 to 1 permanently', 'Clears the interrupt vector table'],
        correctIndex: 1,
        explanation: 'A system call traps into Kernel Mode (0) to execute privileged services safely, then restores User Mode (1) on return.',
      },
      {
        id: 'sc-m1-bh-2',
        question: 'Which OS paradigm switches processes ONLY when the currently executing process blocks for I/O?',
        options: ['Time-Sharing', 'Multiprogramming (non-preemptive)', 'Real-Time Preemptive', 'Distributed Microkernel'],
        correctIndex: 1,
        explanation: 'Classic multiprogramming switches on I/O waits to maximize utilization; time-sharing preempts on timer quanta.',
      },
    ],
    examTip: 'Always state the exact mode-bit convention (`0 = Kernel, 1 = User`) and draw the horizontal privilege boundary line to avoid a -2M deduction.',
  },
  {
    topicId: 'm1-os-structures',
    moduleId: 'm1',
    title: 'OS Structures: Monolithic, Layered, Microkernel, Modular & Hybrid',
    summary:
      'Operating system architecture determines where device drivers, file systems, and schedulers execute, trading direct-call speed (Monolithic) against fault isolation (Microkernel).',
    sourceDecks: ['Silberschatz 10e Ch 2 (§2.7)', 'VITC Past Papers: C1 2-2 Q1 & C2 Q1a'],
    keyPoints: [
      '**Monolithic Kernel** (traditional UNIX, Linux core): all OS services run in a single Ring-0 kernel address space -> blazing fast function calls, but a single driver bug crashes the whole OS.',
      '**Layered Approach**: strict bottom-up hierarchy (Layer 0 = hardware, Layer N = UI); clean debugging, but hard to define strict acyclic layers and incurs overhead crossing layers.',
      '**Microkernel** (Mach, QNX, L4): strips kernel to minimal IPC, basic scheduling, and memory mapping; moves drivers/FS to user space -> superior reliability & security, higher IPC context-switch overhead.',
      '**Loadable Kernel Modules (LKMs)** (modern Linux/Solaris) and **Hybrid Kernels** (Windows NT, macOS XNU) blend modular extensibility with near-monolithic performance.',
    ],
    sections: [
      {
        heading: 'Visual Comparison: Monolithic vs Microkernel vs Hybrid',
        body: 'In a **Monolithic** OS, the file system, device drivers, and scheduler invoke each other directly via C function pointers inside Kernel Mode. In a **Microkernel**, an application reading a file sends an IPC message through the tiny kernel to the user-space File Server, which messages the user-space Disk Driver Server.',
        diagramId: 'm1-os-structures',
      },
      {
        heading: 'Architectural Trade-Off Table',
        body: 'Use this exact comparison whenever asked to justify kernel selection for embedded/safety-critical systems (like C2 Q1a neuro-stimulators) vs high-throughput servers.',
        table: {
          headers: ['Criterion', 'Monolithic', 'Microkernel', 'Modular (LKM) / Hybrid'],
          rows: [
            ['Kernel Size', 'Large (all drivers + FS in Ring 0)', 'Minimal (IPC + MM + basic CPU)', 'Compact core + dynamic modules'],
            ['Communication', 'Direct function calls', 'User <-> Kernel IPC messages', 'Direct kernel interfaces + selective IPC'],
            ['Fault Isolation', 'Poor — driver crash = kernel panic', 'Excellent — user server restarts safely', 'Moderate — modules run in Ring 0'],
            ['Performance', 'Highest throughput & lowest latency', 'Lower due to IPC context switches', 'Near-monolithic'],
            ['Examples', 'Traditional UNIX, MS-DOS', 'QNX, L4, MINIX 3, Mach', 'Linux (LKM), Windows NT, macOS XNU'],
          ],
        },
      },
    ],
    workedExample: {
      title: 'Choosing Kernel Architecture for an Implantable Medical Device (C2 Q1a)',
      problem:
        'An implantable neuro-stimulator needs extreme fault isolation so a telemetry driver crash cannot stop pulse generation, while keeping latency bounded. Which architecture fits best?',
      solution:
        'Choose a **Microkernel** (e.g., QNX/L4). Moving telemetry and logging drivers into isolated user-space servers guarantees a driver fault cannot corrupt kernel memory or halt pacing. Explicitly acknowledge the **trade-off**: IPC message passing adds mode-switch latency compared to monolithic calls, mitigated by fast register-based IPC.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Slot C1+TC1 Set 2-2 Q1 (10M)',
        promptSummary: 'Explain Monolithic and Microkernel structures with neat diagrams (7M) and list differences/pros/cons (3M).',
        markBreakdown: 'Monolithic diagram + explanation (3.5M) + Microkernel diagram + IPC path (3.5M) + Comparison table (3M)',
        solutionSteps: [
          'Draw Monolithic diagram showing Application -> System Call Interface -> single Kernel box containing Process Mgmt, Memory, FS, Drivers -> Hardware.',
          'Draw Microkernel diagram showing User Space servers (Application, File Server, Device Driver, Process Server) communicating via `messages` routed through a minimal Kernel Space box (IPC, Virtual Memory, CPU Scheduling).',
          'Provide a 5-row comparison table covering communication, fault tolerance, extensibility, performance, and real-world OS examples.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m1-os-1',
        question: 'In a pure Microkernel architecture, where do the File System and Device Drivers execute?',
        options: ['Inside Ring 0 Kernel Mode', 'As isolated User-Space server processes communicating via IPC', 'Inside CPU microcode', 'Inside the BIOS ROM'],
        correctIndex: 1,
        explanation: 'Microkernels move non-essential services like file systems and device drivers to User Space for fault isolation.',
      },
      {
        id: 'sc-m1-os-2',
        question: 'Which kernel design combines dynamic runtime extensibility with direct kernel-interface speed?',
        options: ['Simple Structure', 'Strict Layered Structure', 'Loadable Kernel Modules (LKM)', 'Batch Monitor'],
        correctIndex: 2,
        explanation: 'Modern Linux uses LKMs so modules load/unload dynamically without microkernel message-passing penalties.',
      },
    ],
    examTip: 'Always draw arrows showing `messages` passing through the Microkernel IPC layer between user servers — examiners specifically look for the IPC round-trip path.',
  },
  {
    topicId: 'm1-syscalls-services',
    moduleId: 'm1',
    title: 'OS Services, System Calls, FD Redirection & Parameter Passing',
    summary:
      'System calls provide the programmatic interface between User-Space applications (via APIs like POSIX/Win32) and Kernel-Space OS services.',
    sourceDecks: ['Silberschatz 10e Ch 2 (§2.1–2.4)', 'VITC Past Paper: C2 Q1b'],
    keyPoints: [
      'Applications usually invoke high-level **APIs** (POSIX `libc`, Win32) rather than raw assembly traps for portability.',
      'Six System Call categories: **Process Control** (`fork, exec, wait, exit`), **File Mgmt** (`open, read, write, close`), **Device Mgmt** (`ioctl`), **Info Maintenance** (`getpid`), **Communications** (`pipe, shmget`), **Protection** (`chmod`).',
      'Three Parameter-Passing methods: (1) **CPU Registers** (fastest, count-limited), (2) **Memory Block/Table** pointer in register (Linux/Solaris), (3) **Program Stack** push/pop.',
      'Unix **Lowest-Available FD Rule**: `open()` ALWAYS returns the smallest non-negative unused file descriptor (`0=stdin, 1=stdout, 2=stderr`).',
    ],
    sections: [
      {
        heading: 'User API to Kernel System Call Flow',
        body: 'Calling `open()` in C invokes the `libc` wrapper, which places the syscall number in a register and executes a software trap (`syscall` / `int 0x80`). The kernel indexes the **System Call Table**, runs the privileged kernel handler, and returns the integer file descriptor to user space.',
        diagramId: 'm1-syscall-flow',
      },
      {
        heading: 'Tracing Shell Output Redirection (`./analyzer data.txt > report.log`)',
        body: 'C2 Q1(b) asks for the exact POSIX system calls behind shell redirection. Notice the child — NOT the parent shell — reassigns FD 1 so the shell itself keeps printing to the terminal.',
        codeBlock: `// Parent shell parses: ./analyzer data.txt > report.log
pid_t pid = fork();
if (pid == 0) {                          // Child process
    close(1);                            // 1. Free FD 1 (stdout)
    int fd = open("report.log",          // 2. Lowest unused FD is 1!
                  O_WRONLY | O_CREAT | O_TRUNC, 0644);
    // Optional equivalent: dup2(fd, 1); close(fd);
    execlp("./analyzer", "analyzer", "data.txt", NULL); // 3. Replace image; FD table preserved!
    // Inside analyzer: open("data.txt"), read(in_fd, buf, n), write(1, out, m) -> goes to report.log!
} else {
    wait(NULL);                          // Parent waits; parent's FD 1 is untouched
}`,
      },
    ],
    workedExample: {
      title: 'Why `exec()` Preserves Redirection Automatically',
      problem:
        'After the child calls `close(1)` and `open("report.log", ...)`, it invokes `exec()`. Why doesn’t `exec()` reset stdout back to the screen?',
      solution:
        '`exec()` replaces the process’s text, data, heap, and stack with the new program (`./analyzer`), **but preserves the process’s open file descriptor table** (except descriptors marked `FD_CLOEXEC`). Thus FD 1 still points to `report.log`.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Slot C2+TC2 Q1(b) (5M)',
        promptSummary: 'Trace `./analyzer data.txt > report.log` using fork, exec, open, close, read, write and explain FD 1 reassignment.',
        markBreakdown: 'Process creation via fork/exec (2M) + close(1) & open() lowest-FD rule (2M) + read/write data flow (1M)',
        solutionSteps: [
          'Shell calls `fork()` to spawn a child so parent shell stdout stays intact.',
          'Child calls `close(1)` to release stdout, then `open("report.log", O_WRONLY|O_CREAT|O_TRUNC)` which is guaranteed to occupy FD 1 (lowest unused FD).',
          'Child executes `exec("./analyzer", ...)` keeping the FD table intact; `analyzer` calls `open("data.txt")`, `read()`, and `write(1, ...)` seamlessly into `report.log`.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m1-sc-1',
        question: 'Which parameter-passing technique avoids register count limits while keeping kernel access fast?',
        options: ['Hardcoding constants in BIOS', 'Storing parameters in a memory block and passing its base address in a register', 'Writing parameters to a disk file', 'Using DMA'],
        correctIndex: 1,
        explanation: 'Passing a memory block pointer in a register handles arbitrarily many parameters cleanly (used by Linux and Solaris).',
      },
      {
        id: 'sc-m1-sc-2',
        question: 'During `./prog > out.txt`, why must `close(1)` and `open("out.txt")` run in the child process instead of the parent shell?',
        options: ['Parent cannot call open()', 'Doing it in the parent would permanently redirect the shell’s own terminal output', 'Child cannot inherit file descriptors', 'exec() only works if parent closes stdout'],
        correctIndex: 1,
        explanation: 'Isolating FD reassignment to the child ensures the interactive parent shell continues writing to the user terminal.',
      },
    ],
    examTip: 'Always explicitly state the "lowest unused file descriptor" rule when explaining `close(1)` followed by `open()`.',
  },
  {
    topicId: 'm1-interrupts-dma',
    moduleId: 'm1',
    title: 'Interrupts, Traps, I/O Cycle & Direct Memory Access (DMA)',
    summary:
      'Interrupts enable asynchronous hardware-to-CPU signaling, while Direct Memory Access (DMA) offloads bulk block transfers from the CPU to achieve high I/O throughput.',
    sourceDecks: ['Silberschatz 10e Ch 1 (§1.2–1.3)', 'OVERDUE GAP — 0 Qs across C1 & C2'],
    keyPoints: [
      '**Interrupt Vector Table (IVT)**: fixed low-memory array of pointers to Interrupt Service Routines (ISRs) for fast O(1) dispatch.',
      'CPU saves current Program Counter (PC) and Processor Status Word (PSW) on the kernel stack before jumping to the ISR, then restores them via `IRET`.',
      '**Interrupt-Driven I/O** interrupts the CPU once per byte/word — severe overhead for high-speed SSDs or 10 Gbps NICs.',
      '**DMA Controller** transfers an entire block directly between device controller buffer and RAM via **cycle stealing**, raising only **one interrupt per block**.',
    ],
    sections: [
      {
        heading: 'Interrupt Cycle & DMA Data Path',
        body: 'To initiate DMA, the CPU writes only 3 registers on the DMA controller: (1) source/destination RAM address, (2) byte transfer count, and (3) read/write command. The DMA controller then arbitrates the memory bus directly while the CPU executes other ready processes.',
        diagramId: 'm1-interrupt-dma',
      },
      {
        heading: 'I/O Transfer Modes Comparison',
        body: 'Expect this comparison on an Alpha Gap paper because M1 Interrupts & DMA has not yet been tested in C1 or C2.',
        table: {
          headers: ['I/O Method', 'CPU Involvement', 'Interrupt Frequency', 'Best Workload'],
          rows: [
            ['Programmed I/O (Polling)', 'CPU busy-waits polling status bit', '0 interrupts', 'Tiny microcontrollers / ultra-short waits'],
            ['Interrupt-Driven I/O', 'CPU copies every byte/word in ISR', '1 interrupt per byte/word', 'Low-speed character devices (keyboard, serial)'],
            ['Direct Memory Access (DMA)', 'CPU only initializes transfer & handles completion', '1 interrupt per entire block (e.g., 4 KB)', 'High-speed block devices (NVMe SSD, disk, NIC)'],
          ],
        },
      },
    ],
    workedExample: {
      title: 'Interrupt Overhead Reduction via DMA',
      problem:
        'A disk transfers a 4 KB (4096 B) block. Compare total CPU interrupts for byte-level Interrupt-Driven I/O vs DMA.',
      solution:
        'Byte-level Interrupt-Driven I/O triggers **4,096 interrupts** (each incurring register save/restore). DMA transfers all 4,096 bytes directly into RAM and triggers **1 single interrupt** upon completion — a 4,096× reduction in interrupt context switches.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Alpha Gap High-Probability Prompt (10M)',
        promptSummary: 'Trace hardware interrupt handling with IVT/ISR and compare Programmed I/O, Interrupt-Driven I/O, and DMA.',
        markBreakdown: 'Interrupt cycle + IVT diagram (5M) + DMA cycle stealing & 3-way comparison table (5M)',
        solutionSteps: [
          'Trace: Device asserts IRQ -> CPU finishes current instruction -> saves PC/PSW -> switches to Kernel Mode -> looks up ISR in IVT -> executes ISR -> clears IRQ -> `IRET` restores PC/PSW.',
          'Explain DMA setup (address, count, control), bus cycle stealing, and single end-of-block interrupt.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m1-dma-1',
        question: 'What is "cycle stealing" in Direct Memory Access (DMA)?',
        options: ['CPU stealing timer ticks from another process', 'DMA controller briefly seizing memory bus cycles from the CPU to read/write RAM directly', 'Kernel stealing pages from user processes', 'Overwriting the Interrupt Vector Table'],
        correctIndex: 1,
        explanation: 'During DMA transfers, the DMA controller temporarily borrows memory bus cycles so data moves directly between device and RAM without CPU register copies.',
      },
      {
        id: 'sc-m1-dma-2',
        question: 'Which event is a SYNCHRONOUS trap rather than an asynchronous hardware interrupt?',
        options: ['Keyboard keypress', 'Disk DMA completion', 'Divide-by-zero exception or system call', 'Network packet arrival'],
        correctIndex: 2,
        explanation: 'Traps/exceptions occur synchronously as a direct result of executing a specific CPU instruction.',
      },
    ],
    examTip: 'Always distinguish **asynchronous hardware interrupts** (external device) from **synchronous traps/exceptions** (executing instruction).',
  },
  {
    topicId: 'm1-design-booting',
    moduleId: 'm1',
    title: 'OS Design Issues (Policy vs Mechanism) & Linux Boot Sequence',
    summary:
      'Clean OS design separates Mechanism (how) from Policy (what), relies on API/ABI contracts and linkers/loaders, and initializes hardware via a deterministic 6-stage boot sequence.',
    sourceDecks: ['Silberschatz 10e Ch 2 (§2.6, 2.8–2.9)', 'VITC Past Paper: C1 Set 1-2 Q1a'],
    keyPoints: [
      '**Policy vs Mechanism**: Mechanism determines HOW to do something (e.g., hardware timer); Policy determines WHAT will be done (e.g., 10 ms vs 50 ms quantum).',
      '**API vs ABI**: API is source-level portability (POSIX C headers); ABI is binary-level compatibility (calling conventions, syscall registers, ELF binary format).',
      '6-stage Linux boot sequence: **1. Firmware (BIOS/UEFI + POST) -> 2. Bootloader (GRUB) -> 3. Kernel decompression -> 4. initramfs -> 5. Mount rootfs (`/`) -> 6. Launch PID 1 (`systemd`/`init`)**.',
      'A boot loop right after kernel load with `Unable to mount root fs` indicates a Stage 5 failure (corrupted root partition, wrong `root=UUID`, or missing storage driver in `initramfs`).',
    ],
    sections: [
      {
        heading: 'Complete 6-Stage Linux Boot Sequence',
        body: 'When power is applied, the CPU jumps to a fixed reset vector in non-volatile firmware (UEFI/BIOS). Each stage validates and hands off control to the next until PID 1 initializes user-space services.',
        diagramId: 'm1-boot-sequence',
      },
      {
        heading: 'Diagnosing Embedded Linux Boot Failures (C1 Set 1-2 Q1a)',
        body: 'In C1 Set 1-2 Q1a, a hospital embedded Linux monitor restarts continuously because the root filesystem fails to mount. Know both the failing stage and exact recovery actions.',
        table: {
          headers: ['Stage', 'Component', 'Symptom if Failed', 'Recovery / Fix'],
          rows: [
            ['1', 'BIOS/UEFI + POST', 'No display / beep error codes', 'Replace faulty RAM/hardware; verify boot order'],
            ['2', 'Bootloader (GRUB)', '`grub rescue>` prompt', 'Reinstall GRUB / fix `grub.cfg` partition path'],
            ['3–4', 'Kernel + initramfs', 'Panic before mounting storage', 'Rebuild initramfs with NVMe/ext4 storage drivers'],
            ['5', 'Mount Root FS (`/`)', '`VFS: Unable to mount root fs` -> boot loop', 'Fix kernel `root=UUID=`, run `fsck`, verify `/etc/fstab`'],
            ['6', 'init / systemd (PID 1)', 'Emergency shell / hung service', 'Boot `init=/bin/sh` or inspect `journalctl`'],
          ],
        },
      },
    ],
    workedExample: {
      title: 'Separating Policy from Mechanism in CPU Scheduling',
      problem:
        'Give two concrete OS examples showing why separating Policy from Mechanism improves maintainability.',
      solution:
        '(1) **Timer**: Hardware countdown timer is the *mechanism*; choosing a 20 ms quantum for desktop vs 100 ms for batch is the *policy*. (2) **Microkernel IPC**: Fast message passing is the *mechanism*; enforcing access permissions or scheduling priorities in user servers is the *policy*.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Slot C1 Set 1-2 Q1(a) (5M)',
        promptSummary: 'Explain Linux boot sequence, identify failing stage when rootfs is missing on a hospital monitor, and state the fix.',
        markBreakdown: '6-stage boot diagram/trace (2.5M) + Identify Stage 5 rootfs mount failure (1.5M) + Concrete recovery steps (1M)',
        solutionSteps: [
          'Trace all 6 stages: BIOS/UEFI POST -> Bootloader (GRUB) -> Kernel -> initramfs -> Mount rootfs -> init/systemd.',
          'Pinpoint failure at **Stage 5 (Mounting Root Filesystem)** — hardware, GRUB, and kernel already succeeded, but the kernel cannot mount `/` to launch `/sbin/init`.',
          'State fixes: verify bootloader `root=UUID=...`, rebuild `initramfs` with missing storage driver, boot live recovery to run `fsck` on corrupted ext4 root partition, and inspect `/etc/fstab`.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m1-db-1',
        question: 'Which process is ALWAYS started as PID 1 right after the Linux kernel mounts the real root filesystem?',
        options: ['GRUB', 'BIOS POST', 'init / systemd', 'bash'],
        correctIndex: 2,
        explanation: 'The kernel executes `/sbin/init` (typically `systemd`) as PID 1 to spawn all system daemons and user sessions.',
      },
      {
        id: 'sc-m1-db-2',
        question: 'Which component guarantees binary-level compatibility (register conventions, executable layout) across compiled programs on a platform?',
        options: ['API', 'ABI (Application Binary Interface)', 'POST', 'initramfs'],
        correctIndex: 1,
        explanation: 'ABI defines low-level binary calling conventions and syscall interfaces; API defines source-level library signatures.',
      },
    ],
    examTip: 'Always include `initramfs` between Kernel and Root FS mount — it is the exact bridge examiners expect for modern Linux booting.',
  },
];
