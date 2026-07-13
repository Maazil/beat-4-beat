import type { JSX } from "solid-js";

const Logo = (props: JSX.SvgSVGAttributes<SVGSVGElement>) => (
  <svg
    viewBox="0 0 200 32"
    role="img"
    aria-labelledby="beat4beat-logo"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <title id="beat4beat-logo">Beat 4 Beat</title>
    <circle
      cx="16"
      cy="16"
      r="14"
      stroke="var(--color-beat)"
      stroke-width="2.4"
      fill="var(--color-night)"
    />
    <path
      d="M6 16h4l3-6 4 12 4-8 3 6h4"
      stroke="var(--color-beat)"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <text
      x="40"
      y="22"
      fill="var(--color-ink)"
      style={{
        "font-family": "'Bricolage Grotesque', 'Schibsted Grotesk', sans-serif",
        "font-size": "17px",
        "font-weight": "700",
        "letter-spacing": "1px",
      }}
    >
      Beat <tspan fill="var(--color-beat)">4</tspan> Beat
    </text>
  </svg>
);

export default Logo;
