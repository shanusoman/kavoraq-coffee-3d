/**
 * A tiny, render-free store for the story's scroll progress.
 * - `target` is written by ScrollTrigger.
 * - `value` is the damped value everything animates from (3D + overlays).
 * Components read it inside useFrame / rAF, so scrolling never triggers React renders.
 */
import { damp } from './timeline'

const listeners = new Set()

export const progress = {
  target: 0,
  value: 0,
  velocity: 0,
  trigger: null, // the ScrollTrigger instance, used for scroll-to-stage
  subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
  tick(dt) {
    const prev = this.value
    this.value = damp(this.value, this.target, 7, Math.min(dt, 0.1))
    if (Math.abs(this.value - this.target) < 1e-5) this.value = this.target
    this.velocity = (this.value - prev) / Math.max(dt, 1e-4)
    listeners.forEach((fn) => fn(this.value))
  },
}

export const pointer = { x: 0, y: 0, sx: 0, sy: 0 }

if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
    },
    { passive: true },
  )
}
