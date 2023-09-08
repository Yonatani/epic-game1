/*
  Warnings:

  - The primary key for the `GameRole` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `roleId` on the `GameRole` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `GameRole` table. All the data in the column will be lost.
  - The primary key for the `UserRole` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The required column `id` was added to the `GameRole` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `id` was added to the `UserRole` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateTable
CREATE TABLE "UserGameRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameRoleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "UserGameRole_gameRoleId_fkey" FOREIGN KEY ("gameRoleId") REFERENCES "GameRole" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserGameRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GameRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'critic',
    "power" INTEGER NOT NULL,
    CONSTRAINT "GameRole_id_fkey" FOREIGN KEY ("id") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_GameRole" ("power", "type") SELECT "power", "type" FROM "GameRole";
DROP TABLE "GameRole";
ALTER TABLE "new_GameRole" RENAME TO "GameRole";
CREATE TABLE "new_UserRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UserRole" ("roleId", "userId") SELECT "roleId", "userId" FROM "UserRole";
DROP TABLE "UserRole";
ALTER TABLE "new_UserRole" RENAME TO "UserRole";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
