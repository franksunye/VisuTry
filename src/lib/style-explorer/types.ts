import type {
  FaceShape,
  StyleIntent,
  StyleOccasion,
} from '@/config/glasses-presets'

export type StyleExplorerCategoryFilter = 'optical' | 'sunglasses' | 'all'

export interface StyleExplorerSelectionInput {
  styleIntent: StyleIntent
  occasion?: StyleOccasion
  category: StyleExplorerCategoryFilter
  faceShape?: FaceShape
  limit: number
  exclusionIds?: string[]
  pinnedPresetIds?: string[]
}

export interface StyleLookCandidate {
  presetId: string
  lookKey: string
  score: number
  scoreBreakdown: {
    style: number
    occasion: number
    category: number
    faceShape: number
    diversity: number
  }
}

export interface StyleLookCopy {
  name: string
  tags: string[]
  summary: string
  whyItWorks: string
}
