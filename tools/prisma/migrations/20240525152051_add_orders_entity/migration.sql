/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "whatsappOrderId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "item" JSONB NOT NULL DEFAULT '{}',
    "transactionResponse" JSONB NOT NULL DEFAULT '{}',
    "expiredDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'unpaid',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resumeId" TEXT NOT NULL,
    "whatsappUserId" TEXT NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "Order_userId_resumeId_whatsappOrderId_idx" ON "Order"("userId", "resumeId", "whatsappOrderId");

-- CreateIndex
CREATE INDEX "idx_chat_history_session_id" ON "chat_history"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_whatsappUserId_fkey" FOREIGN KEY ("whatsappUserId") REFERENCES "WhatsappUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
