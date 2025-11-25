import React from 'react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, Database, TrendingUp } from 'lucide-react'

async function getDataStats() {
  const [
    totalFrames,
    activeFrames,
    totalBrands,
    totalCategories,
    totalFaceShapes,
    framesWithFaceShapes,
    framesWithCategories,
    framesWithImages,
    framesWithDescription,
    framesWithPrice,
    framesWithBrand,
    allFrames,
    categoryAssociations,
    faceShapeRecommendations,
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
    // imageUrl is required (String), so all frames have images
    prisma.glassesFrame.count(),
    prisma.glassesFrame.count({ where: { description: { not: null } } }),
    prisma.glassesFrame.count({ where: { price: { not: null } } }),
    prisma.glassesFrame.count({ where: { brand: { not: null } } }),
    prisma.glassesFrame.findMany({
      select: { brand: true, category: true },
    }),
    prisma.frameCategoryAssociation.findMany({
      include: { category: { select: { id: true, name: true } } },
    }),
    prisma.frameFaceShapeRecommendation.findMany({
      include: { faceShape: { select: { name: true } } },
    }),
  ])

  // Brand distribution
  const brandCounts = allFrames.reduce<Record<string, number>>((acc, frame) => {
    if (frame.brand) {
      acc[frame.brand] = (acc[frame.brand] || 0) + 1
    }
    return acc
  }, {})
  const brandDistribution = Object.entries(brandCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([brand, count]) => ({ brand, count: count as number }))

  // Category distribution (from string field)
  const categoryCounts = allFrames.reduce<Record<string, number>>((acc, frame) => {
    if (frame.category) {
      acc[frame.category] = (acc[frame.category] || 0) + 1
    }
    return acc
  }, {})
  const categoryDistribution = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([category, count]) => ({ category, count: count as number }))

  // Face shape distribution
  const faceShapeCounts = faceShapeRecommendations.reduce<Record<string, number>>((acc, rec) => {
    const name = rec.faceShape.name
    acc[name] = (acc[name] || 0) + 1
    return acc
  }, {})
  const faceShapeDistribution = Object.entries(faceShapeCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([faceShape, count]) => ({ faceShape, count: count as number }))

  // SEO readiness score
  const seoScore = totalFrames > 0
    ? Math.round(
        ((framesWithImages / totalFrames) * 0.3 +
          (framesWithDescription / totalFrames) * 0.2 +
          (framesWithBrand / totalFrames) * 0.2 +
          (framesWithFaceShapes.length / totalFrames) * 0.15 +
          (framesWithCategories.length / totalFrames) * 0.15) *
          100
      )
    : 0

  return {
    totalFrames,
    activeFrames,
    totalBrands: totalBrands.length,
    totalCategories,
    totalFaceShapes,
    framesWithFaceShapes: framesWithFaceShapes.length,
    framesWithCategories: framesWithCategories.length,
    framesWithImages,
    framesWithDescription,
    framesWithPrice,
    framesWithBrand,
    brandDistribution,
    categoryDistribution,
    faceShapeDistribution,
    seoScore,
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
  ]

  const completenessMetrics = [
    {
      label: 'Frames with Images',
      value: stats.framesWithImages,
      total: stats.totalFrames,
      percentage: stats.totalFrames > 0 ? Math.round((stats.framesWithImages / stats.totalFrames) * 100) : 0,
    },
    {
      label: 'Frames with Description',
      value: stats.framesWithDescription,
      total: stats.totalFrames,
      percentage: stats.totalFrames > 0 ? Math.round((stats.framesWithDescription / stats.totalFrames) * 100) : 0,
    },
    {
      label: 'Frames with Brand',
      value: stats.framesWithBrand,
      total: stats.totalFrames,
      percentage: stats.totalFrames > 0 ? Math.round((stats.framesWithBrand / stats.totalFrames) * 100) : 0,
    },
    {
      label: 'Frames with Price',
      value: stats.framesWithPrice,
      total: stats.totalFrames,
      percentage: stats.totalFrames > 0 ? Math.round((stats.framesWithPrice / stats.totalFrames) * 100) : 0,
    },
    {
      label: 'Frames with Face Shapes',
      value: stats.framesWithFaceShapes,
      total: stats.totalFrames,
      percentage: stats.totalFrames > 0 ? Math.round((stats.framesWithFaceShapes / stats.totalFrames) * 100) : 0,
    },
    {
      label: 'Frames with Categories',
      value: stats.framesWithCategories,
      total: stats.totalFrames,
      percentage: stats.totalFrames > 0 ? Math.round((stats.framesWithCategories / stats.totalFrames) * 100) : 0,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Data Statistics</h2>
          <p className="text-muted-foreground">
            Overview of programmatic SEO data
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/frames">
            <Button variant="outline">
              <Database className="mr-2 h-4 w-4" />
              Manage Frames
            </Button>
          </Link>
          <Link href="/admin/import">
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Import Data
            </Button>
          </Link>
        </div>
      </div>

      {/* SEO Readiness Score */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                SEO Readiness Score
              </CardTitle>
              <CardDescription>
                Overall data quality for programmatic SEO
              </CardDescription>
            </div>
            <div className="text-5xl font-bold text-blue-600">{stats.seoScore}%</div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={stats.seoScore} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            {stats.seoScore >= 80 ? '✅ Excellent - Ready for production' :
             stats.seoScore >= 60 ? '⚠️ Good - Some improvements needed' :
             '❌ Needs work - Improve data completeness'}
          </p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

      {/* Data Completeness */}
      <Card>
        <CardHeader>
          <CardTitle>Data Completeness</CardTitle>
          <CardDescription>
            Percentage of frames with complete information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {completenessMetrics.map((metric) => (
            <div key={metric.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{metric.label}</span>
                <span className="text-muted-foreground">
                  {metric.value} / {metric.total} ({metric.percentage}%)
                </span>
              </div>
              <Progress value={metric.percentage} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Distribution Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Brand Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Brands</CardTitle>
            <CardDescription>Most common brands</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.brandDistribution.length > 0 ? (
              <div className="space-y-2">
                {stats.brandDistribution.map((item) => (
                  <div key={item.brand} className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize">{item.brand}</span>
                    <Badge>{item.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No brand data</p>
            )}
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Categories</CardTitle>
            <CardDescription>Most common categories</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.categoryDistribution.length > 0 ? (
              <div className="space-y-2">
                {stats.categoryDistribution.map((item) => (
                  <div key={item.category} className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize">{item.category}</span>
                    <Badge>{item.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No category data</p>
            )}
          </CardContent>
        </Card>

        {/* Face Shape Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Face Shapes</CardTitle>
            <CardDescription>Most recommended shapes</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.faceShapeDistribution.length > 0 ? (
              <div className="space-y-2">
                {stats.faceShapeDistribution.map((item) => (
                  <div key={item.faceShape} className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize">{item.faceShape}</span>
                    <Badge>{item.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No face shape data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Actions</CardTitle>
          <CardDescription>
            Steps to improve SEO readiness
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
              1
            </div>
            <div className="flex-1">
              <p className="font-medium">Import or create more frames</p>
              <p className="text-sm text-muted-foreground">
                Target: 200+ frames for better SEO coverage
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
              2
            </div>
            <div className="flex-1">
              <p className="font-medium">Add images and descriptions</p>
              <p className="text-sm text-muted-foreground">
                Ensure all frames have imageUrl and description fields
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
              3
            </div>
            <div className="flex-1">
              <p className="font-medium">Configure face shape recommendations</p>
              <p className="text-sm text-muted-foreground">
                Link frames to appropriate face shapes for better targeting
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
              4
            </div>
            <div className="flex-1">
              <p className="font-medium">Test dynamic pages</p>
              <p className="text-sm text-muted-foreground">
                Visit /try/[frame-id] pages to verify they render correctly
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
              5
            </div>
            <div className="flex-1">
              <p className="font-medium">Submit sitemap to Google Search Console</p>
              <p className="text-sm text-muted-foreground">
                Sitemap URL: https://visutry.com/sitemap.xml
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
