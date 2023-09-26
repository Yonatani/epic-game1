/*
  Warnings:

  - You are about to drop the column `ticketPower` on the `Ticket` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `UserGameRole` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `totalPower` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "RoleTicket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "roleType" TEXT NOT NULL,
    "power" INTEGER NOT NULL,
    CONSTRAINT "RoleTicket_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "videoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalPower" INTEGER NOT NULL,
    CONSTRAINT "Ticket_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Ticket" ("id", "userId", "videoId") SELECT "id", "userId", "videoId" FROM "Ticket";
DROP TABLE "Ticket";
ALTER TABLE "new_Ticket" RENAME TO "Ticket";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "UserGameRole_userId_key" ON "UserGameRole"("userId");
