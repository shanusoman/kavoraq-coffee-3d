import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { fbm3, noise3 } from './noise'

/**
 * Procedural coffee bean: an ellipsoid with a flattened face and an S-shaped
 * centre crease, with baked mottling + crease occlusion in vertex colours.
 * The material colour (roast level) multiplies these vertex colours.
 */
export function createBeanGeometry(detail = 1) {
  const w = Math.round(72 * detail)
  const h = Math.round(56 * detail)
  let geo = new THREE.SphereGeometry(1, w, h)
  geo.deleteAttribute('uv')
  geo.deleteAttribute('normal')
  geo = mergeVertices(geo)

  const pos = geo.attributes.position
  const colors = new Float32Array(pos.count * 3)
  const v = new THREE.Vector3()

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const { x, y, z } = v
    // Ellipsoid proportions: long axis Y, thin axis Z.
    let px = x * 0.66
    let py = y * 1.0
    let pz = z * 0.5

    // Flatten the face (front, +Z) side.
    const front = THREE.MathUtils.smoothstep(z, -0.1, 0.35)
    pz *= THREE.MathUtils.lerp(1, 0.52, front)

    // S-curved crease running along the face.
    const along = 1 - Math.min(1, Math.abs(y))
    const sCurve = 0.1 * Math.sin(y * 2.6) * along
    const dx = px - sCurve
    const creaseW = 0.07 + 0.05 * along
    const crease = Math.exp(-(dx * dx) / (creaseW * creaseW)) * Math.sqrt(Math.max(0, 1 - y * y))
    pz -= crease * 0.16 * front
    // Lips either side of the crease bulge slightly.
    const lip = Math.exp(-((Math.abs(dx) - creaseW * 1.6) ** 2) / (creaseW * creaseW * 0.8))
    pz += lip * 0.018 * front * along

    // Organic asymmetry and fine surface irregularity.
    const n = fbm3(x * 2.2, y * 2.2, z * 2.2, 3)
    const s = 1 + n * 0.045 + noise3(x * 9, y * 9, z * 9) * 0.006
    px *= s; py *= s; pz *= s
    px += 0.04 * y * y // slight kidney curve

    pos.setXYZ(i, px, py, pz)

    // Colour: mottling, darker crease interior, lighter lips.
    const mott = 0.9 + fbm3(x * 5, y * 5, z * 5, 4) * 0.35
    const shade = mott * (1 - crease * front * 0.62) * (1 + lip * front * 0.05)
    colors[i * 3] = shade
    colors[i * 3 + 1] = shade * (0.98 + noise3(x * 7, y * 7, 1) * 0.04)
    colors[i * 3 + 2] = shade * 0.97
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  return geo
}

/** Roast colour ramp: green → yellow → cinnamon → medium → dark. */
const RAMP = [
  [0.0, new THREE.Color('#8e9c6a')],
  [0.2, new THREE.Color('#b8a26a')],
  [0.42, new THREE.Color('#a3642f')],
  [0.68, new THREE.Color('#5c321a')],
  [1.0, new THREE.Color('#2e1a0f')],
]
export function roastColor(t, target = new THREE.Color()) {
  for (let i = 1; i < RAMP.length; i++) {
    if (t <= RAMP[i][0]) {
      const [a, ca] = RAMP[i - 1]
      const [b, cb] = RAMP[i]
      return target.copy(ca).lerp(cb, (t - a) / (b - a))
    }
  }
  return target.copy(RAMP[RAMP.length - 1][1])
}

export function createBeanMaterial(roast = 0) {
  const mat = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.7,
    metalness: 0,
    clearcoat: 0,
    clearcoatRoughness: 0.35,
    sheen: 0.4,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color('#d9c7a0'),
    emissive: new THREE.Color('#ff5a14'),
    emissiveIntensity: 0,
  })
  applyRoast(mat, roast)
  return mat
}

/** Roasting is more than a colour change: gloss, oils, sheen and glow all shift. */
export function applyRoast(mat, t, heat = 0) {
  roastColor(t, mat.color)
  mat.roughness = THREE.MathUtils.lerp(0.72, 0.34, t)
  mat.clearcoat = THREE.MathUtils.smoothstep(t, 0.55, 1) * 0.55
  mat.sheen = THREE.MathUtils.lerp(0.45, 0.08, t)
  mat.emissiveIntensity = heat
}
