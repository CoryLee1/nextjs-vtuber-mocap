-- CreateTable
CREATE TABLE "SiteViewCounter" (
    "id" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SiteViewCounter_pkey" PRIMARY KEY ("id")
);

-- Insert initial row so ON CONFLICT in API works
INSERT INTO "SiteViewCounter" ("id", "count") VALUES ('default', 0);
