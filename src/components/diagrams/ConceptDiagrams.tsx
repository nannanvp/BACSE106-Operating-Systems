import React from 'react';
import { DiagramId } from '../../data/noteTypes';
import { renderModule12Diagram } from './Module12Diagrams';
import { renderModule34Diagram } from './Module34Diagrams';
import { renderModule5Diagram } from './Module5Diagrams';

interface ConceptDiagramProps {
  diagramId: DiagramId;
}

export const ConceptDiagram: React.FC<ConceptDiagramProps> = ({ diagramId }) => {
  const result =
    renderModule12Diagram(diagramId) ??
    renderModule34Diagram(diagramId) ??
    renderModule5Diagram(diagramId);

  if (!result) return null;

  return (
    <figure className="diagram-canvas-plate my-4 p-3 sm:p-4 overflow-x-auto">
      <div className="min-w-[520px]">{result.svg}</div>
      <figcaption className="mt-2.5 pt-2 border-t border-[var(--rule-hairline)] font-mono text-[11px] text-[var(--ink-muted)] flex items-center justify-between gap-2">
        <span>Fig · {result.title}</span>
        <span className="uppercase">{diagramId}</span>
      </figcaption>
    </figure>
  );
};
