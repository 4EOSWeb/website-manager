CREATE TABLE "draft_backups" (
    "id" TEXT NOT NULL,
    "website_id" TEXT NOT NULL,
    "source_draft_id" TEXT NOT NULL,
    "version_label" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draft_backups_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "draft_backups_website_id_source_draft_id_idx" ON "draft_backups"("website_id", "source_draft_id");
