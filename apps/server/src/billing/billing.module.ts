import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { PrismaModule } from "nestjs-prisma";

import { StorageModule } from "../storage/storage.module";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";

@Module({
  imports: [HttpModule, StorageModule, PrismaModule],
  providers: [BillingService],
  exports: [BillingService],
  controllers: [BillingController],
})
export class BillingModule {}
