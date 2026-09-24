import { useEffect, useState } from 'react'
import { CHAPTERS, stageAt } from '../lib/timeline'
import { progress } from '../lib/progress'
import { scrollTo } from '../lib/smoothScroll'
import { stageScrollY } from '../lib/scrollToStage'

export default function StageRail() {
  const [active, setActive] = useState(null)
  useEffect(
    () =>
      progress.subscribe((p) => {
        const s = stageAt(p)
        const id = s.chapter ? s.id : null
        setActive((prev) => (prev === id ? prev : id))
      }),
    [],
  )
  return (
    <nav className="rail" aria-label="Journey chapters">
      {CHAPTERS.map((s) => (
        <button
          key={s.id}
          className={`rail__item${active === s.id ? ' is-active' : ''}`}
          onClick={() => scrollTo(stageScrollY(s.id))}
          aria-current={active === s.id ? 'step' : undefined}
        >
          <span className="rail__label">{s.chapter.label}</span>
          <span className="rail__index">{s.chapter.index}</span>
        </button>
      ))}
    </nav>
  )
}
