import { useEffect, useState } from 'react'
import { SITE } from '../data/site'
import { scrollTo } from '../lib/smoothScroll'

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    const story = document.getElementById('story')
    const onScroll = () => {
      const end = story ? story.offsetTop + story.offsetHeight - window.innerHeight : 0
      setSolid(window.scrollY > end)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const go = (e, href) => {
    e.preventDefault()
    setOpen(false)
    scrollTo(href === '#story' ? 0 : href)
  }

  return (
    <header className={`nav${solid ? ' nav--solid' : ''}${open ? ' nav--open' : ''}`}>
      <a href="#story" className="nav__brand" onClick={(e) => go(e, '#story')} aria-label={`${SITE.brand} home`}>
        <span className="nav__mark">{SITE.brand}</span>
        <span className="nav__desc">{SITE.tagline}</span>
      </a>
      <nav className="nav__links" aria-label="Primary">
        {SITE.nav.map((l) => (
          <a key={l.href} href={l.href} onClick={(e) => go(e, l.href)}>{l.label}</a>
        ))}
      </nav>
      <a href="#collection" className="nav__shop" onClick={(e) => go(e, '#collection')}>Shop</a>
      <button className="nav__toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Menu">
        <span /><span />
      </button>
    </header>
  )
}
