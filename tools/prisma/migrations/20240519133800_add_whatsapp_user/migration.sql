-- AlterTable
ALTER TABLE "User" ADD COLUMN     "whatsappUserId" TEXT;

-- CreateTable
CREATE TABLE "WhatsappUser" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "whatsappProfilePicture" TEXT,
    "whatsappName" TEXT NOT NULL,
    "whatsappNumber" TEXT NOT NULL,
    "lastSessionSelection" JSONB NOT NULL DEFAULT '{}',
    "currentSession" JSONB NOT NULL DEFAULT '{}',
    "previewUrl" TEXT NOT NULL,
    "status" JSONB NOT NULL DEFAULT '{}',
    "lastCvDetails" JSONB NOT NULL DEFAULT '{}',
    "lastjobDescription" JSONB NOT NULL DEFAULT '{}',
    "loginToken" TEXT NOT NULL,

    CONSTRAINT "WhatsappUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappUser_whatsappNumber_key" ON "WhatsappUser"("whatsappNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappUser_id_key" ON "WhatsappUser"("id");

-- CreateIndex
CREATE INDEX "User_whatsappUserId_idx" ON "User"("whatsappUserId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_whatsappUserId_fkey" FOREIGN KEY ("whatsappUserId") REFERENCES "WhatsappUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
