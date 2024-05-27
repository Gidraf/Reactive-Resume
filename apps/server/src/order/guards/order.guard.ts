import { CanActivate, ExecutionContext, Injectable, NotFoundException } from "@nestjs/common";
import { UserWithSecrets } from "@reactive-resume/dto";
import { ErrorMessage } from "@reactive-resume/utils";
import { Request } from "express";

import { OrderService } from "../order.service";

@Injectable()
export class OrderGuard implements CanActivate {
  constructor(private readonly orderService: OrderService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as UserWithSecrets | false;

    try {
      const resume = await this.orderService.findOne(request.params.id);

      return true;
    } catch {
      throw new NotFoundException(ErrorMessage.ResumeNotFound);
    }
  }
}
