-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserGameRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "power" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "UserGameRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserGameRole" ("id", "power", "type", "userId") SELECT "id", "power", "type", "userId" FROM "UserGameRole";
DROP TABLE "UserGameRole";
ALTER TABLE "new_UserGameRole" RENAME TO "UserGameRole";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
