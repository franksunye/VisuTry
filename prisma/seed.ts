import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seeding...')

  // Create sample glasses frames
  const frames = [
    {
      name: "Classic Black Frame",
      description: "Classic black square frame glasses, suitable for all face shapes",
      imageUrl: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&h=400&fit=crop",
      category: "Square",
      brand: "Classic"
    },
    {
      name: "Round Metal Frame",
      description: "Vintage style round metal frame glasses",
      imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&h=400&fit=crop",
      category: "Round",
      brand: "Vintage"
    },
    {
      name: "Fashion Cat Eye",
      description: "Elegant cat eye shape, showcasing feminine charm",
      imageUrl: "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=400&h=400&fit=crop",
      category: "Cat Eye",
      brand: "Fashion"
    },
    {
      name: "Sport Glasses",
      description: "Lightweight sport glasses, perfect for active lifestyle",
      imageUrl: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=400&h=400&fit=crop",
      category: "Sport",
      brand: "Sport"
    },
    {
      name: "Clear Frame Glasses",
      description: "Fashionable clear frame design, subtle and elegant",
      imageUrl: "https://images.unsplash.com/photo-1506629905607-d9c297d3d45b?w=400&h=400&fit=crop",
      category: "Square",
      brand: "Modern"
    },
    {
      name: "Vintage Round Frame",
      description: "Classic vintage round frame design with artistic flair",
      imageUrl: "https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=400&h=400&fit=crop",
      category: "Round",
      brand: "Retro"
    },
    {
      name: "Oversized Sunglasses",
      description: "Fashionable oversized sunglasses with UV protection",
      imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop",
      category: "Sunglasses",
      brand: "Sun"
    },
    {
      name: "Business Gold Frame",
      description: "Professional business gold frame glasses, showcasing taste",
      imageUrl: "https://images.unsplash.com/photo-1556306535-38febf6782e7?w=400&h=400&fit=crop",
      category: "Square",
      brand: "Business"
    }
  ]

  // Clear existing data
  await prisma.glassesFrame.deleteMany()

  // Create new data
  for (const frame of frames) {
    await prisma.glassesFrame.create({
      data: frame
    })
  }

  console.log('Database seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
