import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { PrismaModule } from "nestjs-prisma";

import { BillingModule } from "../billing/billing.module";
import { StorageModule } from "../storage/storage.module";
import { AgentController } from "./agent.controller";
import { AgentService } from "./agent.service";

@Module({
  imports: [HttpModule, StorageModule, PrismaModule, BillingModule],
  providers: [AgentService],
  exports: [AgentService],
  controllers: [AgentController],
})
export class AgentModule {}
