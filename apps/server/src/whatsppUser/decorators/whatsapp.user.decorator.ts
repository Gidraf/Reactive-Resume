import { ExecutionContext } from "@nestjs/common";
import { createParamDecorator } from "@nestjs/common";
import { UserWithAccounts } from "@reactive-resume/dto";
import { Request } from "express";

export const WhatsappUser = createParamDecorator(
  (data: keyof UserWithAccounts, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest() as Request;
    const whatsappUser = request.user as UserWithAccounts;

    return data ? whatsappUser?.[data] : whatsappUser;
  },
);
