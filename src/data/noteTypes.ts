export type DiagramId =
  // Module 1: OS & Structure
  | 'm1-dual-mode-trap'
  | 'm1-os-structures'
  | 'm1-syscall-flow'
  | 'm1-interrupt-dma'
  | 'm1-boot-sequence'
  // Module 2: Processes, Scheduling, Threads & Deadlocks
  | 'm2-process-states'
  | 'm2-pcb-memory-layout'
  | 'm2-fork-tree'
  | 'm2-thread-models'
  | 'm2-scheduling-queues'
  | 'm2-rag-wfg'
  // Module 3: Process Synchronization
  | 'm3-ipc-models'
  | 'm3-critical-section'
  | 'm3-peterson-flow'
  | 'm3-semaphore-queue'
  | 'm3-bounded-buffer'
  | 'm3-dining-philosophers'
  | 'm3-monitor-structure'
  // Module 4: Memory & File Management
  | 'm4-mmu-relocation'
  | 'm4-paging-tlb'
  | 'm4-segmentation-hw'
  | 'm4-demand-paging-fault'
  | 'm4-thrashing-curve'
  | 'm4-directory-trees'
  | 'm4-file-allocation-inode'
  // Module 5: Devices, Security, Protection & Virtualization
  | 'm5-disk-geometry'
  | 'm5-raid-levels'
  | 'm5-security-crypto'
  | 'm5-access-matrix'
  | 'm5-virtualization-containers';

export interface NoteTable {
  headers: string[];
  rows: string[][];
}

export interface NoteSubSection {
  heading: string;
  body: string;
  table?: NoteTable;
  codeBlock?: string;
  diagramId?: DiagramId;
}

export interface FatSolvedMethod {
  paperSource: string; // e.g., "C1+TC1 Set 2-2 Q5 (15M)"
  promptSummary: string;
  markBreakdown: string;
  solutionSteps: string[];
}

export interface TopicSelfCheck {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
}

export interface TopicNote {
  topicId: string;
  moduleId: string;
  title: string;
  summary: string;
  sourceDecks: string[];
  keyPoints: string[];
  sections: NoteSubSection[];
  workedExample: {
    title: string;
    problem: string;
    solution: string;
  };
  fatQuestionMethods: FatSolvedMethod[];
  selfChecks: TopicSelfCheck[];
  examTip: string;
}
