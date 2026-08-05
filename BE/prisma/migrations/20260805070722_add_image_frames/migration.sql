-- CreateTable
CREATE TABLE "image_frames" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "insetTop" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "insetRight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "insetBottom" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "insetLeft" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "image_frames_pkey" PRIMARY KEY ("id")
);
