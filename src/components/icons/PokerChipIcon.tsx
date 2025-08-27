import * as React from "react"
import { SVGProps } from "react"

export const PokerChipIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx={12} cy={12} r={10} />
    <path d="M12 12a5 5 0 1 0 0-0.1" />
    <path d="M4 12H2" />
    <path d="M20 12h2" />
    <path d="M12 4V2" />
    <path d="M12 22v-2" />
    <path d="m17 7-1.5-1.5" />
    <path d="m8.5 15.5 1.5 1.5" />
    <path d="m7 7-1.5-1.5" />
    <path d="m15.5 15.5 1.5 1.5" />
  </svg>
)
