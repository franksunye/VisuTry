export type GlassesCategoryRecord = {
  id: string
  name: string
  displayName: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

export type FaceShapeRecord = {
  id: string
  name: string
  displayName: string
  description: string | null
  characteristics: string | null
  createdAt: Date
  updatedAt: Date
}

export type GlassesFrameRecord = {
  id: string
  name: string
  description: string | null
  imageUrl: string
  category: string | null
  brand: string | null
  model: string | null
  price: number | null
  style: string | null
  material: string | null
  color: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  faceShapes: Array<{
    id: string
    frameId: string
    faceShapeId: string
    reason: string | null
    faceShape: FaceShapeRecord
  }>
  categories: Array<{
    id: string
    frameId: string
    categoryId: string
    category: GlassesCategoryRecord
  }>
}
