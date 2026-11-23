import { TopicNote } from './noteTypes';

export const MODULE_5_NOTES: TopicNote[] = [
  {
    topicId: 'm5-disk-scheduling',
    moduleId: 'm5',
    title: 'Disk Geometry, Access Latency & Disk Scheduling (FCFS, SSTF, SCAN, C-SCAN, LOOK, C-LOOK)',
    summary:
      'Magnetic HDD performance is dominated by mechanical seek time and rotational latency; disk schedulers reorder cylinder requests to cut total head travel while avoiding starvation.',
    sourceDecks: ['Silberschatz 10e Ch 11 (§11.1–11.2)', 'VITC Past Papers: C1 1-2 Q9 (15M) & C2 Q9 (10M)'],
    keyPoints: [
      'Disk Geometry: **Platters** (2 surfaces each) -> concentric **Tracks** -> **Sectors** (typically 512 B or 4 KB); aligned tracks across all platters form a **Cylinder**.',
      'Total Access Time = **Seek Time** (`TotalTracks * msPerTrack`) + **Avg Rotational Latency** (`(60,000 ms / RPM) / 2`) + **Transfer Time**.',
      '**FCFS**: fair, zero starvation, wild head swings. **SSTF**: picks nearest track -> low seek time, **can starve distant tracks**.',
      '**SCAN / C-SCAN** sweep all the way to physical disk boundary (`0` or `maxTrack`); **LOOK / C-LOOK** reverse at the extreme *pending request* (saving wasted travel).',
    ],
    sections: [
      {
        heading: 'Magnetic Disk Platter Geometry & Latency Breakdown',
        body: 'In C1 Set 1-2 Q9(a) (3M), label Platters, Spindle, Read/Write Arm & Head, Tracks, Sectors, and Cylinders clearly. At **6000 RPM**, 1 rotation = `10 ms`, so Average Rotational Latency = **`5 ms`**.',
        diagramId: 'm5-disk-geometry',
      },
      {
        heading: 'Verified Real FAT Results: C1 Set 1-2 Q9 (15M) & C2 Q9 (10M)',
        body: 'Verify every seek path interactively in **Lab 5 (Disk & RAID Lab)**! Watch the critical direction cue in C2 Q9: `current = 215, previous = 250` => arm is moving **DOWNWARD toward 0**!',
        table: {
          headers: ['Paper & Setup', 'Algorithm', 'Exact Service Sequence', 'Total Head Movement'],
          rows: [
            ['C1 1-2 Q9 (1–100, Head 50, 1 ms/trk)', 'SSTF', '50->45->60->70->80->90->25->20->10', '**130 tracks (130 ms)**'],
            ['C1 1-2 Q9 (Moving Down -> 1)', 'SCAN (Down)', '50->45->25->20->10->**1**->60->70->80->90', '**138 tracks (138 ms)**'],
            ['C1 1-2 Q9 (Moving Up -> 100)', 'SCAN (Up)', '50->60->70->80->90->**100**->45->25->20->10', '**140 tracks (140 ms)**'],
            ['C2 Q9 (0–499, Head 215 ← Prev 250)', 'LOOK (Down)', '215->170->140->125->82->43->230->310->465', '**594 tracks**'],
            ['C2 Q9 (0–499, Head 215 ← Prev 250)', 'C-LOOK (Down)', '215->170->140->125->82->43->465->310->230', '**829 tracks** (incl. 422 wrap)'],
            ['C2 Q9 (0–499, Head 215)', 'SSTF', '215->230->170->140->125->82->43->310->465', '**624 tracks**'],
          ],
        },
      },
    ],
    workedExample: {
      title: 'Why LOOK Beats SSTF on C2 Q9 (594 vs 624 Tracks!)',
      problem:
        'Students often assume SSTF always gives the lowest movement. Why did LOOK (594) beat SSTF (624) on C2 Q9?',
      solution:
        'At track `215`, SSTF greedily hopped UP by 15 to `230`, then had to reverse ALL the way down past `215` to `43`, then back up to `465` (`15 + 187 + 422 = 624`). LOOK committed cleanly downward first (`215 -> 43 = 172`), then swept upward once (`43 -> 465 = 422`), saving 30 tracks AND eliminating starvation!',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Slot C1 Set 1-2 Q9 (15M) & Slot C2 Q9 (10M)',
        promptSummary: 'Disk components (3M), SSTF & SCAN/LOOK/C-LOOK movement & seek time (8–10M), starvation comparison (2–3M).',
        markBreakdown: 'Direction check + visual seek diagram (4–6M) + Explicit |to-from| summation (4–6M) + Starvation justification (2–3M)',
        solutionSteps: [
          'ALWAYS state the initial head direction explicitly at line 1 (e.g., `prev 250 -> curr 215 => DOWNWARD`).',
          'Draw a horizontal track axis `0 ... 499` with zig-zag step arrows labeled with every cylinder visited.',
          'Write every absolute difference `|to - from|` explicitly before summing, and note SCAN/LOOK avoid SSTF starvation.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m5-ds-1',
        question: 'How does C-SCAN improve fairness over standard SCAN?',
        options: ['Moves twice as fast mechanically', 'Services requests in only ONE sweep direction and wraps back, giving uniform wait times across inner and outer tracks', 'Always picks the closest track', 'Eliminates rotational latency'],
        correctIndex: 1,
        explanation: 'Standard SCAN favors middle tracks (visited twice per full cycle); C-SCAN’s one-way circular sweep yields uniform waiting times.',
      },
      {
        id: 'sc-m5-ds-2',
        question: 'What is the average rotational latency of a 7200 RPM disk?',
        options: ['8.33 ms', '4.17 ms', '5.00 ms', '10.00 ms'],
        correctIndex: 1,
        explanation: 'Full rotation = `60,000 / 7200 = 8.33 ms`; average rotational latency = half rotation = `4.17 ms`.',
      },
    ],
    examTip: 'On C-LOOK, clarify whether your wrap-around jump (`43 -> 465 = 422`) is counted in total head movement — VIT Chennai standard convention counts every physical head movement (`172 + 422 + 235 = 829`).',
  },
  {
    topicId: 'm5-raid',
    moduleId: 'm5',
    title: 'RAID Levels (0, 1, 4, 5, 6, 10), Parity Trade-offs & Scenario Selection',
    summary:
      'Redundant Arrays of Independent Disks (RAID) combine striping (performance) with mirroring or parity (reliability) across multiple drives.',
    sourceDecks: ['Silberschatz 10e Ch 11 (§11.7)', 'VITC Past Paper: C1 Set 1-2 Q7 (10M)'],
    keyPoints: [
      '**RAID 0 (Striping)**: 100% capacity (`N*C`), max R/W throughput, **0 fault tolerance** (1 failed disk destroys entire array!).',
      '**RAID 1 (Mirroring)**: 50% capacity, fast reads, tolerates 1 disk failure per mirrored pair; simple rebuild.',
      '**RAID 5 (Distributed Parity)**: min 3 disks, `(N-1)*C` usable, survives **1 disk failure**; avoids RAID 4’s single-parity-disk bottleneck.',
      '**RAID 6 (P+Q Dual Distributed Parity)**: min 4 disks, `(N-2)*C` usable, survives **ANY 2 simultaneous disk failures** — essential for large enterprise arrays where a second drive can fail during rebuild.',
    ],
    sections: [
      {
        heading: 'Visual RAID Block Layout & Level Matrix',
        body: 'Test exact usable capacity and fault tolerance across `N` disks in **Lab 5 (Disk & RAID Lab)**.',
        diagramId: 'm5-raid-levels',
        table: {
          headers: ['RAID', 'Technique', 'Min Disks', 'Usable Capacity', 'Fault Tolerance', 'Ideal Use Case'],
          rows: [
            ['RAID 0', 'Block Striping', '2', '`N * C` (100%)', '0 disks', 'Regenerable video/scratch rendering (C1 1-2 Q7 Sc2)'],
            ['RAID 1', 'Mirroring', '2', '`(N/2) * C` (50%)', '1 per pair', 'OS boot drives & small critical logs'],
            ['RAID 5', 'Single Distributed Parity', '3', '`(N-1) * C`', '1 disk', 'General-purpose enterprise file storage'],
            ['RAID 6', 'Dual P+Q Distributed Parity', '4', '`(N-2) * C`', '2 disks', 'University Data Center / high-reliability archival (C1 1-2 Q7 Sc1)'],
            ['RAID 10', 'Stripe of Mirrors (1+0)', '4', '`(N/2) * C` (50%)', '1+ (1 per mirror)', 'High-IOPS OLTP databases (no parity write penalty)'],
          ],
        },
      },
    ],
    workedExample: {
      title: 'C1 Set 1-2 Q7 Scenario Justification (University DC vs Multimedia Studio)',
      problem:
        'Select RAID levels for: Scenario 1 — University Data Center requiring survival of 2 simultaneous disk failures; Scenario 2 — Multimedia studio storing easily regenerable scratch video needing max R/W speed and 100% capacity.',
      solution:
        '**Scenario 1 -> RAID 6** (dual P+Q distributed parity survives any 2 simultaneous failures; avoids rebuild catastrophe). **Scenario 2 -> RAID 0** (pure striping gives 100% usable space and maximum parallel throughput with zero parity write overhead; data is regenerable so redundancy is unnecessary). RAID 0 is totally unsuitable for Scenario 1 because losing even 1 drive destroys the entire striped array (MTTF drops by factor `1/N`).',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Slot C1 Set 1-2 Q7 (10M)',
        promptSummary: 'Identify RAID for Sc1 & Sc2 (2M), justify choices (4M), compare RAID 5 vs 6 (2M), explain why RAID 0 fails Sc1 (2M).',
        markBreakdown: 'RAID 6 & RAID 0 IDs (2M) + Parity/striping justification (4M) + RAID 5 vs 6 table (2M) + RAID 0 single-point-of-failure proof (2M)',
        solutionSteps: [
          'State RAID 6 for Scenario 1 and RAID 0 for Scenario 2 immediately.',
          'Contrast RAID 5 (single XOR parity, 1 failure, `(N-1)/N` efficiency) vs RAID 6 (dual P+Q Reed-Solomon parity, 2 failures, `(N-2)/N` efficiency, higher write penalty).',
          'Note that in RAID 0, array reliability is *worse* than a single disk (`MTTF_array = MTTF_disk / N`).',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m5-r-1',
        question: 'An 8-disk RAID 6 array uses 4 TB drives. What is its total usable storage capacity?',
        options: ['32 TB', '28 TB', '24 TB', '16 TB'],
        correctIndex: 2,
        explanation: 'RAID 6 usable capacity = `(N - 2) * C = (8 - 2) * 4 TB = 24 TB`.',
      },
      {
        id: 'sc-m5-r-2',
        question: 'Why does RAID 5 outperform RAID 4 on concurrent random writes?',
        options: ['RAID 5 uses no parity', 'RAID 5 distributes parity blocks across ALL disks, eliminating RAID 4’s dedicated single-parity-disk bottleneck', 'RAID 5 uses 2 parity disks', 'RAID 4 cannot read in parallel'],
        correctIndex: 1,
        explanation: 'In RAID 4, every write contends on the single dedicated parity drive; RAID 5 rotates parity across all drives.',
      },
    ],
    examTip: 'Always mention **RAID 1+0 vs 0+1**: RAID 1+0 (stripe of mirrors) is strictly more fault-tolerant than RAID 0+1 (mirror of stripes) when 2 disks fail!',
  },
  {
    topicId: 'm5-security-crypto',
    moduleId: 'm5',
    title: 'Program & Network Threats (Buffer Overflow, Viruses, DoS) & Cryptography (AES, RSA, TLS)',
    summary:
      'OS security defends against program/network exploits (Buffer Overflows, Worms, DoS, MitM) and enforces confidentiality, integrity, and authentication via Symmetric/Asymmetric cryptography — a major untested M5 gap across C1 and C2.',
    sourceDecks: ['Silberschatz 10e Ch 16 (§16.1–16.6)', 'OVERDUE GAP — 0 Security Qs in C1/C2!'],
    keyPoints: [
      'CIA Triad + Authentication: **Confidentiality** (prevent unauthorized read), **Integrity** (prevent unauthorized tamper), **Availability** (prevent DoS), **Authentication / Non-Repudiation**.',
      '**Program Threats**: **Trojan Horse** (hidden malicious payload), **Trap Door / Backdoor**, **Logic Bomb**, **Stack Buffer Overflow** (overwrites return address -> defended by **ASLR**, **DEP/NX**, **Stack Canaries**), **Virus** (attaches to host binary) vs **Worm** (self-propagates over network).',
      '**Network Threats**: **Port Scanning**, **DoS / DDoS** (SYN flood), **Sniffing / Eavesdropping**, **Man-in-the-Middle (MitM)**, **Session Hijacking**.',
      '**Cryptography**: **Symmetric (AES)** uses 1 shared secret key (fast bulk encryption, key distribution problem); **Asymmetric (RSA)** uses `(Public, Private)` pair — encrypt with **Receiver’s Public Key**, sign `Hash(M)` with **Sender’s Private Key**.',
    ],
    sections: [
      {
        heading: 'Stack Buffer Overflow & Hybrid TLS Cryptographic Flow',
        body: 'Remember the clean division of labor in HTTPS/TLS: Asymmetric RSA/Diffie-Hellman authenticates the server via Certificate Authority (CA) X.509 certificates and agrees on a session key; Symmetric AES encrypts bulk traffic with HMAC/GCM integrity.',
        diagramId: 'm5-security-crypto',
        table: {
          headers: ['Primitive', 'Key Used', 'Security Goal Achieved', 'Speed / Use Case'],
          rows: [
            ['Symmetric (AES-256)', 'Shared Secret Key `K`', 'Confidentiality', 'Very Fast · Bulk data & TLS session payload'],
            ['Asymmetric Enc (RSA)', 'Receiver PUBLIC Key', 'Confidentiality & Key Exchange', 'Slow · Encrypting small session keys'],
            ['Digital Signature', 'Sender PRIVATE Key on `H(m)`', 'Authentication + Integrity + Non-Repudiation', 'Signed software updates & X.509 certs'],
            ['Cryptographic Hash / MAC', 'None (SHA-256) / Secret (HMAC)', 'Integrity / Tamper Detection', 'Fast · Password salting & packet authentication'],
          ],
        },
      },
    ],
    workedExample: {
      title: 'Step-by-Step Stack Buffer Overflow Exploit & 3 OS Mitigations',
      problem:
        'How does `strcpy(buf, user_input)` on a 64-byte stack array allow arbitrary code execution, and how do modern OSes block it?',
      solution:
        'Supplying >64 bytes overflows `buf` upward on the stack, overwriting the saved frame pointer and **saved Return Address (`RIP/EIP`)** with the address of injected shellcode. When the function executes `ret`, the CPU jumps into attacker code. **3 OS Defenses**: (1) **Stack Canaries** (random guard word checked before `ret`), (2) **DEP / NX bit** (marks stack non-executable), (3) **ASLR** (randomizes stack/heap/library base addresses on every run).',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Alpha & Gamma Model High-Probability Prompt (10M)',
        promptSummary: 'Diagram Stack Buffer Overflow + 3 OS mitigations (5M) and compare Symmetric vs Asymmetric crypto + Digital Signatures / TLS (5M).',
        markBreakdown: 'Stack frame overflow diagram + ASLR/NX/Canary (5M) + AES vs RSA table + Hash/Signature flow (5M)',
        solutionSteps: [
          'Draw the stack layout (`local buf -> saved EBP -> saved Return Address`) showing overflow bytes overwriting Return Address.',
          'Contrast AES vs RSA explicitly and draw `M -> SHA-256 -> Encrypt(Sender_Priv) = Signature` verified by `Decrypt(Sender_Pub) == SHA-256(M)`.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m5-sec-1',
        question: 'How does a Worm fundamentally differ from a Virus?',
        options: ['Worms only infect BIOS', 'A Worm self-replicates and spreads independently over networks without needing a host executable, whereas a Virus attaches to a host file', 'Viruses cannot spread', 'Worms require physical USB insertion only'],
        correctIndex: 1,
        explanation: 'Worms are standalone network-propagating programs (e.g., Morris Worm); viruses embed inside existing host files/documents.',
      },
      {
        id: 'sc-m5-sec-2',
        question: 'Which defense randomizes stack, heap, and shared-library memory addresses on every process launch to foil hardcoded shellcode jumps?',
        options: ['DEP / NX', 'ASLR (Address Space Layout Randomization)', 'RAID 6', 'DMA'],
        correctIndex: 1,
        explanation: 'ASLR randomizes virtual address layout so attackers cannot predict where stack buffers or `libc` functions reside.',
      },
    ],
    examTip: 'Security & Protection had **ZERO** questions across all 3 real papers — know Buffer Overflow (ASLR/NX/Canary) and AES/RSA/Digital Signatures cold!',
  },
  {
    topicId: 'm5-protection-matrix',
    moduleId: 'm5',
    title: 'Protection Domains, Access Matrix, ACLs, Capability Lists, Lock-Key & Least Privilege',
    summary:
      'Protection controls internal access of processes/domains to OS objects (files, printers, memory) using the Principle of Least Privilege and Access Matrix implementations — another high-priority untested M5 gap.',
    sourceDecks: ['Silberschatz 10e Ch 17 (§17.1–17.6)', 'OVERDUE GAP — 0 Protection Qs in C1/C2!'],
    keyPoints: [
      '**Principle of Least Privilege**: every program, user, and process operates with the *minimum* set of rights needed to complete its task (limits blast radius of bugs/compromises).',
      '**Protection Domain**: a set of `<object, rights-set>` pairs (e.g., Unix UID/GID + `setuid` bit for controlled domain switching).',
      '**Access Matrix**: rows = Domains (`D1..Dn`), columns = Objects (`F1..Fm` + Domains), cell `A[i,j]` = allowed operations (`read, write, execute, switch, copy*, owner, control`).',
      '4 Implementations: **Global Table** (huge & sparse), **ACL** (column stored with object -> easy revocation), **Capability List** (row stored with domain -> fast check, hard revocation), **Lock-Key** (hybrid: object holds locks, domain holds matching keys).',
    ],
    sections: [
      {
        heading: 'Access Matrix: Row View (Capabilities) vs Column View (ACLs)',
        body: 'Visualizing the Access Matrix makes ACL vs Capability trade-offs unforgettable: slicing **vertically (by column)** produces an ACL per object; slicing **horizontally (by row)** produces a Capability List per domain.',
        diagramId: 'm5-access-matrix',
        table: {
          headers: ['Implementation', 'Storage Orientation', 'Revocation Speed', 'Lookup Cost / Notes'],
          rows: [
            ['Global Table', 'Full list of `<D, O, R>` triples', 'Moderate', 'Too large for RAM; ignores sparsity'],
            ['Access Control List (ACL)', 'Column-wise (per Object)', '**Instant / Easy** (edit 1 object list)', 'Must search object ACL on open; matches Unix `rwx`'],
            ['Capability List', 'Row-wise (per Domain)', '**Hard** (capabilities spread across domains)', 'Fast O(1) ticket check; kernel must protect list'],
            ['Lock-Key Mechanism', 'Locks on Object + Keys in Domain', '**Easy** (change object lock value)', 'Hybrid compromise between ACL and Capabilities'],
          ],
        },
      },
      {
        heading: 'Dynamic Access Matrix Rights & RBAC / MAC vs DAC',
        body: 'Special meta-rights govern controlled matrix updates: **`copy (*)`** copies a right within the *same column*; **`owner`** adds/deletes any right in that column; **`control`** lets `D_i` modify rights in `D_j`’s row. **DAC** (Discretionary) lets file owners set permissions (`chmod`); **MAC** (Mandatory — SELinux/Bell-LaPadula) enforces system-wide security labels; **RBAC** binds permissions to organizational Roles.',
      },
    ],
    workedExample: {
      title: 'Why `setuid` Enables Controlled Domain Switching in Unix',
      problem:
        'How does a regular user change their own password in `/etc/shadow` (owned by `root`) without having permanent root write access to `/etc/shadow`?',
      solution:
        'The `/usr/bin/passwd` binary has the **`setuid` bit** set and is owned by `root`. Executing `passwd` temporarily switches the process’s effective protection domain from `user` to `root` **strictly while running the audited `passwd` code**, enforcing Least Privilege.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Alpha Gap High-Probability Prompt (10M)',
        promptSummary: 'Construct an Access Matrix with `copy(*)`, `owner`, and `switch` rights (5M) and compare Global Table, ACL, Capability List, and Lock-Key (5M).',
        markBreakdown: 'Matrix with dynamic rights explained (5M) + 4-way implementation & revocation comparison (5M)',
        solutionSteps: [
          'Draw a 4×4 Access Matrix showing domains `D1..D4` (rows) and files + domains (columns), including `read*`, `owner`, `control`, and `switch`.',
          'Contrast ACL (column-wise, instant revocation) vs Capability List (row-wise, fast check, requires indirection/key-change for revocation) vs Lock-Key.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m5-pm-1',
        question: 'In an Access Matrix, which special right allows Domain `D1` to grant a right to `D2` within the SAME object column?',
        options: ['control right', 'copy (*) right', 'switch right', 'execute right'],
        correctIndex: 1,
        explanation: 'The `copy (*)` flag permits propagating that specific access right down the same object column to another domain.',
      },
      {
        id: 'sc-m5-pm-2',
        question: 'Which Access Matrix implementation simplifies revocation by storing a list of random bit patterns ("locks") with each object?',
        options: ['Global Table', 'Pure Capability List', 'Lock-Key Mechanism', 'Ring 0 Monolithic Table'],
        correctIndex: 2,
        explanation: 'Changing an object’s lock immediately invalidates any domain holding the old key, combining capability speed with easy revocation.',
      },
    ],
    examTip: 'Memorize the orientation trick: **A**CL = **A**ttached to Object (Column); **C**apability = **C**arried by Domain/Caller (Row).',
  },
  {
    topicId: 'm5-virtualization',
    moduleId: 'm5',
    title: 'Virtualization (Type 1/2 Hypervisors, Full vs Para-Virt) & OS-Level Containers (Docker)',
    summary:
      'Virtualization decouples OSes from physical silicon via Type-1/Type-2 hypervisors (Full vs Para-Virtualization), whereas OS-level Containers (Docker) share the host kernel via Linux namespaces and cgroups for millisecond startup.',
    sourceDecks: ['Silberschatz 10e Ch 18 (§18.1–18.5)', 'VITC Past Papers: C1 2-2 Q4 (10M) & C2 Q10 (10M)'],
    keyPoints: [
      '**Type-1 (Bare-Metal) Hypervisor**: runs directly on hardware (VMware ESXi, KVM, Xen, Hyper-V) -> enterprise cloud standard. **Type-2 (Hosted)**: runs atop host OS (VirtualBox, VMware Workstation).',
      '**Full Virtualization**: runs *unmodified* guest OS using **Trap-and-Emulate**, **Binary Translation** (for non-trapping sensitive x86 instructions), or hardware assist (**Intel VT-x / AMD-V** + Nested Page Tables **EPT/NPT**).',
      '**Para-Virtualization** (classic Xen): modifies the guest OS kernel to replace sensitive instructions with direct **Hypercalls** to the hypervisor (eliminates trap/binary-translation overhead).',
      '**OS-Level Virtualization (Docker Containers)**: NO guest OS & NO hypervisor — containers share the **host OS kernel**, isolated via **Linux Namespaces** (PID/Net/Mnt/IPC/UTS/User) and resource-capped via **cgroups**.',
    ],
    sections: [
      {
        heading: 'Layered Architecture: Full VM vs Para-Virt vs Docker Containers',
        body: 'Both C1 Set 2-2 Q4 (6M for diagrams!) and C2 Q10 (5M for container architecture!) require crisp side-by-side layered stack diagrams.',
        diagramId: 'm5-virtualization-containers',
        table: {
          headers: ['Criterion', 'Full Virtualization (VM)', 'Para-Virtualization', 'OS-Level Containers (Docker)'],
          rows: [
            ['Guest OS Needed?', 'Yes (unmodified full OS)', 'Yes (modified kernel w/ hypercalls)', 'No — shares Host OS Kernel'],
            ['Core Layer', 'Type-1 / Type-2 Hypervisor', 'Hypervisor + Hypercall API', 'Container Runtime (Docker/containerd) + Namespaces/cgroups'],
            ['Boot Time & Size', 'Minutes · GBs per image', 'Seconds–minutes · GBs', 'Milliseconds · MBs per layered image'],
            ['Density & Performance', 'Lower density · hypervisor overhead', 'Better I/O than pure binary trans.', 'Near-native speed · 10× higher density'],
            ['Portability & Isolation', 'Strongest hardware isolation; heavy to move', 'Tied to hypervisor API', 'Ultra-portable (`Dockerfile` -> OCI image); shared-kernel risk'],
          ],
        },
      },
      {
        heading: 'Popek-Goldberg & Live Migration (Bonus Rigor)',
        body: 'Early x86 CPUs violated Popek-Goldberg because ~17 sensitive instructions failed silently in Ring 1 instead of trapping -> solved by **Binary Translation** and later **Intel VT-x / AMD-V** (adding root/non-root modes). **Live Migration** copies a VM’s RAM pages iteratively across hosts with millisecond downtime.',
      },
    ],
    workedExample: {
      title: 'How Docker Isolates Two Microservices on One Linux Host (C2 Q10)',
      problem:
        'Explain how two Docker containers on the same Ubuntu host each think they have PID 1 and port 80 without colliding.',
      solution:
        'Linux **PID namespaces** give each container its own private PID table starting at `PID 1`. **Network namespaces** assign each container an isolated virtual NIC/IP/port stack mapped to host ports via NAT. **Mount namespaces** + UnionFS (Overlay2) provide private filesystems, while **cgroups** enforce strict CPU and RAM ceilings.',
    },
    fatQuestionMethods: [
      {
        paperSource: 'Slot C1 Set 2-2 Q4 (10M) & Slot C2 Q10 (10M)',
        promptSummary: 'C1 2-2 Q4: Para-Virt, Full-Virt & Containers/Docker diagrams (6M) + comparison (4M). C2 Q10: Container architecture (5M) + VM vs Container comparison (5M).',
        markBreakdown: '3-stack layered diagram (5–6M) + 5-dimension comparison table + Namespaces/cgroups (4–5M)',
        solutionSteps: [
          'Draw 3 side-by-side stacks from Hardware upward: (1) Full VM (`HW -> Hypervisor -> Unmodified Guest OS -> Bins/App`), (2) Para-Virt (`HW -> Hypervisor <-> Modified Guest OS via Hypercalls -> App`), (3) Containers (`HW -> Host OS Kernel [Namespaces + cgroups] -> Docker Engine -> Bins/App`).',
          'Compare across Guest OS, Isolation, Boot Time, Resource Utilization, Portability, and Security in a clean table.',
        ],
      },
    ],
    selfChecks: [
      {
        id: 'sc-m5-v-1',
        question: 'Which Linux kernel feature caps a Docker container’s maximum RAM and CPU quota?',
        options: ['Namespaces', 'cgroups (Control Groups)', 'Binary Translation', 'Hypercalls'],
        correctIndex: 1,
        explanation: 'Namespaces isolate *what* a container can see (PID, net, mount); cgroups restrict *how much* CPU, RAM, and I/O it can consume.',
      },
      {
        id: 'sc-m5-v-2',
        question: 'Which statement accurately contrasts Full Virtualization and Para-Virtualization?',
        options: ['Full virtualization modifies the guest OS kernel', 'Para-virtualization modifies the guest OS kernel to communicate via direct hypercalls, whereas Full virtualization runs unmodified guest OSes', 'Para-virtualization does not use a hypervisor', 'Containers require Intel VT-x'],
        correctIndex: 1,
        explanation: 'Para-virtualization trades guest-OS modification for higher efficiency via explicit hypercalls.',
      },
    ],
    examTip: 'Always name **both** Linux container primitives (`namespaces` for isolation + `cgroups` for resource limits) — examiners award immediate marks for those two exact keywords!',
  },
];
