import { useMemo } from 'react';

// ---------------------------------------------------------------------------
// NyayaSetu AI Pipeline Progress Loader
// ---------------------------------------------------------------------------
// A futuristic animated graph showing the legal AI processing pipeline:
//   Query → Analyze → Retrieve → Generate → Verify
//
// Features:
//   - Glowing nodes with stage-specific colors
//   - Animated flowing edges with gradient strokes
//   - Carrier particles moving along paths
//   - Breathing/pulse animations
// ---------------------------------------------------------------------------

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  stage: 'input' | 'analyze' | 'retrieve' | 'generate' | 'verify';
}

interface Edge {
  id: string;
  from: string;
  to: string;
  d: string;
}

const viewBox = { width: 480, height: 200 };

export default function AIProgressLoader({
  maxWidth = 480,
  message = 'Processing your query...',
}: {
  maxWidth?: number;
  message?: string;
}) {
  const nodes = useMemo<Node[]>(
    () => [
      // Input stage
      { id: 'query', label: 'Query', x: 50, y: 100, stage: 'input' },

      // Analysis stage
      { id: 'normalize', label: 'Normalize', x: 130, y: 50, stage: 'analyze' },
      { id: 'entities', label: 'Entities', x: 130, y: 150, stage: 'analyze' },

      // Retrieval stage
      { id: 'embed', label: 'Embed', x: 220, y: 70, stage: 'retrieve' },
      { id: 'search', label: 'Search', x: 220, y: 130, stage: 'retrieve' },

      // Generation stage
      { id: 'context', label: 'Context', x: 310, y: 50, stage: 'generate' },
      { id: 'llm', label: 'LLM', x: 310, y: 100, stage: 'generate' },
      { id: 'format', label: 'Format', x: 310, y: 150, stage: 'generate' },

      // Verification stage
      { id: 'citations', label: 'Citations', x: 400, y: 70, stage: 'verify' },
      { id: 'safety', label: 'Safety', x: 400, y: 130, stage: 'verify' },
    ],
    [],
  );

  const edges = useMemo<Edge[]>(
    () => [
      // From query
      { id: 'e-query-normalize', from: 'query', to: 'normalize', d: 'M50 100 C80 80 100 60 130 50' },
      { id: 'e-query-entities', from: 'query', to: 'entities', d: 'M50 100 C80 120 100 140 130 150' },

      // From analysis to retrieval
      { id: 'e-normalize-embed', from: 'normalize', to: 'embed', d: 'M130 50 C160 45 190 55 220 70' },
      { id: 'e-entities-embed', from: 'entities', to: 'embed', d: 'M130 150 C160 130 190 100 220 70' },
      { id: 'e-entities-search', from: 'entities', to: 'search', d: 'M130 150 C160 145 190 140 220 130' },

      // From retrieval to generation
      { id: 'e-embed-context', from: 'embed', to: 'context', d: 'M220 70 C250 55 280 45 310 50' },
      { id: 'e-search-context', from: 'search', to: 'context', d: 'M220 130 C250 100 280 70 310 50' },
      { id: 'e-embed-llm', from: 'embed', to: 'llm', d: 'M220 70 C250 75 280 85 310 100' },
      { id: 'e-search-llm', from: 'search', to: 'llm', d: 'M220 130 C250 125 280 115 310 100' },
      { id: 'e-search-format', from: 'search', to: 'format', d: 'M220 130 C250 135 280 145 310 150' },

      // From generation to verification
      { id: 'e-context-citations', from: 'context', to: 'citations', d: 'M310 50 C340 45 370 55 400 70' },
      { id: 'e-llm-citations', from: 'llm', to: 'citations', d: 'M310 100 C340 90 370 80 400 70' },
      { id: 'e-llm-safety', from: 'llm', to: 'safety', d: 'M310 100 C340 110 370 120 400 130' },
      { id: 'e-format-safety', from: 'format', to: 'safety', d: 'M310 150 C340 145 370 140 400 130' },

      // Cross connections for visual interest
      { id: 'e-normalize-search', from: 'normalize', to: 'search', d: 'M130 50 C175 70 195 100 220 130' },
      { id: 'e-context-safety', from: 'context', to: 'safety', d: 'M310 50 C360 70 380 100 400 130' },
    ],
    [],
  );

  return (
    <div className="ai-progress-loader" style={{ maxWidth, width: '100%', margin: '0 auto' }}>
      <svg
        viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
        role="presentation"
        aria-hidden="true"
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
      >
        <defs>
          {/* Edge gradient - cyan to purple */}
          <linearGradient id="aiEdgeGradient" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#06d6dd" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#06d6dd" stopOpacity="0.9" />
          </linearGradient>

          {/* Node gradients by stage */}
          <radialGradient id="nodeGradientInput" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#06d6dd" />
          </radialGradient>
          <radialGradient id="nodeGradientAnalyze" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#3b82f6" />
          </radialGradient>
          <radialGradient id="nodeGradientRetrieve" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#a855f7" />
          </radialGradient>
          <radialGradient id="nodeGradientGenerate" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f59e0b" />
          </radialGradient>
          <radialGradient id="nodeGradientVerify" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#10b981" />
          </radialGradient>

          {/* Glow filter */}
          <filter id="aiNodeGlow" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Carrier glow */}
          <filter id="carrierGlow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="2" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background grid pattern */}
        <g className="ai-progress__grid" opacity="0.15">
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1="0"
              y1={i * 20}
              x2={viewBox.width}
              y2={i * 20}
              stroke="#06d6dd"
              strokeWidth="0.5"
            />
          ))}
          {Array.from({ length: 25 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={i * 20}
              y1="0"
              x2={i * 20}
              y2={viewBox.height}
              stroke="#06d6dd"
              strokeWidth="0.5"
            />
          ))}
        </g>

        {/* Edges */}
        <g className="ai-progress__edges">
          {edges.map((edge, index) => (
            <g key={edge.id} style={{ animation: `aiEdgeGlow 4s ease-in-out infinite`, animationDelay: `${index * 0.15}s` }}>
              {/* Base path */}
              <path
                id={`flow-${edge.id}`}
                d={edge.d}
                fill="none"
                stroke="url(#aiEdgeGradient)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="4 8"
                opacity="0.7"
              />
              {/* Highlight path */}
              <path
                d={edge.d}
                fill="none"
                stroke="rgba(168, 85, 247, 0.4)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="8 160"
                style={{
                  animation: `aiFlowHighlight 2.8s linear infinite`,
                  animationDelay: `${index * 0.12}s`,
                }}
              />
            </g>
          ))}
        </g>

        {/* Carrier particles */}
        <g className="ai-progress__carriers" style={{ mixBlendMode: 'screen' }}>
          {edges.map((edge, index) => (
            <circle
              key={`carrier-${edge.id}`}
              r={2.5}
              fill="#ffffff"
              stroke="rgba(6, 214, 221, 0.8)"
              strokeWidth="1"
              filter="url(#carrierGlow)"
            >
              <animateMotion
                dur={`${2.5 + (index % 4) * 0.5}s`}
                repeatCount="indefinite"
                rotate="auto"
                keyPoints="0;1"
                keyTimes="0;1"
              >
                <mpath xlinkHref={`#flow-${edge.id}`} />
              </animateMotion>
            </circle>
          ))}
        </g>

        {/* Nodes */}
        <g className="ai-progress__nodes">
          {nodes.map((node, index) => {
            const gradientId = `nodeGradient${node.stage.charAt(0).toUpperCase() + node.stage.slice(1)}`;
            const stageColors: Record<string, { ring: string; halo: string }> = {
              input: { ring: 'rgba(6, 214, 221, 0.3)', halo: 'rgba(6, 214, 221, 0.15)' },
              analyze: { ring: 'rgba(59, 130, 246, 0.3)', halo: 'rgba(59, 130, 246, 0.15)' },
              retrieve: { ring: 'rgba(168, 85, 247, 0.3)', halo: 'rgba(168, 85, 247, 0.15)' },
              generate: { ring: 'rgba(245, 158, 11, 0.3)', halo: 'rgba(245, 158, 11, 0.15)' },
              verify: { ring: 'rgba(16, 185, 129, 0.3)', halo: 'rgba(16, 185, 129, 0.15)' },
            };
            const colors = stageColors[node.stage];

            return (
              <g
                key={node.id}
                style={{
                  animation: `aiNodeBreathe 3s ease-in-out infinite`,
                  animationDelay: `${index * 0.18}s`,
                  transformOrigin: `${node.x}px ${node.y}px`,
                }}
              >
                {/* Outer ring */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={18}
                  fill="transparent"
                  stroke={colors.ring}
                  strokeWidth="1"
                />
                {/* Halo */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={13}
                  fill={colors.halo}
                  filter="url(#aiNodeGlow)"
                />
                {/* Core */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={7}
                  fill={`url(#${gradientId})`}
                  stroke="rgba(255, 255, 255, 0.6)"
                  strokeWidth="1"
                />
                {/* Label */}
                <text
                  x={node.x}
                  y={node.y + 28}
                  fill="rgba(255, 255, 255, 0.7)"
                  fontSize="8"
                  fontWeight="600"
                  textAnchor="middle"
                  style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </g>

        {/* Stage labels at bottom */}
        <g className="ai-progress__stage-labels">
          {[
            { label: 'Input', x: 50, color: '#06d6dd' },
            { label: 'Analyze', x: 130, color: '#3b82f6' },
            { label: 'Retrieve', x: 220, color: '#a855f7' },
            { label: 'Generate', x: 310, color: '#f59e0b' },
            { label: 'Verify', x: 400, color: '#10b981' },
          ].map((stage) => (
            <text
              key={stage.label}
              x={stage.x}
              y={190}
              fill={stage.color}
              fontSize="9"
              fontWeight="700"
              textAnchor="middle"
              opacity="0.6"
              style={{ textTransform: 'uppercase', letterSpacing: '1px' }}
            >
              {stage.label}
            </text>
          ))}
        </g>
      </svg>

      {/* Message below */}
      <p
        style={{
          textAlign: 'center',
          marginTop: '16px',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.6)',
          fontWeight: 500,
          animation: 'aiMessagePulse 2s ease-in-out infinite',
        }}
      >
        {message}
      </p>

      {/* Inline styles for animations */}
      <style>{`
        @keyframes aiNodeBreathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes aiFlowHighlight {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -200; }
        }
        @keyframes aiEdgeGlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes aiMessagePulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
