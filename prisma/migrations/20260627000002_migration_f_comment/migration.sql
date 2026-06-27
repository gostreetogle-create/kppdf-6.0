-- Migration F: add Comment table
-- История комментариев Картотеки сделок

CREATE TABLE "Comment" (
  "id"          SERIAL PRIMARY KEY,
  "packageTag"  TEXT NOT NULL,
  "authorId"    TEXT NOT NULL,
  "text"        TEXT NOT NULL,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isArchived"  BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "Comment_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id")
    ON DELETE RESTRICT
);

CREATE INDEX "Comment_packageTag_idx" ON "Comment" ("packageTag");
CREATE INDEX "Comment_authorId_idx" ON "Comment" ("authorId");
CREATE INDEX "Comment_createdAt_idx" ON "Comment" ("createdAt");
