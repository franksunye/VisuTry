-- AlterTable
ALTER TABLE "GlassesFrame" ADD COLUMN "model" TEXT,
ADD COLUMN "price" DOUBLE PRECISION,
ADD COLUMN "style" TEXT,
ADD COLUMN "material" TEXT,
ADD COLUMN "color" TEXT;

-- CreateTable
CREATE TABLE "FaceShape" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "characteristics" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaceShape_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlassesCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlassesCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrameFaceShapeRecommendation" (
    "id" TEXT NOT NULL,
    "frameId" TEXT NOT NULL,
    "faceShapeId" TEXT NOT NULL,
    "reason" TEXT,

    CONSTRAINT "FrameFaceShapeRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrameCategoryAssociation" (
    "id" TEXT NOT NULL,
    "frameId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "FrameCategoryAssociation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FaceShape_name_key" ON "FaceShape"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GlassesCategory_name_key" ON "GlassesCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FrameFaceShapeRecommendation_frameId_faceShapeId_key" ON "FrameFaceShapeRecommendation"("frameId", "faceShapeId");

-- CreateIndex
CREATE UNIQUE INDEX "FrameCategoryAssociation_frameId_categoryId_key" ON "FrameCategoryAssociation"("frameId", "categoryId");

-- AddForeignKey
ALTER TABLE "FrameFaceShapeRecommendation" ADD CONSTRAINT "FrameFaceShapeRecommendation_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES "GlassesFrame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameFaceShapeRecommendation" ADD CONSTRAINT "FrameFaceShapeRecommendation_faceShapeId_fkey" FOREIGN KEY ("faceShapeId") REFERENCES "FaceShape"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameCategoryAssociation" ADD CONSTRAINT "FrameCategoryAssociation_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES "GlassesFrame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameCategoryAssociation" ADD CONSTRAINT "FrameCategoryAssociation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "GlassesCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

