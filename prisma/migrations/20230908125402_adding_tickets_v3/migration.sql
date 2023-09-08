/*
  Warnings:

  - You are about to drop the `Permission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_PermissionToRole` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_RoleToUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `createdAt` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Role` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Permission_action_entity_access_key";

-- DropIndex
DROP INDEX "Session_userId_idx";

-- DropIndex
DROP INDEX "_PermissionToRole_B_index";

-- DropIndex
DROP INDEX "_PermissionToRole_AB_unique";

-- DropIndex
DROP INDEX "_RoleToUser_B_index";

-- DropIndex
DROP INDEX "_RoleToUser_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Permission";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_PermissionToRole";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_RoleToUser";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    PRIMARY KEY ("userId", "roleId"),
    CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GameRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'critic',
    "power" INTEGER NOT NULL,

    PRIMARY KEY ("userId", "roleId"),
    CONSTRAINT "GameRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GameRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "ticketPower" INTEGER NOT NULL,
    CONSTRAINT "Ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ticket_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "noteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Report_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_Role" ("description", "id", "name") SELECT "description", "id", "name" FROM "Role";
DROP TABLE "Role";
ALTER TABLE "new_Role" RENAME TO "Role";
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT,
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "updatedAt", "username") SELECT "createdAt", "email", "id", "name", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
