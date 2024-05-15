import { forwardRef, Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { StorageModule } from "../storage/storage.module";
import { WhatsappUserService } from "./user.service";
import { WhatsAppUserController } from "./whatsapp.user.controller";

@Module({
  imports: [forwardRef(() => AuthModule.register()), StorageModule],
  controllers: [WhatsAppUserController],
  providers: [WhatsappUserService],
  exports: [WhatsappUserService],
})
export class WhatsAppUserModule {}
