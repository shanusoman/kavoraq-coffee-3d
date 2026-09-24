import { progress } from './progress'
import { STAGE } from './timeline'

/** Absolute scroll position of a moment inside a story stage. */
export const stageScrollY = (id, t = 0.45) => {
  const st = progress.trigger
  if (!st) return 0
  const s = STAGE[id]
  return st.start + (st.end - st.start) * (s.start + (s.end - s.start) * t)
}
