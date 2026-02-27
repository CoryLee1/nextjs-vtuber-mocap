-- CreateTable
CREATE TABLE "EchuuLiveSession" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "characterName" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "voice" TEXT,
    "persona" TEXT,
    "background" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EchuuLiveSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EchuuEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "stepIndex" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EchuuEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EchuuLiveSession_roomId_key" ON "EchuuLiveSession"("roomId");

-- CreateIndex
CREATE INDEX "EchuuEvent_kind_idx" ON "EchuuEvent"("kind");

-- CreateIndex
CREATE INDEX "EchuuEvent_sessionId_idx" ON "EchuuEvent"("sessionId");

-- AddForeignKey
ALTER TABLE "EchuuEvent" ADD CONSTRAINT "EchuuEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "EchuuLiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
