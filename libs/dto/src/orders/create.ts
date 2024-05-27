import { idSchema } from "@reactive-resume/schema";
import { createZodDto } from "nestjs-zod/dto";
import { z } from "nestjs-zod/z";

import { resumeSchema } from "../resume";
import { userSchema } from "../user/user";
import { whatsappUserSchema } from "../whatsappUser/whatsappuser";

export const orderSchema = z.object({
  id: idSchema,
  createdAt: z.date().or(z.dateString()).optional(),
  updatedAt: z.date().or(z.dateString()).optional(),
  whatsappOrderId: z.string(),
  amount: z.string(),
  transactionId: z.string(),
  status: z.string(),
  item: z.string(),
  transactionResponse: z.string().optional(),
  expiredDate: z.date(),
  resumeId: idSchema,
  resume: resumeSchema,
  whatsappUserId: idSchema,
  whatsappUser: whatsappUserSchema.optional(),
  userId: idSchema,
  user: userSchema.optional(),
});

export class OrderDto extends createZodDto(orderSchema) {}
