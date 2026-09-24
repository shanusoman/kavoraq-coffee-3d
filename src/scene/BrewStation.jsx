import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { progress } from '../lib/progress'
import { local, smoothstep, presence } from '../lib/timeline'
import { STATIONS, STATION_WINDOWS } from './choreography'
import { mulberry32, noise3, fbm3 } from './noise'
import { createFlowTexture } from './textures'
import { SteamWisps, Vapor } from './fx'

const V2 = (pts) => pts.map(([x, y]) => new THREE.Vector2(x, y))

// Glass server profile.
const CARAFE = [[0.5, -1.6], [0.57, -1.52], [0.62, -1.3], [0.6, -1.08], [0.5, -0.82], [0.41, -0.62], [0.4, -0.54], [0.43, -0.5]]
const LIQ_MIN = -1.57
const LIQ_MAX = -1.02
const carafeR = (y) => {
  for (let i = 1; i < CARAFE.length; i++) {
    if (y <= CARAFE[i][1]) {
      const [r0, y0] = CARAFE[i - 1]
      const [r1, y1] = CARAFE[i]
      return THREE.MathUtils.lerp(r0, r1, (y - y0) / (y1 - y0))
    }
  }
  return CARAFE[CARAFE.length - 1][0]
}

const BED_Y = 0.02
const SPOUT_TIP = new THREE.Vector3(-0.3, 1.43, 0)

const ceramic = new THREE.MeshPhysicalMaterial({ color: '#eee4d6', roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.25 })
const paper = new THREE.MeshStandardMaterial({ color: '#e8dfcf', roughness: 1, side: THREE.DoubleSide })
const glass = new THREE.MeshPhysicalMaterial({
  color: '#ffffff', roughness: 0.03, clearcoat: 1, transparent: true, opacity: 0.2, side: THREE.DoubleSide,
  depthWrite: false, envMapIntensity: 2.2,
})
const matteBlack = new THREE.MeshPhysicalMaterial({ color: '#141110', roughness: 0.5, metalness: 0.4, clearcoat: 0.3 })
const wood = new THREE.MeshStandardMaterial({ color: '#5a3520', roughness: 0.6 })

export function BrewStation({ quality = 1 }) {
  const root = useRef()
  const liquid = useRef()
  const liquidTop = useRef()
  const water = useRef()
  const drip = useRef()
  const bed = useRef()
  const bubbles = useRef()

  const clip = useMemo(() => new THREE.Plane(new THREE.Vector3(0, -1, 0), LIQ_MIN), [])
  const flow = useMemo(() => {
    const t = createFlowTexture()
    t.repeat.set(4, 1)
    return t
  }, [])

  const mats = useMemo(() => ({
    coffee: new THREE.MeshPhysicalMaterial({
      color: '#2a1209', roughness: 0.12, clearcoat: 1, transparent: true, opacity: 0.94, clippingPlanes: [clip],
    }),
    coffeeTop: new THREE.MeshPhysicalMaterial({ color: '#3a1a0b', roughness: 0.08, clearcoat: 1 }),
    water: new THREE.MeshPhysicalMaterial({
      color: '#fff6ea', roughness: 0.02, transparent: true, opacity: 0.75, alphaMap: flow, depthWrite: false,
      emissive: new THREE.Color('#ffe2bf'), emissiveIntensity: 0.25,
    }),
    drip: new THREE.MeshPhysicalMaterial({ color: '#4a220d', roughness: 0.1, transparent: true, opacity: 0.85 }),
    bed: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }),
    bubble: new THREE.MeshPhysicalMaterial({ color: '#b98a5c', roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.8 }),
  }), [clip, flow])

  const geos = useMemo(() => {
    const carafe = new THREE.LatheGeometry(V2(CARAFE), 72)
    const liquid = new THREE.LatheGeometry(V2([[0, LIQ_MIN], ...CARAFE.map(([r, y]) => [r * 0.95, Math.max(y, LIQ_MIN)])]), 64)
    const dripper = new THREE.LatheGeometry(V2([
      [0.1, -0.5], [0.55, -0.5], [0.57, -0.47], [0.55, -0.44], [0.2, -0.43], [0.34, -0.2], [0.52, 0.12],
      [0.7, 0.44], [0.76, 0.52], [0.77, 0.55], [0.73, 0.56], [0.66, 0.48], [0.46, 0.12], [0.26, -0.2], [0.13, -0.38], [0.1, -0.5],
    ]), 96)
    // Pleated paper filter
    const filter = new THREE.LatheGeometry(V2(Array.from({ length: 24 }, (_, i) => {
      const t = i / 23
      return [0.12 + t * 0.62, -0.36 + t * 1.0]
    })), 144)
    const fp = filter.attributes.position
    for (let i = 0; i < fp.count; i++) {
      const x = fp.getX(i), y = fp.getY(i), z = fp.getZ(i)
      const a = Math.atan2(x, z)
      const k = 1 + 0.02 * Math.sin(a * 40) * ((y + 0.36) / 1) + noise3(x * 8, y * 8, z * 8) * 0.012
      fp.setX(i, x * k)
      fp.setZ(i, z * k)
    }
    filter.computeVertexNormals()

    // Coffee bed (dome with granular noise, colour baked into vertices)
    const bed = new THREE.CircleGeometry(0.39, 64, 0, Math.PI * 2)
    bed.rotateX(-Math.PI / 2)
    const bp = bed.attributes.position
    const bc = new Float32Array(bp.count * 3)
    for (let i = 0; i < bp.count; i++) {
      const x = bp.getX(i), z = bp.getZ(i)
      const r = Math.hypot(x, z) / 0.39
      bp.setY(i, (1 - r * r) * 0.05 + noise3(x * 40, 0, z * 40) * 0.006)
      const c = 0.8 + fbm3(x * 25, 1, z * 25, 3) * 0.5
      bc.set([c, c, c], i * 3)
    }
    bed.setAttribute('color', new THREE.BufferAttribute(bc, 3))
    bed.computeVertexNormals()

    // Gooseneck spout
    const spoutCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.5, 0.55, -0.35), new THREE.Vector3(-1.25, 1.3, -0.2),
      new THREE.Vector3(-0.8, 1.72, -0.05), new THREE.Vector3(-0.45, 1.6, 0), SPOUT_TIP.clone(),
    ])
    const spout = new THREE.TubeGeometry(spoutCurve, 64, 0.035, 12, false)
    const kettle = new THREE.LatheGeometry(V2([[0, -0.5], [0.52, -0.5], [0.6, -0.42], [0.62, 0.1], [0.5, 0.38], [0.24, 0.5], [0.08, 0.52], [0.08, 0.6], [0, 0.62]]), 64)

    const streamCurve = new THREE.QuadraticBezierCurve3(SPOUT_TIP.clone(), new THREE.Vector3(-0.12, 1.25, 0), new THREE.Vector3(0, BED_Y + 0.06, 0))
    const stream = new THREE.TubeGeometry(streamCurve, 64, 0.011, 8, false)

    const dripGeo = new THREE.CylinderGeometry(0.006, 0.01, 1, 8, 1, true)
    dripGeo.translate(0, -0.5, 0)

    return { carafe, liquid, dripper, filter, bed, spout, kettle, stream, drip: dripGeo }
  }, [])

  const bubbleSeeds = useMemo(() => {
    const rnd = mulberry32(4)
    return Array.from({ length: 40 }, () => ({ a: rnd() * Math.PI * 2, r: Math.sqrt(rnd()) * 0.33, s: 0.01 + rnd() * 0.022, d: rnd() }))
  }, [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const bedDry = useMemo(() => new THREE.Color('#6a4128'), [])
  const bedWet = useMemo(() => new THREE.Color('#2a150a'), [])
  const segIdx = 8 * 6

  useFrame((state, dt) => {
    const p = progress.value
    const t = state.clock.elapsedTime
    const [a, b] = STATION_WINDOWS.brew
    root.current.visible = p > a && p < b
    if (!root.current.visible) return

    const lb = local(p, 'brew')
    const pourIn = smoothstep(0.14, 0.26, lb)
    const pourOut = smoothstep(0.7, 0.8, lb)
    const wet = smoothstep(0.2, 0.4, lb)
    const extract = smoothstep(0.3, 0.95, lb)

    // Water stream draws in from the spout, then retracts from the top.
    const startSeg = Math.floor(pourOut * 64)
    const endSeg = Math.floor(pourIn * 64)
    water.current.visible = endSeg > startSeg
    water.current.geometry.setDrawRange(startSeg * segIdx, Math.max(0, endSeg - startSeg) * segIdx)
    flow.offset.x -= dt * 1.6

    // Bloom: the bed swells and darkens as it's saturated.
    const bloom = presence(lb, 0.22, 0.75, 0.08)
    bed.current.position.y = BED_Y + wet * 0.04 + bloom * 0.025
    bed.current.scale.set(1 + wet * 0.04, 1 + bloom * 1.2, 1 + wet * 0.04)
    mats.bed.color.copy(bedDry).lerp(bedWet, wet)
    mats.bed.roughness = THREE.MathUtils.lerp(0.95, 0.35, wet)

    bubbleSeeds.forEach((s, i) => {
      const life = (t * 0.25 + s.d) % 1
      const k = bloom * Math.sin(life * Math.PI)
      dummy.position.set(Math.cos(s.a) * s.r, bed.current.position.y + (1 - (s.r / 0.39) ** 2) * 0.05 * bed.current.scale.y + 0.004, Math.sin(s.a) * s.r)
      dummy.scale.setScalar(s.s * k)
      dummy.updateMatrix()
      bubbles.current.setMatrixAt(i, dummy.matrix)
    })
    bubbles.current.instanceMatrix.needsUpdate = true

    // Extraction fills the server.
    const level = THREE.MathUtils.lerp(LIQ_MIN, LIQ_MAX, extract)
    clip.constant = level + STATIONS.brew.y
    liquid.current.visible = extract > 0.001
    liquidTop.current.visible = extract > 0.001
    liquidTop.current.position.y = level
    liquidTop.current.scale.setScalar(carafeR(level) * 0.95)

    const dripOn = presence(lb, 0.32, 0.93, 0.03)
    drip.current.visible = dripOn > 0.01
    drip.current.scale.set(dripOn, -0.44 - level, dripOn)
  })

  return (
    <group ref={root} position={STATIONS.brew}>
      {/* Walnut board */}
      <mesh position={[-0.4, -1.58, 0]} material={wood} receiveShadow castShadow>
        <boxGeometry args={[3.6, 0.04, 1.8]} />
      </mesh>
      <mesh geometry={geos.carafe} material={glass} renderOrder={3} />
      <mesh ref={liquid} geometry={geos.liquid} material={mats.coffee} />
      <mesh ref={liquidTop} material={mats.coffeeTop} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1, 64]} />
      </mesh>
      <mesh geometry={geos.dripper} material={ceramic} castShadow receiveShadow />
      <mesh geometry={geos.filter} material={paper} receiveShadow />
      <mesh ref={bed} geometry={geos.bed} material={mats.bed} position={[0, BED_Y, 0]} receiveShadow />
      <instancedMesh ref={bubbles} args={[undefined, mats.bubble, 40]} frustumCulled={false}>
        <sphereGeometry args={[1, 12, 8]} />
      </instancedMesh>
      <mesh ref={drip} geometry={geos.drip} material={mats.drip} position={[0, -0.44, 0]} />

      {/* Gooseneck kettle */}
      <group>
        <mesh geometry={geos.kettle} material={matteBlack} position={[-1.95, 0.4, -0.45]} castShadow />
        <mesh geometry={geos.spout} material={matteBlack} castShadow />
        <mesh position={[-2.6, 0.45, -0.45]} rotation={[0, 0, Math.PI / 2]} material={wood}>
          <torusGeometry args={[0.32, 0.05, 16, 48, Math.PI]} />
        </mesh>
      </group>
      <mesh ref={water} geometry={geos.stream} material={mats.water} renderOrder={4} />

      <SteamWisps position={[0, 0.2, 0]} width={0.55} height={1.4} count={3}
        intensity={(p) => presence(local(p, 'brew'), 0.25, 1.02, 0.08) * 0.8} />
      <Vapor count={Math.round(24 * quality)} position={[-0.3, 1.45, 0]} area={[0.05, 0.02, 0.05]}
        rise={0.7} spread={0.2} size={0.7} speed={0.15} grow={2.2} color="#efe4d6"
        intensity={(p) => presence(local(p, 'brew'), 0.12, 0.8, 0.05) * 0.25} />
    </group>
  )
}
