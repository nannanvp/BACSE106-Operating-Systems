import React from 'react';
import { DiagramId } from '../../data/noteTypes';

export const renderModule5Diagram = (id: DiagramId): { title: string; svg: React.ReactNode } | null => {
  switch (id) {
    case 'm5-disk-geometry':
      return {
        title: 'Magnetic Disk Platter Geometry & Access Time Breakdown (C1 1-2 Q9)',
        svg: (
          <svg viewBox="0 0 680 215" className="w-full h-auto" role="img" aria-label="Magnetic disk platter tracks and sectors">
            {/* Concentric tracks */}
            <circle cx="150" cy="108" r="84" fill="var(--bg-sheet)" stroke="var(--rule-strong)" strokeWidth="1.6" />
            <circle cx="150" cy="108" r="64" fill="none" stroke="var(--div-m5)" strokeWidth="1.2" strokeDasharray="4 2" />
            <circle cx="150" cy="108" r="44" fill="none" stroke="var(--div-m4)" strokeWidth="1.2" />
            <circle cx="150" cy="108" r="22" fill="var(--bg-recessed)" stroke="var(--rule-strong)" />
            {/* Sector wedge */}
            <line x1="150" y1="108" x2="226" y2="72" stroke="var(--div-m2)" strokeWidth="1.6" />
            <line x1="150" y1="108" x2="233" y2="112" stroke="var(--div-m2)" strokeWidth="1.6" />
            <text x="150" y="112" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="var(--ink-primary)">Spindle</text>
            <text x="205" y="102" fontSize="8.5" fontWeight="700" fill="var(--div-m2)">Sector</text>
            <text x="150" y="38" textAnchor="middle" fontSize="8.5" fill="var(--div-m5)">Track / Cylinder</text>

            {/* Access time formula box */}
            <rect x="278" y="20" width="384" height="174" rx="2" fill="var(--bg-sheet)" stroke="var(--rule-hairline)" />
            <text x="470" y="44" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink-primary)">Total Disk Access Time = Seek + Rotational + Transfer</text>

            <rect x="296" y="58" width="348" height="34" rx="2" fill="var(--bg-paper)" stroke="var(--div-m5)" />
            <text x="470" y="79" textAnchor="middle" fontSize="9.5" fill="var(--ink-primary)">1. Seek Time: Move arm to target Cylinder (Dominant)</text>

            <rect x="296" y="100" width="348" height="34" rx="2" fill="var(--bg-paper)" stroke="var(--div-m4)" />
            <text x="470" y="121" textAnchor="middle" fontSize="9.5" fill="var(--ink-primary)">2. Avg Rot Latency = (60,000 ms / RPM) / 2  [6000 RPM = 5 ms]</text>

            <rect x="296" y="142" width="348" height="36" rx="2" fill="var(--bg-recessed)" stroke="var(--rule-hairline)" />
            <text x="470" y="164" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--div-m2)">
              Watch Head Direction: prev 250 -&gt; curr 215 means DOWNWARD toward 0!
            </text>
          </svg>
        ),
      };

    case 'm5-raid-levels':
      return {
        title: 'RAID 0 / 1 / 5 / 6 / 10 Striping, Parity & Fault-Tolerance Comparison',
        svg: (
          <svg viewBox="0 0 680 210" className="w-full h-auto" role="img" aria-label="RAID levels comparison">
            {[
              { x: 16, name: 'RAID 0', cap: 'N × C', tol: '0 disks', blocks: ['A1', 'A2', 'A3', 'A4'], col: 'var(--div-danger)' },
              { x: 148, name: 'RAID 1', cap: '(N/2) × C', tol: '1 / pair', blocks: ['A1', 'A1', 'A2', 'A2'], col: 'var(--div-m1)' },
              { x: 280, name: 'RAID 5', cap: '(N-1) × C', tol: '1 disk', blocks: ['A1', 'A2', 'A3', 'P_A'], col: 'var(--div-m4)' },
              { x: 412, name: 'RAID 6', cap: '(N-2) × C', tol: '2 disks', blocks: ['A1', 'A2', 'P', 'Q'], col: 'var(--div-m5)' },
              { x: 544, name: 'RAID 10', cap: '(N/2) × C', tol: '1 / mirror', blocks: ['A1', 'A1', 'A2', 'A2'], col: 'var(--div-m3)' },
            ].map((r) => (
              <g key={r.name}>
                <rect x={r.x} y="16" width="120" height="178" rx="2" fill="var(--bg-sheet)" stroke={r.col} strokeWidth="1.5" />
                <text x={r.x + 60} y="36" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink-primary)">{r.name}</text>
                {r.blocks.map((b, bi) => (
                  <g key={bi}>
                    <rect
                      x={r.x + 12 + bi * 25}
                      y="50"
                      width="21"
                      height="68"
                      rx="1"
                      fill={b.startsWith('P') || b === 'Q' ? 'var(--bg-recessed)' : 'var(--bg-paper)'}
                      stroke="var(--rule-strong)"
                    />
                    <text x={r.x + 22.5 + bi * 25} y="88" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="var(--ink-primary)">{b}</text>
                  </g>
                ))}
                <text x={r.x + 60} y="146" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--ink-primary)">Cap: {r.cap}</text>
                <text x={r.x + 60} y="166" textAnchor="middle" fontSize="9.5" fontWeight="700" fill={r.col}>Survives: {r.tol}</text>
                <text x={r.x + 60} y="184" textAnchor="middle" fontSize="8.5" fill="var(--ink-muted)">
                  {r.name === 'RAID 6' ? 'C1 1-2 Q7 Pick' : r.name === 'RAID 5' ? 'Min 3 disks' : r.name === 'RAID 10' ? 'Min 4 disks' : 'Min 2 disks'}
                </text>
              </g>
            ))}
          </svg>
        ),
      };

    case 'm5-security-crypto':
      return {
        title: 'Stack Buffer Overflow Defenses & Asymmetric Confidentiality vs Digital Signature',
        svg: (
          <svg viewBox="0 0 680 215" className="w-full h-auto" role="img" aria-label="Buffer overflow and public key cryptography">
            {/* Left: Stack frame */}
            <rect x="16" y="16" width="290" height="182" rx="2" fill="var(--bg-sheet)" stroke="var(--rule-hairline)" />
            <text x="161" y="36" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">Stack Overflow &amp; 3 Mitigations</text>
            <rect x="38" y="48" width="246" height="28" rx="2" fill="var(--bg-paper)" stroke="var(--div-danger)" />
            <text x="161" y="66" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--div-danger)">Saved Return Addr (EIP/RIP)</text>
            <rect x="38" y="80" width="246" height="24" rx="2" fill="var(--bg-recessed)" stroke="var(--div-m1)" />
            <text x="161" y="96" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--div-m1)">Stack Canary (Detect Tamper)</text>
            <rect x="38" y="108" width="246" height="30" rx="2" fill="var(--bg-paper)" stroke="var(--rule-strong)" />
            <text x="161" y="127" textAnchor="middle" fontSize="9.5" fill="var(--ink-secondary)">char buf[64]  ↑ Overflow Direction</text>
            <text x="161" y="160" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--div-m3)">1. ASLR · 2. DEP/NX Bit · 3. Stack Canaries</text>
            <text x="161" y="178" textAnchor="middle" fontSize="8.5" fill="var(--ink-muted)">Use strncpy() instead of gets()/strcpy()</text>

            {/* Right: RSA / Signature */}
            <rect x="328" y="16" width="336" height="182" rx="2" fill="var(--bg-sheet)" stroke="var(--rule-hairline)" />
            <text x="496" y="36" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">Asymmetric Keys (Confidentiality vs Signing)</text>

            <rect x="346" y="50" width="300" height="58" rx="2" fill="var(--bg-paper)" stroke="var(--div-m5)" />
            <text x="496" y="70" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--div-m5)">Confidentiality (Encryption)</text>
            <text x="496" y="90" textAnchor="middle" fontSize="9.5" fill="var(--ink-secondary)">Encrypt w/ Receiver PUBLIC -&gt; Decrypt w/ Receiver PRIVATE</text>

            <rect x="346" y="122" width="300" height="60" rx="2" fill="var(--bg-paper)" stroke="var(--div-m3)" />
            <text x="496" y="142" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--div-m3)">Digital Signature (Auth + Non-Repudiation)</text>
            <text x="496" y="162" textAnchor="middle" fontSize="9.5" fill="var(--ink-secondary)">Sign H(M) w/ Sender PRIVATE -&gt; Verify w/ Sender PUBLIC</text>
          </svg>
        ),
      };

    case 'm5-access-matrix':
      return {
        title: 'Access Matrix Implementation: ACL (Column-Wise) vs Capability List (Row-Wise)',
        svg: (
          <svg viewBox="0 0 680 205" className="w-full h-auto" role="img" aria-label="Access matrix ACL versus capability list">
            <rect x="18" y="18" width="348" height="168" rx="2" fill="var(--bg-paper)" stroke="var(--rule-strong)" />
            <text x="192" y="38" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">Access Matrix (Domains × Objects)</text>
            {/* Header row */}
            <rect x="32" y="48" width="320" height="26" fill="var(--bg-recessed)" stroke="var(--rule-hairline)" />
            <text x="72" y="65" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--ink-primary)">Domain</text>
            <text x="150" y="65" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--div-m4)">File F1 (ACL ↓)</text>
            <text x="234" y="65" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--ink-primary)">File F2</text>
            <text x="312" y="65" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--ink-primary)">Printer</text>
            {[
              { d: 'D1 (Cap →)', c1: 'r, w*', c2: 'r', c3: 'print' },
              { d: 'D2', c1: 'r', c2: 'r, w, own', c3: '—' },
              { d: 'D3', c1: 'x', c2: 'r', c3: 'print' },
            ].map((r, i) => (
              <g key={r.d}>
                <line x1="32" y1={104 + i * 28} x2="352" y2={104 + i * 28} stroke="var(--rule-hairline)" />
                <text x="72" y={94 + i * 28} textAnchor="middle" fontSize="9" fontWeight="700" fill={i === 0 ? 'var(--div-m5)' : 'var(--ink-primary)'}>{r.d}</text>
                <text x="150" y={94 + i * 28} textAnchor="middle" fontSize="9" fill="var(--div-m4)">{r.c1}</text>
                <text x="234" y={94 + i * 28} textAnchor="middle" fontSize="9" fill="var(--ink-secondary)">{r.c2}</text>
                <text x="312" y={94 + i * 28} textAnchor="middle" fontSize="9" fill="var(--ink-secondary)">{r.c3}</text>
              </g>
            ))}

            <rect x="386" y="18" width="276" height="168" rx="2" fill="var(--bg-sheet)" stroke="var(--rule-hairline)" />
            <text x="524" y="42" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">Key Implementation Trade-Off</text>
            <text x="402" y="70" fontSize="9.5" fontWeight="700" fill="var(--div-m4)">ACL (Store Column with Object):</text>
            <text x="402" y="88" fontSize="9" fill="var(--ink-secondary)">+ Instant revocation for a file</text>
            <text x="402" y="104" fontSize="9" fill="var(--ink-secondary)">- Slow check per open()</text>
            <text x="402" y="132" fontSize="9.5" fontWeight="700" fill="var(--div-m5)">Capabilities (Store Row with Domain):</text>
            <text x="402" y="150" fontSize="9" fill="var(--ink-secondary)">+ Fast token check (no search)</text>
            <text x="402" y="166" fontSize="9" fill="var(--ink-secondary)">- Hard to revoke globally</text>
          </svg>
        ),
      };

    case 'm5-virtualization-containers':
      return {
        title: 'Virtual Machines (Hypervisor + Guest OS) vs Docker Containers (Shared Host Kernel · C1 2-2 Q4 & C2 Q10)',
        svg: (
          <svg viewBox="0 0 680 235" className="w-full h-auto" role="img" aria-label="Virtual machines versus containers stack">
            {/* Left: VM Stack */}
            <rect x="16" y="14" width="312" height="208" rx="2" fill="var(--bg-sheet)" stroke="var(--rule-hairline)" />
            <text x="172" y="34" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink-primary)">Virtual Machines (Hypervisor)</text>
            {[0, 1].map((i) => (
              <g key={i}>
                <rect x={34 + i * 144} y="46" width="132" height="32" rx="2" fill="var(--bg-paper)" stroke="var(--rule-strong)" />
                <text x={100 + i * 144} y="66" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--ink-primary)">App {i + 1} + Bins/Libs</text>
                <rect x={34 + i * 144} y="82" width="132" height="36" rx="2" fill="var(--bg-recessed)" stroke="var(--div-m2)" strokeWidth="1.4" />
                <text x={100 + i * 144} y="104" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--div-m2)">Full Guest OS {i + 1}</text>
              </g>
            ))}
            <rect x="34" y="126" width="276" height="34" rx="2" fill="var(--bg-paper)" stroke="var(--div-m5)" strokeWidth="1.6" />
            <text x="172" y="147" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--div-m5)">Hypervisor (Type 1 Bare-Metal / Type 2)</text>
            <rect x="34" y="168" width="276" height="26" rx="2" fill="var(--bg-recessed)" stroke="var(--rule-strong)" />
            <text x="172" y="185" textAnchor="middle" fontSize="9.5" fill="var(--ink-secondary)">Host Hardware · Strong Kernel Isolation</text>
            <text x="172" y="212" textAnchor="middle" fontSize="9" fill="var(--ink-muted)">GB RAM · Boots in minutes · Any Guest OS</text>

            {/* Right: Containers */}
            <rect x="352" y="14" width="312" height="208" rx="2" fill="var(--bg-sheet)" stroke="var(--rule-hairline)" />
            <text x="508" y="34" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink-primary)">Containers (Docker / Podman)</text>
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <rect x={368 + i * 96} y="56" width="88" height="58" rx="2" fill="var(--bg-paper)" stroke="var(--div-m4)" strokeWidth="1.5" />
                <text x={412 + i * 96} y="80" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--ink-primary)">App {i + 1}</text>
                <text x={412 + i * 96} y="98" textAnchor="middle" fontSize="8.5" fill="var(--div-m4)">Bins / Libs</text>
              </g>
            ))}
            <rect x="368" y="124" width="280" height="36" rx="2" fill="var(--bg-recessed)" stroke="var(--div-m3)" strokeWidth="1.6" />
            <text x="508" y="140" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--div-m3)">Container Runtime + Namespaces + cgroups</text>
            <text x="508" y="154" textAnchor="middle" fontSize="8.5" fill="var(--ink-secondary)">SHARED HOST OS KERNEL (Zero Guest OS)</text>
            <rect x="368" y="168" width="280" height="26" rx="2" fill="var(--bg-paper)" stroke="var(--rule-strong)" />
            <text x="508" y="185" textAnchor="middle" fontSize="9.5" fill="var(--ink-secondary)">Host Hardware</text>
            <text x="508" y="212" textAnchor="middle" fontSize="9" fill="var(--ink-muted)">MB RAM · Starts in ms · Same Host Kernel</text>
          </svg>
        ),
      };

    default:
      return null;
  }
};
