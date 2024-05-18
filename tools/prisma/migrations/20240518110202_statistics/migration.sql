/*
  Warnings:

  - You are about to drop the `alembic_version` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chat_history` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,id]` on the table `Secrets` will be added. If there are existing duplicate values, this will fail.
  - Made the column `lastSignedIn` on table `Secrets` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Secrets" ALTER COLUMN "lastSignedIn" SET NOT NULL,
ALTER COLUMN "lastSignedIn" SET DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "alembic_version";

-- DropTable
DROP TABLE "chat_history";

-- CreateTable
CREATE TABLE "Statistics" (
    "id" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "resumeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Statistics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Statistics_resumeId_key" ON "Statistics"("resumeId");

-- CreateIndex
CREATE UNIQUE INDEX "Statistics_resumeId_id_key" ON "Statistics"("resumeId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Secrets_userId_id_key" ON "Secrets"("userId", "id");

-- AddForeignKey
ALTER TABLE "Statistics" ADD CONSTRAINT "Statistics_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
