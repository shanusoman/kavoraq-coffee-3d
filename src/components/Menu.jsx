import { useLayoutEffect, useRef } from 'react'
import { MENU } from '../data/menu'
import { formatPrice } from '../data/site'
import { gsap } from '../lib/smoothScroll'

export default function Menu() {
  const root = useRef()
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.menu__head > *', {
        y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08,
        scrollTrigger: { trigger: '.menu__head', start: 'top 80%' },
      })
      gsap.utils.toArray('.menu__group').forEach((grp) => {
        gsap.from(grp.querySelectorAll('.menu__item, h3'), {
          y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.06,
          scrollTrigger: { trigger: grp, start: 'top 80%' },
        })
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section id="menu" className="menu section" ref={root}>
      <div className="menu__head">
        <p className="eyebrow">The Café</p>
        <h2 className="display">A short menu,<br /><em>made carefully.</em></h2>
      </div>
      <div className="menu__cols">
        {MENU.map((group) => (
          <div className="menu__group" key={group.category}>
            <h3>{group.category}</h3>
            <ul>
              {group.items.map((item) => (
                <li className={`menu__item${item.highlight ? ' is-highlight' : ''}`} key={item.name}>
                  <div className="menu__line">
                    <span className="menu__name">{item.name}</span>
                    <span className="menu__dots" aria-hidden="true" />
                    <span className="menu__price">{formatPrice(item.price)}</span>
                  </div>
                  <p className="menu__note">{item.note}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
