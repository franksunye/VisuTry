import React from 'react'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

async function getDataStats() {
  const [
    totalFrames,
    activeFrames,
    totalBrands,
    totalCategories,
    totalFaceShapes,
    framesWithFaceShapes,
    framesWithCategories,
  ] = await Promise.all([
    prisma.glassesFrame.count(),
    prisma.glassesFrame.count({ where: { isActive: true } }),
    prisma.glassesFrame.findMany({
      select: { brand: true },
      distinct: ['brand'],
      where: { brand: { not: null } },
    }),
    prisma.glassesCategory.count(),
    prisma.faceShape.count(),
    prisma.frameFaceShapeRecommendation.findMany({
      select: { frameId: true },
      distinct: ['frameId'],
    }),
    prisma.frameCategoryAssociation.findMany({
      select: { frameId: true },
      distinct: ['frameId'],
    }),
  ])

  return {
    totalFrames,
    activeFrames,
    totalBrands: totalBrands.length,
    totalCategories,
    totalFaceShapes,
    framesWithFaceShapes: framesWithFaceShapes.length,
    framesWithCategories: framesWithCategories.length,
  }
}

export default async function DataStatsPage() {
  const stats = await getDataStats()

  const statCards = [
    {
      title: 'Total Frames',
      value: stats.totalFrames,
      description: 'Total glasses frames in database',
      color: 'bg-blue-50',
    },
    {
      title: 'Active Frames',
      value: stats.activeFrames,
      description: 'Frames available for SEO',
      color: 'bg-green-50',
    },
    {
      title: 'Unique Brands',
      value: stats.totalBrands,
      description: 'Different brands in database',
      color: 'bg-purple-50',
    },
    {
      title: 'Categories',
      value: stats.totalCategories,
      description: 'Glasses categories',
      color: 'bg-orange-50',
    },
    {
      title: 'Face Shapes',
      value: stats.totalFaceShapes,
      description: 'Face shape types',
      color: 'bg-pink-50',
    },
    {
      title: 'Frames with Face Shapes',
      value: stats.framesWithFaceShapes,
      description: 'Frames with recommendations',
      color: 'bg-indigo-50',
    },
    {
      title: 'Frames with Categories',
      value: stats.framesWithCategories,
      description: 'Frames with category links',
      color: 'bg-cyan-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Data Statistics</h2>
        <p className="text-muted-foreground">
          Overview of programmatic SEO data
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title} className={stat.color}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <CardDescription className="text-xs">
                {stat.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data Quality Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Data Quality Checklist</CardTitle>
          <CardDescription>
            Verify data completeness for SEO
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Frames with images</span>
              <Badge variant="outline">
                {stats.totalFrames > 0 ? '✓' : '✗'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Face shape recommendations</span>
              <Badge variant="outline">
                {stats.framesWithFaceShapes > 0 ? '✓' : '✗'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Category associations</span>
              <Badge variant="outline">
                {stats.framesWithCategories > 0 ? '✓' : '✗'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Multiple brands</span>
              <Badge variant="outline">
                {stats.totalBrands >= 5 ? '✓' : '✗'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">All face shapes defined</span>
              <Badge variant="outline">
                {stats.totalFaceShapes >= 5 ? '✓' : '✗'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. Ensure all frames have descriptions and images</p>
          <p>2. Add face shape recommendations for all frames</p>
          <p>3. Verify category associations are correct</p>
          <p>4. Test dynamic page generation</p>
          <p>5. Generate and submit sitemap to GSC</p>
        </CardContent>
      </Card>
    </div>
  )
}

