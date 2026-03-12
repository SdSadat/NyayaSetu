import { useState } from 'react';
import type { DrishtiIssueNode } from '@nyayasetu/shared-types';

interface Props {
  issues: DrishtiIssueNode[];
}

function IssueNode({ node, depth }: { node: DrishtiIssueNode; depth: number }) {
  const [open, setOpen] = useState(true);

  return (
    <div className={depth > 0 ? 'ml-5 border-l border-white/[0.06] pl-4' : ''}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="group w-full text-left"
      >
        <div className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 hover:border-neon-cyan/20 hover:bg-white/[0.04] transition-all">
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-neon-cyan/30 bg-neon-cyan/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-3 w-3 text-neon-cyan transition-transform ${open ? 'rotate-90' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-200">{node.question}</p>
        </div>
      </button>

      {open && (
        <div className="mt-2 ml-8 mb-3 space-y-2">
          {node.petitionerArgument && (
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2">
              <span className="mr-2 text-[10px] font-semibold uppercase text-blue-400">Petitioner</span>
              <span className="text-xs text-gray-300">{node.petitionerArgument}</span>
            </div>
          )}
          {node.respondentArgument && (
            <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2">
              <span className="mr-2 text-[10px] font-semibold uppercase text-purple-400">Respondent</span>
              <span className="text-xs text-gray-300">{node.respondentArgument}</span>
            </div>
          )}
          {node.courtFinding && (
            <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2">
              <span className="mr-2 text-[10px] font-semibold uppercase text-green-400">Court Finding</span>
              <span className="text-xs text-gray-300">{node.courtFinding}</span>
            </div>
          )}
          {node.appliedLaw.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {node.appliedLaw.map((law, i) => (
                <span
                  key={i}
                  className="rounded-full border border-neon-cyan/20 bg-neon-cyan/5 px-2 py-0.5 text-[10px] text-neon-cyan"
                >
                  {law}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DrishtiIssueTree({ issues }: Props) {
  if (issues.length === 0) {
    return (
      <div className="glass-card text-center py-10 text-gray-500 text-sm">
        No legal issues extracted.
      </div>
    );
  }

  const roots = issues.filter((n) => !n.parentId);

  return (
    <div className="glass-card">
      <h3 className="mb-5 text-sm font-semibold text-gray-300 uppercase tracking-wider">
        Issue Tree
      </h3>
      <div className="space-y-3">
        {roots.map((root) => (
          <IssueNode key={root.id} node={root} depth={0} />
        ))}
      </div>
    </div>
  );
}
