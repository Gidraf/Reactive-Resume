import {
  BadRequestException,
  Body,
  Controller,
  InternalServerErrorException,
  Logger,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { User as UserEntity } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { ErrorMessage } from "@reactive-resume/utils";

import { TwoFactorGuard } from "../auth/guards/two-factor.guard";
import { User } from "../user/decorators/user.decorator";
import { AgentService } from "./agent.service";

@ApiTags("Agent")
@Controller("agent")
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post("/improve-writing")
  @UseGuards(TwoFactorGuard)
  async improveWriting(
    @User() user: UserEntity,
    @Body() { text, item_id, item_type }: { text: string; item_id: string; item_type: string },
  ) {
    try {
      return await this.agentService.improveWriting(text, user, item_type, item_id);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
        throw new BadRequestException(ErrorMessage.ResumeSlugAlreadyExists);
      }

      Logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }

  @Post("/match-jd")
  @UseGuards(TwoFactorGuard)
  async matchJobDescription(
    @User() user: UserEntity,
    @Param("resumeId") resumeId: string,
    @Body() { text, item_id, item_type }: { text: string; item_id: string; item_type: string },
  ) {
    try {
      return await this.agentService.matchJobDescription(text, user, resumeId, item_type, item_id);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
        throw new BadRequestException(ErrorMessage.ResumeSlugAlreadyExists);
      }

      Logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }

  @Post("/infographics")
  @UseGuards(TwoFactorGuard)
  async revampVisualize(
    @User() user: UserEntity,
    @Param("resumeId") resumeId: string,
    @Body() { text, item_id, item_type }: { text: string; item_id: string; item_type: string },
  ) {
    try {
      return await this.agentService.revampToInfographic(text, user, resumeId, item_type, item_id);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
        throw new BadRequestException(ErrorMessage.ResumeSlugAlreadyExists);
      }

      Logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }

  // @Post("/ats-compliant")
  // @UseGuards(TwoFactorGuard)
  // async makeAtsCompliant(@User() user: UserEntity, @Body() text: string) {
  //   try {
  //     return await this.agentService.improveWriting(text, user);
  //   } catch (error) {
  //     if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
  //       throw new BadRequestException(ErrorMessage.ResumeSlugAlreadyExists);
  //     }

  //     Logger.error(error);
  //     throw new InternalServerErrorException(error);
  //   }
  // }
}
