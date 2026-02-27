-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('VRM', 'ANIMATION', 'BGM', 'HDR', 'SCENE', 'IMAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'DELETED', 'PROCESSING');

-- CreateEnum
CREATE TYPE "AssetVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'UNLISTED');

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "asset_type" "AssetType" NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "visibility" "AssetVisibility" NOT NULL DEFAULT 'PRIVATE',
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assets_s3_key_key" ON "assets"("s3_key");

-- CreateIndex
CREATE INDEX "assets_s3_key_idx" ON "assets"("s3_key");

-- CreateIndex
CREATE INDEX "assets_user_id_idx" ON "assets"("user_id");

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
