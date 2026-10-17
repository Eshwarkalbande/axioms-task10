// The target is a circle of this radius (in SVG units). The centre scores 10.
export const TARGET_RADIUS = 150
export const ARROWS_PER_GAME = 10
export const MAX_SCORE = ARROWS_PER_GAME * 10

// spread: how far a shot can land from the aim point (smaller is harder)
// sway: how far the aim wanders from centre
// speed: how fast the aim moves at the start of a round
// wind: maximum wind strength (each shot gets a random wind between -wind and +wind)
export const DIFFICULTIES = {
  easy:   { label: 'Easy',   spread: 18, sway: 110, speed: 0.8,  wind: 0 },
  normal: { label: 'Normal', spread: 12, sway: 150, speed: 1.0,  wind: 1 },
  hard:   { label: 'Hard',   spread: 9,  sway: 160, speed: 1.35, wind: 2 },
}

// Each scoring ring is one tenth of the radius wide.
// Distance 0 to R/10 scores 10, the next band scores 9, and so on out to 1.
// Anything at or beyond the outer edge scores 0.
export function scoreFor(x, y, radius = TARGET_RADIUS) {
  const distance = Math.hypot(x, y)
  if (distance >= radius) return 0
  return 10 - Math.floor(distance / (radius / 10))
}

// Two 9+ shots in a row give +1, then +2, then +3 (capped).
export function streakBonus(streak) {
  return streak >= 2 ? Math.min(streak - 1, 3) : 0
}

export function rankFor(total) {
  const ratio = total / MAX_SCORE
  if (ratio >= 0.85) return 'Master archer'
  if (ratio >= 0.65) return 'Sharpshooter'
  if (ratio >= 0.4) return 'Steady hand'
  return 'Keep practising'
}
