/**
 * The master story definition.
 *
 * Every stage declares a relative `weight` (how much scroll it occupies)
 * instead of a hard-coded percentage. `lib/timeline.js` normalises these
 * into [start, end] ranges, so stages can be added, removed or re-weighted
 * without touching any animation code.
 *
 * `chapter` stages get a numbered overlay panel and appear in the stage rail.
 */
export const STAGES = [
  { id: 'intro', weight: 0.9 },
  { id: 'open', weight: 1.1 },
  { id: 'emerge', weight: 0.8 },
  {
    id: 'origin',
    weight: 1.6,
    chapter: {
      index: '01',
      label: 'Origin',
      title: 'Born from exceptional coffee-growing regions.',
      body: 'Hand-picked at peak ripeness on shaded volcanic slopes, where cool nights slow the cherry and concentrate its sweetness.',
      facts: [
        { k: 'Region', v: 'Chikmagalur, India' },
        { k: 'Altitude', v: '1,450 – 1,700 m' },
        { k: 'Varietal', v: 'SL-795 · Catuai' },
        { k: 'Notes', v: 'Cacao, jaggery, orange zest' },
      ],
      align: 'left',
    },
  },
  {
    id: 'roast',
    weight: 1.9,
    chapter: {
      index: '02',
      label: 'Roast',
      title: 'Heat transforms character.',
      body: 'Small-batch drum roasting, profiled by hand. Sugars caramelise, the bean swells and first crack arrives — the moment flavour is decided.',
      facts: [
        { k: 'Charge', v: '205 °C' },
        { k: 'First crack', v: '8 min 40 s' },
        { k: 'Development', v: '18 %' },
      ],
      align: 'right',
    },
  },
  {
    id: 'grind',
    weight: 1.8,
    chapter: {
      index: '03',
      label: 'Grind',
      title: 'Precision creates balance.',
      body: 'Conical steel burrs turned slowly to keep the grounds cool and uniform — every particle extracting at the same pace.',
      facts: [
        { k: 'Burr', v: '71 mm conical' },
        { k: 'Particle', v: '600 – 800 µm' },
      ],
      align: 'left',
    },
  },
  {
    id: 'brew',
    weight: 2.0,
    chapter: {
      index: '04',
      label: 'Brew',
      title: 'Time, temperature, and patience.',
      body: 'A slow spiral of water at 93 °C. The bed blooms, breathes, and releases its sweetness drop by drop.',
      facts: [
        { k: 'Water', v: '93 °C' },
        { k: 'Ratio', v: '1 : 16' },
        { k: 'Time', v: '3 min 30 s' },
      ],
      align: 'right',
    },
  },
  {
    id: 'cup',
    weight: 2.0,
    chapter: {
      index: '05',
      label: 'The Perfect Cup',
      title: 'Crafted for your everyday ritual.',
      body: 'Deep, round and lingering — a cup that asks you to slow down.',
      cta: { label: 'Explore our coffee', href: '#collection' },
      align: 'center',
    },
  },
  { id: 'outro', weight: 0.5 },
]

/** Total scroll length of the pinned story, in viewport heights. */
export const STORY_SCROLL_VH = 1250
