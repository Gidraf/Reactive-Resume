import { createZodDto } from "nestjs-zod/dto";
import { z } from "nestjs-zod/z";

export const WhatsapploginSchema = z.object({
  identifier: z.string(),
  password: z.password().min(6),
  userId: z.string(),
});

export class WaLoginDto extends createZodDto(WhatsapploginSchema) {}
