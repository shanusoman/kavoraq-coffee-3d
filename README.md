# KAVORAQ Coffee — From Bean to Moment

COFFEE • CRAFT • MOMENT

A scroll-driven 3D coffee story built with React, Three.js / React Three Fiber, GSAP ScrollTrigger and Lenis.

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
npm run preview  # serve the build
```

## Where things live
- `src/data/story.js` — stages, copy and relative weights (the timeline is built from weights, not hardcoded %)
- `src/data/products.js`, `menu.js`, `gallery.js`, `site.js` — all content, prices and currency
- `src/lib/timeline.js` — stage ranges + helpers (`at`, `local`, `presence`)
- `src/scene/choreography.js` — station layout, camera path and hero-bean path keyed to stages
- `src/scene/*Station.jsx` — pod/bean, roaster, grinder, pour-over, cup
- Set `image: '/images/…jpg'` on any product or gallery item to replace the generated artwork with photography.
