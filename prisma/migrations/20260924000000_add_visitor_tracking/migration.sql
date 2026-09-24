-- CreateTable
CREATE TABLE "visitor_sessions" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "ip" TEXT,
    "country" TEXT,
    "userAgent" TEXT,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pageCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "visitor_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit_events" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "title" TEXT,
    "referrer" TEXT,
    "ip" TEXT,
    "country" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "ip" TEXT,
    "country" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "visitor_sessions_visitorId_key" ON "visitor_sessions"("visitorId");

-- CreateIndex
CREATE INDEX "visitor_sessions_country_idx" ON "visitor_sessions"("country");

-- CreateIndex
CREATE INDEX "visitor_sessions_lastSeen_idx" ON "visitor_sessions"("lastSeen");

-- CreateIndex
CREATE INDEX "visit_events_visitorId_createdAt_idx" ON "visit_events"("visitorId", "createdAt");

-- CreateIndex
CREATE INDEX "visit_events_path_idx" ON "visit_events"("path");

-- CreateIndex
CREATE INDEX "visit_events_country_idx" ON "visit_events"("country");

-- CreateIndex
CREATE INDEX "visit_events_createdAt_idx" ON "visit_events"("createdAt");

-- CreateIndex
CREATE INDEX "login_records_createdAt_idx" ON "login_records"("createdAt");

-- CreateIndex
CREATE INDEX "login_records_userId_idx" ON "login_records"("userId");