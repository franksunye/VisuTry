'use client'

interface FaceWireframeOverlayProps {
  className?: string
}

/**
 * Phase 1 illustrative analysis overlay (not real landmark detection).
 */
export function FaceWireframeOverlay({ className }: FaceWireframeOverlayProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 250"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <filter id="face-analysis-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#2563eb" floodOpacity="0.35" />
        </filter>
      </defs>

      <path
        d="M100 42 C134 42 153 69 151 111 C150 143 132 177 100 184 C68 177 50 143 49 111 C47 69 66 42 100 42Z"
        stroke="rgba(37,99,235,0.85)"
        strokeWidth="2"
        strokeDasharray="4 4"
        fill="none"
        filter="url(#face-analysis-glow)"
      />
      <line x1="100" y1="42" x2="100" y2="196" stroke="rgba(255,255,255,0.72)" strokeWidth="1.5" />
      <line x1="62" y1="82" x2="138" y2="82" stroke="rgba(255,255,255,0.58)" strokeWidth="1.25" />
      <line x1="58" y1="121" x2="142" y2="121" stroke="rgba(255,255,255,0.46)" strokeWidth="1.25" />
      <path d="M78 106 C88 101 96 101 106 106" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" />
      <path d="M84 151 C94 158 106 158 116 151" stroke="rgba(255,255,255,0.68)" strokeWidth="1.4" />
      <line x1="78" y1="196" x2="122" y2="196" stroke="rgba(255,255,255,0.5)" strokeWidth="1.25" />
      {[
        [100, 42],
        [62, 82],
        [138, 82],
        [49, 111],
        [151, 111],
        [60, 146],
        [140, 146],
        [100, 184],
      ].map(([cx, cy]) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r="4"
          fill="#2563eb"
          stroke="white"
          strokeWidth="1.5"
          filter="url(#face-analysis-glow)"
        />
      ))}
    </svg>
  )
}
