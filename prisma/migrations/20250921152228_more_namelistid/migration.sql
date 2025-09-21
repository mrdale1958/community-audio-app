/*
  Warnings:

  - Made the column `nameListId` on table `recordings` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_namelists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "names" TEXT NOT NULL,
    "pageNumber" INTEGER,
    "seriesId" TEXT,
    "createdBy" TEXT,
    "description" TEXT,
    "totalPages" INTEGER,
    "namesCount" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "namelists_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_namelists" ("createdAt", "createdBy", "description", "id", "names", "namesCount", "pageNumber", "seriesId", "title", "totalPages", "updatedAt") SELECT "createdAt", "createdBy", "description", "id", "names", "namesCount", "pageNumber", "seriesId", "title", "totalPages", "updatedAt" FROM "namelists";
DROP TABLE "namelists";
ALTER TABLE "new_namelists" RENAME TO "namelists";
CREATE TABLE "new_pdf_downloads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "nameListId" TEXT NOT NULL,
    "downloadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pdf_downloads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_pdf_downloads" ("downloadedAt", "id", "nameListId", "userId") SELECT "downloadedAt", "id", "nameListId", "userId" FROM "pdf_downloads";
DROP TABLE "pdf_downloads";
ALTER TABLE "new_pdf_downloads" RENAME TO "pdf_downloads";
CREATE UNIQUE INDEX "pdf_downloads_userId_nameListId_key" ON "pdf_downloads"("userId", "nameListId");
CREATE TABLE "new_recordings" (
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
    "nameId" TEXT,
    "nameListId" TEXT NOT NULL,
    CONSTRAINT "recordings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "recordings_nameId_fkey" FOREIGN KEY ("nameId") REFERENCES "names" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_recordings" ("createdAt", "duration", "fileHash", "filename", "filesize", "id", "isCorrupted", "lastQualityCheck", "method", "mimetype", "nameId", "nameListId", "originalFilename", "status", "updatedAt", "userId") SELECT "createdAt", "duration", "fileHash", "filename", "filesize", "id", "isCorrupted", "lastQualityCheck", "method", "mimetype", "nameId", "nameListId", "originalFilename", "status", "updatedAt", "userId" FROM "recordings";
DROP TABLE "recordings";
ALTER TABLE "new_recordings" RENAME TO "recordings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
