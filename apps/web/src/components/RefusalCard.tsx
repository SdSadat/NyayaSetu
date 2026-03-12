import type { RefusalResponse, RefusalReason } from '@nyayasetu/shared-types';

interface Props {
  response: RefusalResponse;
}

const REASON_LABELS: Record<RefusalReason, string> = {
  'no-sources-retrieved': 'No matching legal sources found',
  'low-certainty': 'Insufficient certainty to provide information',
  'conflicting-sources': 'Legal sources contain conflicting provisions',
  'jurisdiction-unknown': 'Unable to determine applicable jurisdiction',
  'advisory-language-detected': 'Query requires legal advice (not information)',
  'out-of-scope': 'This topic is outside our current coverage',
};

export default function RefusalCard({ response }: Props) {
  return (
    <div className="glass-card border-white/[0.06]">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.05] text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h2 className="text-base font-semibold text-white">
            Unable to provide legal information
          </h2>
          <p className="mt-1 text-sm text-gray-400">{response.message}</p>

          <div className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
            <p className="text-xs text-gray-500">
              <span className="font-medium text-gray-400">Reason:</span>{' '}
              {REASON_LABELS[response.reason]}
            </p>
          </div>

          {response.suggestHumanLawyer && (
            <div className="mt-4 rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 p-4">
              <p className="text-sm font-medium text-neon-cyan">
                We recommend consulting a qualified lawyer
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-400">
                Your question may require personalised legal advice that only a
                licensed advocate can provide. Consider reaching out to your
                nearest District Legal Services Authority (DLSA) for free legal
                aid if eligible.
              </p>
              <a
                href="https://nalsa.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-medium text-neon-cyan underline decoration-neon-cyan/30 hover:decoration-neon-cyan"
              >
                Visit NALSA (National Legal Services Authority)
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
