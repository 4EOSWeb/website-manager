CREATE TABLE "editor_revisions" (
    "id" TEXT NOT NULL,
    "website_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "editor_revisions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "editor_revisions_website_id_created_at_idx" ON "editor_revisions"("website_id", "created_at");

ALTER TABLE "editor_revisions" ADD CONSTRAINT "editor_revisions_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "websites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "editor_revisions" ADD CONSTRAINT "editor_revisions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
