import { createZodDto } from "nestjs-zod/dto";

import { whatsappUserSchema } from "./whatsappuser";

export const updateWhatsappUserSchema = whatsappUserSchema.partial().pick({
  whatsappName: true,
  whatsappNumber: true,
  whatsappProfilePicture: true,
  currentSession: true,
  lastSessionSelection: true,
  previewUrl: true,
  status: true,
  lastCvDetails: true,
  lastjobDescription: true,
  loginToken: true,
});

export class UpdateWhatsappUserDto extends createZodDto(updateWhatsappUserSchema) {}
