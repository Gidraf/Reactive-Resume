import { idSchema } from "@reactive-resume/schema";
import { createZodDto } from "nestjs-zod/dto";
import { z } from "nestjs-zod/z";

export const whatsappUserSchema = z.object({
  id: idSchema,
  createdAt: z.date().or(z.dateString()).optional(),
  updatedAt: z.date().or(z.dateString()).optional(),
  whatsappProfilePicture: z.literal("").or(z.null()).or(z.string().url()),
  whatsappName: z.string(),
  whatsappNumber: z.string(),
  lastSessionSelection: z.string(),
  currentSession: z.string(),
  previewUrl: z.string(),
  status: z.string(),
  lastCvDetails: z.string(),
  lastjobDescription: z.string(),
  loginToken: z.string(),
});

export class WhatsappUserDto extends createZodDto(whatsappUserSchema) {}

// export const whatsappUsersWithAccountsSchema = whatsappUserSchema.merge(
//   z.object({ }),
// );

// export class UserWithAccounts extends createZodDto(whatsappUsersWithAccountsSchema) {}
