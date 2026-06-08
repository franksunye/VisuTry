'use client'

interface FaceWireframeOverlayProps {
  className?: string
}

/**
 * Phase 1 decorative wireframe overlay (not real landmark detection).
 */
export function FaceWireframeOverlay({ className }: FaceWireframeOverlayProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <polygon
        points="100,28 148,72 132,148 68,148 52,72"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="1.5"
        fill="none"
      />
      <line x1="100" y1="28" x2="100" y2="148" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <line x1="52" y1="72" x2="148" y2="72" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <line x1="68" y1="100" x2="132" y2="100" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <circle cx="78" cy="88" r="3" fill="rgba(255,255,255,0.9)" />
      <circle cx="122" cy="88" r="3" fill="rgba(255,255,255,0.9)" />
      <path
        d="M 82 118 Q 100 128 118 118"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="1.5"
        fill="none"
      />
      <line x1="100" y1="148" x2="100" y2="178" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <line x1="78" y1="168" x2="122" y2="168" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
    </svg>
  )
}
