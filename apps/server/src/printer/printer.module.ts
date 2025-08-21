import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { PrismaModule } from "nestjs-prisma";

import { StorageModule } from "../storage/storage.module";
import { PrinterService } from "./printer.service";

@Module({
  imports: [HttpModule, StorageModule, PrismaModule],
  providers: [PrinterService, PrinterService],
  exports: [PrinterService],
})
export class PrinterModule {}
