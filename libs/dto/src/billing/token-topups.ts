import { idSchema } from "@reactive-resume/schema";
import { dateSchema } from "@reactive-resume/utils";
import { createZodDto } from "nestjs-zod/dto";
import { z } from "zod";

import { userSchema } from "../user";

export const tokenTopupSchema = z.object({
  id: idSchema, // cuid equivalent
  user: userSchema.optional(),
  user_id: idSchema,
  amount: z.number().multipleOf(0.01).nonnegative(), // matches Numeric(12,2)
  currency: z.string().default("KES"),
  token_value: z.string().optional(),
  description: z.string().optional(),
  timestamp: dateSchema.default(() => new Date()),
  previous_balance: z.number().int().default(0),
  new_balance: z.number().int().default(0),
  top_up_type: z
    .enum(["purchase", "initial", "promo", "refund", "discount", "offer"])
    .default("purchase"),
  top_up_status: z.enum(["pending", "completed", "failed"]).optional(),
  transaction_reference: z.string().optional(),
});

// For NestJS DTO integration
export class TokenTopupDto extends createZodDto(tokenTopupSchema) {}
