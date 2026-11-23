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
      id={`${prefix}-arr-accent`}
      viewBox="0 0 10 10"
      refX="8.5"
      refY="5"
      markerWidth="6.5"
      markerHeight="6.5"
      orient="auto-start-reverse"
    >
      <path d="M 0 1.2 L 9 5 L 0 8.8 z" fill="var(--div-m2)" />
    </marker>
    <marker
      id={`${prefix}-arr-danger`}
      viewBox="0 0 10 10"
      refX="8.5"
      refY="5"
      markerWidth="6.5"
      markerHeight="6.5"
      orient="auto-start-reverse"
    >
      <path d="M 0 1.2 L 9 5 L 0 8.8 z" fill="var(--div-danger)" />
    </marker>
  </defs>
);

export const renderModule12Diagram = (id: DiagramId): { title: string; svg: React.ReactNode } | null => {
  switch (id) {
    case 'm1-dual-mode-trap':
      return {
        title: 'Dual-Mode Execution & Hardware Privilege Trap (Mode Bit 1 -> 0 -> 1)',
        svg: (
          <svg viewBox="0 0 680 240" className="w-full h-auto" role="img" aria-label="Dual-mode user to kernel trap cycle">
            <ArrowDefs prefix="m1dm" />
            {/* User Mode band */}
            <rect x="16" y="14" width="648" height="92" rx="2" fill="var(--bg-sheet)" stroke="var(--rule-hairline)" />
            <text x="28" y="34" fontSize="11" fontWeight="700" fill="var(--div-m1)">USER MODE (mode bit = 1 · Ring 3 · Non-Privileged)</text>
            <rect x="40" y="48" width="150" height="44" rx="2" fill="var(--bg-paper)" stroke="var(--rule-strong)" />
            <text x="115" y="67" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink-primary)">User Process</text>
            <text x="115" y="83" textAnchor="middle" fontSize="10" fill="var(--ink-muted)">read(fd, buf, n)</text>

            <rect x="490" y="48" width="155" height="44" rx="2" fill="var(--bg-paper)" stroke="var(--rule-strong)" />
            <text x="567" y="67" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink-primary)">Resume User Code</text>
            <text x="567" y="83" textAnchor="middle" fontSize="10" fill="var(--ink-muted)">mode bit restored = 1</text>

            {/* Boundary line */}
            <line x1="16" y1="118" x2="664" y2="118" stroke="var(--div-m2)" strokeWidth="2" strokeDasharray="6 4" />
            <text x="340" y="113" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--div-m2)">HARDWARE PRIVILEGE BOUNDARY</text>

            {/* Kernel Mode band */}
            <rect x="16" y="130" width="648" height="96" rx="2" fill="var(--bg-recessed)" stroke="var(--rule-hairline)" />
            <text x="28" y="150" fontSize="11" fontWeight="700" fill="var(--div-m5)">KERNEL MODE (mode bit = 0 · Ring 0 · Privileged I/O &amp; MMU)</text>
            <rect x="210" y="164" width="260" height="48" rx="2" fill="var(--bg-paper)" stroke="var(--div-m5)" strokeWidth="1.5" />
            <text x="340" y="185" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink-primary)">System Call Handler (sys_read)</text>
            <text x="340" y="201" textAnchor="middle" fontSize="10" fill="var(--ink-secondary)">Validate args · Access Disk/DMA · Copy to buf</text>

            {/* Trap arrow down */}
            <path d="M 190 70 L 245 70 L 245 162" fill="none" stroke="var(--ink-primary)" strokeWidth="1.6" markerEnd="url(#m1dm-arr)" />
            <text x="253" y="96" fontSize="10" fontWeight="700" fill="var(--ink-primary)">TRAP / syscall</text>
            <text x="253" y="144" fontSize="10" fill="var(--ink-secondary)">set bit = 0</text>

            {/* Return arrow up */}
            <path d="M 435 164 L 435 70 L 488 70" fill="none" stroke="var(--ink-primary)" strokeWidth="1.6" markerEnd="url(#m1dm-arr)" />
            <text x="443" y="144" fontSize="10" fontWeight="700" fill="var(--ink-primary)">sysret / iret</text>
            <text x="443" y="96" fontSize="10" fill="var(--ink-secondary)">set bit = 1</text>
          </svg>
        ),
      };

    case 'm1-os-structures':
      return {
        title: 'Monolithic Kernel vs Microkernel (Privilege Boundary & IPC Path)',
        svg: (
          <svg viewBox="0 0 680 260" className="w-full h-auto" role="img" aria-label="Monolithic versus Microkernel architecture">
            <ArrowDefs prefix="m1os" />
            {/* Left: Monolithic */}
            <rect x="16" y="14" width="312" height="232" rx="2" fill="var(--bg-sheet)" stroke="var(--rule-hairline)" />
            <text x="172" y="34" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink-primary)">Monolithic Kernel (Linux / BSD)</text>
            <rect x="34" y="46" width="276" height="36" rx="2" fill="var(--bg-paper)" stroke="var(--rule-strong)" />
            <text x="172" y="68" textAnchor="middle" fontSize="10.5" fill="var(--ink-primary)">User Applications (Shell, Compiler, DB)</text>
            <line x1="24" y1="95" x2="320" y2="95" stroke="var(--div-m2)" strokeWidth="1.8" strokeDasharray="5 3" />
            <text x="172" y="91" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--div-m2)">USER / KERNEL BOUNDARY (Syscall)</text>
            <rect x="34" y="106" width="276" height="92" rx="2" fill="var(--bg-recessed)" stroke="var(--div-m1)" strokeWidth="1.6" />
            <text x="172" y="124" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">Single Kernel Address Space (Ring 0)</text>
            <text x="172" y="144" textAnchor="middle" fontSize="9.5" fill="var(--ink-secondary)">CPU Scheduler · Virtual Memory · File System</text>
            <text x="172" y="160" textAnchor="middle" fontSize="9.5" fill="var(--ink-secondary)">Device Drivers · Network Stack (Direct C calls)</text>
            <text x="172" y="182" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--div-danger)">Fast · Driver Bug =&gt; Full Kernel Panic</text>
            <rect x="34" y="206" width="276" height="28" rx="2" fill="var(--bg-paper)" stroke="var(--rule-strong)" />
            <text x="172" y="224" textAnchor="middle" fontSize="10" fill="var(--ink-muted)">Hardware (CPU, RAM, Disk, NIC)</text>

            {/* Right: Microkernel */}
            <rect x="352" y="14" width="312" height="232" rx="2" fill="var(--bg-sheet)" stroke="var(--rule-hairline)" />
            <text x="508" y="34" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink-primary)">Microkernel (Mach / QNX / L4)</text>
            <rect x="366" y="46" width="84" height="44" rx="2" fill="var(--bg-paper)" stroke="var(--rule-strong)" />
            <text x="408" y="65" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--ink-primary)">App</text>
            <text x="408" y="80" textAnchor="middle" fontSize="8.5" fill="var(--ink-muted)">User Space</text>
            <rect x="462" y="46" width="90" height="44" rx="2" fill="var(--bg-paper)" stroke="var(--div-m4)" strokeWidth="1.4" />
            <text x="507" y="65" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--ink-primary)">File Server</text>
            <text x="507" y="80" textAnchor="middle" fontSize="8.5" fill="var(--div-m4)">Isolated Ring 3</text>
            <rect x="564" y="46" width="88" height="44" rx="2" fill="var(--bg-paper)" stroke="var(--div-m4)" strokeWidth="1.4" />
            <text x="608" y="65" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--ink-primary)">Dev Driver</text>
            <text x="608" y="80" textAnchor="middle" fontSize="8.5" fill="var(--div-m4)">Isolated Ring 3</text>

            <line x1="360" y1="120" x2="656" y2="120" stroke="var(--div-m2)" strokeWidth="1.8" strokeDasharray="5 3" />
            <text x="508" y="115" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--div-m2)">IPC MESSAGE PASSING ACROSS BOUNDARY</text>

            <rect x="366" y="132" width="286" height="66" rx="2" fill="var(--bg-recessed)" stroke="var(--div-m5)" strokeWidth="1.6" />
            <text x="509" y="152" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">Minimal Microkernel (Ring 0)</text>
            <text x="509" y="170" textAnchor="middle" fontSize="9.5" fill="var(--ink-secondary)">IPC Router · Basic Scheduling · Memory Mapping</text>
            <text x="509" y="187" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--div-m3)">Fault-Isolated · Higher IPC Context Overhead</text>

            <path d="M 408 90 L 408 130" stroke="var(--ink-primary)" strokeWidth="1.4" markerEnd="url(#m1os-arr)" />
            <path d="M 507 130 L 507 92" stroke="var(--ink-primary)" strokeWidth="1.4" markerEnd="url(#m1os-arr)" />
            <path d="M 608 130 L 608 92" stroke="var(--ink-primary)" strokeWidth="1.4" markerEnd="url(#m1os-arr)" />

            <rect x="366" y="206" width="286" height="28" rx="2" fill="var(--bg-paper)" stroke="var(--rule-strong)" />
            <text x="509" y="224" textAnchor="middle" fontSize="10" fill="var(--ink-muted)">Hardware (CPU, RAM, Disk, NIC)</text>
          </svg>
        ),
      };

    case 'm1-syscall-flow':
      return {
        title: 'POSIX System Call Dispatch & FD Redirection Flow (C2 Q1b)',
        svg: (
          <svg viewBox="0 0 680 215" className="w-full h-auto" role="img" aria-label="System call dispatch and FD redirection">
            <ArrowDefs prefix="m1sc" />
            <rect x="16" y="16" width="150" height="72" rx="2" fill="var(--bg-paper)" stroke="var(--rule-strong)" />
            <text x="91" y="38" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">1. C Library API</text>
            <text x="91" y="56" textAnchor="middle" fontSize="9.5" fill="var(--ink-secondary)">open("report.log")</text>
            <text x="91" y="72" textAnchor="middle" fontSize="9" fill="var(--ink-muted)">load syscall # in RAX</text>

            <rect x="200" y="16" width="170" height="72" rx="2" fill="var(--bg-recessed)" stroke="var(--div-m1)" strokeWidth="1.5" />
            <text x="285" y="38" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">2. SysCall Table [i]</text>
            <text x="285" y="56" textAnchor="middle" fontSize="9.5" fill="var(--ink-secondary)">Kernel trap (mode=0)</text>
            <text x="285" y="72" textAnchor="middle" fontSize="9" fill="var(--ink-muted)">Index table -&gt; sys_open()</text>

            <rect x="404" y="16" width="260" height="72" rx="2" fill="var(--bg-paper)" stroke="var(--div-m4)" strokeWidth="1.5" />
            <text x="534" y="38" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">3. Shell Child FD Table (&gt; report.log)</text>
            <text x="534" y="56" textAnchor="middle" fontSize="9.5" fill="var(--ink-secondary)">FD 0: stdin · FD 1: close(1) -&gt; report.log</text>
            <text x="534" y="72" textAnchor="middle" fontSize="9" fill="var(--div-m4)">Lowest free FD = 1 bound before exec()</text>

            <line x1="166" y1="52" x2="198" y2="52" stroke="var(--ink-primary)" strokeWidth="1.5" markerEnd="url(#m1sc-arr)" />
            <line x1="370" y1="52" x2="402" y2="52" stroke="var(--ink-primary)" strokeWidth="1.5" markerEnd="url(#m1sc-arr)" />

            <rect x="16" y="114" width="648" height="86" rx="2" fill="var(--bg-sheet)" stroke="var(--rule-hairline)" />
            <text x="32" y="136" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">3 Parameter-Passing Mechanisms (Silberschatz Ch 2):</text>
            <rect x="32" y="148" width="194" height="40" rx="2" fill="var(--bg-paper)" stroke="var(--rule-hairline)" />
            <text x="129" y="165" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--div-m1)">1. CPU Registers</text>
            <text x="129" y="180" textAnchor="middle" fontSize="9" fill="var(--ink-muted)">Fastest · Limited count</text>

            <rect x="242" y="148" width="198" height="40" rx="2" fill="var(--bg-paper)" stroke="var(--rule-hairline)" />
            <text x="341" y="165" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--div-m4)">2. Memory Block / Table</text>
            <text x="341" y="180" textAnchor="middle" fontSize="9" fill="var(--ink-muted)">Pointer passed in reg (Linux)</text>

            <rect x="456" y="148" width="192" height="40" rx="2" fill="var(--bg-paper)" stroke="var(--rule-hairline)" />
            <text x="552" y="165" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--div-m5)">3. Process Stack</text>
            <text x="552" y="180" textAnchor="middle" fontSize="9" fill="var(--ink-muted)">Push by app · Pop by OS</text>
          </svg>
        ),
      };

    case 'm1-interrupt-dma':
      return {
        title: 'DMA Block Transfer vs Interrupt-Driven I/O (1 IRQ per Block)',
        svg: (
          <svg viewBox="0 0 680 215" className="w-full h-auto" role="img" aria-label="DMA controller direct memory transfer">
            <ArrowDefs prefix="m1dma" />
            <rect x="24" y="20" width="140" height="58" rx="2" fill="var(--bg-paper)" stroke="var(--rule-strong)" />
            <text x="94" y="45" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink-primary)">CPU</text>
            <text x="94" y="63" textAnchor="middle" fontSize="9.5" fill="var(--ink-muted)">Runs other procs</text>

            <rect x="260" y="20" width="160" height="58" rx="2" fill="var(--bg-recessed)" stroke="var(--div-m4)" strokeWidth="1.6" />
            <text x="340" y="45" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink-primary)">DMA Controller</text>
            <text x="340" y="63" textAnchor="middle" fontSize="9.5" fill="var(--div-m4)">Cycle stealing on bus</text>

            <rect x="516" y="20" width="140" height="58" rx="2" fill="var(--bg-paper)" stroke="var(--rule-strong)" />
            <text x="586" y="45" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink-primary)">Main Memory</text>
            <text x="586" y="63" textAnchor="middle" fontSize="9.5" fill="var(--ink-muted)">Target Buffer</text>

            <rect x="260" y="138" width="160" height="54" rx="2" fill="var(--bg-paper)" stroke="var(--div-m2)" strokeWidth="1.5" />
            <text x="340" y="161" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">Disk / NIC Controller</text>
            <text x="340" y="178" textAnchor="middle" fontSize="9.5" fill="var(--ink-muted)">High-speed block I/O</text>

            {/* Step 1 */}
            <path d="M 164 38 L 258 38" stroke="var(--ink-primary)" strokeWidth="1.5" markerEnd="url(#m1dma-arr)" />
            <text x="211" y="31" textAnchor="middle" fontSize="9" fill="var(--ink-secondary)">1. Init (addr,cnt)</text>

            {/* Step 2 */}
            <path d="M 340 138 L 340 80" stroke="var(--div-m2)" strokeWidth="1.8" markerEnd="url(#m1dma-arr-accent)" />
            <text x="415" y="112" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--div-m2)">2. Direct Block Burst</text>

            {/* Step 3 */}
            <path d="M 420 49 L 514 49" stroke="var(--div-m4)" strokeWidth="1.8" markerEnd="url(#m1dma-arr)" />
            <text x="467" y="41" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--div-m4)">3. Write RAM</text>

            {/* Step 4 */}
            <path d="M 260 66 L 166 66" stroke="var(--div-m5)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#m1dma-arr)" />
            <text x="211" y="96" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--div-m5)">4. Single IRQ</text>
            <text x="211" y="109" textAnchor="middle" fontSize="8.5" fill="var(--ink-muted)">(1 per block!)</text>
          </svg>
        ),
      };

    case 'm1-boot-sequence':
      return {
        title: 'Embedded & Linux System Boot Pipeline (C1 Set 1-2 Q1)',
        svg: (
          <svg viewBox="0 0 680 170" className="w-full h-auto" role="img" aria-label="Linux boot pipeline stages">
            <ArrowDefs prefix="m1bt" />
            {[
              { x: 14, label: '1. BIOS/UEFI', sub: 'ROM · POST', col: 'var(--div-m1)' },
              { x: 146, label: '2. Bootloader', sub: 'GRUB / U-Boot', col: 'var(--div-m2)' },
              { x: 278, label: '3. Kernel', sub: 'vmlinuz + MMU', col: 'var(--div-m3)' },
              { x: 410, label: '4. initramfs', sub: 'Mount root /', col: 'var(--div-m4)' },
              { x: 542, label: '5. systemd', sub: 'PID 1 · Login', col: 'var(--div-m5)' },
            ].map((s, idx) => (
              <g key={s.label}>
                <rect x={s.x} y="32" width="116" height="68" rx="2" fill="var(--bg-paper)" stroke={s.col} strokeWidth="1.6" />
                <text x={s.x + 58} y="58" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">{s.label}</text>
                <text x={s.x + 58} y="78" textAnchor="middle" fontSize="9.5" fill="var(--ink-secondary)">{s.sub}</text>
                {idx < 4 && (
                  <line x1={s.x + 116} y1="66" x2={s.x + 144} y2="66" stroke="var(--ink-primary)" strokeWidth="1.5" markerEnd="url(#m1bt-arr)" />
                )}
              </g>
            ))}
            <rect x="14" y="118" width="644" height="36" rx="2" fill="var(--bg-recessed)" stroke="var(--rule-hairline)" />
            <text x="336" y="140" textAnchor="middle" fontSize="10" fill="var(--ink-secondary)">
              Failure Diagnosis: Stuck before logo =&gt; Corrupt Bootloader · Kernel Panic =&gt; Missing rootfs driver / initramfs
            </text>
          </svg>
        ),
      };

    case 'm2-process-states':
      return {
        title: '5-State Process Lifecycle & Ready/Waiting Queues (C2 Q2a)',
        svg: (
          <svg viewBox="0 0 680 225" className="w-full h-auto" role="img" aria-label="Five state process lifecycle diagram">
            <ArrowDefs prefix="m2ps" />
            <rect x="20" y="76" width="96" height="44" rx="2" fill="var(--bg-paper)" stroke="var(--div-m1)" strokeWidth="1.6" />
            <text x="68" y="102" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink-primary)">NEW</text>

            <rect x="172" y="76" width="106" height="44" rx="2" fill="var(--bg-paper)" stroke="var(--div-m3)" strokeWidth="1.6" />
            <text x="225" y="102" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink-primary)">READY</text>

            <rect x="358" y="76" width="114" height="44" rx="2" fill="var(--bg-recessed)" stroke="var(--div-m2)" strokeWidth="2" />
            <text x="415" y="102" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink-primary)">RUNNING</text>

            <rect x="556" y="76" width="108" height="44" rx="2" fill="var(--bg-paper)" stroke="var(--div-danger)" strokeWidth="1.6" />
            <text x="610" y="102" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">TERMINATED</text>

            <rect x="266" y="164" width="118" height="44" rx="2" fill="var(--bg-paper)" stroke="var(--div-m5)" strokeWidth="1.6" />
            <text x="325" y="190" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink-primary)">WAITING</text>

            {/* Admitted */}
            <line x1="116" y1="98" x2="170" y2="98" stroke="var(--ink-primary)" strokeWidth="1.5" markerEnd="url(#m2ps-arr)" />
            <text x="143" y="90" textAnchor="middle" fontSize="9" fill="var(--ink-secondary)">admit</text>

            {/* Dispatch */}
            <line x1="278" y1="98" x2="356" y2="98" stroke="var(--ink-primary)" strokeWidth="1.5" markerEnd="url(#m2ps-arr)" />
            <text x="317" y="90" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--ink-primary)">dispatch</text>

            {/* Interrupt / quantum */}
            <path d="M 415 76 L 415 36 L 225 36 L 225 74" fill="none" stroke="var(--div-m2)" strokeWidth="1.5" markerEnd="url(#m2ps-arr-accent)" />
            <text x="320" y="28" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--div-m2)">timer interrupt / preemption</text>

            {/* Exit */}
            <line x1="472" y1="98" x2="554" y2="98" stroke="var(--ink-primary)" strokeWidth="1.5" markerEnd="url(#m2ps-arr)" />
            <text x="513" y="90" textAnchor="middle" fontSize="9" fill="var(--ink-secondary)">exit()</text>

            {/* I/O Wait */}
            <path d="M 415 120 L 415 186 L 386 186" fill="none" stroke="var(--ink-primary)" strokeWidth="1.5" markerEnd="url(#m2ps-arr)" />
            <text x="486" y="160" textAnchor="middle" fontSize="9" fill="var(--ink-secondary)">I/O or event wait</text>

            {/* I/O Complete */}
            <path d="M 266 186 L 225 186 L 225 122" fill="none" stroke="var(--ink-primary)" strokeWidth="1.5" markerEnd="url(#m2ps-arr)" />
            <text x="155" y="162" textAnchor="middle" fontSize="9" fill="var(--ink-secondary)">I/O / event complete</text>
          </svg>
        ),
      };

    case 'm2-pcb-memory-layout':
      return {
        title: 'Process Control Block (PCB) & Virtual Address Space Layout',
        svg: (
          <svg viewBox="0 0 680 235" className="w-full h-auto" role="img" aria-label="PCB fields and process memory layout">
            <ArrowDefs prefix="m2pcb" />
            {/* Left: PCB */}
            <rect x="24" y="18" width="260" height="202" rx="2" fill="var(--bg-sheet)" stroke="var(--rule-strong)" />
            <rect x="24" y="18" width="260" height="30" rx="2" fill="var(--bg-recessed)" stroke="var(--rule-strong)" />
            <text x="154" y="38" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink-primary)">Process Control Block (task_struct)</text>
            {[
              'Process State (Ready/Run/Wait) + PID',
              'Program Counter (PC) & CPU Registers',
              'CPU Scheduling Info (Priority, Queues)',
              'Memory Mgmt (Page Table Base CR3)',
              'Accounting Info (CPU time, Limits)',
              'I/O Status (Open FD Table, Devices)',
            ].map((row, idx) => (
              <g key={row}>
                <line x1="24" y1={76 + idx * 24} x2="284" y2={76 + idx * 24} stroke="var(--rule-hairline)" />
                <text x="36" y={67 + idx * 24} fontSize="9.5" fill="var(--ink-secondary)">{row}</text>
              </g>
            ))}

            {/* Right: Address space */}
            <rect x="356" y="18" width="296" height="202" rx="2" fill="var(--bg-sheet)" stroke="var(--rule-strong)" />
            <text x="504" y="36" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">Process Address Space (Max -&gt; 0)</text>
            <rect x="380" y="44" width="248" height="34" rx="2" fill="var(--bg-paper)" stroke="var(--div-m2)" strokeWidth="1.4" />
            <text x="504" y="65" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--div-m2)">STACK (local vars, return addrs) ↓</text>

            <text x="504" y="99" textAnchor="middle" fontSize="9.5" fill="var(--ink-muted)">↕ Unallocated Virtual Gap ↕</text>

            <rect x="380" y="110" width="248" height="32" rx="2" fill="var(--bg-paper)" stroke="var(--div-m4)" strokeWidth="1.4" />
            <text x="504" y="130" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--div-m4)">HEAP (malloc / new dynamic) ↑</text>

            <rect x="380" y="148" width="248" height="28" rx="2" fill="var(--bg-paper)" stroke="var(--rule-hairline)" />
            <text x="504" y="166" textAnchor="middle" fontSize="10" fill="var(--ink-secondary)">DATA / BSS (global &amp; static vars)</text>

            <rect x="380" y="182" width="248" height="28" rx="2" fill="var(--bg-recessed)" stroke="var(--rule-strong)" />
            <text x="504" y="200" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-primary)">TEXT / CODE (read-only instructions)</text>
          </svg>
        ),
      };

    case 'm2-fork-tree':
      return {
        title: 'fork() Process Tree (n Unconditional Calls => 2^n Processes) & Orphan/Zombie',
        svg: (
          <svg viewBox="0 0 680 205" className="w-full h-auto" role="img" aria-label="Fork binary process tree">
            <ArrowDefs prefix="m2fk" />
            <rect x="285" y="14" width="110" height="34" rx="2" fill="var(--bg-recessed)" stroke="var(--div-m2)" strokeWidth="1.6" />
            <text x="340" y="35" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">P0 (Parent)</text>

            <rect x="130" y="76" width="120" height="34" rx="2" fill="var(--bg-paper)" stroke="var(--rule-strong)" />
            <text x="190" y="97" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-primary)">P0 (ret &gt; 0)</text>

            <rect x="430" y="76" width="120" height="34" rx="2" fill="var(--bg-paper)" stroke="var(--div-m3)" strokeWidth="1.4" />
            <text x="490" y="97" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--div-m3)">C1 (ret == 0)</text>

            <line x1="315" y1="48" x2="210" y2="74" stroke="var(--ink-primary)" strokeWidth="1.4" markerEnd="url(#m2fk-arr)" />
            <line x1="365" y1="48" x2="470" y2="74" stroke="var(--ink-primary)" strokeWidth="1.4" markerEnd="url(#m2fk-arr)" />
            <text x="340" y="68" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--ink-muted)">fork() #1</text>

            {[
              { x: 54, t: 'P0', s: 'Original' },
              { x: 204, t: 'C2', s: 'Child of P0' },
              { x: 356, t: 'C1', s: 'Child #1' },
              { x: 506, t: 'C3', s: 'Child of C1' },
            ].map((n) => (
              <g key={n.t}>
                <rect x={n.x} y="146" width="120" height="42" rx="2" fill="var(--bg-sheet)" stroke="var(--rule-hairline)" />
                <text x={n.x + 60} y="164" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-primary)">{n.t}</text>
                <text x={n.x + 60} y="180" textAnchor="middle" fontSize="9" fill="var(--ink-muted)">{n.s}</text>
              </g>
            ))}
            <line x1="165" y1="110" x2="114" y2="144" stroke="var(--ink-primary)" strokeWidth="1.3" markerEnd="url(#m2fk-arr)" />
            <line x1="215" y1="110" x2="264" y2="144" stroke="var(--ink-primary)" strokeWidth="1.3" markerEnd="url(#m2fk-arr)" />
            <line x1="465" y1="110" x2="416" y2="144" stroke="var(--ink-primary)" strokeWidth="1.3" markerEnd="url(#m2fk-arr)" />
            <line x1="515" y1="110" x2="566" y2="144" stroke="var(--ink-primary)" strokeWidth="1.3" markerEnd="url(#m2fk-arr)" />
          </svg>
        ),
      };

    case 'm2-thread-models':
      return {
        title: 'Multithreading Models: Many-to-One, One-to-One & Many-to-Many (C2 Q2b)',
        svg: (
          <svg viewBox="0 0 680 215" className="w-full h-auto" role="img" aria-label="Multithreading models comparison">
            {[
              { x: 16, title: 'Many-to-One (M:1)', note: '1 blocking call blocks ALL', kCount: 1, col: 'var(--div-m1)' },
              { x: 238, title: 'One-to-One (1:1 · Linux)', note: 'True SMP · Higher K-thread cost', kCount: 3, col: 'var(--div-m3)' },
              { x: 460, title: 'Many-to-Many (M:N)', note: 'Multiplexes M user -> N kernel', kCount: 2, col: 'var(--div-m5)' },
            ].map((m, idx) => (
              <g key={m.title}>
                <rect x={m.x} y="14" width="204" height="188" rx="2" fill="var(--bg-sheet)" stroke="var(--rule-hairline)" />
                <text x={m.x + 102} y="34" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">{m.title}</text>
                {/* User threads */}
                {[0, 1, 2].map((u) => (
                  <g key={u}>
                    <circle cx={m.x + 42 + u * 60} cy="66" r="14" fill="var(--bg-paper)" stroke={m.col} strokeWidth="1.6" />
                    <text x={m.x + 42 + u * 60} y="70" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--ink-primary)">U{u + 1}</text>
                  </g>
                ))}
                <line x1={m.x + 12} y1="102" x2={m.x + 192} y2="102" stroke="var(--rule-strong)" strokeDasharray="4 3" />
                {/* Kernel threads */}
                {idx === 0 && (
                  <>
                    <circle cx={m.x + 102} cy="138" r="15" fill="var(--bg-recessed)" stroke="var(--ink-primary)" strokeWidth="1.5" />
                    <text x={m.x + 102} y="142" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--ink-primary)">K1</text>
                    <line x1={m.x + 42} y1="80" x2={m.x + 96} y2="124" stroke="var(--ink-secondary)" />
                    <line x1={m.x + 102} y1="80" x2={m.x + 102} y2="123" stroke="var(--ink-secondary)" />
                    <line x1={m.x + 162} y1="80" x2={m.x + 108} y2="124" stroke="var(--ink-secondary)" />
                  </>
                )}
                {idx === 1 &&
                  [0, 1, 2].map((k) => (
                    <g key={k}>
                      <circle cx={m.x + 42 + k * 60} cy="138" r="15" fill="var(--bg-recessed)" stroke="var(--ink-primary)" strokeWidth="1.5" />
                      <text x={m.x + 42 + k * 60} y="142" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--ink-primary)">K{k + 1}</text>
                      <line x1={m.x + 42 + k * 60} y1="80" x2={m.x + 42 + k * 60} y2="123" stroke="var(--ink-secondary)" />
                    </g>
                  ))}
                {idx === 2 && (
                  <>
                    {[0, 1].map((k) => (
                      <g key={k}>
                        <circle cx={m.x + 68 + k * 68} cy="138" r="15" fill="var(--bg-recessed)" stroke="var(--ink-primary)" strokeWidth="1.5" />
                        <text x={m.x + 68 + k * 68} y="142" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--ink-primary)">K{k + 1}</text>
                      </g>
                    ))}
                    <line x1={m.x + 42} y1="80" x2={m.x + 64} y2="123" stroke="var(--ink-secondary)" />
                    <line x1={m.x + 102} y1="80" x2={m.x + 72} y2="123" stroke="var(--ink-secondary)" />
                    <line x1={m.x + 102} y1="80" x2={m.x + 132} y2="123" stroke="var(--ink-secondary)" />
                    <line x1={m.x + 162} y1="80" x2={m.x + 140} y2="123" stroke="var(--ink-secondary)" />
                  </>
                )}
                <text x={m.x + 102} y="182" textAnchor="middle" fontSize="9" fill="var(--ink-muted)">{m.note}</text>
              </g>
            ))}
          </svg>
        ),
      };

    case 'm2-scheduling-queues':
      return {
        title: 'Multilevel Feedback Queue (MLFQ) & Context-Switch Dispatch Pipeline',
        svg: (
          <svg viewBox="0 0 680 215" className="w-full h-auto" role="img" aria-label="MLFQ scheduling queues">
            <ArrowDefs prefix="m2sq" />
            <rect x="24" y="24" width="210" height="44" rx="2" fill="var(--bg-paper)" stroke="var(--div-m2)" strokeWidth="1.6" />
            <text x="129" y="44" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">Q0: RR (q = 8 ms)</text>
            <text x="129" y="60" textAnchor="middle" fontSize="9" fill="var(--div-m2)">Highest Priority · New Arrivals</text>

            <rect x="24" y="88" width="210" height="44" rx="2" fill="var(--bg-paper)" stroke="var(--div-m4)" strokeWidth="1.5" />
            <text x="129" y="108" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">Q1: RR (q = 16 ms)</text>
            <text x="129" y="124" textAnchor="middle" fontSize="9" fill="var(--ink-muted)">Demoted if Q0 quantum expires</text>

            <rect x="24" y="152" width="210" height="44" rx="2" fill="var(--bg-paper)" stroke="var(--div-m5)" strokeWidth="1.5" />
            <text x="129" y="172" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">Q2: FCFS (CPU-Bound)</text>
            <text x="129" y="188" textAnchor="middle" fontSize="9" fill="var(--ink-muted)">Aging promotes long-waiting jobs ↑</text>

            <rect x="330" y="78" width="146" height="64" rx="2" fill="var(--bg-recessed)" stroke="var(--rule-strong)" strokeWidth="1.6" />
            <text x="403" y="105" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink-primary)">CPU Core</text>
            <text x="403" y="124" textAnchor="middle" fontSize="9.5" fill="var(--ink-secondary)">Dispatcher (+CS)</text>

            <rect x="530" y="78" width="128" height="64" rx="2" fill="var(--bg-paper)" stroke="var(--div-m3)" strokeWidth="1.5" />
            <text x="594" y="105" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--div-m3)">Completed</text>
            <text x="594" y="123" textAnchor="middle" fontSize="9" fill="var(--ink-muted)">TAT = CT - AT</text>

            <path d="M 234 46 L 285 46 L 285 96 L 328 96" fill="none" stroke="var(--ink-primary)" strokeWidth="1.4" markerEnd="url(#m2sq-arr)" />
            <line x1="234" y1="110" x2="328" y2="110" stroke="var(--ink-primary)" strokeWidth="1.4" markerEnd="url(#m2sq-arr)" />
            <path d="M 234 174 L 285 174 L 285 124 L 328 124" fill="none" stroke="var(--ink-primary)" strokeWidth="1.4" markerEnd="url(#m2sq-arr)" />
            <line x1="476" y1="110" x2="528" y2="110" stroke="var(--ink-primary)" strokeWidth="1.5" markerEnd="url(#m2sq-arr)" />
          </svg>
        ),
      };

    case 'm2-rag-wfg':
      return {
        title: 'Resource Allocation Graph (RAG) -> Wait-For Graph (C2 Q4 Deadlock Cycle)',
        svg: (
          <svg viewBox="0 0 680 225" className="w-full h-auto" role="img" aria-label="RAG and Wait-For Graph deadlock cycle">
            <ArrowDefs prefix="m2rag" />
            <rect x="16" y="14" width="380" height="198" rx="2" fill="var(--bg-sheet)" stroke="var(--rule-hairline)" />
            <text x="206" y="34" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">Single-Instance RAG (C2 Q4)</text>

            {/* Processes */}
            <circle cx="84" cy="82" r="20" fill="var(--bg-paper)" stroke="var(--div-danger)" strokeWidth="1.8" />
            <text x="84" y="86" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">P1</text>

            <circle cx="236" cy="82" r="20" fill="var(--bg-paper)" stroke="var(--div-danger)" strokeWidth="1.8" />
            <text x="236" y="86" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">P2</text>

            <circle cx="160" cy="176" r="20" fill="var(--bg-paper)" stroke="var(--div-danger)" strokeWidth="1.8" />
            <text x="160" y="180" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">P3</text>

            <circle cx="348" cy="176" r="18" fill="var(--bg-paper)" stroke="var(--rule-strong)" />
            <text x="348" y="180" textAnchor="middle" fontSize="10" fill="var(--ink-secondary)">P4</text>

            {/* Resources */}
            <rect x="144" y="44" width="32" height="24" rx="2" fill="var(--bg-recessed)" stroke="var(--rule-strong)" />
            <text x="160" y="60" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--ink-primary)">R2</text>

            <rect x="240" y="132" width="32" height="24" rx="2" fill="var(--bg-recessed)" stroke="var(--rule-strong)" />
            <text x="256" y="148" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--ink-primary)">R3</text>

            <rect x="52" y="132" width="32" height="24" rx="2" fill="var(--bg-recessed)" stroke="var(--rule-strong)" />
            <text x="68" y="148" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--ink-primary)">R1</text>

            {/* Cycle edges */}
            <line x1="102" y1="72" x2="142" y2="58" stroke="var(--div-danger)" strokeWidth="1.6" markerEnd="url(#m2rag-arr-danger)" />
            <line x1="176" y1="58" x2="216" y2="72" stroke="var(--div-danger)" strokeWidth="1.6" markerEnd="url(#m2rag-arr-danger)" />
            <line x1="244" y1="102" x2="254" y2="130" stroke="var(--div-danger)" strokeWidth="1.6" markerEnd="url(#m2rag-arr-danger)" />
            <line x1="240" y1="150" x2="180" y2="170" stroke="var(--div-danger)" strokeWidth="1.6" markerEnd="url(#m2rag-arr-danger)" />
            <line x1="142" y1="168" x2="86" y2="150" stroke="var(--div-danger)" strokeWidth="1.6" markerEnd="url(#m2rag-arr-danger)" />
            <line x1="72" y1="132" x2="78" y2="104" stroke="var(--div-danger)" strokeWidth="1.6" markerEnd="url(#m2rag-arr-danger)" />
            <line x1="330" y1="172" x2="274" y2="152" stroke="var(--ink-muted)" strokeWidth="1.3" strokeDasharray="3 2" markerEnd="url(#m2rag-arr)" />

            {/* Right: WFG */}
            <rect x="416" y="14" width="248" height="198" rx="2" fill="var(--bg-sheet)" stroke="var(--rule-hairline)" />
            <text x="540" y="34" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink-primary)">Collapsed Wait-For Graph</text>
            <circle cx="480" cy="92" r="18" fill="var(--bg-paper)" stroke="var(--div-danger)" strokeWidth="1.8" />
            <text x="480" y="96" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-primary)">P1</text>
            <circle cx="600" cy="92" r="18" fill="var(--bg-paper)" stroke="var(--div-danger)" strokeWidth="1.8" />
            <text x="600" y="96" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-primary)">P2</text>
            <circle cx="540" cy="158" r="18" fill="var(--bg-paper)" stroke="var(--div-danger)" strokeWidth="1.8" />
            <text x="540" y="162" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-primary)">P3</text>
            <line x1="498" y1="92" x2="580" y2="92" stroke="var(--div-danger)" strokeWidth="1.8" markerEnd="url(#m2rag-arr-danger)" />
            <line x1="590" y1="108" x2="554" y2="144" stroke="var(--div-danger)" strokeWidth="1.8" markerEnd="url(#m2rag-arr-danger)" />
            <line x1="526" y1="144" x2="492" y2="108" stroke="var(--div-danger)" strokeWidth="1.8" markerEnd="url(#m2rag-arr-danger)" />
            <text x="540" y="198" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--div-danger)">Cycle P1-&gt;P2-&gt;P3-&gt;P1 =&gt; DEADLOCK</text>
          </svg>
        ),
      };

    default:
      return null;
  }
};
