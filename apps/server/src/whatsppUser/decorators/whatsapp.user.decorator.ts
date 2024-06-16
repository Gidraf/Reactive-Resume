import { ExecutionContext } from "@nestjs/common";
import { createParamDecorator } from "@nestjs/common";
import { WhatsappUserDto } from "@reactive-resume/dto";

export const WhatsappUser = createParamDecorator(
  (data: keyof WhatsappUserDto, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const whatsappUser = request.user as WhatsappUserDto;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return data ? whatsappUser[data] : whatsappUser;
  },
);
