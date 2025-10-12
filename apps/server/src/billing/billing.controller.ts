import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { User as UserEntity } from "@prisma/client";

import { TwoFactorGuard } from "../auth/guards/two-factor.guard";
import { User } from "../user/decorators/user.decorator";
import { BillingService } from "./billing.service";

@Controller("billing")
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get("/account-balance")
  @UseGuards(TwoFactorGuard)
  async getAccountBalance(@User() user: UserEntity) {
    return await this.billingService.getAccountBalance(user.id);
  }

  @Get("/token-top-ups")
  @UseGuards(TwoFactorGuard)
  async getTokenTopUps(@User() user: UserEntity) {
    return await this.billingService.getTokenTopUps(user.id);
  }

  @Get("/token-top-ups/usages/:tokenTopUpId")
  @UseGuards(TwoFactorGuard)
  async getTokenTopUpsUsages(@Param() tokenTopUpId: any) {
    const _tokenTopUpId = tokenTopUpId.tokenTopUpId
    return await this.billingService.getTokenTopUpsUsages(_tokenTopUpId);
  }

  @Post("/token-top-up")
  @UseGuards(TwoFactorGuard)
  async topupTokens(
    @User() user: UserEntity,
    @Body() { amount, phoneNumber }: { amount: number; phoneNumber: string },
  ) {
    await this.billingService.topupTokens({
      userId: user.id,
      amount,
      phoneNumber,
    });
  }
}
