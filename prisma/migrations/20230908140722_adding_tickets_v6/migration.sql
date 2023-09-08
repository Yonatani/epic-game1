/*
  Warnings:

  - You are about to drop the `GameRole` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `gameRoleId` on the `UserGameRole` table. All the data in the column will be lost.
  - Added the required column `type` to the `UserGameRole` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "GameRole";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserGameRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "power" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "UserGameRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UserGameRole" ("id", "userId") SELECT "id", "userId" FROM "UserGameRole";
DROP TABLE "UserGameRole";
ALTER TABLE "new_UserGameRole" RENAME TO "UserGameRole";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
