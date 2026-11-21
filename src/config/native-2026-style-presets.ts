/**
 * Exact existing 16 Style Explorer image assets and 1–5 intensity values
 * from the original EN 2026 guide. Native text overlays never change presets.
 */
export const STYLE_PRESETS_2026 = [
  {
    "id": "sun-wayfarer-black",
    "image": "/assets/glasses-presets/style-explorer/sun-wayfarer-black.jpg",
    "category": "Sunglasses",
    "intensity": 3
  },
  {
    "id": "sun-aviator-gold",
    "image": "/assets/glasses-presets/style-explorer/sun-aviator-gold.jpg",
    "category": "Sunglasses",
    "intensity": 3
  },
  {
    "id": "optical-warm-tortoise",
    "image": "/assets/glasses-presets/style-explorer/optical-warm-tortoise.jpg",
    "category": "Optical",
    "intensity": 3
  },
  {
    "id": "optical-slim-browline",
    "image": "/assets/glasses-presets/style-explorer/optical-slim-browline.jpg",
    "category": "Optical",
    "intensity": 3
  },
  {
    "id": "optical-thin-gold-oval",
    "image": "/assets/glasses-presets/style-explorer/optical-thin-gold-oval.jpg",
    "category": "Optical",
    "intensity": 2
  },
  {
    "id": "optical-clear-soft-square",
    "image": "/assets/glasses-presets/style-explorer/optical-clear-soft-square.jpg",
    "category": "Optical",
    "intensity": 2
  },
  {
    "id": "optical-rimless-geometric",
    "image": "/assets/glasses-presets/style-explorer/optical-rimless-geometric.jpg",
    "category": "Optical",
    "intensity": 1
  },
  {
    "id": "optical-slim-black-oval",
    "image": "/assets/glasses-presets/style-explorer/optical-slim-black-oval.jpg",
    "category": "Optical",
    "intensity": 2
  },
  {
    "id": "sun-cat-eye-black",
    "image": "/assets/glasses-presets/style-explorer/sun-cat-eye-black.jpg",
    "category": "Sunglasses",
    "intensity": 4
  },
  {
    "id": "sun-oversized-gradient",
    "image": "/assets/glasses-presets/style-explorer/sun-oversized-gradient.jpg",
    "category": "Sunglasses",
    "intensity": 5
  },
  {
    "id": "optical-transparent-geometric",
    "image": "/assets/glasses-presets/style-explorer/optical-transparent-geometric.jpg",
    "category": "Optical",
    "intensity": 3
  },
  {
    "id": "optical-statement-color",
    "image": "/assets/glasses-presets/style-explorer/optical-statement-color.jpg",
    "category": "Optical",
    "intensity": 5
  },
  {
    "id": "sun-shield-wraparound-black",
    "image": "/assets/glasses-presets/style-explorer/sun-shield-wraparound-black.jpg",
    "category": "Sunglasses",
    "intensity": 5
  },
  {
    "id": "sun-curved-flat-top-black",
    "image": "/assets/glasses-presets/style-explorer/sun-curved-flat-top-black.jpg",
    "category": "Sunglasses",
    "intensity": 5
  },
  {
    "id": "sun-narrow-rectangle-black",
    "image": "/assets/glasses-presets/style-explorer/sun-narrow-rectangle-black.jpg",
    "category": "Sunglasses",
    "intensity": 4
  },
  {
    "id": "sun-round-tortoise",
    "image": "/assets/glasses-presets/style-explorer/sun-round-tortoise.jpg",
    "category": "Sunglasses",
    "intensity": 3
  }
] as const

export const STYLE_GROUPS_2026 = [
  {
    "id": "timeless-classics",
    "frameIndexes": [
      0,
      1,
      2,
      3
    ]
  },
  {
    "id": "modern-minimal",
    "frameIndexes": [
      4,
      5,
      6,
      7
    ]
  },
  {
    "id": "bold-statements",
    "frameIndexes": [
      8,
      9,
      10,
      11
    ]
  },
  {
    "id": "sport-future-retro",
    "frameIndexes": [
      12,
      13,
      14,
      15
    ]
  }
] as const

/** Six original intent-to-frame mappings, independent of language. */
export const STYLE_INTENTS_2026 = [
  [
    3,
    4,
    2
  ],
  [
    6,
    5,
    7
  ],
  [
    0,
    1,
    2
  ],
  [
    10,
    11,
    14
  ],
  [
    12,
    13,
    9
  ],
  [
    1,
    15,
    8
  ]
] as const
