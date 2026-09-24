import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { progress } from '../lib/progress'
import { at, easeInOut, local, presence, smoothstep } from '../lib/timeline'
import { createBeanGeometry, createBeanMaterial, applyRoast } from './beanGeometry'
import { beanPath, STATIONS } from './choreography'
import { noise3, mulberry32 } from './noise'

const H = 1.2 // half-height of the pod

function podHalfGeometry(phiStart) {
  const pts = []
  const N = 80
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const y = -H + 2 * H * t
    const yy = y / H
    const r = 0.95 * Math.sqrt(Math.max(0, 1 - yy * yy)) * (1 - 0.1 * yy)
    pts.push(new THREE.Vector2(Math.max(r, 0.0001), y))
  }
  const geo = new THREE.LatheGeometry(pts, 72, phiStart, Math.PI)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const phi = Math.atan2(v.x, v.z)
    const t = (v.y + H) / (2 * H)
    const band = Math.sin(Math.PI * t)
    const rib = Math.pow(0.5 + 0.5 * Math.cos(phi * 22), 2.5) * 0.03 * band
    const hammer = noise3(v.x * 14, v.y * 14, v.z * 14) * 0.004
    const s = 1 + rib + hammer
    pos.setXYZ(i, v.x * s, v.y, v.z * s)
  }
  geo.computeVertexNormals()
  return geo
}

function glowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  g.addColorStop(0, 'rgba(255,214,160,0.9)')
  g.addColorStop(0.18, 'rgba(255,160,80,0.35)')
  g.addColorStop(0.45, 'rgba(255,120,50,0.08)')
  g.addColorStop(1, 'rgba(255,110,40,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export function Pod() {
  const root = useRef()
  const halfA = useRef()
  const halfB = useRef()
  const light = useRef()
  const glow = useRef()

  const { geoA, geoB, outer, inner, glowMat } = useMemo(() => {
    const outer = new THREE.MeshPhysicalMaterial({
      color: '#9a633c', metalness: 1, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.2,
    })
    const inner = new THREE.MeshStandardMaterial({
      color: '#1c0d06', roughness: 0.85, side: THREE.BackSide,
      emissive: new THREE.Color('#ff7a2e'), emissiveIntensity: 0,
    })
    const glowMat = new THREE.SpriteMaterial({
      map: glowTexture(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0,
    })
    return { geoA: podHalfGeometry(0), geoB: podHalfGeometry(Math.PI), outer, inner, glowMat }
  }, [])

  const endP = at('origin', 0.35)

  useFrame((state) => {
    const p = progress.value
    const t = state.clock.elapsedTime
    root.current.visible = p < endP
    if (!root.current.visible) return

    const intro = local(p, 'intro')
    const o = local(p, 'open')
    const e = local(p, 'emerge')
    const settle = smoothstep(0, 0.3, o)

    // Idle motion that settles as the pod prepares to open.
    const idle = 1 - settle
    root.current.rotation.y = (Math.sin(t * 0.35) * 0.55 + intro * 0.6) * idle
    root.current.rotation.z = Math.sin(t * 0.5) * 0.06 * idle
    root.current.rotation.x = 0.12 * idle - 0.05
    const tremble = presence(o, 0.12, 0.34, 0.06)
    root.current.position.set(
      Math.sin(t * 63) * 0.006 * tremble,
      Math.sin(t * 0.9) * 0.06 * idle + Math.sin(t * 71) * 0.005 * tremble,
      0,
    )

    // Crack → part → swing open like a seed pod.
    const gap = smoothstep(0.22, 0.4, o) * 0.05
    const swing = easeInOut(smoothstep(0.36, 1, o))
    const fall = easeInOut(e)
    for (const [ref, dir] of [[halfA, 1], [halfB, -1]]) {
      const g = ref.current
      g.position.set(dir * (gap + swing * 0.35 + fall * 3.2), -H - swing * 0.3 - fall * 4, -swing * 0.5 - fall * 2)
      g.rotation.z = -dir * (swing * 1.05 + fall * 0.6)
      g.rotation.y = -dir * swing * 0.3
    }

    const inside = smoothstep(0.18, 0.5, o) * (1 - smoothstep(0.5, 1, e))
    inner.emissiveIntensity = inside * 0.18
    light.current.intensity = inside * 2.5
    glowMat.opacity = inside * 0.5
    glow.current.scale.setScalar(1.1 + inside * 0.7 + Math.sin(t * 2) * 0.04)
  })

  return (
    <group position={STATIONS.pod}>
      <group ref={root}>
        <group ref={halfA}>
          <mesh geometry={geoA} material={outer} position={[0, H, 0]} castShadow />
          <mesh geometry={geoA} material={inner} position={[0, H, 0]} />
        </group>
        <group ref={halfB}>
          <mesh geometry={geoB} material={outer} position={[0, H, 0]} castShadow />
          <mesh geometry={geoB} material={inner} position={[0, H, 0]} />
        </group>
        <pointLight ref={light} color="#ffb070" intensity={0} distance={5} decay={2} />
        <sprite ref={glow} material={glowMat} />
      </group>
    </group>
  )
}

/** Shared roast function so the hero bean and the drum beans stay in sync. */
export const roastAt = (p) => smoothstep(at('roast', 0.12), at('roast', 0.82), p)
export const heatAt = (p) => presence(p, at('roast', 0.2), at('roast', 0.8), 0.04)

export function HeroBean() {
  const ref = useRef()
  const spin = useRef({ y: 0, x: 0 })
  const { geometry, material } = useMemo(
    () => ({ geometry: createBeanGeometry(1.2), material: createBeanMaterial(0) }),
    [],
  )
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, dt) => {
    const p = progress.value
    const t = state.clock.elapsedTime
    const g = ref.current

    const vanish = 1 - smoothstep(at('grind', 0.14), at('grind', 0.23), p)
    const grow = THREE.MathUtils.lerp(0.3, 0.36, smoothstep(at('open', 0.6), at('emerge', 1), p))
    const roast = roastAt(p)
    const heat = heatAt(p)
    const s = grow * (1 + roast * 0.12) * vanish
    g.visible = s > 0.002 && p > at('open', 0.2)
    if (!g.visible) return
    g.scale.setScalar(s)

    beanPath.getPosition(p, tmp)
    const float = smoothstep(at('emerge', 0.2), at('emerge', 1), p)
    tmp.y += Math.sin(t * 1.1) * 0.035 * float
    g.position.copy(tmp)

    const tumble = heat * 1.6 + Math.min(Math.abs(progress.velocity) * 6, 1.5)
    spin.current.y += dt * tumble
    spin.current.x += dt * heat * 1.1
    const emergeTurn = smoothstep(at('open', 0.5), at('emerge', 1), p) * Math.PI * 2
    g.rotation.set(
      0.25 + Math.sin(t * 0.4) * 0.15 + spin.current.x,
      Math.sin(t * 0.35) * 0.75 + spin.current.y + emergeTurn,
      -0.45 + Math.sin(t * 0.3) * 0.1,
    )

    applyRoast(material, roast, heat * (0.16 + 0.08 * Math.sin(t * 9)))
  })

  return <mesh ref={ref} geometry={geometry} material={material} castShadow />
}

/** Origin: glowing topographic contours — a nod to altitude and terroir. */
export function OriginContours() {
  const group = useRef()
  const { lines, mats } = useMemo(() => {
    const rnd = mulberry32(5)
    const lines = []
    const mats = []
    for (let i = 0; i < 11; i++) {
      const pts = []
      const r0 = 2.8 - i * 0.24
      const ox = (rnd() - 0.5) * 0.2
      for (let k = 0; k <= 160; k++) {
        const a = (k / 160) * Math.PI * 2
        const r = r0 * (1 + noise3(Math.cos(a) * 1.3, Math.sin(a) * 1.3, i * 0.18) * 0.28)
        pts.push(new THREE.Vector3(Math.cos(a) * r + ox * i, 0, Math.sin(a) * r * 0.8))
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts)
      const mat = new THREE.LineBasicMaterial({
        color: i === 7 ? '#ffd9a0' : '#c8925a', transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
      mats.push(mat)
      lines.push({ geo, mat, y: i * 0.07 })
    }
    return { lines, mats }
  }, [])

  useFrame((state) => {
    const k = presence(progress.value, at('emerge', 0.6), at('origin', 0.95), 0.03)
    group.current.visible = k > 0.002
    if (!group.current.visible) return
    group.current.rotation.y = state.clock.elapsedTime * 0.03
    mats.forEach((m, i) => (m.opacity = k * (0.18 + (i === 7 ? 0.35 : 0)) * (0.6 + 0.4 * Math.sin(state.clock.elapsedTime * 0.8 + i))))
  })

  return (
    <group ref={group} position={[1.6, -1.35, -1.2]}>
      {lines.map((l, i) => (
        <lineLoop key={i} geometry={l.geo} material={l.mat} position={[0, l.y, 0]} />
      ))}
    </group>
  )
}
