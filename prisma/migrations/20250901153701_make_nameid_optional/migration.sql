-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "nameListId" TEXT,
    CONSTRAINT "recordings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "recordings_nameId_fkey" FOREIGN KEY ("nameId") REFERENCES "names" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "recordings_nameListId_fkey" FOREIGN KEY ("nameListId") REFERENCES "namelists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_recordings" ("createdAt", "duration", "fileHash", "filename", "filesize", "id", "isCorrupted", "lastQualityCheck", "method", "mimetype", "nameId", "nameListId", "originalFilename", "status", "updatedAt", "userId") SELECT "createdAt", "duration", "fileHash", "filename", "filesize", "id", "isCorrupted", "lastQualityCheck", "method", "mimetype", "nameId", "nameListId", "originalFilename", "status", "updatedAt", "userId" FROM "recordings";
DROP TABLE "recordings";
ALTER TABLE "new_recordings" RENAME TO "recordings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
