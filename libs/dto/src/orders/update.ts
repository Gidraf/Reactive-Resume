import { createZodDto } from "nestjs-zod/dto";


import { orderSchema } from "./create";

export const updateOrderSchema = orderSchema.partial();

export class UpdateOrderDto extends createZodDto(updateOrderSchema) {}