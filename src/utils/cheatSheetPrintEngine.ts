import { FormulaEntry } from './formulaQuickRefEngine';

export interface CheatSheetPrintPayload {
  courseCode: string;
  courseTitle: string;
  examDateLabel: string;
  formulas: FormulaEntry[];
  examinerTraps: Array<{ title: string; fix: string; moduleCode: string }>;
  comparisonRows: Array<{ label: string; summary: string }>;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Builds a clean, self-contained 2-Page A4 Portrait printable HTML document
 * covering all BACSE106 formulas, examiner traps, and OS comparisons.
 */
export function buildCheatSheetHtml(payload: CheatSheetPrintPayload): string {
  const page1Formulas = payload.formulas.slice(0, 10);
  const page2Formulas = payload.formulas.slice(10);

  const renderFormulaRows = (list: FormulaEntry[]) =>
    list
      .map(
        (f) => `
      <tr>
        <td class="mod">${escapeHtml(f.moduleCode)}</td>
        <td><strong>${escapeHtml(f.title)}</strong><div class="sub">${escapeHtml(f.unitsOrCondition)}</div></td>
        <td class="mono">${escapeHtml(f.formula)}</td>
        <td class="trap">${escapeHtml(f.trapNote)}</td>
      </tr>`
      )
      .join('');

  const renderTrapItems = payload.examinerTraps
    .slice(0, 12)
    .map(
      (t) =>
        `<li><strong>[${escapeHtml(t.moduleCode)}] ${escapeHtml(t.title)}:</strong> ${escapeHtml(t.fix)}</li>`
    )
    .join('');

  const renderCompRows = payload.comparisonRows
    .map(
      (c) =>
        `<tr><td><strong>${escapeHtml(c.label)}</strong></td><td>${escapeHtml(c.summary)}</td></tr>`
    )
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(payload.courseCode)} — 2-Page FAT Formula & Trap Sheet</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; color: #1c1b18; margin: 0; font-size: 9.5pt; line-height: 1.32; }
    .sheet { page-break-after: always; }
    .sheet:last-child { page-break-after: auto; }
    .head { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #1c1b18; padding-bottom: 4px; margin-bottom: 8px; }
    .head h1 { font-size: 13pt; margin: 0; }
    .head .meta { font-family: ui-monospace, monospace; font-size: 8.5pt; color: #434038; }
    h2 { font-size: 10.5pt; margin: 10px 0 4px; border-bottom: 1px solid #c5beb0; padding-bottom: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
    th, td { border: 1px solid #c5beb0; padding: 3.5px 5px; vertical-align: top; text-align: left; }
    th { background: #eae4d7; font-size: 8.5pt; }
    .mod { font-family: ui-monospace, monospace; font-weight: 700; width: 32px; text-align: center; }
    .mono { font-family: ui-monospace, monospace; font-size: 8.5pt; }
    .sub { font-size: 8pt; color: #555; margin-top: 1px; }
    .trap { font-size: 8.2pt; color: #7c231c; }
    ul { margin: 4px 0; padding-left: 16px; columns: 2; column-gap: 14px; }
    li { margin-bottom: 3px; font-size: 8.4pt; break-inside: avoid; }
  </style>
</head>
<body>
  <section class="sheet">
    <div class="head">
      <h1>${escapeHtml(payload.courseCode)} · ${escapeHtml(payload.courseTitle)} — Page 1/2</h1>
      <div class="meta">${escapeHtml(payload.examDateLabel)} · VIT Chennai FAT</div>
    </div>
    <h2>Core Mathematical Formulas (M2–M4)</h2>
    <table>
      <thead><tr><th>Mod</th><th>Concept & Conditions</th><th>Exact Formula</th><th>Exam Trap</th></tr></thead>
      <tbody>${renderFormulaRows(page1Formulas)}</tbody>
    </table>
  </section>
  <section class="sheet">
    <div class="head">
      <h1>${escapeHtml(payload.courseCode)} · Disk, RAID, Security & Deduction Traps — Page 2/2</h1>
      <div class="meta">2-Page A4 Last-Morning Reference</div>
    </div>
    <h2>Memory, File Systems, Disk, RAID & Security Formulas (M4–M5)</h2>
    <table>
      <thead><tr><th>Mod</th><th>Concept & Conditions</th><th>Exact Formula</th><th>Exam Trap</th></tr></thead>
      <tbody>${renderFormulaRows(page2Formulas)}</tbody>
    </table>
    <h2>High-Yield Architectural Comparisons</h2>
    <table>
      <thead><tr><th style="width: 28%;">Comparison</th><th>Key Examiner Distinctions</th></tr></thead>
      <tbody>${renderCompRows}</tbody>
    </table>
    <h2>Top -2M Examiner Deduction Traps to Audit Before Submitting</h2>
    <ul>${renderTrapItems}</ul>
  </section>
</body>
</html>`;
}

/**
 * Triggers printing cleanly inside sandboxed iframes without window.open or alert.
 * Uses a hidden print iframe fallback that works identically offline.
 */
export function printCheatSheetHtml(html: string): boolean {
  if (typeof document === 'undefined') return false;
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    return false;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => {
    setTimeout(() => iframe.remove(), 1200);
  };

  try {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    cleanup();
    return true;
  } catch {
    cleanup();
    return false;
  }
}
