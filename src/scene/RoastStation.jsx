import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { progress } from '../lib/progress'
import { at, local, presence } from '../lib/timeline'
import { createBeanGeometry, createBeanMaterial, applyRoast } from './beanGeometry'
import { STATIONS, STATION_WINDOWS, FLOOR_Y } from './choreography'
import { mulberry32 } from './noise'
import { flameMaterial, Vapor } from './fx'
import { roastAt, heatAt } from './PodStation'

const R = 1.3 // drum radius
const L = 2.4 // drum length
const DRUM_Y = 0.25

const steel = new THREE.MeshStandardMaterial({ color: '#2b2522', metalness: 0.85, roughness: 0.38, side: THREE.DoubleSide })
const blackened = new THREE.MeshStandardMaterial({ color: '#141110', metalness: 0.6, roughness: 0.55 })
const copper = new THREE.MeshPhysicalMaterial({ color: '#b8743f', metalness: 1, roughness: 0.25, clearcoat: 0.5 })

export function RoastStation({ quality = 1 }) {
  const root = useRef()
  const drum = useRef()
  const beans = useRef()
  const fireLight = useRef()
  const flames = useRef([])

  const count = Math.round(150 * quality)
  const beanGeo = useMemo(() => createBeanGeometry(0.35), [])
  const beanMat = useMemo(() => createBeanMaterial(0), [])
  const seeds = useMemo(() => {
    const rnd = mulberry32(21)
    return Array.from({ length: count }, () => ({
      phase: rnd(), layer: rnd(), z: (rnd() - 0.5) * (L - 0.4), spin: rnd() * 10, speed: 0.9 + rnd() * 0.25,
    }))
  }, [count])
  const flameMats = useMemo(() => Array.from({ length: 9 }, (_, i) => {
    const m = flameMaterial()
    m.uniforms.uSeed.value = i * 3.1
    return m
  }), [])

  const drumGeo = useMemo(() => new THREE.CylinderGeometry(R, R, L, 72, 1, true).rotateX(Math.PI / 2), [])
  const vanes = useMemo(() => [0, 1, 2, 3].map((i) => (i / 4) * Math.PI * 2), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((state, dt) => {
    const p = progress.value
    const t = state.clock.elapsedTime
    const [a, b] = STATION_WINDOWS.roast
    root.current.visible = p > a && p < b
    if (!root.current.visible) return

    const lr = local(p, 'roast')
    const heat = heatAt(p)
    const roast = roastAt(p)
    drum.current.rotation.z += dt * (0.5 + heat * 0.7) + progress.velocity * dt * 25

    applyRoast(beanMat, roast, heat * 0.12)

    // Tumbling: beans ride up the rotating wall, then cascade back down.
    const base = -Math.PI / 2
    for (let i = 0; i < count; i++) {
      const s = seeds[i]
      const u = (t * 0.24 * s.speed + s.phase + lr * 0.8) % 1
      const r = R - 0.1 - s.layer * 0.38
      const a0 = base - 0.45
      const a1 = base + 1.55 - s.layer * 0.5
      let x, y
      if (u < 0.72) {
        const k = u / 0.72
        const ang = a0 + (a1 - a0) * k
        x = Math.cos(ang) * r
        y = Math.sin(ang) * r
      } else {
        const k = (u - 0.72) / 0.28
        const x1 = Math.cos(a1) * r, y1 = Math.sin(a1) * r
        const x0 = Math.cos(a0) * (r - 0.05), y0 = Math.sin(a0) * (r - 0.05)
        x = x1 + (x0 - x1) * k
        y = y1 + (y0 - y1) * k * k
      }
      dummy.position.set(x, y + DRUM_Y, s.z)
      dummy.rotation.set(t * 1.7 + s.spin, t * 1.1 + s.spin * 2, s.spin)
      dummy.scale.setScalar(0.16 * (1 + roast * 0.12))
      dummy.updateMatrix()
      beans.current.setMatrixAt(i, dummy.matrix)
    }
    beans.current.instanceMatrix.needsUpdate = true

    const flicker = 0.85 + Math.sin(t * 13) * 0.08 + Math.sin(t * 29.7) * 0.07
    const burn = presence(lr, 0.08, 0.92, 0.08)
    fireLight.current.intensity = burn * flicker * (4 + heat * 10)
    flameMats.forEach((m) => {
      m.uniforms.uTime.value = t
      m.uniforms.uIntensity.value = burn * (0.6 + heat * 0.6)
    })
  })

  return (
    <group ref={root} position={STATIONS.roast}>
      {/* Drum */}
      <group ref={drum} position={[0, DRUM_Y, 0]}>
        <mesh geometry={drumGeo} material={steel} receiveShadow />
        {vanes.map((a, i) => (
          <mesh key={i} position={[Math.cos(a) * (R - 0.12), Math.sin(a) * (R - 0.12), 0]} rotation={[0, 0, a]} material={steel}>
            <boxGeometry args={[0.24, 0.035, L - 0.1]} />
          </mesh>
        ))}
        {/* Perforation ring details */}
        {[-0.8, 0, 0.8].map((z) => (
          <mesh key={z} position={[0, 0, z]} material={blackened}>
            <torusGeometry args={[R + 0.01, 0.018, 8, 96]} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, DRUM_Y, -L / 2]} material={blackened}>
        <circleGeometry args={[R, 64]} />
      </mesh>
      {/* Housing */}
      <mesh position={[0, DRUM_Y, L / 2]} material={copper} castShadow>
        <torusGeometry args={[R + 0.05, 0.08, 24, 120]} />
      </mesh>
      <mesh position={[0, DRUM_Y, -0.1]} material={blackened} castShadow>
        <cylinderGeometry args={[R + 0.22, R + 0.22, L - 0.2, 72, 1, true, Math.PI * 0.08, Math.PI * 1.1]} />
      </mesh>
      <mesh position={[0.95, 2.4, -0.8]} material={copper} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 2.6, 32]} />
      </mesh>
      <mesh position={[0.95, 1.1, -0.8]} material={blackened}>
        <cylinderGeometry args={[0.24, 0.24, 0.2, 32]} />
      </mesh>
      {/* Stand & burners */}
      {[-1.1, 1.1].map((x) => (
        <mesh key={x} position={[x, (FLOOR_Y + DRUM_Y - R) / 2, 0]} material={blackened} castShadow>
          <boxGeometry args={[0.14, DRUM_Y - R - FLOOR_Y, 1.8]} />
        </mesh>
      ))}
      <mesh position={[0, DRUM_Y - R - 0.28, 0]} material={blackened}>
        <boxGeometry args={[1.9, 0.08, 1.6]} />
      </mesh>
      {flameMats.map((m, i) => (
        <mesh key={i} ref={(el) => (flames.current[i] = el)} material={m}
          position={[-0.8 + (i % 5) * 0.4 + (i >= 5 ? 0.2 : 0), DRUM_Y - R - 0.22, i >= 5 ? -0.35 : 0.25]}>
          <planeGeometry args={[0.28, 0.42]} />
        </mesh>
      ))}
      <pointLight ref={fireLight} position={[0, DRUM_Y - R - 0.1, 0.6]} color="#ff7a2a" intensity={0} distance={6} decay={2} />

      <instancedMesh ref={beans} args={[beanGeo, beanMat, count]} castShadow frustumCulled={false} />

      {/* Smoke from the drum mouth and sparks from the burners */}
      <Vapor count={Math.round(70 * quality)} position={[0, DRUM_Y + 0.6, L / 2 + 0.1]} area={[1.4, 0.4, 0.3]}
        rise={3.2} spread={0.9} size={3.2} speed={0.07} grow={3.4} color="#8a7a6c"
        intensity={(p) => presence(p, at('roast', 0.25), at('roast', 0.98), 0.03) * (0.18 + roastAt(p) * 0.3)} />
      <Vapor count={Math.round(50 * quality)} position={[0, DRUM_Y - R - 0.1, 0]} area={[1.8, 0.1, 1.2]}
        rise={2.4} spread={0.4} size={0.18} speed={0.35} grow={0.6} color="#ffae5c" additive
        intensity={(p) => heatAt(p) * 0.9} />
    </group>
  )
}
