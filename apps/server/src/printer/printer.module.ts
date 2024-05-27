import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";

import { OrderModule } from "../order/order.module";
import { StorageModule } from "../storage/storage.module";
import { PrinterService } from "./printer.service";

@Module({
  imports: [HttpModule, StorageModule, OrderModule],
  providers: [PrinterService],
  exports: [PrinterService],
})
export class PrinterModule {}
