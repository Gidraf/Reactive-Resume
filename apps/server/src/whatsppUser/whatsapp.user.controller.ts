import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { UpdateWhatsappUserDto, WhatsappUserDto } from "@reactive-resume/dto";
import { ErrorMessage } from "@reactive-resume/utils";

import { AuthService } from "../auth/auth.service";
import { WhatsappUser } from "./decorators/whatsapp.user.decorator";
import { WhatsappUserService } from "./user.service";

@ApiTags("WhatsappUser")
@Controller("whatsappuser")
export class WhatsAppUserController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: WhatsappUserService,
  ) {}

  @Get("me/:whatsappNumber")
  // @UseGuards(TwoFactorGuard)
  fetch(@Param("whatsappNumber") whatsappNumber: string) {
    const user = this.userService.findOneByIdentifier(whatsappNumber);
    return user;
  }

  @Put("update")
  // @UseGuards(TwoFactorGuard)
  async update(
    @WhatsappUser("whatsappNumber") whatsappNumber: string,
    @Body() updateWhatsappUserDto: UpdateWhatsappUserDto,
  ) {
    try {
      // Updates user session on whatsapp bot
      if (
        updateWhatsappUserDto.whatsappNumber &&
        updateWhatsappUserDto.whatsappNumber !== whatsappNumber
      ) {
        return await this.userService.updateByWhatsappNumber(whatsappNumber, {
          ...updateWhatsappUserDto,
        });
      }
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
        throw new BadRequestException(ErrorMessage.UserAlreadyExists);
      }

      Logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }

  @Post("create")
  // @UseGuards(TwoFactorGuard)
  async create(
    @WhatsappUser("whatsappNumber") whatsappNumber: string,
    @Body() whatsappUserDto: WhatsappUserDto,
  ) {
    try {
      // Updates user session on whatsapp bot
      // if (
      // updateWhatsappUserDto.whatsappNumber &&
      // updateWhatsappUserDto.whatsappNumber !== whatsappNumber
      // ) {
      return await this.userService.create({
        ...whatsappUserDto,
      });
      // }
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
        throw new BadRequestException(ErrorMessage.UserAlreadyExists);
      }

      Logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }
}
