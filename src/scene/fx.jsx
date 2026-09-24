import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { progress } from '../lib/progress'
import { mulberry32, GLSL_NOISE } from './noise'

/* ------------------------------------------------------------------ */
/* Vapor: rising soft particles — smoke, steam, sparks.                */
/* ------------------------------------------------------------------ */
const vaporVert = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime, uRise, uSpread, uSize, uSpeed, uPixelRatio, uGrow;
  varying float vAlpha;
  varying float vSeed;
  void main(){
    float life = fract(uTime * uSpeed * (0.7 + aSeed.y * 0.6) + aSeed.x);
    vec3 p = position;
    p.y += life * uRise;
    float sw = life * uSpread;
    p.x += sin(life * 3.2 + aSeed.z * 6.283) * sw + (aSeed.w - 0.5) * sw;
    p.z += cos(life * 2.7 + aSeed.w * 6.283) * sw * 0.7;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * mix(0.5, uGrow, life) * uPixelRatio * (140.0 / -mv.z);
    vAlpha = smoothstep(0.0, 0.18, life) * (1.0 - smoothstep(0.45, 1.0, life));
    vSeed = aSeed.y;
  }
`
const vaporFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vSeed;
  void main(){
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    gl_FragColor = vec4(uColor * (0.85 + vSeed * 0.3), a * vAlpha * uOpacity);
  }
`

export function Vapor({
  count = 60, position = [0, 0, 0], area = [0.3, 0, 0.3], rise = 1.6, spread = 0.35,
  size = 1, speed = 0.12, grow = 2.6, color = '#d8cbb8', additive = false, intensity,
}) {
  const ref = useRef()
  const { geometry, material } = useMemo(() => {
    const rnd = mulberry32(count * 31 + Math.round(rise * 100))
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count * 4)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rnd() - 0.5) * area[0]
      pos[i * 3 + 1] = (rnd() - 0.5) * area[1]
      pos[i * 3 + 2] = (rnd() - 0.5) * area[2]
      seed.set([rnd(), rnd(), rnd(), rnd()], i * 4)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4))
    const m = new THREE.ShaderMaterial({
      vertexShader: vaporVert,
      fragmentShader: vaporFrag,
      transparent: true,
      depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 }, uRise: { value: rise }, uSpread: { value: spread },
        uSize: { value: size }, uSpeed: { value: speed }, uGrow: { value: grow },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uColor: { value: new THREE.Color(color) }, uOpacity: { value: 0 },
      },
    })
    return { geometry: g, material: m }
  }, [count, area[0], area[1], area[2], rise, spread, size, speed, grow, color, additive])

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
    const k = intensity ? intensity(progress.value, state.clock.elapsedTime) : 1
    material.uniforms.uOpacity.value = k
    ref.current.visible = k > 0.002
  })

  return <points ref={ref} position={position} geometry={geometry} material={material} frustumCulled={false} />
}

/* ------------------------------------------------------------------ */
/* Steam wisps: soft, curling ribbons that billboard toward the camera.*/
/* ------------------------------------------------------------------ */
const wispFrag = /* glsl */ `
  ${GLSL_NOISE}
  uniform float uTime, uOpacity, uSeed;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main(){
    float t = uTime * 0.22 + uSeed * 10.0;
    vec2 uv = vUv;
    float bend = sin(uv.y * 5.0 - t * 2.6 + uSeed * 6.0) * 0.1 * uv.y
               + (fbm(vec2(uv.y * 2.4 - t * 1.4, uSeed * 3.0)) - 0.5) * 0.35 * uv.y;
    float x = uv.x - 0.5 - bend;
    float width = mix(0.035, 0.2, uv.y);
    float a = smoothstep(width, 0.0, abs(x));
    a *= smoothstep(0.0, 0.12, uv.y) * (1.0 - smoothstep(0.45, 1.0, uv.y));
    a *= 0.35 + 0.65 * fbm(vec2(uv.x * 5.0, uv.y * 7.0 - t * 3.2));
    gl_FragColor = vec4(uColor, a * uOpacity);
  }
`
const wispVert = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`

export function SteamWisps({ position = [0, 0, 0], width = 0.7, height = 1.8, count = 3, color = '#f4e9dc', intensity }) {
  const group = useRef()
  const mats = useMemo(
    () =>
      Array.from({ length: count }, (_, i) =>
        new THREE.ShaderMaterial({
          vertexShader: wispVert,
          fragmentShader: wispFrag,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          uniforms: {
            uTime: { value: 0 }, uOpacity: { value: 0 }, uSeed: { value: i * 1.37 + 0.3 },
            uColor: { value: new THREE.Color(color) },
          },
        }),
      ),
    [count, color],
  )
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, height, 1, 1)
    g.translate(0, height / 2, 0)
    return g
  }, [width, height])

  useFrame((state) => {
    const k = intensity ? intensity(progress.value) : 1
    group.current.visible = k > 0.002
    if (!group.current.visible) return
    const cam = state.camera.position
    group.current.children.forEach((m, i) => {
      m.lookAt(cam.x, m.getWorldPosition(tmp).y, cam.z)
      mats[i].uniforms.uTime.value = state.clock.elapsedTime
      mats[i].uniforms.uOpacity.value = k * (0.55 - i * 0.1)
    })
  })

  return (
    <group ref={group} position={position}>
      {mats.map((m, i) => (
        <mesh key={i} geometry={geo} material={m} position={[(i - (count - 1) / 2) * width * 0.22, 0, i * 0.02]} renderOrder={5} />
      ))}
    </group>
  )
}
const tmp = new THREE.Vector3()

/* ------------------------------------------------------------------ */
/* Volumetric light shaft (additive cone with soft edges).             */
/* ------------------------------------------------------------------ */
export function LightShaft({ position, rotation = [0, 0, 0], radius = 2.2, length = 9, color = '#ffcf94', opacity = 0.12, intensity }) {
  const ref = useRef()
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity } },
        vertexShader: /* glsl */ `
          varying vec2 vUv; varying vec3 vN; varying vec3 vV;
          void main(){
            vUv = uv;
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vN = normalize(mat3(modelMatrix) * normal);
            vV = normalize(cameraPosition - wp.xyz);
            gl_Position = projectionMatrix * viewMatrix * wp;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; uniform float uOpacity;
          varying vec2 vUv; varying vec3 vN; varying vec3 vV;
          void main(){
            float edge = pow(abs(dot(normalize(vN), normalize(vV))), 2.2);
            float fall = pow(vUv.y, 1.6);
            gl_FragColor = vec4(uColor, edge * fall * uOpacity);
          }`,
      }),
    [color, opacity],
  )
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.05, radius, length, 48, 1, true)
    g.translate(0, -length / 2, 0)
    return g
  }, [radius, length])
  useFrame(() => {
    if (!intensity) return
    const k = intensity(progress.value)
    material.uniforms.uOpacity.value = opacity * k
    ref.current.visible = k > 0.002
  })
  return <mesh ref={ref} geometry={geo} material={material} position={position} rotation={rotation} renderOrder={4} />
}

/* ------------------------------------------------------------------ */
/* Dust: warm motes floating along the whole journey.                  */
/* ------------------------------------------------------------------ */
export function Dust({ count = 1400 }) {
  const { geometry, material } = useMemo(() => {
    const rnd = mulberry32(99)
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = -6 + rnd() * 70
      pos[i * 3 + 1] = -1.5 + rnd() * 5.5
      pos[i * 3 + 2] = -4 + rnd() * 9
      seed[i] = rnd()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) } },
      vertexShader: /* glsl */ `
        attribute float aSeed; uniform float uTime, uPixelRatio; varying float vA;
        void main(){
          vec3 p = position;
          float t = uTime * (0.05 + aSeed * 0.08);
          p.x += sin(t * 2.0 + aSeed * 40.0) * 0.35;
          p.y += sin(t * 1.3 + aSeed * 17.0) * 0.45 + t * 0.1;
          p.y = mod(p.y + 1.5, 5.5) - 1.5;
          p.z += cos(t * 1.7 + aSeed * 23.0) * 0.3;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (1.0 + aSeed * 2.2) * uPixelRatio * (6.0 / -mv.z);
          float tw = 0.5 + 0.5 * sin(uTime * (0.6 + aSeed) + aSeed * 50.0);
          vA = tw * smoothstep(0.3, 2.5, -mv.z) * (1.0 - smoothstep(6.0, 14.0, -mv.z));
        }`,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          gl_FragColor = vec4(vec3(1.0, 0.78, 0.52), smoothstep(0.5, 0.0, d) * vA * 0.55);
        }`,
    })
    return { geometry: g, material: m }
  }, [count])
  useFrame((s) => (material.uniforms.uTime.value = s.clock.elapsedTime))
  return <points geometry={geometry} material={material} frustumCulled={false} />
}

/* ------------------------------------------------------------------ */
/* Flame: a single flickering burner flame (additive billboard).        */
/* ------------------------------------------------------------------ */
export const flameMaterial = () =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uIntensity: { value: 0 }, uSeed: { value: 0 } },
    vertexShader: wispVert,
    fragmentShader: /* glsl */ `
      ${GLSL_NOISE}
      uniform float uTime, uIntensity, uSeed; varying vec2 vUv;
      void main(){
        vec2 uv = vUv;
        float n = fbm(vec2(uv.x * 3.0 + uSeed, uv.y * 4.0 - uTime * 3.5));
        float w = (1.0 - uv.y) * 0.42 * (0.7 + n * 0.6);
        float a = smoothstep(w, w * 0.2, abs(uv.x - 0.5 + (n - 0.5) * 0.15 * uv.y));
        a *= smoothstep(0.0, 0.08, uv.y) * (1.0 - smoothstep(0.35, 1.0, uv.y));
        vec3 blue = vec3(0.25, 0.45, 1.0);
        vec3 orange = vec3(1.0, 0.45, 0.1);
        vec3 col = mix(blue, orange, smoothstep(0.05, 0.35, uv.y));
        gl_FragColor = vec4(col * 2.2, a * uIntensity);
      }`,
  })
