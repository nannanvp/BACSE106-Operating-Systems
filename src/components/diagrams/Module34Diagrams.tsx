import React from 'react';
import { DiagramId } from '../../data/noteTypes';

const ArrowDefs: React.FC<{ prefix: string }> = ({ prefix }) => (
  <defs>
    <marker
      id={`${prefix}-arr`}
      viewBox="0 0 10 10"
      refX="8.5"
      refY="5"
      markerWidth="6.5"
      markerHeight="6.5"
      orient="auto-start-reverse"
    >
      <path d="M 0 1.2 L 9 5 L 0 8.8 z" fill="var(--ink-primary)" />
    </marker>
    <marker
      id={`${prefix}-arr-m3`}
      viewBox="0 0 10 10"
      refX="8.5"
      refY="5"
      markerWidth="6.5"
      markerHeight="6.5"
      orient="auto-start-reverse"
    >
      <path d="M 0 1.2 L 9 5 L 0 8.8 z" fill="var(--div-m3)" />
    </marker>
    <marker
      id={`${prefix}-arr-m4`}
      viewBox="0 0 10 10"
      refX="8.5"
      refY="5"
      markerWidth="6.5"
      markerHeight="6.5"
      orient="auto-start-reverse"
    >
      <path d="M 0 1.2 L 9 5 L 0 8.8 z" fill="var(--div-m4)" />
    </marker>
  </defs>
);

export const renderModule34Diagram = (id: DiagramId): { title: string; svg: React.ReactNode } | null => {
  switch (id) {
    case 'm3-ipc-models':
      return {
        title: 'IPC Models: Shared Memory (Zero-Copy) vs Message Passing (Kernel-Mediated)',
        svg: (
          <svg viewBox="0 0 680 215" className="w-full h-auto" role="img" aria-label="Shared memory versus message passing IPC">
            <ArrowDefs prefix="m3ipc" />
            {/* Shared Memory */}
            <rect x="16" y="14" width="312" height="186" rx="2" fill="var(--bg-sheet)" stroke="var(--rule-hairline)" />
            <text x="172" y="34" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink-primary)">Shared Memory (shm_open / mmap)</text>
            <rect x="34" y="48" width="94" height="44" rx="2" fill="var(--bg-paper)" stroke="var(--rule-strong)" />
            <text x="81" y="74" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">Process A</text>
            <rect x="136" y="48" width="76" height="44" rx="2" fill="var(--bg-recessed)" stroke="var(--div-m3)" strokeWidth="1.6" />
            <text x="174" y="67" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--div-m3)">Shared</text>
            <text x="174" y="81" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--div-m3)">Region</text>
            <rect x="220" y="48" width="94" height="44" rx="2" fill="var(--bg-paper)" stroke="var(--rule-strong)" />
            <text x="267" y="74" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">Process B</text>
            <rect x="34" y="128" width="280" height="36" rx="2" fill="var(--bg-recessed)" stroke="var(--rule-hairline)" />
            <text x="174" y="150" textAnchor="middle" fontSize="10" fill="var(--ink-secondary)">Kernel (only involved at initial attach)</text>
            <text x="172" y="186" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--div-m3)">Memory-speed · User must synchronize!</text>

            {/* Message Passing */}
            <rect x="352" y="14" width="312" height="186" rx="2" fill="var(--bg-sheet)" stroke="var(--rule-hairline)" />
            <text x="508" y="34" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink-primary)">Message Passing (send / recv / pipe)</text>
            <rect x="372" y="48" width="108" height="44" rx="2" fill="var(--bg-paper)" stroke="var(--rule-strong)" />
            <text x="426" y="74" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">Process A</text>
            <rect x="536" y="48" width="108" height="44" rx="2" fill="var(--bg-paper)" stroke="var(--rule-strong)" />
            <text x="590" y="74" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">Process B</text>
            <rect x="372" y="124" width="272" height="40" rx="2" fill="var(--bg-recessed)" stroke="var(--div-m5)" strokeWidth="1.6" />
            <text x="508" y="148" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--div-m5)">Kernel Mailbox / Queue [M1 | M2]</text>
            <path d="M 426 92 L 426 122" stroke="var(--ink-primary)" strokeWidth="1.5" markerEnd="url(#m3ipc-arr)" />
            <path d="M 590 124 L 590 94" stroke="var(--ink-primary)" strokeWidth="1.5" markerEnd="url(#m3ipc-arr)" />
            <text x="508" y="186" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--div-m5)">Syscall per msg · Zero shared-state races</text>
          </svg>
        ),
      };

    case 'm3-critical-section':
      return {
        title: 'Critical Section Protocol & Three Mandatory Requirements',
        svg: (
          <svg viewBox="0 0 680 180" className="w-full h-auto" role="img" aria-label="Critical section entry exit structure">
            <ArrowDefs prefix="m3cs" />
            {[
              { x: 18, w: 138, title: 'Entry Section', sub: 'Request permission', col: 'var(--div-m1)' },
              { x: 184, w: 152, title: 'CRITICAL SECTION', sub: 'Mutate shared data', col: 'var(--div-danger)' },
              { x: 364, w: 134, title: 'Exit Section', sub: 'Release lock / signal', col: 'var(--div-m3)' },
              { x: 526, w: 136, title: 'Remainder', sub: 'Private non-shared', col: 'var(--rule-strong)' },
            ].map((b, i) => (
              <g key={b.title}>
                <rect x={b.x} y="24" width={b.w} height="66" rx="2" fill="var(--bg-paper)" stroke={b.col} strokeWidth="1.7" />
                <text x={b.x + b.w / 2} y="51" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">{b.title}</text>
                <text x={b.x + b.w / 2} y="71" textAnchor="middle" fontSize="9" fill="var(--ink-secondary)">{b.sub}</text>
                {i < 3 && (
                  <line x1={b.x + b.w} y1="57" x2={b.x + b.w + 26} y2="57" stroke="var(--ink-primary)" strokeWidth="1.5" markerEnd="url(#m3cs-arr)" />
                )}
              </g>
            ))}
            <rect x="18" y="114" width="644" height="48" rx="2" fill="var(--bg-recessed)" stroke="var(--rule-hairline)" />
            <text x="340" y="134" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-primary)">
              1. Mutual Exclusion (at most 1 in CS) · 2. Progress (no deadlock / no outside block) · 3. Bounded Waiting (no starvation)
            </text>
            <text x="340" y="152" textAnchor="middle" fontSize="9.5" fill="var(--ink-muted)">
              Every FAT proof must verify all 3 criteria explicitly.
            </text>
          </svg>
        ),
      };

    case 'm3-peterson-flow':
      return {
        title: 'Peterson’s Two-Process Protocol & Contradiction Proof (C1 1-2 Q3 & C2 Q5)',
        svg: (
          <svg viewBox="0 0 680 215" className="w-full h-auto" role="img" aria-label="Peterson algorithm state flow">
            <rect x="18" y="16" width="290" height="130" rx="2" fill="var(--bg-paper)" stroke="var(--div-m3)" strokeWidth="1.6" />
            <text x="163" y="36" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--div-m3)">Process P0 (i = 0, j = 1)</text>
            <text x="34" y="60" fontSize="10" fill="var(--ink-primary)">flag[0] = true;</text>
            <text x="34" y="78" fontSize="10" fill="var(--ink-primary)">turn = 1; // yield to P1</text>
            <text x="34" y="96" fontSize="10" fontWeight="700" fill="var(--div-m2)">while (flag[1] &amp;&amp; turn == 1);</text>
            <text x="34" y="116" fontSize="10" fill="var(--div-m3)">/* CRITICAL SECTION */</text>
            <text x="34" y="134" fontSize="10" fill="var(--ink-secondary)">flag[0] = false;</text>

            <rect x="372" y="16" width="290" height="130" rx="2" fill="var(--bg-paper)" stroke="var(--div-m5)" strokeWidth="1.6" />
            <text x="517" y="36" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--div-m5)">Process P1 (i = 1, j = 0)</text>
            <text x="388" y="60" fontSize="10" fill="var(--ink-primary)">flag[1] = true;</text>
            <text x="388" y="78" fontSize="10" fill="var(--ink-primary)">turn = 0; // yield to P0</text>
            <text x="388" y="96" fontSize="10" fontWeight="700" fill="var(--div-m2)">while (flag[0] &amp;&amp; turn == 0);</text>
            <text x="388" y="116" fontSize="10" fill="var(--div-m5)">/* CRITICAL SECTION */</text>
            <text x="388" y="134" fontSize="10" fill="var(--ink-secondary)">flag[1] = false;</text>

            <rect x="18" y="160" width="644" height="42" rx="2" fill="var(--bg-recessed)" stroke="var(--rule-strong)" />
            <text x="340" y="178" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-primary)">
              Mutual Exclusion Proof: Both in CS =&gt; flag[0]=flag[1]=T =&gt; turn must equal BOTH 0 and 1 =&gt; CONTRADICTION.
            </text>
            <text x="340" y="194" textAnchor="middle" fontSize="9.5" fill="var(--ink-secondary)">
              Rule of Thumb: turn == 0 lets P0 enter first (C2 Q5: Seats 10 -&gt; 8 -&gt; 6). Modern CPUs need memory_barrier().
            </text>
          </svg>
        ),
      };

    case 'm3-semaphore-queue':
      return {
        title: 'Blocking Semaphore Structure (No Busy-Waiting · Negative Value = Queue Length)',
        svg: (
          <svg viewBox="0 0 680 190" className="w-full h-auto" role="img" aria-label="Blocking semaphore queue">
            <ArrowDefs prefix="m3sem" />
            <rect x="20" y="20" width="210" height="148" rx="2" fill="var(--bg-paper)" stroke="var(--div-m3)" strokeWidth="1.6" />
            <text x="125" y="42" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--div-m3)">wait(S) [P / down]</text>
            <text x="34" y="68" fontSize="10" fill="var(--ink-primary)">S-&gt;value--;</text>
            <text x="34" y="90" fontSize="10" fill="var(--ink-primary)">if (S-&gt;value &lt; 0) {'{'}</text>
            <text x="46" y="110" fontSize="9.5" fill="var(--ink-secondary)">add PCB to S-&gt;list;</text>
            <text x="46" y="128" fontSize="9.5" fill="var(--div-danger)">block(); // sleep</text>
            <text x="34" y="148" fontSize="10" fill="var(--ink-primary)">{'}'}</text>

            <rect x="256" y="34" width="168" height="118" rx="2" fill="var(--bg-recessed)" stroke="var(--rule-strong)" />
            <text x="340" y="56" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">Semaphore S</text>
            <text x="340" y="78" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--div-m2)">value = -2</text>
            <rect x="274" y="94" width="60" height="32" rx="2" fill="var(--bg-paper)" stroke="var(--rule-strong)" />
            <text x="304" y="114" textAnchor="middle" fontSize="9.5" fill="var(--ink-primary)">PCB P2</text>
            <rect x="346" y="94" width="60" height="32" rx="2" fill="var(--bg-paper)" stroke="var(--rule-strong)" />
            <text x="376" y="114" textAnchor="middle" fontSize="9.5" fill="var(--ink-primary)">PCB P3</text>

            <rect x="450" y="20" width="210" height="148" rx="2" fill="var(--bg-paper)" stroke="var(--div-m5)" strokeWidth="1.6" />
            <text x="555" y="42" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--div-m5)">signal(S) [V / up]</text>
            <text x="464" y="68" fontSize="10" fill="var(--ink-primary)">S-&gt;value++;</text>
            <text x="464" y="90" fontSize="10" fill="var(--ink-primary)">if (S-&gt;value &lt;= 0) {'{'}</text>
            <text x="476" y="110" fontSize="9.5" fill="var(--ink-secondary)">pop P from S-&gt;list;</text>
            <text x="476" y="128" fontSize="9.5" fill="var(--div-m3)">wakeup(P); // Ready</text>
            <text x="464" y="148" fontSize="10" fill="var(--ink-primary)">{'}'}</text>

            <line x1="230" y1="92" x2="254" y2="92" stroke="var(--ink-primary)" strokeWidth="1.5" markerEnd="url(#m3sem-arr)" />
            <line x1="424" y1="92" x2="448" y2="92" stroke="var(--ink-primary)" strokeWidth="1.5" markerEnd="url(#m3sem-arr)" />
          </svg>
        ),
      };

    case 'm3-bounded-buffer':
      return {
        title: 'Producer-Consumer Bounded Buffer (N = 5 · C2 Q6 Safe Semaphore Order)',
        svg: (
          <svg viewBox="0 0 680 195" className="w-full h-auto" role="img" aria-label="Bounded buffer producer consumer diagram">
            <ArrowDefs prefix="m3bb" />
            <rect x="18" y="34" width="150" height="86" rx="2" fill="var(--bg-paper)" stroke="var(--div-m3)" strokeWidth="1.6" />
            <text x="93" y="56" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--div-m3)">Producer</text>
            <text x="93" y="76" textAnchor="middle" fontSize="9.5" fill="var(--ink-primary)">1. wait(empty)</text>
            <text x="93" y="92" textAnchor="middle" fontSize="9.5" fill="var(--ink-primary)">2. wait(mutex)</text>
            <text x="93" y="108" textAnchor="middle" fontSize="9" fill="var(--ink-muted)">insert -&gt; sig(m),sig(f)</text>

            {/* Buffer slots */}
            <text x="340" y="30" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">Circular Buffer (Capacity N = 5)</text>
            {[0, 1, 2, 3, 4].map((slot) => (
              <g key={slot}>
                <rect
                  x={216 + slot * 50}
                  y="44"
                  width="46"
                  height="56"
                  rx="2"
                  fill={slot < 3 ? 'var(--bg-recessed)' : 'var(--bg-paper)'}
                  stroke={slot < 3 ? 'var(--div-m4)' : 'var(--rule-strong)'}
                  strokeWidth="1.4"
                />
                <text x={239 + slot * 50} y="76" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-primary)">
                  {slot < 3 ? `Ord${slot + 1}` : 'Empty'}
                </text>
              </g>
            ))}
            <text x="340" y="122" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--div-m4)">
              Invariant: full (3) + empty (2) = N (5) · mutex = 1
            </text>

            <rect x="512" y="34" width="150" height="86" rx="2" fill="var(--bg-paper)" stroke="var(--div-m5)" strokeWidth="1.6" />
            <text x="587" y="56" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--div-m5)">Consumer</text>
            <text x="587" y="76" textAnchor="middle" fontSize="9.5" fill="var(--ink-primary)">1. wait(full)</text>
            <text x="587" y="92" textAnchor="middle" fontSize="9.5" fill="var(--ink-primary)">2. wait(mutex)</text>
            <text x="587" y="108" textAnchor="middle" fontSize="9" fill="var(--ink-muted)">remove -&gt; sig(m),sig(e)</text>

            <line x1="168" y1="72" x2="214" y2="72" stroke="var(--div-m3)" strokeWidth="1.6" markerEnd="url(#m3bb-arr-m3)" />
            <line x1="466" y1="72" x2="510" y2="72" stroke="var(--ink-primary)" strokeWidth="1.6" markerEnd="url(#m3bb-arr)" />

            <rect x="18" y="142" width="644" height="36" rx="2" fill="var(--bg-recessed)" stroke="var(--div-danger)" />
            <text x="340" y="164" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--div-danger)">
              DEADLOCK TRAP: Never swap wait(mutex) before wait(empty)/wait(full) — blocks while holding mutex!
            </text>
          </svg>
        ),
      };

    case 'm3-dining-philosophers':
      return {
        title: 'Dining Philosophers Circular Wait vs Asymmetric Odd/Even Acquisition',
        svg: (
          <svg viewBox="0 0 680 215" className="w-full h-auto" role="img" aria-label="Dining philosophers circular wait">
            <circle cx="170" cy="108" r="56" fill="var(--bg-recessed)" stroke="var(--rule-strong)" strokeWidth="1.5" />
            <text x="170" y="104" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-primary)">5 Philosophers</text>
            <text x="170" y="120" textAnchor="middle" fontSize="9" fill="var(--div-danger)">All grab Left =&gt; Deadlock</text>
            {[0, 1, 2, 3, 4].map((i) => {
              const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
              const px = 170 + 82 * Math.cos(a);
              const py = 108 + 82 * Math.sin(a);
              return (
                <g key={i}>
                  <circle cx={px} cy={py} r="15" fill="var(--bg-paper)" stroke="var(--div-m3)" strokeWidth="1.5" />
                  <text x={px} y={py + 4} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--ink-primary)">P{i}</text>
                </g>
              );
            })}

            <rect x="330" y="24" width="330" height="168" rx="2" fill="var(--bg-sheet)" stroke="var(--rule-hairline)" />
            <text x="348" y="48" fontSize="11" fontWeight="700" fill="var(--ink-primary)">3 Exam-Standard Deadlock Fixes:</text>
            <text x="348" y="76" fontSize="10" fill="var(--ink-secondary)">1. Asymmetric Order: Even picks Left-&gt;Right,</text>
            <text x="364" y="92" fontSize="9.5" fill="var(--div-m3)">   Odd picks Right-&gt;Left (breaks Circular Wait).</text>
            <text x="348" y="118" fontSize="10" fill="var(--ink-secondary)">2. Room Semaphore: Allow at most 4 seated</text>
            <text x="364" y="134" fontSize="9.5" fill="var(--div-m4)">   at table simultaneously (N - 1 rule).</text>
            <text x="348" y="160" fontSize="10" fill="var(--ink-secondary)">3. Monitor Solution: Pick BOTH chopsticks</text>
            <text x="364" y="176" fontSize="9.5" fill="var(--div-m5)">   atomically iff both neighbors != EATING.</text>
          </svg>
        ),
      };

    case 'm3-monitor-structure':
      return {
        title: 'Monitor Encapsulation: Entry Queue, Condition Variables & Mesa Semantics',
        svg: (
          <svg viewBox="0 0 680 215" className="w-full h-auto" role="img" aria-label="Monitor encapsulation structure">
            <rect x="20" y="26" width="128" height="162" rx="2" fill="var(--bg-sheet)" stroke="var(--rule-hairline)" />
            <text x="84" y="48" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-primary)">Entry Queue</text>
            <rect x="36" y="64" width="96" height="28" rx="2" fill="var(--bg-paper)" stroke="var(--rule-strong)" />
            <text x="84" y="82" textAnchor="middle" fontSize="9.5" fill="var(--ink-secondary)">Waiting Callers</text>
            <text x="84" y="128" textAnchor="middle" fontSize="9" fill="var(--ink-muted)">Implicit Mutex:</text>
            <text x="84" y="144" textAnchor="middle" fontSize="9" fill="var(--ink-muted)">1 active inside</text>

            <rect x="174" y="18" width="486" height="178" rx="2" fill="var(--bg-recessed)" stroke="var(--div-m3)" strokeWidth="1.8" />
            <text x="417" y="40" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--div-m3)">MONITOR (e.g., HospitalSurgeryMonitor · C1 1-2 Q4)</text>
            <rect x="194" y="54" width="210" height="58" rx="2" fill="var(--bg-paper)" stroke="var(--rule-strong)" />
            <text x="299" y="76" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-primary)">Private Shared State</text>
            <text x="299" y="96" textAnchor="middle" fontSize="9" fill="var(--ink-secondary)">freeTheatres = 3, consecEmerg = 0</text>

            <rect x="424" y="54" width="216" height="58" rx="2" fill="var(--bg-paper)" stroke="var(--div-m5)" strokeWidth="1.4" />
            <text x="532" y="76" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--div-m5)">Condition Variable Queues</text>
            <text x="532" y="96" textAnchor="middle" fontSize="9" fill="var(--ink-secondary)">emergencyQ.wait() · routineQ.wait()</text>

            <rect x="194" y="126" width="446" height="54" rx="2" fill="var(--bg-paper)" stroke="var(--rule-hairline)" />
            <text x="417" y="148" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-primary)">
              Mesa Semantics (Java/POSIX): ALWAYS use while (!cond) cv.wait();
            </text>
            <text x="417" y="168" textAnchor="middle" fontSize="9.5" fill="var(--ink-secondary)">
              Signal wakes waiter to Ready Queue (not immediate handoff) · Empty signal() is a NO-OP.
            </text>
          </svg>
        ),
      };

    case 'm4-mmu-relocation':
      return {
        title: 'Dynamic Relocation Hardware (Base & Limit Registers -> MMU Trap Check)',
        svg: (
          <svg viewBox="0 0 680 185" className="w-full h-auto" role="img" aria-label="MMU base and limit relocation">
            <ArrowDefs prefix="m4mmu" />
            <rect x="20" y="64" width="90" height="48" rx="2" fill="var(--bg-paper)" stroke="var(--rule-strong)" />
            <text x="65" y="92" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink-primary)">CPU</text>

            <rect x="168" y="64" width="120" height="48" rx="2" fill="var(--bg-recessed)" stroke="var(--div-m4)" strokeWidth="1.6" />
            <text x="228" y="84" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-primary)">Check &lt; Limit?</text>
            <text x="228" y="100" textAnchor="middle" fontSize="9" fill="var(--div-m4)">Strict &lt; (not &lt;=)</text>

            <rect x="346" y="64" width="110" height="48" rx="2" fill="var(--bg-recessed)" stroke="var(--div-m3)" strokeWidth="1.6" />
            <text x="401" y="84" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-primary)">+ Base Reg</text>
            <text x="401" y="100" textAnchor="middle" fontSize="9" fill="var(--ink-secondary)">Relocation</text>

            <rect x="520" y="64" width="140" height="48" rx="2" fill="var(--bg-paper)" stroke="var(--rule-strong)" />
            <text x="590" y="84" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">Physical RAM</text>
            <text x="590" y="100" textAnchor="middle" fontSize="9" fill="var(--ink-muted)">Phys = Base + Log</text>

            <line x1="110" y1="88" x2="166" y2="88" stroke="var(--ink-primary)" strokeWidth="1.5" markerEnd="url(#m4mmu-arr)" />
            <text x="138" y="79" textAnchor="middle" fontSize="8.5" fill="var(--ink-muted)">Logical</text>
            <line x1="288" y1="88" x2="344" y2="88" stroke="var(--div-m3)" strokeWidth="1.5" markerEnd="url(#m4mmu-arr-m3)" />
            <text x="316" y="79" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--div-m3)">YES</text>
            <line x1="456" y1="88" x2="518" y2="88" stroke="var(--ink-primary)" strokeWidth="1.5" markerEnd="url(#m4mmu-arr)" />

            <line x1="228" y1="112" x2="228" y2="146" stroke="var(--div-danger)" strokeWidth="1.5" />
            <rect x="138" y="146" width="180" height="28" rx="2" fill="var(--bg-paper)" stroke="var(--div-danger)" />
            <text x="228" y="164" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--div-danger)">NO =&gt; TRAP: Addressing Error</text>
          </svg>
        ),
      };

    case 'm4-paging-tlb':
      return {
        title: 'Paging Hardware with Associative TLB (C2 Q8: EAT = α(t+m) + (1-α)(t+2m))',
        svg: (
          <svg viewBox="0 0 680 225" className="w-full h-auto" role="img" aria-label="Paging hardware with TLB">
            <ArrowDefs prefix="m4tlb" />
            <rect x="20" y="24" width="110" height="44" rx="2" fill="var(--bg-paper)" stroke="var(--rule-strong)" />
            <text x="75" y="44" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-primary)">Logical Addr</text>
            <text x="75" y="60" textAnchor="middle" fontSize="9.5" fill="var(--div-m4)">[ p | d ]</text>

            <rect x="180" y="24" width="150" height="68" rx="2" fill="var(--bg-recessed)" stroke="var(--div-m4)" strokeWidth="1.6" />
            <text x="255" y="46" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--div-m4)">TLB (Fast Cache)</text>
            <text x="255" y="64" textAnchor="middle" fontSize="9" fill="var(--ink-secondary)">Parallel associative lookup</text>
            <text x="255" y="80" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--div-m3)">Hit (α): T_tlb + 1·T_mem</text>

            <rect x="180" y="128" width="150" height="72" rx="2" fill="var(--bg-paper)" stroke="var(--rule-strong)" />
            <text x="255" y="150" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">Page Table (RAM)</text>
            <text x="255" y="168" textAnchor="middle" fontSize="9" fill="var(--ink-secondary)">Indexed by p -&gt; frame f</text>
            <text x="255" y="186" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--div-danger)">Miss (1-α): T_tlb + 2·T_mem</text>

            <rect x="424" y="68" width="108" height="52" rx="2" fill="var(--bg-paper)" stroke="var(--div-m5)" strokeWidth="1.6" />
            <text x="478" y="90" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-primary)">Physical Addr</text>
            <text x="478" y="108" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--div-m5)">[ f | d ]</text>

            <rect x="558" y="68" width="102" height="52" rx="2" fill="var(--bg-recessed)" stroke="var(--rule-strong)" />
            <text x="609" y="98" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">RAM Frame</text>

            <line x1="130" y1="46" x2="178" y2="46" stroke="var(--ink-primary)" strokeWidth="1.5" markerEnd="url(#m4tlb-arr)" />
            <path d="M 152 46 L 152 164 L 178 164" fill="none" stroke="var(--ink-secondary)" strokeWidth="1.3" strokeDasharray="4 2" markerEnd="url(#m4tlb-arr)" />
            <path d="M 330 58 L 385 58 L 385 88 L 422 88" fill="none" stroke="var(--div-m4)" strokeWidth="1.6" markerEnd="url(#m4tlb-arr-m4)" />
            <path d="M 330 164 L 385 164 L 385 104 L 422 104" fill="none" stroke="var(--ink-primary)" strokeWidth="1.4" markerEnd="url(#m4tlb-arr)" />
            <line x1="532" y1="94" x2="556" y2="94" stroke="var(--ink-primary)" strokeWidth="1.5" markerEnd="url(#m4tlb-arr)" />
          </svg>
        ),
      };

    case 'm4-segmentation-hw':
      return {
        title: 'Segmentation Address Translation Hardware (C1 1-2 Q5: offset < limit -> base + d)',
        svg: (
          <svg viewBox="0 0 680 205" className="w-full h-auto" role="img" aria-label="Segmentation translation hardware">
            <ArrowDefs prefix="m4seg" />
            <rect x="18" y="34" width="106" height="46" rx="2" fill="var(--bg-paper)" stroke="var(--rule-strong)" />
            <text x="71" y="54" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-primary)">CPU Addr</text>
            <text x="71" y="70" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--div-m4)">&lt; s , d &gt;</text>

            <rect x="166" y="20" width="166" height="118" rx="2" fill="var(--bg-sheet)" stroke="var(--rule-strong)" />
            <text x="249" y="40" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-primary)">Segment Table (STBR)</text>
            <text x="249" y="62" textAnchor="middle" fontSize="9.5" fill="var(--ink-secondary)">Code: Base 1000 · Lim 400</text>
            <text x="249" y="82" textAnchor="middle" fontSize="9.5" fill="var(--div-danger)">Data: Base 2000 · Lim 300</text>
            <text x="249" y="102" textAnchor="middle" fontSize="9.5" fill="var(--ink-secondary)">Heap: Base 4000 · Lim 500</text>
            <text x="249" y="122" textAnchor="middle" fontSize="9.5" fill="var(--ink-secondary)">Stack: Base 6000 · Lim 200</text>

            <rect x="380" y="34" width="112" height="46" rx="2" fill="var(--bg-recessed)" stroke="var(--div-m4)" strokeWidth="1.6" />
            <text x="436" y="55" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-primary)">d &lt; limit?</text>
            <text x="436" y="71" textAnchor="middle" fontSize="8.5" fill="var(--ink-muted)">350 &lt; 300 =&gt; NO</text>

            <rect x="536" y="34" width="126" height="46" rx="2" fill="var(--bg-paper)" stroke="var(--div-m3)" strokeWidth="1.6" />
            <text x="599" y="54" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--div-m3)">Phys = base + d</text>
            <text x="599" y="70" textAnchor="middle" fontSize="9" fill="var(--ink-secondary)">e.g. 1000+250=1250</text>

            <rect x="380" y="128" width="282" height="42" rx="2" fill="var(--bg-paper)" stroke="var(--div-danger)" />
            <text x="521" y="153" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--div-danger)">TRAP: Segmentation Fault (d &gt;= limit)</text>

            <line x1="124" y1="57" x2="164" y2="57" stroke="var(--ink-primary)" strokeWidth="1.5" markerEnd="url(#m4seg-arr)" />
            <line x1="332" y1="57" x2="378" y2="57" stroke="var(--ink-primary)" strokeWidth="1.5" markerEnd="url(#m4seg-arr)" />
            <line x1="492" y1="57" x2="534" y2="57" stroke="var(--div-m3)" strokeWidth="1.5" markerEnd="url(#m4seg-arr-m3)" />
            <line x1="436" y1="80" x2="436" y2="126" stroke="var(--div-danger)" strokeWidth="1.5" />
          </svg>
        ),
      };

    case 'm4-demand-paging-fault':
      return {
        title: '6-Step Demand Paging Page-Fault Handling Cycle',
        svg: (
          <svg viewBox="0 0 680 175" className="w-full h-auto" role="img" aria-label="Six step page fault handling cycle">
            <ArrowDefs prefix="m4pf" />
            {[
              { x: 14, n: '1. Invalid Bit', d: 'PTE v/i = i' },
              { x: 124, n: '2. OS Trap', d: 'Check PCB' },
              { x: 234, n: '3. Free Frame', d: 'Or evict victim' },
              { x: 344, n: '4. Disk Read', d: 'Load page' },
              { x: 454, n: '5. Update PTE', d: 'Set bit = v' },
              { x: 564, n: '6. Restart', d: 'Re-run instr' },
            ].map((s, idx) => (
              <g key={s.n}>
                <rect x={s.x} y="30" width="98" height="68" rx="2" fill="var(--bg-paper)" stroke={idx === 3 ? 'var(--div-danger)' : 'var(--div-m4)'} strokeWidth="1.5" />
                <text x={s.x + 49} y="56" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--ink-primary)">{s.n}</text>
                <text x={s.x + 49} y="78" textAnchor="middle" fontSize="9" fill="var(--ink-secondary)">{s.d}</text>
                {idx < 5 && (
                  <line x1={s.x + 98} y1="64" x2={s.x + 122} y2="64" stroke="var(--ink-primary)" strokeWidth="1.4" markerEnd="url(#m4pf-arr)" />
                )}
              </g>
            ))}
            <rect x="14" y="118" width="648" height="38" rx="2" fill="var(--bg-recessed)" stroke="var(--rule-hairline)" />
            <text x="338" y="141" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-primary)">
              EAT = (1 - p) · ma + p · PageFaultTime  ·  Keep p &lt; 10⁻⁶ so disk latency (8 ms) doesn’t dominate 100 ns RAM!
            </text>
          </svg>
        ),
      };

    case 'm4-thrashing-curve':
      return {
        title: 'CPU Utilization vs Degree of Multiprogramming (Thrashing Cliff · C1 2-2 Q3)',
        svg: (
          <svg viewBox="0 0 680 215" className="w-full h-auto" role="img" aria-label="Thrashing CPU utilization cliff">
            <ArrowDefs prefix="m4th" />
            {/* Axes */}
            <line x1="64" y1="176" x2="410" y2="176" stroke="var(--ink-primary)" strokeWidth="1.6" markerEnd="url(#m4th-arr)" />
            <line x1="64" y1="176" x2="64" y2="24" stroke="var(--ink-primary)" strokeWidth="1.6" markerEnd="url(#m4th-arr)" />
            <text x="236" y="198" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-secondary)">Degree of Multiprogramming (N)</text>
            <text x="24" y="100" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-secondary)" transform="rotate(-90 24 100)">CPU Utilization</text>

            {/* Curve */}
            <path d="M 66 168 Q 160 44, 240 42 Q 270 42, 294 128 Q 320 166, 392 170" fill="none" stroke="var(--div-m4)" strokeWidth="2.6" />
            <line x1="255" y1="36" x2="255" y2="176" stroke="var(--div-danger)" strokeDasharray="5 3" strokeWidth="1.4" />
            <text x="262" y="54" fontSize="9.5" fontWeight="700" fill="var(--div-danger)">THRASHING CLIFF</text>
            <text x="262" y="68" fontSize="9" fill="var(--div-danger)">Σ WSS_i &gt; m frames</text>

            {/* Remedies box */}
            <rect x="434" y="24" width="228" height="162" rx="2" fill="var(--bg-sheet)" stroke="var(--rule-hairline)" />
            <text x="548" y="46" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">Remedies (C1 2-2 Q3 &amp; 1-2 Q6)</text>
            <text x="448" y="72" fontSize="9.5" fill="var(--ink-secondary)">1. Working-Set Model: if D = ΣWSS &gt; m,</text>
            <text x="458" y="88" fontSize="9.5" fontWeight="700" fill="var(--div-m4)">   suspend / swap out 1 process.</text>
            <text x="448" y="114" fontSize="9.5" fill="var(--ink-secondary)">2. Page-Fault Frequency (PFF):</text>
            <text x="458" y="130" fontSize="9.5" fill="var(--ink-secondary)">   High PFF -&gt; add frame; Low -&gt; reclaim.</text>
            <text x="448" y="156" fontSize="9.5" fill="var(--ink-secondary)">3. Local replacement stops one</text>
            <text x="458" y="172" fontSize="9.5" fill="var(--ink-secondary)">   thrashing process stealing frames.</text>
          </svg>
        ),
      };

    case 'm4-directory-trees':
      return {
        title: 'Directory Evolution: Tree-Structured vs Acyclic-Graph (Hard vs Soft Links)',
        svg: (
          <svg viewBox="0 0 680 205" className="w-full h-auto" role="img" aria-label="Acyclic graph directory with hard and soft links">
            <ArrowDefs prefix="m4dir" />
            <rect x="280" y="14" width="120" height="32" rx="2" fill="var(--bg-recessed)" stroke="var(--rule-strong)" />
            <text x="340" y="34" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">/ (Root)</text>

            <rect x="116" y="74" width="120" height="32" rx="2" fill="var(--bg-paper)" stroke="var(--div-m4)" strokeWidth="1.5" />
            <text x="176" y="94" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-primary)">/home/alice</text>

            <rect x="444" y="74" width="120" height="32" rx="2" fill="var(--bg-paper)" stroke="var(--div-m5)" strokeWidth="1.5" />
            <text x="504" y="94" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-primary)">/home/bob</text>

            <rect x="250" y="148" width="180" height="42" rx="2" fill="var(--bg-recessed)" stroke="var(--div-m3)" strokeWidth="1.6" />
            <text x="340" y="167" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--div-m3)">Shared Inode #4821</text>
            <text x="340" y="182" textAnchor="middle" fontSize="9" fill="var(--ink-secondary)">link_count = 2 (deleted when 0)</text>

            <line x1="312" y1="46" x2="196" y2="72" stroke="var(--ink-primary)" strokeWidth="1.4" markerEnd="url(#m4dir-arr)" />
            <line x1="368" y1="46" x2="484" y2="72" stroke="var(--ink-primary)" strokeWidth="1.4" markerEnd="url(#m4dir-arr)" />
            <line x1="196" y1="106" x2="296" y2="146" stroke="var(--div-m4)" strokeWidth="1.6" markerEnd="url(#m4dir-arr-m4)" />
            <text x="195" y="136" fontSize="9" fontWeight="700" fill="var(--div-m4)">Hard Link (same inode)</text>
            <line x1="484" y1="106" x2="384" y2="146" stroke="var(--div-m5)" strokeWidth="1.6" strokeDasharray="4 3" markerEnd="url(#m4dir-arr)" />
            <text x="488" y="136" fontSize="9" fontWeight="700" fill="var(--div-m5)">Symlink (stores path)</text>
          </svg>
        ),
      };

    case 'm4-file-allocation-inode':
      return {
        title: 'Unix Multi-Level Indexed Inode (12 Direct + Single + Double + Triple Indirect)',
        svg: (
          <svg viewBox="0 0 680 220" className="w-full h-auto" role="img" aria-label="Unix inode multi-level pointer layout">
            <ArrowDefs prefix="m4in" />
            <rect x="20" y="18" width="186" height="184" rx="2" fill="var(--bg-sheet)" stroke="var(--rule-strong)" />
            <text x="113" y="38" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">Unix Inode Structure</text>
            <rect x="34" y="48" width="158" height="28" rx="2" fill="var(--bg-recessed)" stroke="var(--rule-hairline)" />
            <text x="113" y="66" textAnchor="middle" fontSize="9" fill="var(--ink-secondary)">Metadata (uid, mode, size)</text>
            <rect x="34" y="82" width="158" height="26" rx="2" fill="var(--bg-paper)" stroke="var(--div-m3)" />
            <text x="113" y="99" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--div-m3)">12 Direct Pointers</text>
            <rect x="34" y="114" width="158" height="24" rx="2" fill="var(--bg-paper)" stroke="var(--div-m4)" />
            <text x="113" y="130" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--div-m4)">1 Single Indirect (P)</text>
            <rect x="34" y="142" width="158" height="24" rx="2" fill="var(--bg-paper)" stroke="var(--div-m2)" />
            <text x="113" y="158" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--div-m2)">1 Double Indirect (P²)</text>
            <rect x="34" y="170" width="158" height="24" rx="2" fill="var(--bg-paper)" stroke="var(--div-m5)" />
            <text x="113" y="186" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--div-m5)">1 Triple Indirect (P³)</text>

            {/* Right expansions */}
            <rect x="270" y="76" width="128" height="32" rx="2" fill="var(--bg-paper)" stroke="var(--div-m3)" />
            <text x="334" y="96" textAnchor="middle" fontSize="9.5" fill="var(--ink-primary)">12 Data Blocks</text>

            <rect x="270" y="116" width="128" height="32" rx="2" fill="var(--bg-paper)" stroke="var(--div-m4)" />
            <text x="334" y="136" textAnchor="middle" fontSize="9.5" fill="var(--ink-primary)">Index Block (P ptrs)</text>

            <rect x="444" y="116" width="214" height="80" rx="2" fill="var(--bg-recessed)" stroke="var(--rule-strong)" />
            <text x="551" y="138" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-primary)">FAT Numerical Formula</text>
            <text x="551" y="158" textAnchor="middle" fontSize="9.5" fill="var(--div-m4)">P = BlockSize / PointerSize</text>
            <text x="551" y="178" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--ink-primary)">Max = (12 + P + P² + P³) × B</text>

            <line x1="192" y1="95" x2="268" y2="95" stroke="var(--ink-primary)" strokeWidth="1.4" markerEnd="url(#m4in-arr)" />
            <line x1="192" y1="126" x2="268" y2="132" stroke="var(--div-m4)" strokeWidth="1.4" markerEnd="url(#m4in-arr-m4)" />
            <line x1="398" y1="132" x2="442" y2="132" stroke="var(--ink-primary)" strokeWidth="1.4" markerEnd="url(#m4in-arr)" />
          </svg>
        ),
      };

    default:
      return null;
  }
};
