/**
 * Placeholder line-drawing: a small bird perched on the rim of a coupe glass.
 * Mirrors the motif in the source invite. Stroke uses currentColor so it
 * inherits the cream text color — swap this whole file for the final artwork.
 */
export default function BirdGlass({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 140"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="A bird perched on a coupe glass"
    >
      {/* coupe bowl */}
      <path d="M28 60 Q60 92 92 60" />
      <path d="M28 60 Q26 56 30 56 L90 56 Q94 56 92 60" />
      {/* stem + foot */}
      <path d="M60 88 L60 118" />
      <path d="M44 122 Q60 112 76 122" />
      {/* little bubbles */}
      <circle cx="52" cy="66" r="1.1" />
      <circle cx="64" cy="72" r="1.1" />
      <circle cx="70" cy="64" r="1.1" />
      {/* bird perched on the right rim */}
      <g transform="translate(78 30)">
        {/* body */}
        <path d="M0 24 Q-2 10 10 8 Q22 7 22 18 Q22 26 10 26 Q4 26 0 24 Z" />
        {/* head + beak */}
        <path d="M22 14 Q30 10 33 14 Q30 16 24 17" />
        {/* eye */}
        <circle cx="25" cy="14" r="0.9" fill="currentColor" stroke="none" />
        {/* tail */}
        <path d="M0 24 Q-12 26 -18 22" />
        {/* wing */}
        <path d="M8 14 Q16 16 18 22" />
        {/* legs to rim */}
        <path d="M8 26 L8 32 M14 26 L14 32" />
      </g>
    </svg>
  )
}
