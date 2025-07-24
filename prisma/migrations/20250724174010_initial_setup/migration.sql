-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CONTRIBUTOR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "namelists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "names" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "seriesId" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "namelists_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "recordings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "filesize" INTEGER NOT NULL,
    "mimetype" TEXT NOT NULL,
    "fileHash" TEXT,
    "isCorrupted" BOOLEAN NOT NULL DEFAULT false,
    "lastQualityCheck" DATETIME,
    "duration" REAL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "method" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "nameListId" TEXT NOT NULL,
    CONSTRAINT "recordings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "recordings_nameListId_fkey" FOREIGN KEY ("nameListId") REFERENCES "namelists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "exhibitions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "psaFrequency" INTEGER NOT NULL DEFAULT 50,
    "galleryHours" TEXT NOT NULL,
    "settings" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "galleristId" TEXT NOT NULL,
    CONSTRAINT "exhibitions_galleristId_fkey" FOREIGN KEY ("galleristId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "exhibition_psas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "filesize" INTEGER NOT NULL,
    "duration" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exhibitionId" TEXT NOT NULL,
    CONSTRAINT "exhibition_psas_exhibitionId_fkey" FOREIGN KEY ("exhibitionId") REFERENCES "exhibitions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "exhibition_queue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "position" INTEGER NOT NULL,
    "hasPlayed" BOOLEAN NOT NULL DEFAULT false,
    "playedAt" DATETIME,
    "queueCycle" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exhibitionId" TEXT NOT NULL,
    "recordingId" TEXT NOT NULL,
    CONSTRAINT "exhibition_queue_exhibitionId_fkey" FOREIGN KEY ("exhibitionId") REFERENCES "exhibitions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "exhibition_queue_recordingId_fkey" FOREIGN KEY ("recordingId") REFERENCES "recordings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "exhibition_playback_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "playedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" REAL,
    "wasSkipped" BOOLEAN NOT NULL DEFAULT false,
    "exhibitionId" TEXT NOT NULL,
    CONSTRAINT "exhibition_playback_logs_exhibitionId_fkey" FOREIGN KEY ("exhibitionId") REFERENCES "exhibitions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "exhibition_queue_exhibitionId_recordingId_queueCycle_key" ON "exhibition_queue"("exhibitionId", "recordingId", "queueCycle");
