import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { RedisService } from "@songkeys/nestjs-redis";
import Redis from "ioredis";
import { PrismaService } from "nestjs-prisma";

import { StorageService } from "../storage/storage.service";

@Injectable()
export class WhatsappUserService {
  private readonly redis: Redis;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly redisService: RedisService,
  ) {
    this.redis = this.redisService.getClient();
  }

  async findOneById(id: string) {
    const user = await this.prisma.whatsappUser.findUniqueOrThrow({
      where: { id },
      include: { users: true },
    });

    return user;
  }

  async findOneByIdentifier(whatsappNumber: string) {
    const user = await (async (whatsappNumber: string) => {
      // First, find the user by email
      const user = await this.prisma.whatsappUser.findFirst({
        where: { whatsappNumber: whatsappNumber },
        include: { users: true },
      });

      // If the user exists, return it
      if (user) {
        return user;
      }
      return undefined;
    })(whatsappNumber);

    return user;
  }

  async create(data: Prisma.WhatsappUserCreateInput) {
    return await this.prisma.whatsappUser.create({ data, include: { users: true } });
  }

  async updateByWhatsappNumber(
    whatsappNumber: string,
    data: Prisma.WhatsappUserUpdateArgs["data"],
  ) {
    return await this.prisma.whatsappUser.update({ where: { whatsappNumber }, data });
  }
}
