import { useEffect } from 'react'
import { progress } from './progress'
import { presence } from './timeline'

/**
 * Binds overlay elements to the story progress without React re-renders.
 * Each element with `data-from` / `data-to` gets a `--v` custom property
 * (0 → hidden, 1 → fully presented); CSS turns that into motion.
 */
export function useProgressStyles(rootRef) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const els = [...root.querySelectorAll('[data-from]')].map((el) => ({
      el,
      from: parseFloat(el.dataset.from),
      to: parseFloat(el.dataset.to),
      fade: parseFloat(el.dataset.fade ?? 0.018),
      last: -1,
    }))
    return progress.subscribe((p) => {
      for (const item of els) {
        const v = presence(p, item.from, item.to, item.fade)
        const q = Math.round(v * 1000) / 1000
        if (q === item.last) continue
        item.last = q
        item.el.style.setProperty('--v', q)
        item.el.style.visibility = q < 0.002 ? 'hidden' : 'visible'
        item.el.classList.toggle('is-live', q > 0.6)
      }
    })
  }, [rootRef])
}
