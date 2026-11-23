import React from 'react';

interface MarkdownBlockProps {
  text?: string;
  content?: string;
  highlightQuery?: string;
  className?: string;
}

function renderHighlightedText(text: string, query?: string): React.ReactNode {
  const clean = query?.trim();
  if (!clean) return text;
  const tokens = clean
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (tokens.length === 0) return text;

  const regex = new RegExp(`(${tokens.join('|')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, idx) =>
    idx % 2 === 1 ? (
      <mark key={idx} className="manual-mark">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function renderInline(line: string, highlightQuery?: string): React.ReactNode[] {
  // Split cleanly on `code` and **bold** without ever touching innerHTML
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  const segments = line.split(tokenRegex);
  return segments.map((seg, i) => {
    if (seg.startsWith('`') && seg.endsWith('`') && seg.length >= 2) {
      return (
        <code
          key={i}
          className="font-mono text-[0.85em] px-1 py-0.5 rounded-[2px] bg-[var(--bg-recessed)] border border-[var(--rule-hairline)] text-[var(--ink-primary)]"
        >
          {renderHighlightedText(seg.slice(1, -1), highlightQuery)}
        </code>
      );
    }
    if (seg.startsWith('**') && seg.endsWith('**') && seg.length >= 4) {
      return (
        <strong key={i} className="font-semibold text-[var(--ink-primary)]">
          {renderHighlightedText(seg.slice(2, -2), highlightQuery)}
        </strong>
      );
    }
    return <React.Fragment key={i}>{renderHighlightedText(seg, highlightQuery)}</React.Fragment>;
  });
}

export const MarkdownBlock: React.FC<MarkdownBlockProps> = ({
  text,
  content,
  highlightQuery,
  className = '',
}) => {
  const rawText = content ?? text ?? '';
  const blocks = rawText.split(/\n\n+/);

  return (
    <div className={`space-y-2.5 ${className}`}>
      {blocks.map((block, bIdx) => {
        const lines = block.split('\n').filter((l) => l.trim().length > 0);
        const isBulletList = lines.length > 0 && lines.every((l) => /^[-*]\s+/.test(l.trim()));

        if (isBulletList) {
          return (
            <ul key={bIdx} className="list-disc pl-5 space-y-1.5">
              {lines.map((line, lIdx) => (
                <li key={lIdx}>{renderInline(line.trim().replace(/^[-*]\s+/, ''), highlightQuery)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={bIdx} className="leading-relaxed">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                {renderInline(line, highlightQuery)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};
