/*
  Warnings:

  - A unique constraint covering the columns `[whatsappUserId,id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[whatsappUserId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id]` on the table `WhatsappUser` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "User_whatsappUserId_idx" ON "User"("whatsappUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_whatsappUserId_id_key" ON "User"("whatsappUserId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "User_whatsappUserId_key" ON "User"("whatsappUserId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappUser_id_key" ON "WhatsappUser"("id");
