import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { progress } from '../lib/progress'
import { local, presence, smoothstep } from '../lib/timeline'
import { createBeanGeometry, createBeanMaterial } from './beanGeometry'
import { STATIONS, STATION_WINDOWS } from './choreography'
import { mulberry32, noise3 } from './noise'
import { Vapor } from './fx'

const BASE_TOP = -1.48
const BODY_Z = -0.2
const HOP_BOTTOM = 0.98
const HOP_H = 1.2
const HOP_RB = 0.26
const HOP_RT = 0.8
const SPOUT = new THREE.Vector3(0, -0.5, 0.52)
const CUP_Z = 0.56
const CUP_BOTTOM = BASE_TOP + 0.04
const PILE_MAX = 0.34

const hopperR = (y) => THREE.MathUtils.lerp(HOP_RB, HOP_RT, THREE.MathUtils.clamp((y - HOP_BOTTOM) / HOP_H, 0, 1))

const body = new THREE.MeshPhysicalMaterial({ color: '#2a221d', roughness: 0.38, metalness: 0.45, clearcoat: 0.35, clearcoatRoughness: 0.4 })
const copper = new THREE.MeshPhysicalMaterial({ color: '#b8743f', metalness: 1, roughness: 0.22, clearcoat: 0.5 })
const glass = new THREE.MeshPhysicalMaterial({
  color: '#ffffff', roughness: 0.04, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.16,
  side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 2,
})
const groundsMat = new THREE.MeshStandardMaterial({ color: '#3a2112', roughness: 1 })

function bodyGeometry() {
  const pts = [[0, BASE_TOP], [0.6, BASE_TOP], [0.64, BASE_TOP + 0.05], [0.64, 0.8], [0.6, 0.88], [0.48, 0.93], [0, 0.93]]
  return new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 72)
}
function burrGeometry() {
  const g = new THREE.CylinderGeometry(0.46, 0.46, 0.1, 96, 1)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i)
    const r = Math.hypot(x, z)
    if (r < 0.3) continue
    const a = Math.atan2(z, x)
    const k = 1 + (Math.sin(a * 30) > 0 ? 0.04 : 0)
    pos.setX(i, x * k)
    pos.setZ(i, z * k)
  }
  g.computeVertexNormals()
  return g
}
function pileGeometry() {
  const g = new THREE.ConeGeometry(0.235, 1, 48, 12)
  g.translate(0, 0.5, 0)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    const n = noise3(x * 30, y * 30, z * 30) * 0.012 + noise3(x * 90, y * 90, z * 90) * 0.004
    const r = Math.hypot(x, z)
    if (r > 0.001) {
      pos.setX(i, x * (1 + n / r))
      pos.setZ(i, z * (1 + n / r))
    }
    pos.setY(i, y * (0.85 + 0.15 * Math.cos(r * 6)))
  }
  g.computeVertexNormals()
  return g
}

export function GrindStation({ quality = 1 }) {
  const root = useRef()
  const burr = useRef()
  const hopperBeans = useRef()
  const grounds = useRef()
  const pile = useRef()

  const beanCount = Math.round(90 * quality)
  const groundCount = Math.round(520 * quality)

  const geos = useMemo(() => ({
    body: bodyGeometry(),
    burr: burrGeometry(),
    pile: pileGeometry(),
    hopper: new THREE.CylinderGeometry(HOP_RT, HOP_RB, HOP_H, 64, 1, true),
    bean: createBeanGeometry(0.35),
    ground: new THREE.IcosahedronGeometry(0.013, 0),
    cup: new THREE.CylinderGeometry(0.27, 0.25, 0.44, 48, 1, true),
  }), [])
  const beanMat = useMemo(() => createBeanMaterial(1), [])

  const beans = useMemo(() => {
    const rnd = mulberry32(8)
    const arr = []
    for (let i = 0; i < beanCount; i++) {
      const y = HOP_BOTTOM + 0.06 + rnd() * 0.95
      const rel = Math.sqrt(rnd())
      arr.push({ y, rel, a: rnd() * Math.PI * 2, rot: [rnd() * 6, rnd() * 6, rnd() * 6] })
    }
    return arr.sort((a, b) => a.y - b.y)
  }, [beanCount])
  const grains = useMemo(() => {
    const rnd = mulberry32(12)
    return Array.from({ length: groundCount }, () => ({ s: rnd(), a: rnd() * Math.PI * 2, r: rnd(), rot: rnd() * 6 }))
  }, [groundCount])
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((state, dt) => {
    const p = progress.value
    const t = state.clock.elapsedTime
    const [a, b] = STATION_WINDOWS.grind
    root.current.visible = p > a && p < b
    if (!root.current.visible) return

    const lg = local(p, 'grind')
    const grinding = presence(lg, 0.24, 0.9, 0.05)
    const drain = smoothstep(0.2, 0.92, lg)
    const fill = smoothstep(0.28, 0.95, lg)
    burr.current.rotation.y += dt * (0.4 + grinding * 5) + progress.velocity * dt * 40

    // Hopper beans sink toward the burrs as they're consumed.
    for (let i = 0; i < beanCount; i++) {
      const bn = beans[i]
      const y = bn.y - drain * 1.15 + Math.sin(t * 20 + i) * 0.003 * grinding
      const hidden = y < HOP_BOTTOM + 0.02
      const r = bn.rel * (hopperR(y) - 0.09)
      dummy.position.set(Math.cos(bn.a) * r, y, BODY_Z + Math.sin(bn.a) * r)
      dummy.rotation.set(bn.rot[0] + drain * 3, bn.rot[1], bn.rot[2])
      dummy.scale.setScalar(hidden ? 0 : 0.13 * smoothstep(HOP_BOTTOM, HOP_BOTTOM + 0.1, y))
      dummy.updateMatrix()
      hopperBeans.current.setMatrixAt(i, dummy.matrix)
    }
    hopperBeans.current.instanceMatrix.needsUpdate = true

    // Falling grounds stream from the spout into the dosing cup.
    const pileTop = CUP_BOTTOM + PILE_MAX * fill * 0.9
    const drop = SPOUT.y - pileTop
    for (let i = 0; i < groundCount; i++) {
      const g = grains[i]
      const u = (t * (0.9 + g.s * 0.4) + g.s * 13.7) % 1
      const spread = 0.012 + u * 0.05 * g.r
      dummy.position.set(
        SPOUT.x + Math.cos(g.a) * spread,
        SPOUT.y - u * u * drop,
        SPOUT.z + 0.02 + Math.sin(g.a) * spread + u * 0.03,
      )
      dummy.rotation.set(g.rot + t * 3, g.rot * 2, 0)
      dummy.scale.setScalar(grinding * (0.6 + g.r * 0.8))
      dummy.updateMatrix()
      grounds.current.setMatrixAt(i, dummy.matrix)
    }
    grounds.current.instanceMatrix.needsUpdate = true

    pile.current.scale.set(0.35 + fill * 0.65, Math.max(0.001, PILE_MAX * fill), 0.35 + fill * 0.65)
  })

  return (
    <group ref={root} position={STATIONS.grind}>
      <mesh position={[0, BASE_TOP - 0.06, 0.15]} material={body} receiveShadow castShadow>
        <cylinderGeometry args={[0.95, 0.98, 0.12, 72]} />
      </mesh>
      <mesh geometry={geos.body} material={body} position={[0, 0, BODY_Z]} castShadow receiveShadow />
      <mesh position={[0, 0.55, BODY_Z]} material={copper}>
        <cylinderGeometry args={[0.648, 0.648, 0.05, 72, 1, true]} />
      </mesh>
      {/* Dial */}
      <mesh position={[0, 0.2, BODY_Z + 0.64]} rotation={[Math.PI / 2, 0, 0]} material={copper}>
        <cylinderGeometry args={[0.12, 0.12, 0.05, 48]} />
      </mesh>
      <mesh ref={burr} geometry={geos.burr} material={copper} position={[0, 0.98, BODY_Z]} castShadow />
      <mesh geometry={geos.hopper} material={glass} position={[0, HOP_BOTTOM + HOP_H / 2, BODY_Z]} renderOrder={3} />
      <mesh position={[0, HOP_BOTTOM + HOP_H, BODY_Z]} rotation={[Math.PI / 2, 0, 0]} material={copper}>
        <torusGeometry args={[HOP_RT, 0.015, 12, 96]} />
      </mesh>
      {/* Spout */}
      <mesh position={[0, -0.38, BODY_Z + 0.66]} rotation={[0.5, 0, 0]} material={copper} castShadow>
        <cylinderGeometry args={[0.07, 0.06, 0.32, 32, 1, true]} />
      </mesh>
      {/* Dosing cup and grounds pile */}
      <mesh geometry={geos.cup} material={copper} position={[0, CUP_BOTTOM + 0.2, CUP_Z]} castShadow receiveShadow>
      </mesh>
      <mesh position={[0, CUP_BOTTOM - 0.01, CUP_Z]} rotation={[-Math.PI / 2, 0, 0]} material={copper}>
        <circleGeometry args={[0.25, 48]} />
      </mesh>
      <mesh ref={pile} geometry={geos.pile} material={groundsMat} position={[0, CUP_BOTTOM, CUP_Z]} receiveShadow />

      <instancedMesh ref={hopperBeans} args={[geos.bean, beanMat, beanCount]} castShadow frustumCulled={false} />
      <instancedMesh ref={grounds} args={[geos.ground, groundsMat, groundCount]} frustumCulled={false} />

      <Vapor count={Math.round(30 * quality)} position={[0, -0.95, CUP_Z]} area={[0.2, 0.1, 0.2]}
        rise={0.8} spread={0.25} size={1.1} speed={0.12} grow={2.5} color="#8b6a50"
        intensity={(p) => presence(local(p, 'grind'), 0.3, 0.95, 0.06) * 0.12} />
    </group>
  )
}
