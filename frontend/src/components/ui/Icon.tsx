interface IconProps {
  /** SVG path data for a 24×24 viewBox */
  path: string
  size?: number
  strokeWidth?: number
  className?: string
}

/** Stroke icon in the prototype's style (round caps/joins, currentColor). */
export default function Icon({ path, size = 20, strokeWidth = 1.8, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  )
}
