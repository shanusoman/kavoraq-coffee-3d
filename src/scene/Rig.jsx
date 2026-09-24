import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { progress, pointer } from '../lib/progress'
import { at, smoothstep } from '../lib/timeline'
import { cameraPath, FLOOR_Y } from './choreography'
import { createSurfaceTexture } from './textures'

const _pos = new THREE.Vector3()
const _tgt = new THREE.Vector3()
const _sub = new THREE.Vector3()

/** Camera follows the choreographed spline; pointer adds a gentle parallax. */
export function CameraRig() {
  const { camera, size } = useThree()
  const lookTarget = useRef(new THREE.Vector3())

  useFrame(() => {
    const p = progress.value
    cameraPath.getPosition(p, _pos)
    cameraPath.getTarget(p, _tgt)

    // Narrow / portrait screens: pull the camera back to keep compositions framed.
    const aspect = size.width / size.height
    if (aspect < 1) {
      // Portrait: centre the subject horizontally and lift it above the text panel.
      cameraPath.getSubject(p, _sub)
      const k = Math.min(1, (1 - aspect) * 2)
      _pos.x += (_sub.x - _tgt.x) * k
      _tgt.lerp(_sub, k)
      _tgt.y -= 0.55 * k
    }
    const back = aspect < 1.2 ? 1 + (1.2 - aspect) * 0.75 : 1
    _pos.sub(_tgt).multiplyScalar(back).add(_tgt)

    _pos.x += pointer.sx * 0.22
    _pos.y += pointer.sy * 0.14
    camera.position.copy(_pos)
    lookTarget.current.copy(_tgt)
    camera.lookAt(lookTarget.current)
  })
  return null
}

/** Lights that travel with the camera target so every station is lit like a set. */
export function Lights({ quality }) {
  const key = useRef()
  const rim = useRef()
  const hemi = useRef()
  const target = useMemo(() => new THREE.Object3D(), [])

  useFrame(() => {
    const p = progress.value
    cameraPath.getTarget(p, _tgt)
    target.position.copy(_tgt)
    target.updateMatrixWorld()
    key.current.position.set(_tgt.x - 3.5, _tgt.y + 6.5, _tgt.z + 4)
    rim.current.position.set(_tgt.x + 3.5, _tgt.y + 3, _tgt.z - 4.5)

    // Hero starts moody; the set "lights up" as the journey begins.
    const wake = smoothstep(0, at('emerge', 1), p)
    key.current.intensity = 0.7 + wake * 1.6
    rim.current.intensity = 60 + wake * 30
    hemi.current.intensity = 0.25 + wake * 0.25
  })

  const shadowSize = quality > 0.7 ? 2048 : 1024
  return (
    <>
      <primitive object={target} />
      <hemisphereLight ref={hemi} args={['#ffe6cc', '#1a0f08', 0.3]} />
      <directionalLight
        ref={key}
        color="#ffe0bd"
        castShadow
        target={target}
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
      />
      <spotLight ref={rim} target={target} color="#ffb06a" angle={0.6} penumbra={1} distance={14} decay={2} />
      <Environment resolution={256} frames={1} environmentIntensity={0.55}>
        <Lightformer form="rect" intensity={3} color="#ffe2c4" position={[0, 5, -1]} scale={[10, 3, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={2.2} color="#ffb070" position={[-5, 1, 1]} scale={[3, 6, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.2} color="#fff5ea" position={[5, 1.5, -1]} scale={[2, 6, 1]} rotation-y={-Math.PI / 2} />
        <Lightformer form="ring" intensity={1.6} color="#ffcf99" position={[0, 1, 6]} scale={3} />
      </Environment>
    </>
  )
}

export function Floor() {
  const mat = useMemo(() => {
    const rough = createSurfaceTexture()
    return new THREE.MeshStandardMaterial({ color: '#1b120d', roughness: 0.62, roughnessMap: rough, metalness: 0.05 })
  }, [])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[25, FLOOR_Y, 0]} material={mat} receiveShadow>
      <planeGeometry args={[110, 24]} />
    </mesh>
  )
}
