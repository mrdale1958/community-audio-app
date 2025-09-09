-- CreateTable
CREATE TABLE "pdf_downloads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "nameListId" TEXT NOT NULL,
    "downloadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pdf_downloads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pdf_downloads_nameListId_fkey" FOREIGN KEY ("nameListId") REFERENCES "namelists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "pdf_downloads_userId_nameListId_key" ON "pdf_downloads"("userId", "nameListId");
