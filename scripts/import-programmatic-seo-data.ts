import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface Brand {
  id: string
  name: string
  displayName: string
  description: string
  website?: string
  isActive: boolean
}

interface FaceShape {
  id: string
  name: string
  displayName: string
  description?: string
  characteristics?: string
  recommendedStyles?: string[]
  avoidStyles?: string[]
  isActive: boolean
}

interface Category {
  id: string
  name: string
  displayName: string
  description?: string
  isActive: boolean
}

interface Model {
  id: string
  brand: string
  name: string
  displayName: string
  description?: string
  imageUrl: string
  category: string
  style?: string
  material?: string
  color?: string
  price?: number
  faceShapes?: string[]
  isActive: boolean
}

async function importBrands() {
  console.log('Importing brands...')
  const brandsPath = path.join(process.cwd(), 'data', 'brands.json')
  const brandsData: Brand[] = JSON.parse(fs.readFileSync(brandsPath, 'utf-8'))

  for (const brand of brandsData) {
    await prisma.glassesFrame.create({
      data: {
        name: brand.displayName,
        description: brand.description,
        imageUrl: 'https://via.placeholder.com/400x400?text=' + brand.displayName,
        brand: brand.id,
        isActive: brand.isActive,
      },
    }).catch(() => {
      // Skip if already exists
    })
  }

  console.log(`✓ Imported ${brandsData.length} brands`)
}

async function importFaceShapes() {
  console.log('Importing face shapes...')
  const shapesPath = path.join(process.cwd(), 'data', 'face-shapes.json')
  const shapesData: FaceShape[] = JSON.parse(fs.readFileSync(shapesPath, 'utf-8'))

  for (const shape of shapesData) {
    await prisma.faceShape.upsert({
      where: { name: shape.name },
      update: {
        displayName: shape.displayName,
        description: shape.description,
        characteristics: shape.characteristics,
      },
      create: {
        name: shape.name,
        displayName: shape.displayName,
        description: shape.description,
        characteristics: shape.characteristics,
      },
    })
  }

  console.log(`✓ Imported ${shapesData.length} face shapes`)
}

async function importCategories() {
  console.log('Importing categories...')
  const categoriesPath = path.join(process.cwd(), 'data', 'categories.json')
  const categoriesData: Category[] = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'))

  for (const category of categoriesData) {
    await prisma.glassesCategory.upsert({
      where: { name: category.name },
      update: {
        displayName: category.displayName,
        description: category.description,
      },
      create: {
        name: category.name,
        displayName: category.displayName,
        description: category.description,
      },
    })
  }

  console.log(`✓ Imported ${categoriesData.length} categories`)
}

async function importModels() {
  console.log('Importing models...')
  const modelsPath = path.join(process.cwd(), 'data', 'models.json')
  const modelsData: Model[] = JSON.parse(fs.readFileSync(modelsPath, 'utf-8'))

  for (const model of modelsData) {
    const frame = await prisma.glassesFrame.upsert({
      where: { id: model.id },
      update: {
        name: model.displayName,
        description: model.description,
        imageUrl: model.imageUrl,
        brand: model.brand,
        model: model.name,
        category: model.category,
        style: model.style,
        material: model.material,
        color: model.color,
        price: model.price,
        isActive: model.isActive,
      },
      create: {
        id: model.id,
        name: model.displayName,
        description: model.description,
        imageUrl: model.imageUrl,
        brand: model.brand,
        model: model.name,
        category: model.category,
        style: model.style,
        material: model.material,
        color: model.color,
        price: model.price,
        isActive: model.isActive,
      },
    })

    // Add face shape recommendations
    if (model.faceShapes && model.faceShapes.length > 0) {
      for (const shapeId of model.faceShapes) {
        const shape = await prisma.faceShape.findUnique({
          where: { name: shapeId },
        })

        if (shape) {
          await prisma.frameFaceShapeRecommendation.upsert({
            where: {
              frameId_faceShapeId: {
                frameId: frame.id,
                faceShapeId: shape.id,
              },
            },
            update: {},
            create: {
              frameId: frame.id,
              faceShapeId: shape.id,
            },
          })
        }
      }
    }
  }

  console.log(`✓ Imported ${modelsData.length} models`)
}

async function main() {
  try {
    console.log('Starting data import...\n')

    await importFaceShapes()
    await importCategories()
    await importBrands()
    await importModels()

    console.log('\n✓ Data import completed successfully!')
  } catch (error) {
    console.error('Error importing data:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

