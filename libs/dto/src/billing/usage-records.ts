import { idSchema } from "@reactive-resume/schema";
import { dateSchema } from "@reactive-resume/utils";
import { createZodDto } from "nestjs-zod/dto";
import { z } from "zod";

import { tokenTopupSchema } from "./token-topups";

export const usageRecordSchema = z.object({
  id: idSchema.default(() => crypto.randomUUID()), // cuid equivalent
  top_up_id: idSchema.nullable().optional(), // nullable FK to TokenTopUps
  token_quantity: z.number().int().default(1),
  timestamp: dateSchema.default(() => new Date()),
  usage_type: z.string().optional(),
  item_name: z.string().optional(),
  previous_balance: z.number().int().default(0),
  new_balance: z.number().int().default(0),
  top_up: tokenTopupSchema.optional(),
});

// For NestJS DTO integration
export class UsageRecordDto extends createZodDto(usageRecordSchema) {}
