export interface GlassesPreset {
  id: string
  name: string
  style: string
  assetPath: string
  promptHint: string
}

export const TOP_PICK_GLASSES_PRESETS: GlassesPreset[] = [
  {
    id: 'round-classic',
    name: 'Round',
    style: 'Round',
    assetPath: 'assets/glasses-presets/round-classic.jpg',
    promptHint: 'classic black round glasses with soft circular lenses',
  },
  {
    id: 'aviator-classic',
    name: 'Aviator',
    style: 'Aviator',
    assetPath: 'assets/glasses-presets/aviator-classic.jpg',
    promptHint: 'thin black aviator glasses with teardrop lenses and a double bridge',
  },
  {
    id: 'rectangle-classic',
    name: 'Rectangle',
    style: 'Rectangle',
    assetPath: 'assets/glasses-presets/rectangle-classic.jpg',
    promptHint: 'classic black rectangular acetate glasses with clean straight lines',
  },
  {
    id: 'browline-classic',
    name: 'Browline',
    style: 'Browline',
    assetPath: 'assets/glasses-presets/browline-classic.jpg',
    promptHint: 'black browline glasses with a stronger upper rim and thin lower rim',
  },
  {
    id: 'wayfarer-classic',
    name: 'Wayfarer',
    style: 'Wayfarer',
    assetPath: 'assets/glasses-presets/wayfarer-classic.jpg',
    promptHint: 'classic black wayfarer glasses with softly angled square lenses',
  },
  {
    id: 'geometric-classic',
    name: 'Geometric',
    style: 'Geometric',
    assetPath: 'assets/glasses-presets/geometric-classic.jpg',
    promptHint: 'thin black geometric hexagonal glasses with modern angular lenses',
  },
  {
    id: 'cat-eye-classic',
    name: 'Cat-Eye',
    style: 'Cat-Eye',
    assetPath: 'assets/glasses-presets/cat-eye-classic.jpg',
    promptHint: 'black acetate cat-eye glasses with elegant upswept outer corners',
  },
  {
    id: 'oval-classic',
    name: 'Oval',
    style: 'Oval',
    assetPath: 'assets/glasses-presets/oval-classic.jpg',
    promptHint: 'thin black metal oval glasses with soft oval lenses',
  },
  {
    id: 'rimless-light',
    name: 'Light Rimless',
    style: 'Rimless',
    assetPath: 'assets/glasses-presets/rimless-light.jpg',
    promptHint: 'light rimless glasses with subtle transparent lenses and thin dark metal bridge',
  },
  {
    id: 'oversized-classic',
    name: 'Oversized',
    style: 'Oversized',
    assetPath: 'assets/glasses-presets/oversized-classic.jpg',
    promptHint: 'black acetate oversized glasses with large softly square lenses',
  },
  {
    id: 'narrow-rectangle-classic',
    name: 'Narrow Rectangle',
    style: 'Narrow Rectangle',
    assetPath: 'assets/glasses-presets/narrow-rectangle-classic.jpg',
    promptHint: 'slim black narrow rectangular glasses with shallow lenses',
  },
  {
    id: 'square-classic',
    name: 'Square',
    style: 'Square',
    assetPath: 'assets/glasses-presets/square-classic.jpg',
    promptHint: 'black acetate square glasses with slightly softened corners',
  },
  {
    id: 'top-accent-classic',
    name: 'Top-Accent',
    style: 'Top-Accent',
    assetPath: 'assets/glasses-presets/top-accent-classic.jpg',
    promptHint: 'black top-accent glasses with a stronger upper rim and lighter lower rim',
  },
  {
    id: 'bottom-weighted-classic',
    name: 'Bottom-Weighted',
    style: 'Bottom-Weighted',
    assetPath: 'assets/glasses-presets/bottom-weighted-classic.jpg',
    promptHint: 'bottom-weighted glasses with a slightly stronger lower rim and lighter upper rim',
  },
  {
    id: 'large-round-classic',
    name: 'Large Round',
    style: 'Large Round',
    assetPath: 'assets/glasses-presets/large-round-classic.jpg',
    promptHint: 'large black round glasses with oversized circular lenses',
  },
  {
    id: 'oversized-square-classic',
    name: 'Oversized Square',
    style: 'Oversized Square',
    assetPath: 'assets/glasses-presets/oversized-square-classic.jpg',
    promptHint: 'black acetate oversized square glasses with large square lenses',
  },
]

export const DEFAULT_TOP_PICK_PRESET_IDS = [
  'rectangle-classic',
  'browline-classic',
  'wayfarer-classic',
  'geometric-classic',
]

export function getTopPickPresetById(id: string): GlassesPreset | undefined {
  return TOP_PICK_GLASSES_PRESETS.find((preset) => preset.id === id)
}

export function getTopPickPresetForStyle(style: string): GlassesPreset {
  const normalized = style.toLowerCase()

  if (normalized.includes('oversized') && normalized.includes('square')) {
    return getTopPickPresetById('oversized-square-classic')!
  }
  if (normalized.includes('large') && normalized.includes('round')) {
    return getTopPickPresetById('large-round-classic')!
  }
  if (normalized.includes('narrow') && normalized.includes('rectangle')) {
    return getTopPickPresetById('narrow-rectangle-classic')!
  }
  if (normalized.includes('thin') && normalized.includes('rectangle')) {
    return getTopPickPresetById('narrow-rectangle-classic')!
  }
  if (normalized.includes('top-accent') || normalized.includes('top accent') || normalized.includes('top-heavy') || normalized.includes('top heavy')) {
    return getTopPickPresetById('top-accent-classic')!
  }
  if (normalized.includes('bottom-weighted') || normalized.includes('bottom weighted') || normalized.includes('bottom-heavy') || normalized.includes('bottom heavy')) {
    return getTopPickPresetById('bottom-weighted-classic')!
  }
  if (normalized.includes('cat-eye') || normalized.includes('cat eye') || normalized.includes('cateye')) {
    return getTopPickPresetById('cat-eye-classic')!
  }
  if (normalized.includes('rimless')) {
    return getTopPickPresetById('rimless-light')!
  }
  if (normalized.includes('oversized')) {
    return getTopPickPresetById('oversized-classic')!
  }
  if (normalized.includes('aviator')) {
    return getTopPickPresetById('aviator-classic')!
  }
  if (normalized.includes('oval')) {
    return getTopPickPresetById('oval-classic')!
  }
  if (normalized.includes('round')) {
    return getTopPickPresetById('round-classic')!
  }
  if (normalized.includes('brow') || normalized.includes('clubmaster')) {
    return getTopPickPresetById('browline-classic')!
  }
  if (normalized.includes('wayfarer')) {
    return getTopPickPresetById('wayfarer-classic')!
  }
  if (normalized.includes('geometric') || normalized.includes('hexagon')) {
    return getTopPickPresetById('geometric-classic')!
  }
  if (normalized.includes('square')) {
    return getTopPickPresetById('square-classic')!
  }

  return getTopPickPresetById('rectangle-classic')!
}
