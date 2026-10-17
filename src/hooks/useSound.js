import { useCallback, useRef, useState } from 'react'

// Tiny synth sound effects with the Web Audio API, so no audio files are needed.
export default function useSound() {
  const ctxRef = useRef(null)
  const mutedRef = useRef(false)
  const [muted, setMuted] = useState(false)

  const tone = useCallback((freq, dur, type = 'sine', vol = 0.1, slide = 0, delay = 0) => {
    if (mutedRef.current) return
    try {
      ctxRef.current = ctxRef.current || new (window.AudioContext || window.webkitAudioContext)()
      const ac = ctxRef.current
      const t = ac.currentTime + delay
      const o = ac.createOscillator()
      const g = ac.createGain()
      o.type = type
      o.frequency.setValueAtTime(freq, t)
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur)
      g.gain.setValueAtTime(vol, t)
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      o.connect(g)
      g.connect(ac.destination)
      o.start(t)
      o.stop(t + dur)
    } catch { /* audio unavailable */ }
  }, [])

  const playShot = useCallback(() => tone(220, 0.25, 'triangle', 0.12, -120), [tone])

  const playHit = useCallback(score => {
    if (score >= 9) {
      tone(880, 0.3, 'sine', 0.12)
      tone(1320, 0.25, 'sine', 0.08, 0, 0.12)
    } else if (score > 0) {
      tone(330, 0.2, 'square', 0.08)
    } else {
      tone(90, 0.2, 'sawtooth', 0.08, -40)
    }
  }, [tone])

  const toggleMute = useCallback(() => {
    mutedRef.current = !mutedRef.current
    setMuted(mutedRef.current)
  }, [])

  return { muted, toggleMute, playShot, playHit }
}
