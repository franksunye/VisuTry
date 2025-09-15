import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始填充数据库...')

  // 创建示例眼镜框架
  const frames = [
    {
      name: "经典黑框眼镜",
      description: "经典的黑色方框眼镜，适合各种脸型",
      imageUrl: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&h=400&fit=crop",
      category: "方框",
      brand: "Classic"
    },
    {
      name: "圆形金属框",
      description: "复古风格的圆形金属框眼镜",
      imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&h=400&fit=crop",
      category: "圆框",
      brand: "Vintage"
    },
    {
      name: "时尚猫眼框",
      description: "优雅的猫眼形状，展现女性魅力",
      imageUrl: "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=400&h=400&fit=crop",
      category: "猫眼",
      brand: "Fashion"
    },
    {
      name: "运动型眼镜",
      description: "轻便的运动型眼镜，适合活跃生活",
      imageUrl: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=400&h=400&fit=crop",
      category: "运动",
      brand: "Sport"
    },
    {
      name: "透明框眼镜",
      description: "时尚的透明框设计，低调而优雅",
      imageUrl: "https://images.unsplash.com/photo-1506629905607-d9c297d3d45b?w=400&h=400&fit=crop",
      category: "方框",
      brand: "Modern"
    },
    {
      name: "复古圆框",
      description: "经典的复古圆框设计，文艺气息浓厚",
      imageUrl: "https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=400&h=400&fit=crop",
      category: "圆框",
      brand: "Retro"
    },
    {
      name: "大框太阳镜",
      description: "时尚的大框太阳镜，防紫外线",
      imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop",
      category: "太阳镜",
      brand: "Sun"
    },
    {
      name: "商务金框",
      description: "专业的商务金框眼镜，彰显品味",
      imageUrl: "https://images.unsplash.com/photo-1556306535-38febf6782e7?w=400&h=400&fit=crop",
      category: "方框",
      brand: "Business"
    }
  ]

  for (const frame of frames) {
    await prisma.glassesFrame.upsert({
      where: { name: frame.name },
      update: {},
      create: frame
    })
  }

  console.log('数据库填充完成！')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
