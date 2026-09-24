import { useLayoutEffect, useRef } from 'react'
import { PRODUCTS } from '../data/products'
import { formatPrice } from '../data/site'
import { gsap } from '../lib/smoothScroll'
import PackArt from './PackArt'

export default function Collection() {
  const root = useRef()

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.collection__head > *', {
        y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08,
        scrollTrigger: { trigger: '.collection__head', start: 'top 80%' },
      })
      gsap.utils.toArray('.product').forEach((el, i) => {
        gsap.from(el, {
          y: 80, opacity: 0, duration: 1.3, ease: 'expo.out', delay: (i % 3) * 0.08,
          scrollTrigger: { trigger: el, start: 'top 88%' },
        })
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section id="collection" className="collection section" ref={root}>
      <div className="collection__head">
        <p className="eyebrow">The Collection</p>
        <h2 className="display">Roasted this week.<br /><em>Poured for years.</em></h2>
        <p className="lede">Five coffees, each profiled in small batches and shipped within 48 hours of roasting.</p>
      </div>
      <div className="collection__grid">
        {PRODUCTS.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </section>
  )
}

function ProductCard({ product, index }) {
  const ref = useRef()
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3))
    ref.current.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3))
  }
  const onLeave = () => {
    ref.current.style.setProperty('--mx', 0)
    ref.current.style.setProperty('--my', 0)
  }
  return (
    <article ref={ref} className={`product${product.featured ? ' product--featured' : ''}`} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div className="product__media" style={{ '--tint': product.palette.label }}>
        <span className="product__num">{String(index + 1).padStart(2, '0')}</span>
        {product.image ? <img src={product.image} alt={product.name} loading="lazy" /> : <PackArt product={product} />}
      </div>
      <div className="product__info">
        <div className="product__row">
          <h3>{product.name}</h3>
          <span className="product__price">{formatPrice(product.price)}</span>
        </div>
        <p className="product__tag">{product.tagline}</p>
        <p className="product__desc">{product.description}</p>
        <div className="product__row product__row--foot">
          <span className="product__meta">{product.roast} · {product.weight}</span>
          <a href="#collection" className="link-arrow" aria-label={`Shop ${product.name}`}>
            Shop now
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </a>
        </div>
      </div>
    </article>
  )
}
