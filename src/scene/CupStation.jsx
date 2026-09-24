import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { progress } from '../lib/progress'
import { local, smoothstep, presence } from '../lib/timeline'
import { STATIONS, STATION_WINDOWS, FLOOR_Y } from './choreography'
import { createBeanGeometry, createBeanMaterial } from './beanGeometry'
import { createCremaTexture, createFlowTexture } from './textures'
import { mulberry32 } from './noise'
import { SteamWisps } from './fx'

const V2 = (pts) => pts.map(([x, y]) => new THREE.Vector2(x, y))

const CUP_INNER = [[0.0, -1.44], [0.3, -1.42], [0.46, -1.32], [0.55, -1.15], [0.6, -0.95], [0.62, -0.76], [0.63, -0.68]]
const CUP = [
  [0.0, -1.54], [0.3, -1.54], [0.35, -1.51], [0.37, -1.48], [0.44, -1.42], [0.53, -1.28], [0.6, -1.1],
  [0.645, -0.9], [0.662, -0.74], [0.665, -0.69], [0.656, -0.665], [0.638, -0.672],
  ...CUP_INNER.slice().reverse().slice(1),
]
const SAUCER = [
  [0.0, -1.6], [0.48, -1.6], [0.54, -1.585], [0.56, -1.575], [0.9, -1.535], [1.03, -1.49], [1.05, -1.475],
  [1.03, -1.468], [0.88, -1.515], [0.5, -1.556], [0.0, -1.556],
]
const LEVEL_MIN = -1.43
const LEVEL_MAX = -0.77
const innerR = (y) => {
  for (let i = 1; i < CUP_INNER.length; i++) {
    if (y <= CUP_INNER[i][1]) {
      const [r0, y0] = CUP_INNER[i - 1]
      const [r1, y1] = CUP_INNER[i]
      return THREE.MathUtils.lerp(r0, r1, (y - y0) / (y1 - y0))
    }
  }
  return CUP_INNER[CUP_INNER.length - 1][0]
}

const porcelain = new THREE.MeshPhysicalMaterial({
  color: '#f2ebe0', roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.12, sheen: 0.2, sheenColor: new THREE.Color('#fff4e6'),
})
const COFFEE_DARK = new THREE.Color('#3a1c0c')
const goldRim = new THREE.MeshPhysicalMaterial({ color: '#c89a5c', metalness: 1, roughness: 0.2 })

export function CupStation({ quality = 1 }) {
  const root = useRef()
  const surface = useRef()
  const stream = useRef()
  const cupGroup = useRef()
  const scattered = useRef()

  const crema = useMemo(() => {
    const t = createCremaTexture()
    t.center.set(0.5, 0.5)
    return t
  }, [])
  const flow = useMemo(() => {
    const t = createFlowTexture()
    t.repeat.set(1, 1)
    t.rotation = Math.PI / 2
    t.center.set(0.5, 0.5)
    return t
  }, [])

  const mats = useMemo(() => ({
    surface: new THREE.MeshPhysicalMaterial({ map: crema, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 }),
    stream: new THREE.MeshPhysicalMaterial({
      color: '#4b220c', roughness: 0.08, clearcoat: 1, transparent: true, opacity: 0.95, alphaMap: flow,
    }),
    bean: createBeanMaterial(1),
  }), [crema, flow])

  const geos = useMemo(() => {
    const handleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.63, -0.82, 0), new THREE.Vector3(0.9, -0.8, 0), new THREE.Vector3(0.98, -0.98, 0),
      new THREE.Vector3(0.86, -1.2, 0), new THREE.Vector3(0.56, -1.26, 0),
    ])
    const s = new THREE.CylinderGeometry(0.03, 0.03, 1, 16, 1, true)
    s.translate(0, 0.5, 0)
    return {
      cup: new THREE.LatheGeometry(V2(CUP), 128),
      saucer: new THREE.LatheGeometry(V2(SAUCER), 128),
      handle: new THREE.TubeGeometry(handleCurve, 48, 0.045, 16, false),
      rim: new THREE.TorusGeometry(0.66, 0.006, 8, 160),
      surface: new THREE.CircleGeometry(1, 96),
      stream: s,
      bean: createBeanGeometry(0.5),
    }
  }, [])

  const beanCount = Math.round(16 * Math.max(quality, 0.6))
  const beanLayout = useMemo(() => {
    const rnd = mulberry32(17)
    return Array.from({ length: beanCount }, (_, i) => {
      const a = rnd() * Math.PI * 2
      const r = 1.35 + rnd() * 1.4
      return { x: Math.cos(a) * r, z: Math.sin(a) * r - 0.3, ry: rnd() * 6, flip: rnd() > 0.35 }
    })
  }, [beanCount])

  useFrame((state, dt) => {
    const p = progress.value
    const t = state.clock.elapsedTime
    const [a, b] = STATION_WINDOWS.cup
    root.current.visible = p > a && p < b
    if (!root.current.visible) return

    const lc = local(p, 'cup')
    const fill = smoothstep(0.04, 0.36, lc)
    const pourOn = presence(lc, 0.02, 0.36, 0.03)
    const level = THREE.MathUtils.lerp(LEVEL_MIN, LEVEL_MAX, fill)

    surface.current.visible = fill > 0.001
    surface.current.position.y = level
    surface.current.scale.setScalar(innerR(level) * 0.995)
    crema.rotation = t * 0.015 + fill * 1.5
    // Crema blooms from dark coffee into caramel silk as the cup fills.
    mats.surface.color.setRGB(1, 1, 1).lerp(COFFEE_DARK, 1 - smoothstep(0.35, 1, fill))

    stream.current.visible = pourOn > 0.01
    const top = 3.2
    stream.current.position.y = level
    stream.current.scale.set(pourOn, top - level, pourOn)
    flow.offset.x -= dt * 2

    // Final hero: a slow, reverent turn.
    cupGroup.current.rotation.y = -0.6 + smoothstep(0.3, 1, lc) * 0.5 + Math.sin(t * 0.2) * 0.03
  })

  return (
    <group ref={root} position={STATIONS.cup}>
      <group ref={cupGroup}>
        <mesh geometry={geos.saucer} material={porcelain} castShadow receiveShadow />
        <mesh geometry={geos.cup} material={porcelain} castShadow receiveShadow />
        <mesh geometry={geos.handle} material={porcelain} castShadow />
        <mesh geometry={geos.rim} material={goldRim} position={[0, -0.668, 0]} rotation={[Math.PI / 2, 0, 0]} />
        <mesh ref={surface} geometry={geos.surface} material={mats.surface} rotation={[-Math.PI / 2, 0, 0]} />
      </group>
      <mesh ref={stream} geometry={geos.stream} material={mats.stream} />
      <instancedMesh
        ref={(m) => {
          if (!m || scattered.current) return
          scattered.current = m
          const d = new THREE.Object3D()
          beanLayout.forEach((bn, i) => {
            d.position.set(bn.x, FLOOR_Y + 0.055, bn.z)
            d.rotation.set(bn.flip ? -Math.PI / 2 : Math.PI / 2, 0, bn.ry)
            d.scale.setScalar(0.12)
            d.updateMatrix()
            m.setMatrixAt(i, d.matrix)
          })
          m.instanceMatrix.needsUpdate = true
        }}
        args={[geos.bean, mats.bean, beanCount]}
        castShadow
        receiveShadow
      />
      <SteamWisps position={[0, -0.78, 0]} width={0.8} height={2.2} count={3}
        intensity={(p) => smoothstep(0.25, 0.6, local(p, 'cup'))} />
    </group>
  )
}
