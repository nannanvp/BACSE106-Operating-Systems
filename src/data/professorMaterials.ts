export interface CourseResourceFile {
  id: string;
  label: string;
  kind: 'syllabus' | 'slides' | 'past-paper' | 'pending-slot';
  href?: string;
  detail: string;
}

export interface ModuleStudyPack {
  moduleId: string;
  silberschatzChapters: string[];
  labExperiments: string[];
  pastPaperQuestions: string[];
  revisionChecklist: string[];
}

export const COURSE_ATTACHED_FILES: CourseResourceFile[] = [
  {
    id: 'res-syllabus',
    label: 'BACSE106 Official Syllabus (v1.0)',
    kind: 'syllabus',
    href: '/assets/aistudio/BACSE106_OPERATING-SYSTEMS_ELA_1.0_80_BACSE106_1de1c950.pdf',
    detail: 'VIT Chennai B.Tech CSE Core · 3-0-2-4 · 5 Exam Modules + 15 Lab Experiments',
  },
  {
    id: 'res-silberschatz',
    label: 'Silberschatz 10th Ed. Merged Lecture Slides (Ch 1–21)',
    kind: 'slides',
    href: '/assets/aistudio/BACSE106_Operating_Systems_PPT_to_PDF_from_Silberschatz_eb48ed04.pdf',
    detail: 'Operating System Concepts 10e converted PPT-to-PDF reference deck',
  },
  {
    id: 'res-c1-2-2',
    label: 'FAT Paper — Slot C1+TC1 Set 2-2 (Prof. Sudhakaran G)',
    kind: 'past-paper',
    href: '/assets/aistudio/BACSE106_Operating_Systems_C1_2-2_FAT_VITC_-_Copy_4a36a71b.pdf',
    detail: '4×10M + 4×15M = 100M · Preemptive Priority+CS, Banker’s 6×4, Page Repl 25-ref, Placement',
  },
  {
    id: 'res-c1-1-2',
    label: 'FAT Paper — Slot C1 Set 1-2',
    kind: 'past-paper',
    href: '/assets/aistudio/BACSE106_Operating_Systems_C1_1-2_FAT_VITC_dc52fb46.pdf',
    detail: '7×10M + 2×15M = 100M · Boot loop, Peterson’s proof, Hospital Monitor, Working Set, RAID, Disk',
  },
  {
    id: 'res-c2',
    label: 'FAT Paper — Slot C2+TC2 (Prof. Linda Joseph)',
    kind: 'past-paper',
    href: '/assets/aistudio/BACSE106_Operating_Systems_C2_FAT_VITC_6c7734d2.pdf',
    detail: '10×10M = 100M · Microkernel, FD redirection, FCFS vs RR, RAG, Bounded Buffer, TLB EAT, LOOK/C-LOOK',
  },
  {
    id: 'res-f1-pending',
    label: 'FAT Paper — Slot F1 (Pending Upload)',
    kind: 'pending-slot',
    detail: 'Slot reserved in Coverage Matrix & Paper Forensics — plug in F1 questions as soon as available',
  },
];

export const MODULE_STUDY_PACKS: Record<string, ModuleStudyPack> = {
  m1: {
    moduleId: 'm1',
    silberschatzChapters: [
      'Ch 1: Introduction (Dual-Mode, Interrupts, DMA, Multiprogramming vs Time-Sharing)',
      'Ch 2: Operating-System Structures (Services, System Calls, Monolithic/Microkernel/Modular/Hybrid, Booting)',
    ],
    labExperiments: [
      'Exp 1: Basic Linux/UNIX shell commands & system inspection',
      'Exp 2: Shell programming & I/O redirection (dup2/open/close/read/write)',
    ],
    pastPaperQuestions: [
      'C1 Set 2-2 Q1 (10M): Monolithic vs Microkernel Architecture',
      'C1 Set 1-2 Q1 (10M): Embedded Linux Boot Sequence Failure & Time-Sharing',
      'C2 Q1 (10M): Microkernel for Neuro-Stimulator + Shell Redirection Syscalls',
    ],
    revisionChecklist: [
      'Sketch Dual-Mode (mode bit 0/1) trap cycle cleanly',
      'Draw Monolithic vs Microkernel vs Hybrid with exact IPC path arrows',
      'Trace BIOS/UEFI -> POST -> Bootloader (GRUB) -> Kernel -> initramfs -> rootfs -> init/systemd',
    ],
  },
  m2: {
    moduleId: 'm2',
    silberschatzChapters: [
      'Ch 3: Processes (PCB, 5-State Diagram, Scheduling Queues, fork/exec/wait/exit)',
      'Ch 4: Threads & Concurrency (M:1, 1:1, M:M, Pthreads, Amdahl’s Law)',
      'Ch 5: CPU Scheduling (FCFS, SJF, SRTF, Priority, RR, MLQ, MLFQ)',
      'Ch 8: Deadlocks (4 Coffman Conditions, RAG, WFG, Prevention, Banker’s Algorithm, Recovery)',
    ],
    labExperiments: [
      'Exp 3: Process creation using fork(), exec(), wait(), getpid() (Orphan & Zombie)',
      'Exp 4: Multithreading using POSIX Pthreads (pthread_create / pthread_join)',
      'Exp 5: CPU Scheduling algorithms (FCFS, SJF, Priority, RR)',
      'Exp 8: Banker’s Algorithm for Deadlock Avoidance',
    ],
    pastPaperQuestions: [
      'C1 Set 2-2 Q5 (15M): Preemptive Priority with 1 ms CS Overhead',
      'C1 Set 2-2 Q7 (15M): Banker’s Algorithm (6×4) + Request2=(0,0,1,0)',
      'C1 Set 1-2 Q2 (10M): Non-Preemptive Priority vs FCFS + Aging',
      'C1 Set 1-2 Q8 (15M): Banker’s Algorithm (4×3) + RAG/WFG',
      'C2 Q2 (10M): Banking Process Lifecycle + Multithreading Models',
      'C2 Q3 (10M): 3D Printer FCFS vs Round Robin (q=10)',
      'C2 Q4 (10M): Healthcare Single-Instance RAG Deadlock Analysis',
    ],
    revisionChecklist: [
      'Practice Gantt chart with explicit CS blocks & arrivals during CS',
      'Always verify all 3 Resource-Request steps in Banker’s Algorithm',
      'Distinguish single-instance RAG cycle (necessary & sufficient) vs multi-instance (necessary only)',
    ],
  },
  m3: {
    moduleId: 'm3',
    silberschatzChapters: [
      'Ch 3 (§3.4–3.8): IPC (Shared Memory, Message Passing, Pipes, Sockets, RPC)',
      'Ch 6: Synchronization Tools (Critical Section, Peterson’s, Hardware TSL/CAS, Mutex, Semaphores, Monitors)',
      'Ch 7: Synchronization Examples (Bounded Buffer, Readers-Writers, Dining Philosophers, Sleeping Barber)',
    ],
    labExperiments: [
      'Exp 6: Inter-Process Communication (Shared Memory / Pipes / Message Queues)',
      'Exp 7: Producer-Consumer / Dining Philosophers using Semaphores & Mutex',
    ],
    pastPaperQuestions: [
      'C1 Set 2-2 Q2 (10M): Sleeping Barber Problem using Semaphores',
      'C1 Set 1-2 Q3 (10M): Peterson’s Solution Contradiction Proof & Trace',
      'C1 Set 1-2 Q4 (10M): Hospital 3-Theatre Priority Monitor with Anti-Starvation',
      'C2 Q5 (10M): Railway Booking Peterson’s State Trace (10 -> 6 seats)',
      'C2 Q6 (10M): Food Ordering Bounded Buffer (capacity 5) Semaphores',
    ],
    revisionChecklist: [
      'Memorize Peterson’s contradiction proof line-by-line (turn can hold only 0 or 1)',
      'NEVER put wait(mutex) before wait(empty)/wait(full) in Producer-Consumer',
      'Know Monitor syntax (`condition`, `wait()`, `signal()`) and Hoare vs Mesa semantics',
    ],
  },
  m4: {
    moduleId: 'm4',
    silberschatzChapters: [
      'Ch 9: Main Memory (MMU, Contiguous Allocation, First/Best/Worst/Next Fit, Paging, TLB, Segmentation)',
      'Ch 10: Virtual Memory (Demand Paging, Page Fault EAT, FIFO/LRU/OPT/Clock, Belady’s Anomaly, Thrashing, Working Set)',
      'Ch 13–15: File System Interface, Implementation, Directories, Allocation (Contiguous/Linked/Indexed Inode), Free Space',
    ],
    labExperiments: [
      'Exp 9: Contiguous Memory Allocation (First Fit, Best Fit, Worst Fit)',
      'Exp 10: Page Replacement Algorithms (FIFO, LRU, Optimal)',
      'Exp 11: File Allocation Strategies (Sequential, Indexed, Linked)',
    ],
    pastPaperQuestions: [
      'C1 Set 2-2 Q3 (10M): Thrashing Causes & Remedies',
      'C1 Set 2-2 Q6 (15M): Page Replacement FIFO/LRU/OPT (4 frames, 25 refs)',
      'C1 Set 2-2 Q8 (15M): Contiguous Placement (FF/BF/NF/WF) & External Fragmentation',
      'C1 Set 1-2 Q5 (10M): Segmentation Base/Limit Translation & Fragmentation',
      'C1 Set 1-2 Q6 (10M): Working-Set Window (Δ=5) & Thrashing Swap-Out',
      'C2 Q7 (10M): Page Replacement FIFO/OPT/LRU (4 frames, 20 refs)',
      'C2 Q8 (10M): Paging Bit Splits & TLB EAT (80% vs 95%)',
    ],
    revisionChecklist: [
      'HIGH ALERT GAP: File Allocation (Unix Inode max file size!) & Directory Structures had 0 Qs in C1/C2',
      'Double check Next Fit wrap-around pointer and strict Segmentation `offset < limit`',
      'State OPT tie-break rule explicitly when two pages are never used again',
    ],
  },
  m5: {
    moduleId: 'm5',
    silberschatzChapters: [
      'Ch 11: Mass-Storage Structure (Disk Geometry, FCFS/SSTF/SCAN/C-SCAN/LOOK/C-LOOK, RAID 0–6/10)',
      'Ch 16–17: Security & Protection (Program/Network Threats, Buffer Overflow, AES/RSA/Signatures, Access Matrix, ACL/Capabilities)',
      'Ch 18: Virtual Machines (Type 0/1/2 Hypervisors, Trap-and-Emulate, Binary Translation, Para/Full Virtualization, Containers/Docker)',
      'Ch 20–21: Contemporary OS Case Studies (Linux & Windows Kernel Internals)',
    ],
    labExperiments: [
      'Exp 12: Disk Scheduling Algorithms (FCFS, SSTF, SCAN, C-SCAN, LOOK, C-LOOK)',
      'Exp 13–15: File permissions, security utilities, and Docker/container workspace basics',
    ],
    pastPaperQuestions: [
      'C1 Set 2-2 Q4 (10M): Para-Virtualization, Full Virtualization & Docker Containers',
      'C1 Set 1-2 Q7 (10M): RAID 6 vs RAID 0 Selection & Justification',
      'C1 Set 1-2 Q9 (15M): Disk Geometry + SSTF & SCAN (1–100, 6000 RPM)',
      'C2 Q9 (10M): E-Commerce Disk LOOK, C-LOOK & SSTF (0–499, head 215 <- prev 250)',
      'C2 Q10 (10M): Containers vs Virtual Machines Architecture & Trade-offs',
    ],
    revisionChecklist: [
      'HIGH ALERT GAP: Security (Buffer Overflow, RSA/AES/Signatures) & Access Matrix had 0 Qs in C1/C2',
      'Watch disk head direction (`prev 250 -> curr 215` means moving DOWNWARD!)',
      'Distinguish SCAN (touches 0/maxTrack) vs LOOK (reverses at last request)',
    ],
  },
};
