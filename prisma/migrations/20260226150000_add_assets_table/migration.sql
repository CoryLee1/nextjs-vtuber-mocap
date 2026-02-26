-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('VRM', 'ANIMATION', 'BGM', 'HDR', 'SCENE');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('UPLOADING', 'READY', 'FAILED', 'MISSING');

-- CreateEnum
CREATE TYPE "AssetVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "s3_key" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "status" "AssetStatus" NOT NULL DEFAULT 'READY',
    "owner_user_id" TEXT,
    "visibility" "AssetVisibility" NOT NULL DEFAULT 'PRIVATE',
    "error_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assets_s3_key_key" ON "assets"("s3_key");

-- CreateIndex
CREATE INDEX "assets_owner_user_id_type_status_idx" ON "assets"("owner_user_id", "type", "status");

-- CreateIndex
CREATE INDEX "assets_visibility_type_status_idx" ON "assets"("visibility", "type", "status");

-- CreateIndex
CREATE INDEX "assets_type_status_created_at_idx" ON "assets"("type", "status", "created_at");

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
