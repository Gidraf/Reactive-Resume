import { idSchema } from "@reactive-resume/schema";
import { dateSchema } from "@reactive-resume/utils";
import { createZodDto } from "nestjs-zod/dto";
import { z } from "zod";

import { userSchema } from "../user";

export const accountBalanceSchema = z.object({
  id: idSchema.default(() => crypto.randomUUID()), // cuid-like ID
  user_id: idSchema,
  user: userSchema.optional(),
  balance: z.number().multipleOf(0.01).default(20),
  updated_at: dateSchema.default(() => new Date()),
});

// For NestJS DTO integration
export class AccountBalanceDto extends createZodDto(accountBalanceSchema) {}
