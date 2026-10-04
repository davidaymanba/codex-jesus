-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EDITOR');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('DEVELOPMENT', 'BRANDING', 'MARKETING');

-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('POST', 'PROJECT');

-- CreateEnum
CREATE TYPE "Team" AS ENUM ('BRAND', 'MARKETING', 'DEVELOPMENT');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'IN_PROGRESS', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('NEW', 'REPLIED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('ar', 'en');

-- CreateEnum
CREATE TYPE "ServiceOffering" AS ENUM ('ECOMMERCE', 'ELEARNING', 'ERP', 'CRM', 'SALLA', 'SHOPIFY', 'WORDPRESS', 'AI_AGENTS', 'N8N_AUTOMATION', 'BRAND_STRATEGY', 'LOGO_DESIGN', 'VISUAL_IDENTITY', 'BRAND_GUIDELINES', 'SOCIAL_MEDIA', 'CONTENT_CREATION', 'PAID_ADS', 'SEO');

-- CreateEnum
CREATE TYPE "BudgetRange" AS ENUM ('UNDER_5K', 'FROM_5K_TO_15K', 'FROM_15K_TO_50K', 'ABOVE_50K', 'NOT_SURE');

-- CreateEnum
CREATE TYPE "ProjectTimeline" AS ENUM ('ASAP', 'ONE_TO_THREE_MONTHS', 'THREE_TO_SIX_MONTHS', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'TOKEN_REUSE_DETECTED', 'ACCOUNT_LOCKED');

-- CreateEnum
CREATE TYPE "AuditEntity" AS ENUM ('USER', 'SERVICE', 'PROJECT', 'POST', 'CATEGORY', 'TAG', 'TESTIMONIAL', 'TEAM_MEMBER', 'CLIENT', 'MEDIA', 'QUOTE_REQUEST', 'CONTACT_MESSAGE', 'SITE_SETTINGS');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EDITOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMPTZ(3),
    "lastLoginAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "familyId" UUID NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),
    "replacedById" UUID,
    "userAgent" VARCHAR(512),
    "ipHash" CHAR(64),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" UUID NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "publicId" VARCHAR(255) NOT NULL,
    "alt" JSONB NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedById" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL,
    "slugAr" VARCHAR(120) NOT NULL,
    "slugEn" VARCHAR(120) NOT NULL,
    "title" JSONB NOT NULL,
    "shortDescription" JSONB NOT NULL,
    "content" JSONB NOT NULL,
    "icon" VARCHAR(64) NOT NULL,
    "category" "ServiceCategory" NOT NULL,
    "subServices" JSONB NOT NULL,
    "benefits" JSONB NOT NULL,
    "faqs" JSONB NOT NULL,
    "coverId" UUID,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "seo" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "slugAr" VARCHAR(120) NOT NULL,
    "slugEn" VARCHAR(120) NOT NULL,
    "title" JSONB NOT NULL,
    "client" VARCHAR(120),
    "industry" JSONB NOT NULL,
    "serviceCategory" "ServiceCategory" NOT NULL,
    "coverId" UUID,
    "challenge" JSONB NOT NULL,
    "solution" JSONB NOT NULL,
    "results" JSONB NOT NULL,
    "techStack" TEXT[],
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMPTZ(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "seo" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_gallery_images" (
    "projectId" UUID NOT NULL,
    "mediaId" UUID NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_gallery_images_pkey" PRIMARY KEY ("projectId","mediaId")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" UUID NOT NULL,
    "slugAr" VARCHAR(120) NOT NULL,
    "slugEn" VARCHAR(120) NOT NULL,
    "title" JSONB NOT NULL,
    "excerpt" JSONB NOT NULL,
    "content" JSONB NOT NULL,
    "coverId" UUID,
    "authorId" UUID NOT NULL,
    "readingTimeAr" INTEGER NOT NULL,
    "readingTimeEn" INTEGER NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMPTZ(3),
    "seo" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" JSONB NOT NULL,
    "slugAr" VARCHAR(120) NOT NULL,
    "slugEn" VARCHAR(120) NOT NULL,
    "type" "CategoryType" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "name" JSONB NOT NULL,
    "slugAr" VARCHAR(120) NOT NULL,
    "slugEn" VARCHAR(120) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" UUID NOT NULL,
    "clientName" VARCHAR(80) NOT NULL,
    "role" JSONB NOT NULL,
    "company" VARCHAR(120),
    "photoId" UUID,
    "quote" JSONB NOT NULL,
    "rating" SMALLINT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" UUID NOT NULL,
    "name" JSONB NOT NULL,
    "role" JSONB NOT NULL,
    "team" "Team" NOT NULL,
    "photoId" UUID,
    "bio" JSONB NOT NULL,
    "socials" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "logoId" UUID,
    "website" VARCHAR(2048),
    "order" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_requests" (
    "id" UUID NOT NULL,
    "services" "ServiceOffering"[],
    "projectDetails" VARCHAR(3000) NOT NULL,
    "budgetRange" "BudgetRange" NOT NULL,
    "timeline" "ProjectTimeline" NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "phone" VARCHAR(16),
    "company" VARCHAR(120),
    "locale" "Locale" NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "internalNotes" VARCHAR(5000),
    "assignedToId" UUID,
    "ipHash" CHAR(64),
    "userAgent" VARCHAR(512),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "quote_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "phone" VARCHAR(16),
    "message" VARCHAR(2000) NOT NULL,
    "locale" "Locale" NOT NULL,
    "status" "ContactStatus" NOT NULL DEFAULT 'NEW',
    "ipHash" CHAR(64),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "companyName" JSONB NOT NULL,
    "logoId" UUID,
    "contact" JSONB NOT NULL,
    "socials" JSONB NOT NULL,
    "defaultSeo" JSONB NOT NULL,
    "homepage" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "action" "AuditAction" NOT NULL,
    "entity" "AuditEntity" NOT NULL,
    "entityId" VARCHAR(64),
    "changes" JSONB,
    "ipHash" CHAR(64),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PostTags" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_PostTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProjectCategories" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_ProjectCategories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PostCategories" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_PostCategories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_replacedById_key" ON "refresh_tokens"("replacedById");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_familyId_idx" ON "refresh_tokens"("familyId");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "media_publicId_key" ON "media"("publicId");

-- CreateIndex
CREATE INDEX "media_uploadedById_idx" ON "media"("uploadedById");

-- CreateIndex
CREATE INDEX "media_createdAt_idx" ON "media"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "services_slugAr_key" ON "services"("slugAr");

-- CreateIndex
CREATE UNIQUE INDEX "services_slugEn_key" ON "services"("slugEn");

-- CreateIndex
CREATE INDEX "services_status_order_idx" ON "services"("status", "order");

-- CreateIndex
CREATE INDEX "services_category_idx" ON "services"("category");

-- CreateIndex
CREATE INDEX "services_coverId_idx" ON "services"("coverId");

-- CreateIndex
CREATE UNIQUE INDEX "projects_slugAr_key" ON "projects"("slugAr");

-- CreateIndex
CREATE UNIQUE INDEX "projects_slugEn_key" ON "projects"("slugEn");

-- CreateIndex
CREATE INDEX "projects_status_publishedAt_idx" ON "projects"("status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "projects_isFeatured_status_idx" ON "projects"("isFeatured", "status");

-- CreateIndex
CREATE INDEX "projects_order_idx" ON "projects"("order");

-- CreateIndex
CREATE INDEX "projects_serviceCategory_idx" ON "projects"("serviceCategory");

-- CreateIndex
CREATE INDEX "projects_coverId_idx" ON "projects"("coverId");

-- CreateIndex
CREATE INDEX "project_gallery_images_mediaId_idx" ON "project_gallery_images"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "posts_slugAr_key" ON "posts"("slugAr");

-- CreateIndex
CREATE UNIQUE INDEX "posts_slugEn_key" ON "posts"("slugEn");

-- CreateIndex
CREATE INDEX "posts_status_publishedAt_idx" ON "posts"("status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "posts_isFeatured_status_idx" ON "posts"("isFeatured", "status");

-- CreateIndex
CREATE INDEX "posts_authorId_idx" ON "posts"("authorId");

-- CreateIndex
CREATE INDEX "posts_coverId_idx" ON "posts"("coverId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slugAr_key" ON "categories"("slugAr");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slugEn_key" ON "categories"("slugEn");

-- CreateIndex
CREATE INDEX "categories_type_idx" ON "categories"("type");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slugAr_key" ON "tags"("slugAr");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slugEn_key" ON "tags"("slugEn");

-- CreateIndex
CREATE INDEX "testimonials_isVisible_order_idx" ON "testimonials"("isVisible", "order");

-- CreateIndex
CREATE INDEX "testimonials_photoId_idx" ON "testimonials"("photoId");

-- CreateIndex
CREATE INDEX "team_members_team_isVisible_order_idx" ON "team_members"("team", "isVisible", "order");

-- CreateIndex
CREATE INDEX "team_members_photoId_idx" ON "team_members"("photoId");

-- CreateIndex
CREATE INDEX "clients_isVisible_order_idx" ON "clients"("isVisible", "order");

-- CreateIndex
CREATE INDEX "clients_logoId_idx" ON "clients"("logoId");

-- CreateIndex
CREATE INDEX "quote_requests_status_createdAt_idx" ON "quote_requests"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "quote_requests_createdAt_idx" ON "quote_requests"("createdAt");

-- CreateIndex
CREATE INDEX "quote_requests_assignedToId_idx" ON "quote_requests"("assignedToId");

-- CreateIndex
CREATE INDEX "contact_messages_status_createdAt_idx" ON "contact_messages"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "_PostTags_B_index" ON "_PostTags"("B");

-- CreateIndex
CREATE INDEX "_ProjectCategories_B_index" ON "_ProjectCategories"("B");

-- CreateIndex
CREATE INDEX "_PostCategories_B_index" ON "_PostCategories"("B");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_replacedById_fkey" FOREIGN KEY ("replacedById") REFERENCES "refresh_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_coverId_fkey" FOREIGN KEY ("coverId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_coverId_fkey" FOREIGN KEY ("coverId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_gallery_images" ADD CONSTRAINT "project_gallery_images_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_gallery_images" ADD CONSTRAINT "project_gallery_images_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_coverId_fkey" FOREIGN KEY ("coverId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostTags" ADD CONSTRAINT "_PostTags_A_fkey" FOREIGN KEY ("A") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostTags" ADD CONSTRAINT "_PostTags_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectCategories" ADD CONSTRAINT "_ProjectCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectCategories" ADD CONSTRAINT "_ProjectCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostCategories" ADD CONSTRAINT "_PostCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostCategories" ADD CONSTRAINT "_PostCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Constraints Prisma cannot model (kept in sync with @codex/shared) ──────────

-- Emails are normalized to lowercase so the unique index is effectively case-insensitive.
ALTER TABLE "users" ADD CONSTRAINT "users_email_lowercase_check" CHECK ("email" = lower("email"));

-- FIELD_LIMITS.RATING
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_rating_range_check" CHECK ("rating" BETWEEN 1 AND 5);

-- SiteSettings is a singleton.
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_singleton_check" CHECK ("id" = 1);

-- Content counters and sizes are never negative.
ALTER TABLE "users" ADD CONSTRAINT "users_failed_login_attempts_check" CHECK ("failedLoginAttempts" >= 0);
ALTER TABLE "media" ADD CONSTRAINT "media_dimensions_check" CHECK ("width" > 0 AND "height" > 0 AND "sizeBytes" > 0);
ALTER TABLE "posts" ADD CONSTRAINT "posts_reading_time_check" CHECK ("readingTimeAr" >= 1 AND "readingTimeEn" >= 1);
