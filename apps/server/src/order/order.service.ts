import { Injectable } from "@nestjs/common";
import { UpdateOrderDto } from "@reactive-resume/dto";
import { PrismaService } from "nestjs-prisma";

import { StorageService } from "../storage/storage.service";

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  // async create(userId: string, order: OrderDto, resumeId: string) {
  //   this.prisma.order.create({

  //   })
  // }

  findAll(userId: string) {
    // this.prisma.
    // return this.prisma.resume.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
  }

  findAllOrders() {
    // return this.prisma.resume.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
  }

  async findOne(id: string) {
    const today = new Date();
    const order = await this.prisma.order.findFirst({
      where: {
        resume: { id },
        expiredDate: {
          gt: today,
        },
        status: "paid",
      },
    });

    if (order === null) {
      return null;
    }

    // const isPrivate = !resume.public;
    // const isNotOwner = resume.user.id !== userId;

    // if (isPrivate && isNotOwner) {
    //   throw new HttpException('The resume you are looking does not exist, or maybe never did?', HttpStatus.NOT_FOUND);
    // }

    return order;
    // if (userId) {
    //   return this.prisma.resume.findUniqueOrThrow({ where: { userId_id: { userId, id } } });
    // }
    // return this.prisma.resume.findUniqueOrThrow({ where: { id } });
  }

  update(id: string, updateResumeDto: UpdateOrderDto) {
    console.log("update");
  }

  async remove(d: string) {
    // await Promise.all([
    //   // Remove files in storage, and their cached keys
    //   this.storageService.deleteObject(userId, "resumes", id),
    //   this.storageService.deleteObject(userId, "previews", id),
    // ]);
    // return this.prisma.resume.delete({ where: { userId_id: { userId, id } } });
  }
}
