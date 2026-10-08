-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('SUPER_ADMIN', 'DESIGNER');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('CLIENT_ADMIN', 'CLIENT_EDITOR', 'VIEWER', 'DESIGNER');

-- CreateEnum
CREATE TYPE "EditorStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'DISABLED');

-- CreateEnum
CREATE TYPE "PageStatus" AS ENUM ('ACTIVE');

-- CreateEnum
CREATE TYPE "BlogStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('SAVED', 'AWAITING_REVIEW', 'BUILD_IN_PROGRESS', 'DEPLOYMENT_IN_PROGRESS', 'LIVE', 'BUILD_FAILED', 'MERGE_CONFLICT', 'PUBLICATION_FAILED', 'SAVED_LOCALLY');

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "identity_provider_id" TEXT,
    "display_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "platform_role" "PlatformRole",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "websites" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "production_url" TEXT NOT NULL,
    "github_owner" TEXT NOT NULL,
    "github_repository" TEXT NOT NULL,
    "github_installation_id" INTEGER,
    "default_branch" TEXT NOT NULL DEFAULT 'main',
    "azure_deployment_identifier" TEXT,
    "editor_status" "EditorStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "manifest" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "websites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "website_memberships" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "website_id" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "website_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" TEXT NOT NULL,
    "website_id" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "PageStatus" NOT NULL DEFAULT 'ACTIVE',
    "editable_manifest" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_drafts" (
    "id" TEXT NOT NULL,
    "website_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "page_id" TEXT,
    "draft_data" JSONB NOT NULL,
    "base_commit_sha" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "website_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL DEFAULT '',
    "content" JSONB NOT NULL,
    "featured_image" TEXT,
    "author_display_name" TEXT NOT NULL,
    "author_user_id" TEXT,
    "status" "BlogStatus" NOT NULL DEFAULT 'DRAFT',
    "publish_date" TIMESTAMP(3),
    "seo_title" TEXT NOT NULL DEFAULT '',
    "meta_description" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "website_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storage_location" TEXT NOT NULL,
    "alt_text" TEXT NOT NULL DEFAULT '',
    "checksum" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "website_id" TEXT,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publishing_requests" (
    "id" TEXT NOT NULL,
    "website_id" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "reviewed_by" TEXT,
    "branch_name" TEXT NOT NULL,
    "commit_sha" TEXT,
    "pull_request_url" TEXT,
    "status" "PublishStatus" NOT NULL,
    "summary" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publishing_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "editor_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL DEFAULT '',
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "step_up_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "editor_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_identity_provider_id_key" ON "users"("identity_provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "websites_github_owner_github_repository_key" ON "websites"("github_owner", "github_repository");

-- CreateIndex
CREATE UNIQUE INDEX "website_memberships_user_id_website_id_key" ON "website_memberships"("user_id", "website_id");

-- CreateIndex
CREATE UNIQUE INDEX "pages_website_id_route_key" ON "pages"("website_id", "route");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_drafts_website_id_user_id_page_id_key" ON "workspace_drafts"("website_id", "user_id", "page_id");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_website_id_slug_key" ON "blog_posts"("website_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_website_id_checksum_key" ON "media_assets"("website_id", "checksum");

-- CreateIndex
CREATE INDEX "audit_events_website_id_created_at_idx" ON "audit_events"("website_id", "created_at");

-- CreateIndex
CREATE INDEX "editor_sessions_user_id_idx" ON "editor_sessions"("user_id");

-- AddForeignKey
ALTER TABLE "websites" ADD CONSTRAINT "websites_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "website_memberships" ADD CONSTRAINT "website_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "website_memberships" ADD CONSTRAINT "website_memberships_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "websites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "websites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_drafts" ADD CONSTRAINT "workspace_drafts_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "websites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_drafts" ADD CONSTRAINT "workspace_drafts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_drafts" ADD CONSTRAINT "workspace_drafts_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "websites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "websites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "websites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publishing_requests" ADD CONSTRAINT "publishing_requests_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "websites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publishing_requests" ADD CONSTRAINT "publishing_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publishing_requests" ADD CONSTRAINT "publishing_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editor_sessions" ADD CONSTRAINT "editor_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
