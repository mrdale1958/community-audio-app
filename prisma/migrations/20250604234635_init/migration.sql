-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CONTRIBUTOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "bio" TEXT,
    "preferredLanguage" TEXT,
    "location" TEXT,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "name_lists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "pageNumber" INTEGER NOT NULL,
    "names" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "totalNames" INTEGER NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "category" TEXT,
    "instructions" TEXT
);

-- CreateTable
CREATE TABLE "recordings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "duration" REAL,
    "recordingMethod" TEXT NOT NULL,
    "deviceInfo" TEXT,
    "recordingQuality" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    "processingNotes" TEXT,
    "normalizedPath" TEXT,
    "userId" TEXT NOT NULL,
    "nameListId" TEXT NOT NULL,
    "recordedAt" DATETIME,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "recordings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "recordings_nameListId_fkey" FOREIGN KEY ("nameListId") REFERENCES "name_lists" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "exhibition_queue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "position" INTEGER NOT NULL,
    "played" BOOLEAN NOT NULL DEFAULT false,
    "playedAt" DATETIME,
    "playbackDuration" REAL,
    "skipReason" TEXT,
    "recordingId" TEXT NOT NULL,
    "queuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "exhibition_queue_recordingId_fkey" FOREIGN KEY ("recordingId") REFERENCES "recordings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contributor_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentAt" DATETIME,
    "deliveredAt" DATETIME,
    "errorMsg" TEXT,
    "scheduledFor" DATETIME,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'system',
    "exhibitionActive" BOOLEAN NOT NULL DEFAULT false,
    "currentPosition" INTEGER,
    "playbackSpeed" REAL NOT NULL DEFAULT 1.0,
    "pauseBetweenRecordings" INTEGER NOT NULL DEFAULT 2,
    "maxFileSizeMB" INTEGER NOT NULL DEFAULT 50,
    "allowedFileTypes" TEXT NOT NULL DEFAULT '["mp3","wav","m4a"]',
    "audioNormalization" BOOLEAN NOT NULL DEFAULT true,
    "targetLoudness" REAL NOT NULL DEFAULT -23.0,
    "reminderFrequencyDays" INTEGER NOT NULL DEFAULT 7,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "exhibition_queue_position_key" ON "exhibition_queue"("position");

-- CreateIndex
CREATE UNIQUE INDEX "exhibition_queue_recordingId_key" ON "exhibition_queue"("recordingId");
