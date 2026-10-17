import { TARGET_RADIUS } from '../utils/scoring'

const R = TARGET_RADIUS

// Gold centre, red, blue, black and white outer ring.
const COLORS = {
  10: '#f5c542', 9: '#f5c542',
  8: '#d9483b', 7: '#d9483b',
  6: '#3b7fb8', 5: '#3b7fb8',
  4: '#2a2a2a', 3: '#2a2a2a',
  2: '#f7f4ea', 1: '#f7f4ea',
}

function Arrow({ x, y, fresh, score, bonus }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={fresh ? 'arrow-stick' : ''}>
        {fresh && <circle className="ripple" r="6" fill="none" stroke="#fff" strokeWidth="2" />}
        <line x1="0" y1="0" x2="5" y2="-30" stroke="#5a3d22" strokeWidth="3.2" strokeLinecap="round" />
        <polygon points="5,-30 1,-40 9,-40" fill={fresh ? '#f5c542' : '#d9483b'} />
        <polygon points="4,-24 -1,-34 11,-29" fill="#d9483b" opacity="0.85" />
        <circle r="3.2" fill="#111" stroke="#ddd" strokeWidth="1" />
        {fresh && (
          <text x="10" y="-48" fontSize="15" fontWeight="bold" fill="#fff" stroke="#000" strokeWidth="3" paintOrder="stroke">
            {score > 0 ? `+${score}${bonus ? ` +${bonus}` : ''}` : 'Miss'}
          </text>
        )}
      </g>
    </g>
  )
}

export default function Target({ arrows, aim, onClick }) {
  const rings = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const lastIndex = arrows.length - 1

  return (
    <svg
      viewBox="-190 -190 380 380"
      className="target"
      role="img"
      aria-label="Archery target. Click to shoot."
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <defs>
        <radialGradient id="face" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
        </radialGradient>
        <radialGradient id="bg" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#e7f0dc" />
          <stop offset="100%" stopColor="#b9cfa9" />
        </radialGradient>
      </defs>

      <rect x="-190" y="-190" width="380" height="380" rx="190" fill="url(#bg)" />

      {rings.map(score => (
        <circle key={score} r={(R * (11 - score)) / 10} fill={COLORS[score]} stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
      ))}
      <circle r={R} fill="url(#face)" />

      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(score => (
        <text key={score} x="0" y={-(R * (10.5 - score)) / 10 + 4} textAnchor="middle" fontSize="10" fontWeight="bold"
          fill={score >= 7 ? '#fff' : 'rgba(0,0,0,0.6)'}>
          {score}
        </text>
      ))}

      {arrows.map((a, i) => (
        <Arrow key={i} x={a.x} y={a.y} fresh={i === lastIndex} score={a.score} bonus={a.bonus} />
      ))}

      {aim && (
        <g transform={`translate(${aim.x} ${aim.y})`} className="crosshair" stroke="#101010" strokeWidth="2" fill="none">
          <circle r="12" />
          <path d="M-20 0H-6M6 0H20M0 -20V-6M0 6V20" />
        </g>
      )}
    </svg>
  )
}
