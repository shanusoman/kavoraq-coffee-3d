import { EffectComposer, Bloom, Noise, Vignette, ToneMapping } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'

export function Effects({ quality }) {
  return (
    <EffectComposer multisampling={quality > 0.7 ? 4 : 0}>
      <Bloom mipmapBlur intensity={0.6} luminanceThreshold={0.82} luminanceSmoothing={0.25} radius={0.7} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.22} darkness={0.78} />
      <Noise opacity={0.045} premultiply blendFunction={BlendFunction.SOFT_LIGHT} />
    </EffectComposer>
  )
}
