import React, { useEffect, useState } from 'react';
import {
  Calculator,
  Cpu,
  HardDrive,
  Lock,
  MemoryStick,
  ShieldAlert,
} from 'lucide-react';
import { WeakTopicSource } from '../utils/weakTopicsEngine';
import { BankersRagLab } from './labs/BankersRagLab';
import { CpuSchedulerLab } from './labs/CpuSchedulerLab';
import { DiskRaidLab } from './labs/DiskRaidLab';
import { MemoryPagingLab } from './labs/MemoryPagingLab';
import { NumericalDrillLab } from './labs/NumericalDrillLab';
import { SyncConcurrencyLab } from './labs/SyncConcurrencyLab';

export type LabTabId = 'drill' | 'cpu' | 'bankers' | 'sync' | 'memory' | 'disk';

interface InteractiveLabsViewProps {
  initialLabTab?: LabTabId;
  onLogWeakTopic: (payload: {
    topicId: string;
    moduleId: string;
    topicTitle: string;
    source: WeakTopicSource;
  }) => void;
}

const LAB_TABS: Array<{ id: LabTabId; label: string; moduleCode: string; icon: React.FC<{ className?: string }> }> = [
  { id: 'drill', label: 'Numerical Drill Arena', moduleCode: 'M2–M5', icon: Calculator },
  { id: 'cpu', label: 'CPU Scheduler & CS Gantt', moduleCode: 'M2', icon: Cpu },
  { id: 'bankers', label: "Banker's & RAG Cycle", moduleCode: 'M2', icon: ShieldAlert },
  { id: 'sync', label: 'Sync & Concurrency', moduleCode: 'M3', icon: Lock },
  { id: 'memory', label: 'Memory, Paging & TLB', moduleCode: 'M4', icon: MemoryStick },
  { id: 'disk', label: 'Disk Scheduling & RAID', moduleCode: 'M5', icon: HardDrive },
];

export const InteractiveLabsView: React.FC<InteractiveLabsViewProps> = ({
  initialLabTab,
  onLogWeakTopic,
}) => {
  const [activeTab, setActiveTab] = useState<LabTabId>(initialLabTab ?? 'cpu');

  useEffect(() => {
    if (initialLabTab) {
      setActiveTab(initialLabTab);
    }
  }, [initialLabTab]);

  return (
    <section className="space-y-5">
      <div className="pb-3 border-b border-[var(--rule-strong)]">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--ink-primary)]">
          Interactive Operating Systems Laboratory (6 Simulators)
        </h1>
        <p className="font-mono text-xs text-[var(--ink-muted)] mt-1">
          Verify every C1/C2 FAT numerical step-by-step: Preemptive Priority+CS, Banker&apos;s 6×4,
          Peterson&apos;s, FIFO/LRU/OPT, Contiguous Placement, TLB EAT, LOOK/C-LOOK &amp; RAID
        </p>
      </div>

      {/* Lab Selector Rail */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {LAB_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`p-2.5 text-left rounded-[2px] border transition-colors ${
                active
                  ? 'bg-[var(--ink-primary)] text-[var(--bg-paper)] border-[var(--ink-primary)]'
                  : 'bg-[var(--bg-paper)] text-[var(--ink-primary)] border-[var(--rule-hairline)] hover:bg-[var(--bg-recessed)]'
              }`}
            >
              <div className="flex items-center justify-between font-mono text-[10px] opacity-80">
                <span>{tab.moduleCode}</span>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs font-bold mt-1 leading-tight">{tab.label}</div>
            </button>
          );
        })}
      </div>

      {/* Active Simulator Stage */}
      <div>
        {activeTab === 'drill' && <NumericalDrillLab onLogWeakTopic={onLogWeakTopic} />}
        {activeTab === 'cpu' && <CpuSchedulerLab />}
        {activeTab === 'bankers' && <BankersRagLab />}
        {activeTab === 'sync' && <SyncConcurrencyLab />}
        {activeTab === 'memory' && <MemoryPagingLab />}
        {activeTab === 'disk' && <DiskRaidLab />}
      </div>
    </section>
  );
};
