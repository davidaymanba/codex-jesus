-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "ogImageId" UUID;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "ogImageId" UUID;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "ogImageId" UUID;

-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "ogImageId" UUID;

-- CreateIndex
CREATE INDEX "posts_ogImageId_idx" ON "posts"("ogImageId");

-- CreateIndex
CREATE INDEX "projects_ogImageId_idx" ON "projects"("ogImageId");

-- CreateIndex
CREATE INDEX "services_ogImageId_idx" ON "services"("ogImageId");

-- CreateIndex
CREATE INDEX "site_settings_ogImageId_idx" ON "site_settings"("ogImageId");

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_ogImageId_fkey" FOREIGN KEY ("ogImageId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_ogImageId_fkey" FOREIGN KEY ("ogImageId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_ogImageId_fkey" FOREIGN KEY ("ogImageId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_ogImageId_fkey" FOREIGN KEY ("ogImageId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
