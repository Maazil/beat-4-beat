import type { JSX } from 'solid-js';

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
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ff1e46" />
        <stop offset="50%" stop-color="#ff1e46" />
        <stop offset="100%" stop-color="#ff3b5c" />
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="14" stroke="url(#logoGradient)" stroke-width="2.4" fill="#050507" />
    <path
      d="M6 16h4l3-6 4 12 4-8 3 6h4"
      stroke="url(#logoGradient)"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <text
      x="44"
      y="21"
      fill="url(#logoGradient)"
      style={{
        'font-family': "'JetBrains Mono', 'Inter', sans-serif",
        'font-size': '15px',
        'letter-spacing': '6px',
      }}
    >
      Beat 4 Beat
    </text>
  </svg>
);

export default Logo;
