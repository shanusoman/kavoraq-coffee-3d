import { STAGES } from '../data/story'

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const lerp = (a, b, t) => a + (b - a) * t
export const invLerp = (a, b, v) => clamp((v - a) / (b - a))
export const smoothstep = (a, b, v) => {
  const t = invLerp(a, b, v)
  return t * t * (3 - 2 * t)
}
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
export const easeOut = (t) => 1 - Math.pow(1 - t, 3)
export const damp = (current, target, lambda, dt) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt))

/** Normalised stage ranges built from relative weights. */
const total = STAGES.reduce((s, st) => s + st.weight, 0)
let cursor = 0
export const TIMELINE = STAGES.map((stage) => {
  const start = cursor / total
  cursor += stage.weight
  return { ...stage, start, end: cursor / total }
})

export const STAGE = Object.fromEntries(TIMELINE.map((s) => [s.id, s]))
export const CHAPTERS = TIMELINE.filter((s) => s.chapter)

/** Absolute progress at a relative point inside a stage (at: 0..1). */
export const at = (id, t = 0) => lerp(STAGE[id].start, STAGE[id].end, t)

/** 0..1 progress within a stage (clamped). */
export const local = (p, id) => invLerp(STAGE[id].start, STAGE[id].end, p)

/** 0..1 progress spanning from the start of one stage to the end of another. */
export const span = (p, fromId, toId, t0 = 0, t1 = 1) => invLerp(at(fromId, t0), at(toId, t1), p)

/**
 * Presence envelope: fades in before a window, holds, fades out after.
 * Used for visibility and intensity of stage-specific elements.
 */
export const presence = (p, a, b, fade = 0.02) =>
  smoothstep(a - fade, a + fade, p) * (1 - smoothstep(b - fade, b + fade, p))

export const stageAt = (p) => TIMELINE.find((s) => p >= s.start && p <= s.end) ?? TIMELINE[0]
