import * as THREE from 'three'
import { at, invLerp, TIMELINE } from '../lib/timeline'

/**
 * World layout: each station of the journey sits along the X axis.
 * The camera physically travels between them; fog hides what's ahead.
 */
export const FLOOR_Y = -1.6
export const STATIONS = {
  pod: new THREE.Vector3(0, 0, 0),
  roast: new THREE.Vector3(14, 0, 0),
  grind: new THREE.Vector3(28, 0, 0),
  brew: new THREE.Vector3(42, 0, 0),
  cup: new THREE.Vector3(56, 0, 0),
}

const v = (base, x, y, z) => new THREE.Vector3(base.x + x, base.y + y, base.z + z)
const S = STATIONS

/**
 * Keyframed path. Each key is anchored to a moment in the story timeline
 * (stage id + relative position), never to a raw percentage.
 */
function buildPath(keys) {
  const ps = keys.map((k) => at(k.stage, k.t))
  const pos = new THREE.CatmullRomCurve3(keys.map((k) => k.pos), false, 'centripetal', 0.5)
  const tgt = keys[0].target ? new THREE.CatmullRomCurve3(keys.map((k) => k.target), false, 'centripetal', 0.5) : null
  // Optional "subject": where the hero object actually is (targets are offset on desktop to leave room for text).
  const subj = tgt ? new THREE.CatmullRomCurve3(keys.map((k) => k.subject ?? k.target), false, 'centripetal', 0.5) : null
  const n = keys.length - 1
  const param = (p) => {
    if (p <= ps[0]) return 0
    if (p >= ps[n]) return 1
    let i = 0
    while (p > ps[i + 1]) i++
    const f = invLerp(ps[i], ps[i + 1], p)
    // Ease between keys so the camera lingers on each composition.
    const e = f * f * (3 - 2 * f) * 0.55 + f * 0.45
    return (i + e) / n
  }
  return {
    getPosition: (p, out) => out.copy(pos.getPoint(param(p))),
    getTarget: (p, out) => out.copy(tgt.getPoint(param(p))),
    getSubject: (p, out) => out.copy(subj.getPoint(param(p))),
  }
}

export const cameraPath = buildPath([
  { stage: 'intro', t: 0, pos: v(S.pod, 0, 0.15, 8.8), target: v(S.pod, 0, 0.05, 0) },
  { stage: 'intro', t: 1, pos: v(S.pod, 0.9, 0.5, 6.0), target: v(S.pod, 0, 0.05, 0) },
  { stage: 'open', t: 0.55, pos: v(S.pod, -1.9, 0.9, 4.3), target: v(S.pod, 0, 0.0, 0) },
  { stage: 'emerge', t: 1, pos: v(S.pod, 0.5, 0.55, 3.1), target: v(S.pod, 0, 0.35, 0) },
  { stage: 'origin', t: 0.45, pos: v(S.pod, -0.5, 0.35, 3.6), target: v(S.pod, 0.25, 0.25, 0), subject: v(S.pod, 0.9, 0.28, 0.2) },
  { stage: 'origin', t: 1, pos: v(S.pod, 4.2, 0.9, 4.4), target: v(S.pod, 4.8, 0.2, 0) },
  { stage: 'roast', t: 0.22, pos: v(S.roast, -1.8, 1.5, 7.4), target: v(S.roast, 1.4, 0.2, 0), subject: v(S.roast, 0, 0.2, 0.6) },
  { stage: 'roast', t: 0.62, pos: v(S.roast, 0.9, 0.7, 6.0), target: v(S.roast, 1.3, -0.05, 0.3), subject: v(S.roast, 0, 0, 0.8) },
  { stage: 'roast', t: 1, pos: v(S.roast, 5.5, 1.6, 5.2), target: v(S.roast, 6.5, 0.8, 0) },
  { stage: 'grind', t: 0.2, pos: v(S.grind, -3.0, 2.3, 6.2), target: v(S.grind, -1.2, 1.0, 0), subject: v(S.grind, 0, 0.8, 0) },
  { stage: 'grind', t: 0.65, pos: v(S.grind, -0.6, 0.35, 4.6), target: v(S.grind, -0.9, -0.7, 0.4), subject: v(S.grind, 0, -0.5, 0.4) },
  { stage: 'grind', t: 1, pos: v(S.grind, 5.5, 0.8, 5.0), target: v(S.grind, 6.5, 0, 0) },
  { stage: 'brew', t: 0.18, pos: v(S.brew, -2.4, 1.5, 7.0), target: v(S.brew, 1.2, 0.2, 0), subject: v(S.brew, 0, 0.1, 0) },
  { stage: 'brew', t: 0.55, pos: v(S.brew, 1.1, 1.0, 5.2), target: v(S.brew, 1.15, 0.0, 0), subject: v(S.brew, 0, -0.1, 0) },
  { stage: 'brew', t: 0.85, pos: v(S.brew, 1.4, -0.3, 4.6), target: v(S.brew, 1.0, -0.85, 0), subject: v(S.brew, 0, -0.7, 0) },
  { stage: 'cup', t: 0.1, pos: v(S.cup, -2.2, 2.6, 3.8), target: v(S.cup, 0, -0.8, 0) },
  { stage: 'cup', t: 0.38, pos: v(S.cup, 0.4, 1.3, 2.4), target: v(S.cup, 0, -0.85, 0) },
  { stage: 'cup', t: 0.8, pos: v(S.cup, -0.2, 0.5, 4.6), target: v(S.cup, 0.1, -0.75, 0) },
  { stage: 'outro', t: 1, pos: v(S.cup, 0, 0.7, 5.6), target: v(S.cup, 0, -0.7, 0) },
])

/** The hero bean's journey: out of the pod, across origin, into the drum, into the grinder. */
export const beanPath = buildPath([
  { stage: 'intro', t: 0, pos: v(S.pod, 0, -0.05, 0) },
  { stage: 'open', t: 0.6, pos: v(S.pod, 0, -0.02, 0) },
  { stage: 'emerge', t: 1, pos: v(S.pod, 0, 0.38, 0.25) },
  { stage: 'origin', t: 0.45, pos: v(S.pod, 0.9, 0.28, 0.2) },
  { stage: 'origin', t: 1, pos: v(S.pod, 4.6, 0.35, 0.3) },
  { stage: 'roast', t: 0.2, pos: v(S.roast, -0.1, 0.3, 1.8) },
  { stage: 'roast', t: 0.6, pos: v(S.roast, -0.15, -0.1, 1.9) },
  { stage: 'roast', t: 0.9, pos: v(S.roast, 2.5, 0.9, 1.4) },
  { stage: 'grind', t: 0.05, pos: v(S.grind, -0.8, 3.0, 0.6) },
  { stage: 'grind', t: 0.22, pos: v(S.grind, 0, 1.55, 0) },
])

/** Which station is "active" — used to cull far-away geometry and move lights. */
export const STATION_WINDOWS = {
  pod: [0, at('roast', 0.1)],
  roast: [at('origin', 0.55), at('grind', 0.25)],
  grind: [at('roast', 0.7), at('brew', 0.25)],
  brew: [at('grind', 0.7), at('cup', 0.25)],
  cup: [at('brew', 0.7), 1.01],
}

export const TOTAL = TIMELINE.length
