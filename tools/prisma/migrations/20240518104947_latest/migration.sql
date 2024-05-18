/*
  Warnings:

  - You are about to drop the `Statistics` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Statistics" DROP CONSTRAINT "Statistics_resumeId_fkey";

-- DropIndex
DROP INDEX "Secrets_userId_id_key";

-- AlterTable
ALTER TABLE "Secrets" ALTER COLUMN "lastSignedIn" DROP NOT NULL,
ALTER COLUMN "lastSignedIn" DROP DEFAULT;

-- DropTable
DROP TABLE "Statistics";

-- CreateTable
CREATE TABLE "alembic_version" (
    "version_num" VARCHAR(32) NOT NULL,

    CONSTRAINT "alembic_version_pkc" PRIMARY KEY ("version_num")
);

-- CreateTable
CREATE TABLE "chat_history" (
    "id" SERIAL NOT NULL,
    "session_id" UUID NOT NULL,
    "message" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_chat_history_session_id" ON "chat_history"("session_id");
