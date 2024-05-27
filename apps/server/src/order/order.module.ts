import { Module } from "@nestjs/common";

import { AuthModule } from "@/server/auth/auth.module";

import { StorageModule } from "../storage/storage.module";
import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";

@Module({
  imports: [AuthModule, StorageModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
