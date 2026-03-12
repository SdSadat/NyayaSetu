import type { Jurisdiction, SupportedState } from '@nyayasetu/shared-types';

interface Props {
  jurisdiction: Jurisdiction;
}

const STATE_LABELS: Record<SupportedState, string> = {
  'west-bengal': 'West Bengal',
  jharkhand: 'Jharkhand',
};

export default function JurisdictionTag({ jurisdiction }: Props) {
  const scopeLabel =
    jurisdiction.scope === 'central' ? 'Central Law' : 'State Law';
  const stateLabel = jurisdiction.state
    ? STATE_LABELS[jurisdiction.state]
    : null;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 text-xs font-medium text-gray-300">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-3 w-3 text-gray-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
      {scopeLabel}
      {stateLabel && (
        <>
          <span className="text-gray-600">|</span>
          {stateLabel}
        </>
      )}
    </span>
  );
}
