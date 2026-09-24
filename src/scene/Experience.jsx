import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerformanceMonitor, Preload } from '@react-three/drei'
import { CameraRig, Lights, Floor } from './Rig'
import { Effects } from './Effects'
import { Pod, HeroBean, OriginContours } from './PodStation'
import { RoastStation } from './RoastStation'
import { GrindStation } from './GrindStation'
import { BrewStation } from './BrewStation'
import { CupStation } from './CupStation'
import { Dust, LightShaft } from './fx'
import { STATIONS } from './choreography'
import { presence } from '../lib/timeline'
import { STATION_WINDOWS } from './choreography'

function ReadySignal({ onReady }) {
  const frames = useRef(0)
  useFrame(() => {
    frames.current++
    if (frames.current === 4) onReady?.()
  })
  return null
}

const shaftFor = (id) => (p) => presence(p, STATION_WINDOWS[id][0], STATION_WINDOWS[id][1], 0.03)

export default function Experience({ active = true, quality = 1, onReady }) {
  const [dpr, setDpr] = useState(quality > 0.7 ? 1.75 : 1.25)
  return (
    <Canvas
      shadows="percentage"
      dpr={dpr}
      frameloop={active ? 'always' : 'never'}
      camera={{ fov: 35, near: 0.1, far: 60, position: [0, 0.15, 8.8] }}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true
      }}
    >
      <color attach="background" args={['#0b0705']} />
      <fog attach="fog" args={['#0b0705', 7, 21]} />
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(quality > 0.7 ? 1.75 : 1.25)} />
      <Suspense fallback={null}>
        <CameraRig />
        <Lights quality={quality} />
        <Floor />
        <Dust count={Math.round(1400 * quality)} />

        <Pod />
        <HeroBean />
        <OriginContours />
        <RoastStation quality={quality} />
        <GrindStation quality={quality} />
        <BrewStation quality={quality} />
        <CupStation quality={quality} />

        {Object.entries(STATIONS).map(([id, s]) => (
          <LightShaft key={id} position={[s.x - 1.5, s.y + 6.5, s.z - 1.5]} rotation={[0.18, 0, -0.22]}
            radius={2.4} length={10} opacity={id === 'pod' ? 0.16 : 0.1} intensity={shaftFor(id)} />
        ))}

        <Effects quality={quality} />
        <Preload all />
        <ReadySignal onReady={onReady} />
      </Suspense>
    </Canvas>
  )
}
