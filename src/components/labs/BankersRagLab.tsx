import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Pause,
  Play,
  Plus,
  RotateCcw,
  ShieldAlert,
  SkipBack,
  SkipForward,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  BANKERS_PRESETS,
  BankersInput,
  BankersPreset,
  RAG_PRESETS,
  RagEdge,
  RagPreset,
  analyzeSingleInstanceRag,
  evaluateResourceRequest,
  runBankersSafety,
  validateBankersInput,
} from '../../utils/bankersEngine';

function deepCloneBankersInput(src: BankersInput): BankersInput {
  return {
    resourceNames: [...src.resourceNames],
    totalResources: [...src.totalResources],
    processIds: [...src.processIds],
    allocation: src.allocation.map((row) => [...row]),
    max: src.max.map((row) => [...row]),
  };
}

export const BankersRagLab: React.FC = () => {
  // Main Tab: Bankers Algorithm vs RAG Wait-For Graph
  const [subMode, setSubMode] = useState<'bankers' | 'rag'>('bankers');

  // --- Banker's Algorithm State ---
  const [bankersPresetIdx, setBankersPresetIdx] = useState(0);
  const activeBankersPreset: BankersPreset = BANKERS_PRESETS[bankersPresetIdx] ?? BANKERS_PRESETS[0];

  // Editable Banker's input
  const [bankersInput, setBankersInput] = useState<BankersInput>(() =>
    deepCloneBankersInput(activeBankersPreset.input)
  );

  // Resource Request State
  const [reqProcIdx, setReqProcIdx] = useState<number>(
    activeBankersPreset.sampleRequest?.processIndex ?? 0
  );
  const [reqVec, setReqVec] = useState<number[]>(
    activeBankersPreset.sampleRequest
      ? [...activeBankersPreset.sampleRequest.request]
      : activeBankersPreset.input.resourceNames.map(() => 0)
  );
  const [isRequestApplied, setIsRequestApplied] = useState(false);

  // Trace Animation State
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeedMs, setPlaySpeedMs] = useState<number>(1000);

  // --- RAG State ---
  const [ragPresetIdx, setRagPresetIdx] = useState(0);
  const activeRagPreset: RagPreset = RAG_PRESETS[ragPresetIdx] ?? RAG_PRESETS[0];
  const [ragProcesses, setRagProcesses] = useState<string[]>([...activeRagPreset.processes]);
  const [ragResources, setRagResources] = useState<string[]>([...activeRagPreset.resources]);
  const [ragEdges, setRagEdges] = useState<RagEdge[]>([...activeRagPreset.edges]);

  // Edge editor form
  const [newEdgeFrom, setNewEdgeFrom] = useState<string>('P1');
  const [newEdgeTo, setNewEdgeTo] = useState<string>('R1');
  const [newEdgeType, setNewEdgeType] = useState<'request' | 'assignment'>('request');

  // --- Banker's Calculations ---
  // Input validation
  const validation = useMemo(() => validateBankersInput(bankersInput), [bankersInput]);

  // Safety result on the current input
  const safety = useMemo(() => runBankersSafety(bankersInput), [bankersInput]);

  // Request evaluation on current input
  const reqEval = useMemo(
    () => evaluateResourceRequest(bankersInput, reqProcIdx, reqVec),
    [bankersInput, reqProcIdx, reqVec]
  );

  // RAG Analysis
  const ragResult = useMemo(
    () => analyzeSingleInstanceRag(ragProcesses, ragEdges),
    [ragProcesses, ragEdges]
  );

  // Animation Step Setup
  const totalTraceSteps = safety.trace.length;

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return;

    if (currentStep >= totalTraceSteps) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep((prev) => {
        if (prev >= totalTraceSteps - 1) {
          setIsPlaying(false);
          return totalTraceSteps;
        }
        return prev + 1;
      });
    }, playSpeedMs);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, totalTraceSteps, playSpeedMs]);

  // Load Banker's preset
  const loadBankersPreset = (idx: number) => {
    setBankersPresetIdx(idx);
    const p = BANKERS_PRESETS[idx];
    setBankersInput(deepCloneBankersInput(p.input));
    setReqProcIdx(p.sampleRequest?.processIndex ?? 0);
    setReqVec(p.sampleRequest ? [...p.sampleRequest.request] : p.input.resourceNames.map(() => 0));
    setIsRequestApplied(false);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  // Reset current matrix to original preset values
  const resetToActivePreset = () => {
    setBankersInput(deepCloneBankersInput(activeBankersPreset.input));
    setReqProcIdx(activeBankersPreset.sampleRequest?.processIndex ?? 0);
    setReqVec(
      activeBankersPreset.sampleRequest
        ? [...activeBankersPreset.sampleRequest.request]
        : activeBankersPreset.input.resourceNames.map(() => 0)
    );
    setIsRequestApplied(false);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  // Load RAG preset
  const loadRagPreset = (idx: number) => {
    setRagPresetIdx(idx);
    const p = RAG_PRESETS[idx];
    setRagProcesses([...p.processes]);
    setRagResources([...p.resources]);
    setRagEdges([...p.edges]);
    setNewEdgeFrom(p.processes[0] ?? 'P1');
    setNewEdgeTo(p.resources[0] ?? 'R1');
  };

  // Matrix cell editor helpers
  const updateAllocationCell = (pIdx: number, rIdx: number, val: number) => {
    setBankersInput((prev) => {
      const nextAlloc = prev.allocation.map((row, i) =>
        i === pIdx ? row.map((v, j) => (j === rIdx ? Math.max(0, val) : v)) : [...row]
      );
      return { ...prev, allocation: nextAlloc };
    });
    setIsRequestApplied(false);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const updateMaxCell = (pIdx: number, rIdx: number, val: number) => {
    setBankersInput((prev) => {
      const nextMax = prev.max.map((row, i) =>
        i === pIdx ? row.map((v, j) => (j === rIdx ? Math.max(0, val) : v)) : [...row]
      );
      return { ...prev, max: nextMax };
    });
    setIsRequestApplied(false);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const updateTotalResource = (rIdx: number, val: number) => {
    setBankersInput((prev) => {
      const nextTot = prev.totalResources.map((t, j) => (j === rIdx ? Math.max(0, val) : t));
      return { ...prev, totalResources: nextTot };
    });
    setIsRequestApplied(false);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const addProcessRow = () => {
    setBankersInput((prev) => {
      const nextPid = `P${prev.processIds.length}`;
      const m = prev.resourceNames.length;
      return {
        ...prev,
        processIds: [...prev.processIds, nextPid],
        allocation: [...prev.allocation, new Array(m).fill(0)],
        max: [...prev.max, new Array(m).fill(1)],
      };
    });
    setIsRequestApplied(false);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const removeProcessRow = (idx: number) => {
    if (bankersInput.processIds.length <= 2) return;
    setBankersInput((prev) => ({
      ...prev,
      processIds: prev.processIds.filter((_, i) => i !== idx),
      allocation: prev.allocation.filter((_, i) => i !== idx),
      max: prev.max.filter((_, i) => i !== idx),
    }));
    if (reqProcIdx >= bankersInput.processIds.length - 1) {
      setReqProcIdx(0);
    }
    setIsRequestApplied(false);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  // Toggle applying request to the live matrix
  const toggleApplyRequest = () => {
    if (isRequestApplied) {
      // Revert to original active preset
      resetToActivePreset();
    } else {
      // Apply request
      setBankersInput((prev) => {
        const nextAlloc = prev.allocation.map((row, i) =>
          i === reqProcIdx ? row.map((v, j) => v + (reqVec[j] ?? 0)) : [...row]
        );
        return { ...prev, allocation: nextAlloc };
      });
      setIsRequestApplied(true);
      setCurrentStep(0);
      setIsPlaying(false);
    }
  };

  // Derived trace state for animation
  const activeStepDetail = currentStep > 0 && currentStep <= safety.trace.length
    ? safety.trace[currentStep - 1]
    : null;

  const currentWorkVector = useMemo(() => {
    if (currentStep === 0) return [...safety.available];
    if (activeStepDetail) return [...activeStepDetail.workAfter];
    if (safety.trace.length > 0) return [...safety.trace[safety.trace.length - 1].workAfter];
    return [...safety.available];
  }, [currentStep, safety.available, activeStepDetail, safety.trace]);

  const finishedPidsSet = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < currentStep && i < safety.trace.length; i += 1) {
      set.add(safety.trace[i].processId);
    }
    return set;
  }, [currentStep, safety.trace]);

  // RAG node positioning helper
  const ragNodePositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number; isProcess: boolean }>();
    const np = ragProcesses.length;
    const nr = ragResources.length;

    // Arrange processes on left / top arc, resources on right / bottom arc
    ragProcesses.forEach((p, idx) => {
      const angle = (idx / Math.max(1, np)) * Math.PI * 1.5 + Math.PI * 0.25;
      const x = 240 + 170 * Math.cos(angle);
      const y = 180 + 110 * Math.sin(angle);
      map.set(p, { x, y, isProcess: true });
    });

    ragResources.forEach((r, idx) => {
      const angle = (idx / Math.max(1, nr)) * Math.PI * 1.5 + Math.PI * 1.25;
      const x = 240 + 120 * Math.cos(angle);
      const y = 180 + 80 * Math.sin(angle);
      map.set(r, { x, y, isProcess: false });
    });

    return map;
  }, [ragProcesses, ragResources]);

  // Add edge in RAG
  const handleAddEdge = () => {
    const exists = ragEdges.some(
      (e) => e.from === newEdgeFrom && e.to === newEdgeTo && e.type === newEdgeType
    );
    if (!exists) {
      setRagEdges((prev) => [...prev, { from: newEdgeFrom, to: newEdgeTo, type: newEdgeType }]);
    }
  };

  const handleRemoveEdge = (idx: number) => {
    setRagEdges((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      {/* Top Level Lab Navigation & Mode Switcher */}
      <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSubMode('bankers')}
            className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-[2px] border transition-colors ${
              subMode === 'bankers'
                ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
            }`}
          >
            Banker&apos;s Safety &amp; Resource-Request Workbench
          </button>
          <button
            type="button"
            onClick={() => setSubMode('rag')}
            className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-[2px] border transition-colors ${
              subMode === 'rag'
                ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                : 'bg-[var(--bg-sheet)] text-[var(--ink-secondary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
            }`}
          >
            RAG → Wait-For Graph Cycle Detector (C2 Q4)
          </button>
        </div>

        <div className="text-[11px] font-mono text-[var(--ink-muted)]">
          {subMode === 'bankers' ? (
            <span>Strict 7:5 Asymmetric Workbench · Silberschatz §8.6.3 &amp; VIT C1/C2 FAT</span>
          ) : (
            <span>Single-Instance Deadlock Detection · Silberschatz §8.5 &amp; VIT C2 Q4</span>
          )}
        </div>
      </div>

      {subMode === 'bankers' ? (
        /* ======================================================================
           STRICT 7:5 ASYMMETRIC WORKBENCH — BANKER'S ALGORITHM
           Left 7 Columns: Live Allocation, Max, Available, Dynamic Need & Work Safety Trace
           Right 5 Columns: Matrix Editor, Dynamic Resource-Request Evaluator & Presets
           ====================================================================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ------------------------------------------------------------------
              LEFT 7 COLUMNS: Live Vectors, Dynamic Matrix, Safety Trace Animation
              ------------------------------------------------------------------ */}
          <div className="lg:col-span-7 space-y-4">
            {/* System Vectors KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs tabular-nums">
              <div className="p-3 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px]">
                <div className="text-[11px] text-[var(--ink-muted)] uppercase tracking-wider">
                  Total Vector (E)
                </div>
                <div className="text-sm font-bold text-[var(--ink-primary)] mt-1">
                  ({bankersInput.totalResources.join(', ')})
                </div>
                <div className="text-[10px] text-[var(--ink-muted)] mt-0.5">
                  {bankersInput.resourceNames.join(', ')}
                </div>
              </div>

              <div className="p-3 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px]">
                <div className="text-[11px] text-[var(--ink-muted)] uppercase tracking-wider">
                  Allocated (ΣAlloc)
                </div>
                <div className="text-sm font-bold text-[var(--ink-secondary)] mt-1">
                  ({safety.totalAllocated.join(', ')})
                </div>
                <div className="text-[10px] text-[var(--ink-muted)] mt-0.5">
                  Sum over all P_i
                </div>
              </div>

              <div className="p-3 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px]">
                <div className="text-[11px] text-[var(--ink-muted)] uppercase tracking-wider">
                  Initial Available
                </div>
                <div className="text-sm font-bold text-[var(--div-m4)] mt-1">
                  ({safety.available.join(', ')})
                </div>
                <div className="text-[10px] text-[var(--ink-muted)] mt-0.5">
                  Total - ΣAlloc
                </div>
              </div>

              <div className="p-3 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px]">
                <div className="text-[11px] text-[var(--ink-muted)] uppercase tracking-wider">
                  Current Work (Trace)
                </div>
                <div className="text-sm font-bold text-[var(--div-m2)] mt-1">
                  ({currentWorkVector.join(', ')})
                </div>
                <div className="text-[10px] text-[var(--ink-muted)] mt-0.5">
                  At Step {currentStep}/{totalTraceSteps}
                </div>
              </div>
            </div>

            {/* Safety Status Banner */}
            <div
              className={`p-3 rounded-[2px] border flex items-center justify-between font-mono text-xs ${
                safety.isSafe
                  ? 'bg-[var(--bg-paper)] border-[var(--div-m3)] text-[var(--ink-primary)]'
                  : 'bg-[var(--bg-sheet)] border-[var(--div-danger)] text-[var(--div-danger)]'
              }`}
            >
              <div className="flex items-center gap-2">
                {safety.isSafe ? (
                  <CheckCircle2 className="w-4 h-4 text-[var(--div-m3)] shrink-0" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-[var(--div-danger)] shrink-0" />
                )}
                <div>
                  <span className="font-bold">
                    {safety.isSafe ? 'SYSTEM IN SAFE STATE' : 'DEADLOCK / UNSAFE STATE'}
                  </span>
                  <span className="text-[var(--ink-secondary)] ml-2">
                    {safety.isSafe
                      ? `At least one safe sequence exists: <${safety.safeSequence.join(', ')}>`
                      : `No safe sequence found. Unfinished: {${safety.unfinishedProcesses.join(', ')}}`}
                  </span>
                </div>
              </div>

              {isRequestApplied && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-[2px] bg-[var(--div-m2)] text-white">
                  Hypothetical Request Active
                </span>
              )}
            </div>

            {/* Validation Warnings (if user edits matrix invalidly) */}
            {!validation.isValid && (
              <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--div-danger)] rounded-[2px] font-mono text-xs space-y-1 text-[var(--div-danger)]">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> Input Matrix Invalidation:
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                  {validation.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Live Process Matrices Table: Allocation, Max, Dynamic Need */}
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] overflow-hidden">
              <div className="px-3.5 py-2.5 bg-[var(--bg-board)] border-b border-[var(--rule-hairline)] flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-[var(--ink-primary)]">
                    Live System Matrices &amp; Dynamic Need Matrix
                  </span>
                  <span className="font-mono text-[11px] text-[var(--ink-muted)] ml-2">
                    Need[i][j] = Max[i][j] - Allocation[i][j]
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[var(--ink-muted)]">
                  Resources: {bankersInput.resourceNames.join(', ')}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs tabular-nums">
                  <thead>
                    <tr className="bg-[var(--bg-recessed)] border-b border-[var(--rule-strong)] text-[11px]">
                      <th className="px-3 py-2">PID</th>
                      <th className="px-3 py-2">
                        Allocation ({bankersInput.resourceNames.join(', ')})
                      </th>
                      <th className="px-3 py-2">Max Claim ({bankersInput.resourceNames.join(', ')})</th>
                      <th className="px-3 py-2 font-bold text-[var(--div-m4)]">
                        Dynamic Need (Max - Alloc)
                      </th>
                      <th className="px-3 py-2 text-center">Trace Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--rule-hairline)]">
                    {bankersInput.processIds.map((pid, i) => {
                      const isFinished = finishedPidsSet.has(pid);
                      const isActiveStep = activeStepDetail?.processId === pid;
                      const isSelectedForReq = reqProcIdx === i;

                      return (
                        <tr
                          key={pid}
                          className={`transition-colors ${
                            isActiveStep
                              ? 'bg-[var(--bg-recessed)] border-l-4 border-l-[var(--div-m2)]'
                              : isSelectedForReq
                                ? 'bg-[var(--bg-sheet)] border-l-2 border-l-[var(--rule-strong)]'
                                : 'hover:bg-[var(--bg-sheet)]'
                          }`}
                        >
                          <td className="px-3 py-2.5 font-bold text-[var(--ink-primary)]">
                            <span className="inline-flex items-center gap-1">
                              {pid}
                              {isSelectedForReq && (
                                <span className="text-[10px] text-[var(--div-m2)] font-semibold">
                                  [Req]
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-[var(--ink-secondary)]">
                            ({bankersInput.allocation[i]?.join(', ')})
                          </td>
                          <td className="px-3 py-2.5 text-[var(--ink-secondary)]">
                            ({bankersInput.max[i]?.join(', ')})
                          </td>
                          <td className="px-3 py-2.5 font-bold text-[var(--div-m4)]">
                            ({safety.need[i]?.join(', ')})
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {isFinished ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-[2px] bg-[var(--bg-sheet)] text-[var(--div-m3)] border border-[var(--div-m3)]">
                                <Check className="w-3 h-3" /> Finished
                              </span>
                            ) : isActiveStep ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-[2px] bg-[var(--div-m2)] text-white">
                                Active Step
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] text-[var(--ink-muted)] rounded-[2px] bg-[var(--bg-sheet)] border border-[var(--rule-hairline)]">
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Step-by-Step Work Vector Safety Trace Animation Workbench */}
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--rule-hairline)] pb-2.5">
                <div>
                  <h3 className="font-mono text-xs font-bold text-[var(--ink-primary)] uppercase tracking-wider">
                    Safety Algorithm Execution Trace &amp; Work Vector Evolution
                  </h3>
                  <p className="font-mono text-[11px] text-[var(--ink-muted)]">
                    Work_0 = Available · Test Need[i] ≤ Work · Work_new = Work + Allocation[i]
                  </p>
                </div>

                {/* Animation Stepper Controls */}
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentStep(0);
                    }}
                    title="Reset to Step 0"
                    className="p-1.5 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)]"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentStep((s) => Math.max(0, s - 1));
                    }}
                    disabled={currentStep <= 0}
                    title="Previous Step"
                    className="p-1.5 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)] disabled:opacity-40"
                  >
                    <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    title={isPlaying ? 'Pause' : 'Play Trace Animation'}
                    className={`px-2.5 py-1 font-semibold rounded-[2px] border inline-flex items-center gap-1 transition-colors ${
                      isPlaying
                        ? 'bg-[var(--div-m2)] text-white border-[var(--div-m2)]'
                        : 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                    }`}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlaying ? 'Pause' : 'Play Trace'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentStep((s) => Math.min(totalTraceSteps, s + 1));
                    }}
                    disabled={currentStep >= totalTraceSteps}
                    title="Next Step"
                    className="p-1.5 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)] disabled:opacity-40"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentStep(totalTraceSteps);
                    }}
                    title="Jump to Finish"
                    className="p-1.5 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)]"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>

                  {/* Playback speed selector */}
                  <div className="flex items-center ml-2 border border-[var(--rule-hairline)] rounded-[2px] overflow-hidden text-[11px]">
                    <button
                      type="button"
                      onClick={() => setPlaySpeedMs(1500)}
                      className={`px-1.5 py-0.5 ${
                        playSpeedMs === 1500
                          ? 'bg-[var(--ink-primary)] text-white'
                          : 'bg-[var(--bg-sheet)] text-[var(--ink-muted)]'
                      }`}
                    >
                      0.5x
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlaySpeedMs(1000)}
                      className={`px-1.5 py-0.5 ${
                        playSpeedMs === 1000
                          ? 'bg-[var(--ink-primary)] text-white'
                          : 'bg-[var(--bg-sheet)] text-[var(--ink-muted)]'
                      }`}
                    >
                      1.0x
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlaySpeedMs(500)}
                      className={`px-1.5 py-0.5 ${
                        playSpeedMs === 500
                          ? 'bg-[var(--ink-primary)] text-white'
                          : 'bg-[var(--bg-sheet)] text-[var(--ink-muted)]'
                      }`}
                    >
                      2.0x
                    </button>
                  </div>
                </div>
              </div>

              {/* Step Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between font-mono text-[11px] text-[var(--ink-muted)]">
                  <span>
                    Trace Progress: Step {currentStep} of {totalTraceSteps}
                  </span>
                  <span>
                    {totalTraceSteps > 0
                      ? Math.round((currentStep / totalTraceSteps) * 100)
                      : 0}
                    % Complete
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[var(--bg-recessed)] rounded-[1px] overflow-hidden">
                  <div
                    className="h-full bg-[var(--div-m3)] transition-all duration-300"
                    style={{
                      width: `${
                        totalTraceSteps > 0 ? (currentStep / totalTraceSteps) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Active Step Details Card */}
              <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] font-mono text-xs space-y-2">
                {currentStep === 0 ? (
                  <div className="space-y-1 text-[var(--ink-secondary)]">
                    <div className="font-bold text-[var(--ink-primary)]">
                      Initial State (Step 0):
                    </div>
                    <div>
                      Work vector initialized to Available = ({safety.available.join(', ')}).
                    </div>
                    <div>
                      Finish[i] = false for all {bankersInput.processIds.length} processes.
                    </div>
                    <div className="text-[11px] text-[var(--ink-muted)]">
                      Press <strong>Play Trace</strong> or <strong>Next Step</strong> to evaluate candidates where Need[i] ≤ Work.
                    </div>
                  </div>
                ) : activeStepDetail ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--ink-primary)] text-sm">
                        Step {activeStepDetail.step}: Process {activeStepDetail.processId}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-[2px] bg-[var(--div-m3)] text-white">
                        Need ≤ Work Satisfied
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-[var(--bg-paper)] p-2.5 rounded-[2px] border border-[var(--rule-hairline)]">
                      <div>
                        <div className="text-[var(--ink-muted)]">Condition Check:</div>
                        <div className="font-bold text-[var(--ink-primary)] mt-0.5">
                          Need[{activeStepDetail.processId}] ({activeStepDetail.need.join(', ')}) ≤ Work ({activeStepDetail.workBefore.join(', ')})
                        </div>
                      </div>
                      <div>
                        <div className="text-[var(--ink-muted)]">Resource Deallocation:</div>
                        <div className="font-bold text-[var(--div-m4)] mt-0.5">
                          Work = ({activeStepDetail.workBefore.join(', ')}) + Alloc ({activeStepDetail.allocation.join(', ')})
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <div>
                        Updated Work vector: <strong>({activeStepDetail.workAfter.join(', ')})</strong>
                      </div>
                      <div className="text-[var(--div-m3)] font-bold">
                        Finish[{activeStepDetail.processId}] = true
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-[var(--div-danger)]">
                    <div className="font-bold">No progress possible at this state.</div>
                    <div className="text-[11px]">
                      Remaining unfinished processes: {safety.unfinishedProcesses.join(', ')}.
                    </div>
                  </div>
                )}
              </div>

              {/* Safe Sequence Derivation Ribbon */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-mono font-bold text-[var(--ink-primary)] uppercase tracking-wider flex items-center justify-between">
                  <span>Safe Sequence Derivation</span>
                  <span className="text-[var(--ink-muted)] font-normal text-[10px]">
                    {currentStep === totalTraceSteps && safety.isSafe
                      ? 'Fully Derived'
                      : `Derived ${finishedPidsSet.size}/${safety.safeSequence.length}`}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                  <span className="text-[var(--ink-muted)] font-bold">&lt;</span>
                  {safety.safeSequence.length > 0 ? (
                    safety.safeSequence.map((pid, idx) => {
                      const isReached = idx < currentStep;
                      return (
                        <React.Fragment key={pid}>
                          <span
                            className={`px-2 py-1 rounded-[2px] font-bold transition-all ${
                              isReached
                                ? 'bg-[var(--div-m3)] text-white shadow-xs'
                                : 'bg-[var(--bg-sheet)] text-[var(--ink-muted)] border border-dashed border-[var(--rule-strong)] opacity-60'
                            }`}
                          >
                            {pid}
                          </span>
                          {idx < safety.safeSequence.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-[var(--ink-muted)]" />
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <span className="text-[var(--div-danger)] font-bold text-xs">
                      No safe sequence (System in Unsafe / Deadlock State)
                    </span>
                  )}
                  <span className="text-[var(--ink-muted)] font-bold">&gt;</span>
                </div>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------
              RIGHT 5 COLUMNS: Matrix Editor, Dynamic Resource-Request Evaluator, Presets
              ------------------------------------------------------------------ */}
          <div className="lg:col-span-5 space-y-4">
            {/* 1-Click Real Exam Presets */}
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-[var(--rule-hairline)] pb-2">
                <span className="font-mono text-xs font-bold text-[var(--ink-primary)] uppercase tracking-wider">
                  1-Click Real Exam Presets
                </span>
                <span className="text-[10px] font-mono text-[var(--ink-muted)]">VIT FAT Questions</span>
              </div>

              <div className="space-y-1.5 font-mono text-xs">
                {BANKERS_PRESETS.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => loadBankersPreset(idx)}
                    className={`w-full text-left p-2.5 rounded-[2px] border transition-colors flex flex-col gap-0.5 ${
                      bankersPresetIdx === idx
                        ? 'bg-[var(--bg-sheet)] border-[var(--div-m2)] text-[var(--ink-primary)]'
                        : 'bg-[var(--bg-paper)] border-[var(--rule-hairline)] text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span>{p.label}</span>
                      {bankersPresetIdx === idx && (
                        <span className="text-[10px] font-semibold text-[var(--div-m2)]">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[var(--ink-muted)]">{p.source}</div>
                    {p.sampleRequest && (
                      <div className="text-[10px] text-[var(--div-m4)] mt-0.5 font-semibold">
                        Includes: {p.sampleRequest.label}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Resource-Request Evaluator (Banker's 3-Step Test) */}
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4 space-y-3.5">
              <div className="border-b border-[var(--rule-hairline)] pb-2">
                <h3 className="font-mono text-xs font-bold text-[var(--ink-primary)] uppercase tracking-wider flex items-center justify-between">
                  <span>Dynamic Resource-Request Evaluator</span>
                  <span className="text-[10px] font-semibold text-[var(--div-m2)]">Banker&apos;s 3-Step</span>
                </h3>
                <p className="font-mono text-[11px] text-[var(--ink-muted)] mt-0.5">
                  Test whether an immediate request from Process P_i can be safely granted.
                </p>
              </div>

              {/* Request Parameters Form */}
              <div className="space-y-3 font-mono text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-1.5 font-bold text-[var(--ink-primary)]">
                    Requesting Process:
                    <select
                      value={reqProcIdx}
                      onChange={(e) => {
                        setReqProcIdx(Number(e.target.value));
                        setIsRequestApplied(false);
                      }}
                      className="px-2.5 py-1 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] text-[var(--ink-primary)] font-bold"
                    >
                      {bankersInput.processIds.map((pid, idx) => (
                        <option key={pid} value={idx}>
                          {pid} (Need: {safety.need[idx]?.join(',')})
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Quick Preset Request Button */}
                  {activeBankersPreset.sampleRequest && (
                    <button
                      type="button"
                      onClick={() => {
                        setReqProcIdx(activeBankersPreset.sampleRequest!.processIndex);
                        setReqVec([...activeBankersPreset.sampleRequest!.request]);
                        setIsRequestApplied(false);
                      }}
                      className="text-[10px] font-bold px-2 py-1 rounded-[2px] bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)]"
                    >
                      Load Exam Request
                    </button>
                  )}
                </div>

                {/* Request Vector Inputs */}
                <div>
                  <div className="text-[11px] text-[var(--ink-muted)] mb-1.5">
                    Request Vector Request[{bankersInput.processIds[reqProcIdx] ?? 'Pi'}]:
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {bankersInput.resourceNames.map((rName, rIdx) => (
                      <div
                        key={rName}
                        className="p-1.5 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] flex items-center justify-between"
                      >
                        <span className="font-bold text-[var(--ink-primary)]">{rName}:</span>
                        <input
                          type="number"
                          min={0}
                          max={15}
                          value={reqVec[rIdx] ?? 0}
                          onChange={(e) => {
                            const next = [...reqVec];
                            next[rIdx] = Math.max(0, Number(e.target.value) || 0);
                            setReqVec(next);
                            setIsRequestApplied(false);
                          }}
                          className="w-12 px-1 py-0.5 text-right font-bold rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-paper)] tabular-nums"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3-Step Banker's Test Breakdown */}
                <div className="bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] p-3 space-y-2 text-[11px]">
                  <div className="font-bold text-[var(--ink-primary)] text-xs border-b border-[var(--rule-hairline)] pb-1">
                    Banker&apos;s Algorithm 3-Step Verification:
                  </div>

                  {/* Condition 1: Request <= Need */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-[var(--ink-primary)]">
                        1. Request ≤ Need[{bankersInput.processIds[reqProcIdx]}] ?
                      </div>
                      <div className="text-[var(--ink-muted)]">
                        ({reqVec.join(', ')}) ≤ ({safety.need[reqProcIdx]?.join(', ')})
                      </div>
                    </div>
                    <div>
                      {reqEval.step1Pass ? (
                        <span className="inline-flex items-center gap-1 text-[var(--div-m3)] font-bold">
                          <Check className="w-3.5 h-3.5" /> PASS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[var(--div-danger)] font-bold">
                          <XCircle className="w-3.5 h-3.5" /> ERROR
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Condition 2: Request <= Available */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-[var(--ink-primary)]">
                        2. Request ≤ Available ?
                      </div>
                      <div className="text-[var(--ink-muted)]">
                        ({reqVec.join(', ')}) ≤ ({safety.available.join(', ')})
                      </div>
                    </div>
                    <div>
                      {reqEval.step2Pass ? (
                        <span className="inline-flex items-center gap-1 text-[var(--div-m3)] font-bold">
                          <Check className="w-3.5 h-3.5" /> PASS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[var(--div-m2)] font-bold">
                          <Pause className="w-3.5 h-3.5" /> WAIT
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Condition 3: Safety check of tentative state */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-[var(--ink-primary)]">
                        3. Tentative State Safety Check ?
                      </div>
                      <div className="text-[var(--ink-muted)]">
                        Available&apos; = ({safety.available.map((a, j) => a - (reqVec[j] ?? 0)).join(', ')})
                      </div>
                    </div>
                    <div>
                      {reqEval.step3Pass ? (
                        <span className="inline-flex items-center gap-1 text-[var(--div-m3)] font-bold">
                          <Check className="w-3.5 h-3.5" /> SAFE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[var(--div-danger)] font-bold">
                          <XCircle className="w-3.5 h-3.5" /> UNSAFE
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Verdict Box & Apply Button */}
                <div
                  className={`p-3 rounded-[2px] border space-y-2 ${
                    reqEval.granted
                      ? 'bg-[var(--bg-sheet)] border-[var(--div-m3)]'
                      : 'bg-[var(--bg-sheet)] border-[var(--div-danger)]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    {reqEval.granted ? (
                      <span className="inline-flex items-center gap-1 text-[var(--div-m3)]">
                        <CheckCircle2 className="w-4 h-4" /> REQUEST CAN BE GRANTED IMMEDIATELY
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[var(--div-danger)]">
                        <XCircle className="w-4 h-4" /> REQUEST CANNOT BE GRANTED (DENIED)
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[var(--ink-secondary)] leading-relaxed">
                    {reqEval.reason}
                  </div>

                  {/* Action Button: Apply / Revert */}
                  <button
                    type="button"
                    onClick={toggleApplyRequest}
                    className={`w-full py-1.5 px-3 rounded-[2px] text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                      isRequestApplied
                        ? 'bg-[var(--div-m2)] text-white border-[var(--div-m2)]'
                        : 'bg-[var(--bg-paper)] text-[var(--ink-primary)] border-[var(--rule-strong)] hover:bg-[var(--bg-recessed)]'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>
                      {isRequestApplied
                        ? 'Revert Applied Request'
                        : 'Tentatively Apply Request to Live Matrix'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Matrix Editor */}
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--rule-hairline)] pb-2">
                <span className="font-mono text-xs font-bold text-[var(--ink-primary)] uppercase tracking-wider">
                  Live Matrix Editor
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={addProcessRow}
                    className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-recessed)] inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Process
                  </button>
                  <button
                    type="button"
                    onClick={resetToActivePreset}
                    title="Reset to Preset Default"
                    className="p-1 text-[11px] font-mono rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Total Resources Editor */}
              <div className="space-y-1.5 font-mono text-xs">
                <div className="text-[11px] text-[var(--ink-muted)] font-bold">
                  Total System Instances:
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {bankersInput.resourceNames.map((rName, rIdx) => (
                    <div
                      key={rName}
                      className="p-1 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] flex items-center justify-between"
                    >
                      <span className="font-bold text-[var(--ink-primary)] text-[11px]">{rName}:</span>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={bankersInput.totalResources[rIdx] ?? 0}
                        onChange={(e) => updateTotalResource(rIdx, Number(e.target.value) || 1)}
                        className="w-12 px-1 py-0.5 text-right font-bold rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-paper)] tabular-nums"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Matrix Table Editor */}
              <div className="space-y-2 font-mono text-xs overflow-x-auto max-h-[300px] overflow-y-auto pr-1">
                <div className="text-[11px] text-[var(--ink-muted)] font-bold">
                  Process Allocation &amp; Max Claim Editors:
                </div>
                <table className="w-full text-left border-collapse text-xs tabular-nums">
                  <thead>
                    <tr className="bg-[var(--bg-recessed)] text-[10px] text-[var(--ink-muted)]">
                      <th className="p-1.5">PID</th>
                      <th className="p-1.5">Alloc ({bankersInput.resourceNames.join(',')})</th>
                      <th className="p-1.5">Max ({bankersInput.resourceNames.join(',')})</th>
                      <th className="p-1.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--rule-hairline)] text-[11px]">
                    {bankersInput.processIds.map((pid, i) => (
                      <tr key={pid}>
                        <td className="p-1.5 font-bold text-[var(--ink-primary)]">{pid}</td>
                        <td className="p-1.5">
                          <div className="flex items-center gap-1">
                            {bankersInput.resourceNames.map((_, j) => (
                              <input
                                key={j}
                                type="number"
                                min={0}
                                max={20}
                                value={bankersInput.allocation[i]?.[j] ?? 0}
                                onChange={(e) =>
                                  updateAllocationCell(i, j, Number(e.target.value) || 0)
                                }
                                className="w-8 px-1 py-0.5 text-center rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)]"
                              />
                            ))}
                          </div>
                        </td>
                        <td className="p-1.5">
                          <div className="flex items-center gap-1">
                            {bankersInput.resourceNames.map((_, j) => (
                              <input
                                key={j}
                                type="number"
                                min={0}
                                max={20}
                                value={bankersInput.max[i]?.[j] ?? 0}
                                onChange={(e) =>
                                  updateMaxCell(i, j, Number(e.target.value) || 0)
                                }
                                className="w-8 px-1 py-0.5 text-center rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-sheet)]"
                              />
                            ))}
                          </div>
                        </td>
                        <td className="p-1.5 text-right">
                          {bankersInput.processIds.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeProcessRow(i)}
                              className="text-[var(--ink-muted)] hover:text-[var(--div-danger)] p-0.5"
                              title={`Remove ${pid}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ======================================================================
           STRICT 7:5 ASYMMETRIC WORKBENCH — RESOURCE ALLOCATION GRAPH (RAG)
           Left 7 Columns: Interactive SVG Graph, Collapsed WFG, Deadlock Analysis
           Right 5 Columns: RAG Edge Editor, Presets & Exam Case Study
           ====================================================================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ------------------------------------------------------------------
              LEFT 7 COLUMNS: Interactive RAG Diagram, Collapsed Wait-For Graph, Cycle Analysis
              ------------------------------------------------------------------ */}
          <div className="lg:col-span-7 space-y-4">
            {/* Status & Single-Instance Deadlock Verdict */}
            <div
              className={`p-3.5 rounded-[2px] border flex items-start gap-3 font-mono text-xs ${
                ragResult.hasCycle
                  ? 'bg-[var(--bg-sheet)] border-[var(--div-danger)] text-[var(--div-danger)]'
                  : 'bg-[var(--bg-paper)] border-[var(--div-m3)] text-[var(--ink-primary)]'
              }`}
            >
              {ragResult.hasCycle ? (
                <ShieldAlert className="w-5 h-5 text-[var(--div-danger)] shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-[var(--div-m3)] shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-bold text-sm">
                  {ragResult.hasCycle
                    ? 'DEADLOCK DETECTED: Single-Instance Cycle Present'
                    : 'ACYCLIC GRAPH: System Deadlock-Free'}
                </div>
                <div className="text-[11px] text-[var(--ink-secondary)] leading-relaxed">
                  {ragResult.hasCycle ? (
                    <>
                      Silberschatz Single-Instance Theorem: Since each resource has exactly 1 instance, a cycle is a{' '}
                      <strong>necessary and sufficient condition</strong> for deadlock. Cycle nodes:{' '}
                      <strong className="text-[var(--div-danger)]">
                        {ragResult.cycleNodes.join(' → ')} → {ragResult.cycleNodes[0]}
                      </strong>
                      .
                    </>
                  ) : (
                    'No directed cycles exist in the Wait-For Graph. All waiting processes can eventually acquire resources and finish.'
                  )}
                </div>
              </div>
            </div>

            {/* Interactive SVG Diagram of the RAG */}
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-[var(--rule-hairline)] pb-2 font-mono text-xs">
                <span className="font-bold text-[var(--ink-primary)]">
                  Resource Allocation Graph (RAG) Visualizer
                </span>
                <div className="flex items-center gap-3 text-[11px] text-[var(--ink-muted)]">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--div-m2)] inline-block" /> Process (Circle)
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-[1px] bg-[var(--div-m4)] inline-block" /> Resource (Box)
                  </span>
                </div>
              </div>

              {/* SVG Canvas */}
              <div className="w-full overflow-x-auto">
                <svg
                  viewBox="0 0 480 320"
                  className="w-full h-auto max-h-[360px] bg-[var(--bg-sheet)] rounded-[2px] border border-[var(--rule-hairline)]"
                  role="img"
                  aria-label="Resource Allocation Graph"
                >
                  <defs>
                    <marker
                      id="arrow-request"
                      viewBox="0 0 10 10"
                      refX="18"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--div-m5)" />
                    </marker>
                    <marker
                      id="arrow-assignment"
                      viewBox="0 0 10 10"
                      refX="18"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--div-m3)" />
                    </marker>
                    <marker
                      id="arrow-cycle"
                      viewBox="0 0 10 10"
                      refX="18"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--div-danger)" />
                    </marker>
                  </defs>

                  {/* Edges */}
                  {ragEdges.map((e, idx) => {
                    const fromPos = ragNodePositions.get(e.from);
                    const toPos = ragNodePositions.get(e.to);
                    if (!fromPos || !toPos) return null;

                    const isCycleEdge =
                      ragResult.cycleNodes.includes(e.from) &&
                      ragResult.cycleNodes.includes(e.to);

                    const strokeColor = isCycleEdge
                      ? 'var(--div-danger)'
                      : e.type === 'request'
                        ? 'var(--div-m5)'
                        : 'var(--div-m3)';

                    const marker = isCycleEdge
                      ? 'url(#arrow-cycle)'
                      : e.type === 'request'
                        ? 'url(#arrow-request)'
                        : 'url(#arrow-assignment)';

                    return (
                      <g key={idx}>
                        <line
                          x1={fromPos.x}
                          y1={fromPos.y}
                          x2={toPos.x}
                          y2={toPos.y}
                          stroke={strokeColor}
                          strokeWidth={isCycleEdge ? 2.5 : 1.5}
                          strokeDasharray={e.type === 'request' ? '4 2' : undefined}
                          markerEnd={marker}
                        />
                      </g>
                    );
                  })}

                  {/* Resource Nodes (Rectangles) */}
                  {ragResources.map((r) => {
                    const pos = ragNodePositions.get(r);
                    if (!pos) return null;
                    return (
                      <g key={r} transform={`translate(${pos.x}, ${pos.y})`}>
                        <rect
                          x={-20}
                          y={-20}
                          width={40}
                          height={40}
                          rx={3}
                          fill="var(--bg-paper)"
                          stroke="var(--div-m4)"
                          strokeWidth={2}
                        />
                        <circle cx={0} cy={-5} r={3} fill="var(--div-m4)" />
                        <text
                          x={0}
                          y={12}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="700"
                          fontFamily="monospace"
                          fill="var(--ink-primary)"
                        >
                          {r}
                        </text>
                      </g>
                    );
                  })}

                  {/* Process Nodes (Circles) */}
                  {ragProcesses.map((p) => {
                    const pos = ragNodePositions.get(p);
                    if (!pos) return null;
                    const isDeadlocked = ragResult.deadlockedProcesses.includes(p);
                    const isWaiting = ragResult.waitingProcesses.includes(p);

                    const fill = isDeadlocked
                      ? 'var(--bg-sheet)'
                      : isWaiting
                        ? 'var(--bg-recessed)'
                        : 'var(--bg-paper)';

                    const stroke = isDeadlocked
                      ? 'var(--div-danger)'
                      : isWaiting
                        ? 'var(--div-m2)'
                        : 'var(--ink-primary)';

                    return (
                      <g key={p} transform={`translate(${pos.x}, ${pos.y})`}>
                        <circle
                          r={20}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={isDeadlocked ? 2.5 : 1.5}
                        />
                        <text
                          x={0}
                          y={4}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="700"
                          fontFamily="monospace"
                          fill={isDeadlocked ? 'var(--div-danger)' : 'var(--ink-primary)'}
                        >
                          {p}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Collapsed Wait-For Graph (WFG) & Process Groupings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Wait-For Graph Edges */}
              <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-3.5 space-y-2 font-mono text-xs">
                <div className="font-bold text-[var(--ink-primary)] border-b border-[var(--rule-hairline)] pb-1.5">
                  Collapsed Wait-For Graph (P_i → P_j)
                </div>
                <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
                  {ragResult.waitForEdges.length > 0 ? (
                    ragResult.waitForEdges.map((e, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-[2px] bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] flex items-center justify-between text-[11px]"
                      >
                        <span className="font-bold text-[var(--ink-primary)]">
                          {e.from} → {e.to}
                        </span>
                        <span className="text-[var(--ink-muted)]">via {e.viaResource}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[var(--ink-muted)] text-[11px] py-2">
                      No wait-for dependencies active.
                    </div>
                  )}
                </div>
              </div>

              {/* Deadlocked vs Blocked Breakdown */}
              <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-3.5 space-y-2.5 font-mono text-xs">
                <div className="font-bold text-[var(--ink-primary)] border-b border-[var(--rule-hairline)] pb-1.5">
                  Process Impact Breakdown
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div>
                    <span className="text-[var(--ink-muted)]">Deadlocked in Cycle:</span>
                    <div className="font-bold text-[var(--div-danger)] mt-0.5">
                      {ragResult.deadlockedProcesses.length > 0
                        ? `{${ragResult.deadlockedProcesses.join(', ')}}`
                        : 'None (Deadlock-Free)'}
                    </div>
                  </div>

                  <div>
                    <span className="text-[var(--ink-muted)]">Blocked Outside Cycle:</span>
                    <div className="font-bold text-[var(--div-m2)] mt-0.5">
                      {ragResult.waitingProcesses.length > 0
                        ? `{${ragResult.waitingProcesses.join(', ')}} (Waiting on cycle member)`
                        : 'None'}
                    </div>
                  </div>

                  <div className="pt-1 text-[10px] text-[var(--ink-muted)] border-t border-[var(--rule-hairline)]">
                    Notice P4 in C2 Q4 is blocked waiting on R2 (held by P2), but P4 is NOT part of the circular wait cycle itself!
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------
              RIGHT 5 COLUMNS: RAG Presets, Edge Editor, Exam Context Card
              ------------------------------------------------------------------ */}
          <div className="lg:col-span-5 space-y-4">
            {/* 1-Click RAG Presets */}
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-[var(--rule-hairline)] pb-2 font-mono text-xs">
                <span className="font-bold text-[var(--ink-primary)] uppercase tracking-wider">
                  1-Click RAG Exam Presets
                </span>
                <span className="text-[10px] text-[var(--ink-muted)]">VIT FAT Slots</span>
              </div>

              <div className="space-y-1.5 font-mono text-xs">
                {RAG_PRESETS.map((rp, idx) => (
                  <button
                    key={rp.id}
                    type="button"
                    onClick={() => loadRagPreset(idx)}
                    className={`w-full text-left p-2.5 rounded-[2px] border transition-colors flex flex-col gap-0.5 ${
                      ragPresetIdx === idx
                        ? 'bg-[var(--bg-sheet)] border-[var(--div-m2)] text-[var(--ink-primary)]'
                        : 'bg-[var(--bg-paper)] border-[var(--rule-hairline)] text-[var(--ink-secondary)] hover:bg-[var(--bg-recessed)]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span>{rp.label}</span>
                      {ragPresetIdx === idx && (
                        <span className="text-[10px] font-semibold text-[var(--div-m2)]">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[var(--ink-muted)]">{rp.source}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* RAG Graph & Edge Editor */}
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4 space-y-3 font-mono text-xs">
              <div className="border-b border-[var(--rule-hairline)] pb-2">
                <h3 className="font-bold text-[var(--ink-primary)] uppercase tracking-wider flex items-center justify-between">
                  <span>RAG Edge Editor</span>
                  <button
                    type="button"
                    onClick={() => loadRagPreset(ragPresetIdx)}
                    className="text-[10px] font-bold text-[var(--ink-muted)] hover:text-[var(--ink-primary)] inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                </h3>
              </div>

              {/* Add Edge Form */}
              <div className="p-3 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] space-y-2.5">
                <div className="font-bold text-[11px] text-[var(--ink-primary)]">Add New Edge:</div>
                <div className="grid grid-cols-3 gap-2">
                  <label className="text-[10px] text-[var(--ink-muted)]">
                    From:
                    <select
                      value={newEdgeFrom}
                      onChange={(e) => setNewEdgeFrom(e.target.value)}
                      className="w-full mt-0.5 px-2 py-1 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-paper)] text-[var(--ink-primary)] font-bold text-xs"
                    >
                      <optgroup label="Processes">
                        {ragProcesses.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Resources">
                        {ragResources.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </label>

                  <label className="text-[10px] text-[var(--ink-muted)]">
                    To:
                    <select
                      value={newEdgeTo}
                      onChange={(e) => setNewEdgeTo(e.target.value)}
                      className="w-full mt-0.5 px-2 py-1 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-paper)] text-[var(--ink-primary)] font-bold text-xs"
                    >
                      <optgroup label="Resources">
                        {ragResources.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Processes">
                        {ragProcesses.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </label>

                  <label className="text-[10px] text-[var(--ink-muted)]">
                    Edge Type:
                    <select
                      value={newEdgeType}
                      onChange={(e) =>
                        setNewEdgeType(e.target.value as 'request' | 'assignment')
                      }
                      className="w-full mt-0.5 px-2 py-1 rounded-[2px] border border-[var(--rule-hairline)] bg-[var(--bg-paper)] text-[var(--ink-primary)] font-bold text-xs"
                    >
                      <option value="request">P → R (Request)</option>
                      <option value="assignment">R → P (Assign)</option>
                    </select>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleAddEdge}
                  className="w-full py-1.5 px-3 rounded-[2px] bg-[var(--ink-primary)] text-[var(--bg-paper)] font-bold text-xs hover:opacity-90 inline-flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Directed Edge
                </button>
              </div>

              {/* Edge List */}
              <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                <div className="text-[11px] text-[var(--ink-muted)] font-bold">
                  Active Edges ({ragEdges.length}):
                </div>
                {ragEdges.map((e, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px] flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.2 text-[9px] font-bold rounded-[2px] uppercase ${
                          e.type === 'request'
                            ? 'bg-[var(--div-m5)] text-white'
                            : 'bg-[var(--div-m3)] text-white'
                        }`}
                      >
                        {e.type === 'request' ? 'Request' : 'Assign'}
                      </span>
                      <span className="font-bold text-[var(--ink-primary)]">
                        {e.from} → {e.to}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEdge(idx)}
                      className="text-[var(--ink-muted)] hover:text-[var(--div-danger)] p-0.5"
                      title="Delete Edge"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Exam Case Study & Solution Walkthrough */}
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 space-y-2 font-mono text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[var(--ink-primary)]">
                <HelpCircle className="w-4 h-4 text-[var(--div-m4)] shrink-0" />
                <span>C2 Q4 Healthcare Exam Breakdown (10 Marks)</span>
              </div>
              <div className="text-[11px] text-[var(--ink-secondary)] leading-relaxed space-y-1.5">
                <p>
                  <strong>1. Graph Translation:</strong> P1 holds R1 and wants R2; P2 holds R2 and wants R3; P3 holds R3 and wants R1; P4 wants R2.
                </p>
                <p>
                  <strong>2. Wait-For Graph:</strong> Collapses to P1 → P2, P2 → P3, P3 → P1, and P4 → P2.
                </p>
                <p>
                  <strong>3. Cycle Identification:</strong> A directed cycle exists: ⟨P1, P2, P3, P1⟩. Since all resources are single-instance, deadlock is verified.
                </p>
                <p>
                  <strong>4. Deadlock Recovery:</strong> Terminate one process in the cycle (e.g. abort P1, releasing R1 so P3 can finish) or preempt R2 from P2.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
