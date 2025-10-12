import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import cuid2 from "@paralleldrive/cuid2";
import { AIServices } from "@reactive-resume/utils";
import { PrismaService } from "nestjs-prisma";

@Injectable()
export class BillingService {
  private readonly workerUrl: string | undefined;
  private readonly verificationId: string | undefined;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.workerUrl = this.configService.get<string>("WORKER_URL");
    this.verificationId = this.configService.get<string>("VERIFICATION_ID");
  }

  async getAccountBalance(userId: string) {
    const account = await this.prismaService.account_balances.findFirst({
      where: { user_id: userId },
    });

    return account;
  }

  async createUsageRecord(data: { user_id: string; item_id?: string; item_type?: string }) {
    const { user_id, item_id, item_type } = data;
    const balance = await this.getAccountBalance(user_id);
    let aiItem = null;
    if (item_type === "ats") {
      aiItem = AIServices.ats.find((item) => item.id === item_id);
    }
    if (
      balance &&
      typeof balance.balance?.toNumber === "function" &&
      typeof aiItem?.token_price === "number" &&
      balance.balance.toNumber() >= aiItem.token_price
    ) {
      const topUp = await this.prismaService.token_top_ups.findFirst({
        where: {
          user_id,
          top_up_status: "completed",
        },
        orderBy: { timestamp: "desc" },
      });
      if (!topUp) {
        throw new Error("No completed purchase top-up found for user.");
      }
      const usageRecord = await this.prismaService.usage_records.create({
        data: {
          id: cuid2.createId(),
          top_up_id: topUp?.id,
          item_name: item_id,
          previous_balance: balance.balance.toNumber(),
          token_quantity: aiItem.token_price,
          new_balance: balance.balance.toNumber() - aiItem.token_price,
          usage_type: item_type,
        },
      });

      await this.updateAccountBalance(user_id, -aiItem.token_price);

      return usageRecord;
    }
    return null;
  }

  async updateAccountBalance(userId: string, amount: number) {
    const balance = await this.getAccountBalance(userId);
    if (balance && typeof balance.balance?.toNumber === "function") {
      const newBalance = Number(balance.balance.toNumber()) + Number(amount);
      const updatedBalance = await this.prismaService.account_balances.update({
        where: { id: balance.id },
        data: { balance: newBalance },
      });
      return updatedBalance;
    } else if (!balance) {
      const newBalance = await this.prismaService.account_balances.create({
        data: {
          id: cuid2.createId(),
          user_id: userId,
          balance: amount,
        },
      });
      return newBalance;
    }
    throw new Error("Unable to update account balance.");
  }

  async getTokenTopUps(userId: string) {
    return await this.prismaService.token_top_ups.findMany({
      where: { user_id: userId, top_up_status: "completed" },
      orderBy: { timestamp: "desc" },
    });
  }

  async getTokenTopUpsUsages(tokenTopUpId: string) {
    return await this.prismaService.usage_records.findMany({
      where: {
        top_up_id: tokenTopUpId,
      },
    });
  }

  async topupTokens({
    userId,
    amount,
    phoneNumber,
  }: {
    userId: string;
    amount: number;
    phoneNumber: string;
  }) {
    const response = await fetch(`${this.workerUrl}/api/v1/checkout/mpesa`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        amount,
        phonenumber: phoneNumber,
        verificationId: this.verificationId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to top up tokens: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Top-up result:", result);
  }
}
