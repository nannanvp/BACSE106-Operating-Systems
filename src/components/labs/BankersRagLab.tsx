import React, { useMemo, useState } from 'react';
import { CheckCircle2, ShieldAlert, XCircle } from 'lucide-react';
import {
  BANKERS_PRESETS,
  RAG_PRESETS,
  analyzeSingleInstanceRag,
  evaluateResourceRequest,
  runBankersSafety,
} from '../../utils/bankersEngine';

export const BankersRagLab: React.FC = () => {
  const [subMode, setSubMode] = useState<'bankers' | 'rag'>('bankers');
  const [presetIdx, setPresetIdx] = useState(0);
  const preset = BANKERS_PRESETS[presetIdx];

  const [reqProcIdx, setReqProcIdx] = useState<number>(preset.sampleRequest?.processIndex ?? 0);
  const [reqVec, setReqVec] = useState<number[]>(
    preset.sampleRequest?.request ?? preset.input.resourceNames.map(() => 0)
  );

  const [ragPresetIdx, setRagPresetIdx] = useState(0);
  const activeRag = RAG_PRESETS[ragPresetIdx];

  const safety = useMemo(() => runBankersSafety(preset.input), [preset]);
  const reqEval = useMemo(
    () => evaluateResourceRequest(preset.input, reqProcIdx, reqVec),
    [preset, reqProcIdx, reqVec]
  );
  const ragResult = useMemo(
    () => analyzeSingleInstanceRag(activeRag.processes, activeRag.edges),
    [activeRag]
  );

  const switchBankersPreset = (idx: number) => {
    setPresetIdx(idx);
    const p = BANKERS_PRESETS[idx];
    setReqProcIdx(p.sampleRequest?.processIndex ?? 0);
    setReqVec(p.sampleRequest ? [...p.sampleRequest.request] : p.input.resourceNames.map(() => 0));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSubMode('bankers')}
          className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-[2px] border ${
            subMode === 'bankers'
              ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
              : 'bg-[var(--bg-paper)] text-[var(--ink-secondary)] border-[var(--rule-hairline)]'
          }`}
        >
          Banker&apos;s Safety &amp; Resource-Request (C1 2-2 Q7 &amp; 1-2 Q8)
        </button>
        <button
          type="button"
          onClick={() => setSubMode('rag')}
          className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-[2px] border ${
            subMode === 'rag'
              ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
              : 'bg-[var(--bg-paper)] text-[var(--ink-secondary)] border-[var(--rule-hairline)]'
          }`}
        >
          RAG -&gt; Wait-For Graph Cycle Detector (C2 Q4)
        </button>
      </div>

      {subMode === 'bankers' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {BANKERS_PRESETS.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => switchBankersPreset(idx)}
                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-[2px] border ${
                  presetIdx === idx
                    ? 'bg-[var(--div-m2)] text-white border-[var(--div-m2)]'
                    : 'bg-[var(--bg-paper)] text-[var(--ink-secondary)] border-[var(--rule-hairline)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Summary Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs tabular-nums">
            <div className="p-3 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px]">
              <div className="text-[var(--ink-muted)]">Total Resources ({preset.input.resourceNames.join(', ')})</div>
              <div className="text-sm font-bold text-[var(--ink-primary)] mt-1">
                ({preset.input.totalResources.join(', ')})
              </div>
            </div>
            <div className="p-3 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px]">
              <div className="text-[var(--ink-muted)]">Initial Available = Total - ΣAlloc</div>
              <div className="text-sm font-bold text-[var(--div-m4)] mt-1">
                ({safety.available.join(', ')})
              </div>
            </div>
            <div className="p-3 bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px]">
              <div className="text-[var(--ink-muted)]">Safety Verdict</div>
              <div
                className={`text-sm font-bold mt-1 ${
                  safety.isSafe ? 'text-[var(--div-m3)]' : 'text-[var(--div-danger)]'
                }`}
              >
                {safety.isSafe ? `SAFE: <${safety.safeSequence.join(', ')}>` : 'UNSAFE STATE'}
              </div>
            </div>
          </div>

          {/* Allocation / Max / Need Matrix */}
          <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs tabular-nums">
              <thead>
                <tr className="bg-[var(--bg-recessed)] border-b border-[var(--rule-strong)]">
                  <th className="px-3 py-2">Process</th>
                  <th className="px-3 py-2">Allocation ({preset.input.resourceNames.join(',')})</th>
                  <th className="px-3 py-2">Max ({preset.input.resourceNames.join(',')})</th>
                  <th className="px-3 py-2">Need = Max - Alloc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rule-hairline)]">
                {preset.input.processIds.map((pid, i) => (
                  <tr key={pid}>
                    <td className="px-3 py-2 font-bold text-[var(--ink-primary)]">{pid}</td>
                    <td className="px-3 py-2">({preset.input.allocation[i].join(', ')})</td>
                    <td className="px-3 py-2">({preset.input.max[i].join(', ')})</td>
                    <td className="px-3 py-2 font-bold text-[var(--div-m5)]">
                      ({safety.need[i].join(', ')})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Step-by-Step Safety Trace */}
          <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 space-y-2">
            <h4 className="font-mono text-xs font-bold text-[var(--ink-primary)]">
              Safety Algorithm Step Trace (Final Work = Total System Resources)
            </h4>
            <div className="space-y-1 font-mono text-xs tabular-nums">
              {safety.trace.map((st) => (
                <div
                  key={st.step}
                  className="px-3 py-1.5 bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] rounded-[2px]"
                >
                  Step {st.step}: <strong>{st.processId}</strong> · Need ({st.need.join(',')}) ≤ Work (
                  {st.workBefore.join(',')}) → Finish → New Work = ({st.workAfter.join(',')})
                </div>
              ))}
            </div>
          </div>

          {/* 3-Step Resource-Request Tester */}
          <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4 space-y-3">
            <h4 className="text-sm font-bold text-[var(--ink-primary)]">
              Live 3-Step Resource-Request Evaluator
            </h4>
            <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
              <label className="inline-flex items-center gap-1.5">
                Process:
                <select
                  value={reqProcIdx}
                  onChange={(e) => setReqProcIdx(Number(e.target.value))}
                  className="px-2 py-1 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)]"
                >
                  {preset.input.processIds.map((pid, idx) => (
                    <option key={pid} value={idx}>
                      {pid}
                    </option>
                  ))}
                </select>
              </label>

              {preset.input.resourceNames.map((rName, rIdx) => (
                <label key={rName} className="inline-flex items-center gap-1">
                  {rName}:
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={reqVec[rIdx] ?? 0}
                    onChange={(e) => {
                      const next = [...reqVec];
                      next[rIdx] = Math.max(0, Number(e.target.value) || 0);
                      setReqVec(next);
                    }}
                    className="w-14 px-1.5 py-1 rounded-[2px] border border-[var(--rule-strong)] bg-[var(--bg-sheet)] tabular-nums"
                  />
                </label>
              ))}
            </div>

            <div className="p-3 rounded-[2px] bg-[var(--bg-sheet)] border border-[var(--rule-hairline)] space-y-1 font-mono text-xs">
              <div className="flex items-center gap-1.5 font-bold">
                {reqEval.granted ? (
                  <span className="inline-flex items-center gap-1 text-[var(--div-m3)]">
                    <CheckCircle2 className="w-4 h-4" /> REQUEST GRANTED (SAFE)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[var(--div-danger)]">
                    <XCircle className="w-4 h-4" /> REQUEST DENIED / MUST WAIT
                  </span>
                )}
              </div>
              <div className="text-[var(--ink-secondary)]">{reqEval.reason}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {RAG_PRESETS.map((rp, idx) => (
              <button
                key={rp.id}
                type="button"
                onClick={() => setRagPresetIdx(idx)}
                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-[2px] border ${
                  ragPresetIdx === idx
                    ? 'bg-[var(--div-m2)] text-white border-[var(--div-m2)]'
                    : 'bg-[var(--bg-paper)] text-[var(--ink-secondary)] border-[var(--rule-hairline)]'
                }`}
              >
                {rp.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[var(--bg-paper)] border border-[var(--rule-hairline)] rounded-[2px] p-4 space-y-2.5">
              <h4 className="font-mono text-xs font-bold text-[var(--ink-primary)]">
                Collapsed Wait-For Graph Edges (P_i → P_j)
              </h4>
              <div className="space-y-1 font-mono text-xs">
                {ragResult.waitForEdges.map((e, i) => (
                  <div
                    key={i}
                    className="px-2.5 py-1.5 rounded-[2px] bg-[var(--bg-sheet)] border border-[var(--rule-hairline)]"
                  >
                    <strong>{e.from}</strong> waits for <strong>{e.to}</strong> (via {e.viaResource})
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[var(--bg-paper)] border border-[var(--rule-strong)] rounded-[2px] p-4 space-y-2.5">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                {ragResult.hasCycle ? (
                  <span className="inline-flex items-center gap-1.5 text-[var(--div-danger)]">
                    <ShieldAlert className="w-4 h-4" /> DEADLOCK DETECTED (Single-Instance Cycle)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[var(--div-m3)]">
                    <CheckCircle2 className="w-4 h-4" /> ACYCLIC — NO DEADLOCK
                  </span>
                )}
              </div>
              <div className="font-mono text-xs text-[var(--ink-secondary)] space-y-1">
                <div>
                  Cycle Nodes:{' '}
                  <strong>{ragResult.cycleNodes.length ? ragResult.cycleNodes.join(' → ') : 'None'}</strong>
                </div>
                <div>
                  Deadlocked Processes:{' '}
                  <strong>
                    {ragResult.deadlockedProcesses.length
                      ? ragResult.deadlockedProcesses.join(', ')
                      : 'None'}
                  </strong>
                </div>
                <div>
                  Blocked Outside Cycle:{' '}
                  <strong>
                    {ragResult.waitingProcesses.length
                      ? ragResult.waitingProcesses.join(', ')
                      : 'None'}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
