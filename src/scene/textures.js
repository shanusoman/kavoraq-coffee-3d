import * as THREE from 'three'
import { mulberry32 } from './noise'

const canvas = (size) => {
  const c = document.createElement('canvas')
  c.width = c.height = size
  return [c, c.getContext('2d')]
}

/** Top-down espresso crema: caramel centre, tiger mottling, darker meniscus. */
export function createCremaTexture() {
  const size = 1024
  const [c, ctx] = canvas(size)
  const r = size / 2
  const rnd = mulberry32(7)

  const g = ctx.createRadialGradient(r * 0.92, r * 0.9, 0, r, r, r)
  g.addColorStop(0, '#c9915a')
  g.addColorStop(0.45, '#a86a37')
  g.addColorStop(0.8, '#7a4520')
  g.addColorStop(0.93, '#5b3016')
  g.addColorStop(1, '#3a1d0c')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)

  // Tiger striping: soft dark and light flecks swirled around the centre.
  for (let i = 0; i < 2600; i++) {
    const ang = rnd() * Math.PI * 2
    const d = Math.sqrt(rnd()) * r * 0.95
    const x = r + Math.cos(ang) * d
    const y = r + Math.sin(ang) * d
    const len = 6 + rnd() * 26
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang + Math.PI / 2 + (rnd() - 0.5) * 0.6)
    ctx.globalAlpha = 0.05 + rnd() * 0.08
    ctx.fillStyle = rnd() > 0.55 ? '#e0b07a' : '#4a2410'
    ctx.beginPath()
    ctx.ellipse(0, 0, len, 1.5 + rnd() * 3, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  // Micro-foam bubbles.
  for (let i = 0; i < 900; i++) {
    const ang = rnd() * Math.PI * 2
    const d = Math.sqrt(rnd()) * r * 0.97
    ctx.globalAlpha = 0.12 + rnd() * 0.2
    ctx.fillStyle = rnd() > 0.5 ? '#f0cf9f' : '#6b3a1a'
    ctx.beginPath()
    ctx.arc(r + Math.cos(ang) * d, r + Math.sin(ang) * d, 0.6 + rnd() * 1.8, 0, Math.PI * 2)
    ctx.fill()
  }
  // Pale ring where crema meets the ceramic.
  ctx.globalAlpha = 0.35
  ctx.strokeStyle = '#d7a773'
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.arc(r, r, r * 0.955, 0, Math.PI * 2)
  ctx.stroke()
  ctx.globalAlpha = 1

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/** Streaky alpha texture (bands along U) used to make liquid streams appear to flow. */
export function createFlowTexture() {
  const [c, ctx] = canvas(256)
  const rnd = mulberry32(3)
  ctx.fillStyle = '#b8b8b8'
  ctx.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 180; i++) {
    const x = rnd() * 256
    ctx.globalAlpha = 0.15 + rnd() * 0.35
    ctx.fillStyle = rnd() > 0.5 ? '#ffffff' : '#6a6a6a'
    ctx.fillRect(x, 0, 1 + rnd() * 6, 256)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

/** Subtle stone/walnut surface roughness variation for the floor. */
export function createSurfaceTexture() {
  const [c, ctx] = canvas(512)
  const rnd = mulberry32(11)
  ctx.fillStyle = '#7a7a7a'
  ctx.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 4000; i++) {
    ctx.globalAlpha = 0.04 + rnd() * 0.06
    ctx.fillStyle = rnd() > 0.5 ? '#ffffff' : '#000000'
    ctx.fillRect(rnd() * 512, rnd() * 512, 1 + rnd() * 40, 1 + rnd() * 2)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(24, 4)
  return tex
}
