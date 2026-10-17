import { useCallback, useEffect, useRef, useState } from 'react'
import Target from './components/Target'
import useSound from './hooks/useSound'
import { ARROWS_PER_GAME, DIFFICULTIES, rankFor, scoreFor, streakBonus } from './utils/scoring'
import './App.css'

const BEST_KEY = 'archery-best-v2'
const PX_PER_WIND = 25        // wind of 1 pushes the arrow this many SVG units
const BREATH_DRAIN = 0.45     // breath used per second while holding
const BREATH_REGEN = 0.3      // breath recovered per second when not holding

const randomWind = d => (Math.random() * 2 - 1) * d.wind
const mphOf = w => Math.round(Math.abs(w) * 8)

function loadBest() {
  try { return JSON.parse(localStorage.getItem(BEST_KEY)) || {} } catch { return {} }
}

export default function App() {
  const [difficulty, setDifficulty] = useState('normal')
  const [arrows, setArrows] = useState([])
  const [aim, setAim] = useState({ x: 0, y: 0 })
  const [wind, setWind] = useState(() => randomWind(DIFFICULTIES.normal))
  const [breath, setBreath] = useState(1)
  const [holding, setHolding] = useState(false)
  const [paused, setPaused] = useState(false)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [last, setLast] = useState(null)
  const [best, setBest] = useState(loadBest)
  const { muted, toggleMute, playShot, playHit } = useSound()

  const diff = DIFFICULTIES[difficulty]
  const total = arrows.reduce((sum, a) => sum + a.score + a.bonus, 0)
  const hits = arrows.filter(a => a.score > 0).length
  const bullseyes = arrows.filter(a => a.score === 10).length
  const over = arrows.length >= ARROWS_PER_GAME
  const inRound = arrows.length > 0 && !over
  const isNewBest = over && total > 0 && total === best[difficulty]

  // Refs let the animation loop and key handlers read live values without re-subscribing.
  const aimRef = useRef({ x: 0, y: 0 })
  const phaseRef = useRef(0)
  const breathRef = useRef(1)
  const holdingRef = useRef(false)
  const pausedRef = useRef(false)
  const countRef = useRef(0)
  const diffRef = useRef(diff)
  const windRef = useRef(wind)
  const streakRef = useRef(0)

  useEffect(() => {
    diffRef.current = diff
    pausedRef.current = paused
    countRef.current = arrows.length
    windRef.current = wind
  }, [diff, paused, arrows.length, wind])

  // Figure-eight sway. Holding Space slows it down and drains breath.
  useEffect(() => {
    let raf, prev = performance.now()
    const loop = now => {
      const dt = Math.min(0.05, (now - prev) / 1000)
      prev = now
      if (!pausedRef.current && countRef.current < ARROWS_PER_GAME) {
        const steady = holdingRef.current && breathRef.current > 0
        breathRef.current = steady
          ? Math.max(0, breathRef.current - dt * BREATH_DRAIN)
          : Math.min(1, breathRef.current + dt * BREATH_REGEN)
        phaseRef.current += dt * diffRef.current.speed * (1 + countRef.current * 0.08) * (steady ? 0.3 : 1)
        const p = phaseRef.current, s = diffRef.current.sway
        aimRef.current = { x: Math.sin(p * 0.9) * s, y: Math.cos(p * 1.4) * s * 0.6 }
        setAim(aimRef.current)
        setBreath(breathRef.current)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const shoot = useCallback(steady => {
    if (countRef.current >= ARROWS_PER_GAME || pausedRef.current) return
    const d = diffRef.current, a = aimRef.current, w = windRef.current
    const tight = steady ? 0.4 : 1
    const x = a.x + (Math.random() * 2 - 1) * d.spread * tight + w * PX_PER_WIND
    const y = a.y + (Math.random() * 2 - 1) * d.spread * tight
    const score = scoreFor(x, y)
    const nextStreak = score >= 9 ? streakRef.current + 1 : 0
    const bonus = score >= 9 ? streakBonus(nextStreak) : 0
    const nextWind = randomWind(d)

    streakRef.current = nextStreak
    countRef.current += 1
    windRef.current = nextWind
    setArrows(prev => [...prev, { x, y, score, bonus }])
    setStreak(nextStreak)
    setBestStreak(b => Math.max(b, nextStreak))
    setWind(nextWind)
    setLast({ score, bonus })
    playShot()
    playHit(score)
  }, [playShot, playHit])

  const togglePause = useCallback(() => {
    if (countRef.current >= ARROWS_PER_GAME) return
    holdingRef.current = false
    setHolding(false)
    setPaused(p => !p)
  }, [])

  const startRound = key => {
    const nd = DIFFICULTIES[key]
    const w = randomWind(nd)
    diffRef.current = nd
    pausedRef.current = false
    holdingRef.current = false
    countRef.current = 0
    streakRef.current = 0
    windRef.current = w
    breathRef.current = 1
    phaseRef.current = 0
    setDifficulty(key)
    setArrows([])
    setLast(null)
    setStreak(0)
    setBestStreak(0)
    setPaused(false)
    setHolding(false)
    setBreath(1)
    setWind(w)
  }

  // Keyboard: hold Space to steady, release to shoot. P pauses.
  useEffect(() => {
    const down = e => {
      if (e.code === 'KeyP') { togglePause(); return }
      if (e.code === 'Space') {
        e.preventDefault()
        if (!e.repeat && !pausedRef.current && countRef.current < ARROWS_PER_GAME) {
          holdingRef.current = true
          setHolding(true)
        }
      }
    }
    const up = e => {
      if (e.code !== 'Space') return
      e.preventDefault()
      if (holdingRef.current) {
        const steady = breathRef.current > 0
        holdingRef.current = false
        setHolding(false)
        shoot(steady)
      }
    }
    const blur = () => { holdingRef.current = false; setHolding(false) }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [shoot, togglePause])

  // Save a new best when a round finishes.
  useEffect(() => {
    if (!over || total <= (best[difficulty] || 0)) return
    const next = { ...best, [difficulty]: total }
    setBest(next)
    try { localStorage.setItem(BEST_KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
  }, [over, total, difficulty, best])

  const mph = mphOf(wind)
  const windLabel = mph === 0 ? 'Wind: calm' : `Wind ${mph} mph ${wind < 0 ? '←' : '→'}`

  const feedback =
    last === null ? 'Take your aim' :
    last.score === 0 ? 'Miss. The arrow fell off the target.' :
    `Scored ${last.score}${last.bonus ? ` +${last.bonus} streak bonus` : ''}`
  const tone =
    last === null ? '' :
    last.score === 0 ? 'miss' :
    last.score >= 9 ? 'gold' :
    last.score >= 7 ? 'red' :
    last.score >= 5 ? 'blue' : 'plain'

  return (
    <main className="app">
      <header className="hero">
        <span className="kicker">Archery range</span>
        <h1>Bullseye</h1>
        <div className="modes" role="group" aria-label="Difficulty">
          {Object.entries(DIFFICULTIES).map(([key, d]) => (
            <button
              key={key}
              className={`mode ${difficulty === key ? 'active' : ''}`}
              onClick={() => startRound(key)}
              disabled={inRound}
              aria-pressed={difficulty === key}
            >
              {d.label}
            </button>
          ))}
        </div>
      </header>

      <section className="stats">
        <div className="stat"><span>Score</span><strong>{total}</strong></div>
        <div className="stat"><span>Streak</span><strong>{streak}</strong></div>
        <div className="stat"><span>Best {diff.label}</span><strong>{best[difficulty] || 0}</strong></div>
      </section>

      <div className="hud-row">
        <div className="wind">{windLabel}</div>
        <div className="breath">
          <span>Breath{holding ? ' · steady' : ''}</span>
          <div className="meter"><i className={holding ? 'on' : ''} style={{ width: `${breath * 100}%` }} /></div>
        </div>
      </div>

      <div className="quiver" aria-label={`${arrows.length} of ${ARROWS_PER_GAME} arrows used`}>
        {Array.from({ length: ARROWS_PER_GAME }, (_, i) => (
          <span key={i} className={i < arrows.length ? 'used' : ''} />
        ))}
      </div>

      <div className="target-wrap">
        <Target arrows={arrows} aim={over || paused ? null : aim} onClick={() => shoot(false)} />

        {paused && !over && (
          <div className="overlay">
            <span className="kicker">Paused</span>
            <h2>Take a breather</h2>
            <button className="primary" onClick={togglePause}>Resume <kbd>P</kbd></button>
          </div>
        )}

        {over && (
          <div className="overlay">
            <span className="kicker">Round complete · {diff.label}</span>
            <h2>{rankFor(total)}</h2>
            <p className="final"><strong>{total}</strong></p>
            {isNewBest && <p className="newbest">New best!</p>}
            <div className="summary">
              <span>Accuracy {Math.round((hits / ARROWS_PER_GAME) * 100)}%</span>
              <span>Average {(total / ARROWS_PER_GAME).toFixed(1)}</span>
              <span>Bullseyes {bullseyes}</span>
              <span>Best streak {bestStreak}</span>
            </div>
            <button className="primary" onClick={() => startRound(difficulty)}>Play again</button>
          </div>
        )}
      </div>

      <p className={`feedback ${tone}`} aria-live="polite">{feedback}</p>

      <div className="controls">
        <button className="primary" onClick={() => shoot(false)} disabled={over || paused}>Shoot <kbd>Space</kbd></button>
        <button className="ghost" onClick={togglePause} disabled={over}>{paused ? 'Resume' : 'Pause'} <kbd>P</kbd></button>
        <button className="ghost" onClick={() => startRound(difficulty)}>New game</button>
        <button className="ghost" onClick={toggleMute} aria-pressed={muted}>{muted ? 'Sound off' : 'Sound on'}</button>
      </div>

      <p className="tip">Tap Space to shoot quickly. Hold Space to steady your aim, then release. Holding uses breath.</p>

      <ol className="log" aria-label="Arrow scores">
        {arrows.map((a, i) => (
          <li key={i} className={a.score >= 9 ? 'gold' : a.score === 0 ? 'miss' : a.score >= 7 ? 'red' : a.score >= 5 ? 'blue' : ''}>
            {a.score}{a.bonus ? `+${a.bonus}` : ''}
          </li>
        ))}
      </ol>
    </main>
  )
}
