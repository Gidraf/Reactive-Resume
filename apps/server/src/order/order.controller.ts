import { Body, Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { OrderDto } from "@reactive-resume/dto";

import { OrderGuard } from "./guards/order.guard";
import { OrderService } from "./order.service";

@ApiTags("Order")
@Controller("order")
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // @Post()
  // @UseGuards(TwoFactorGuard)
  // async create(@User() user: UserEntity, @Body() orderDto: OrderDto, resumeId: string) {
  //   try {
  //     return await this.orderService.create(user.id, orderDto, resumeId);
  //   } catch (error) {
  //     if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
  //       throw new BadRequestException(ErrorMessage.SomethingWentWrong);
  //     }

  //     Logger.error(error);
  //     throw new InternalServerErrorException(error);
  //   }
  // }

  // @Get()
  // @UseGuards(TwoFactorGuard)
  // findAll(@User() user: UserEntity) {
  //   return this.orderService.findAll(user.id);
  // }

  // @Get()
  // @UseGuards(TwoFactorGuard)
  // findAllOrder(@User() user: UserEntity) {
  //   return this.orderService.findAllOrders();
  // }

  @Get(":id")
  @UseGuards(OrderGuard)
  findOne(@Body() order: OrderDto) {
    console.log(order);
    return order;
  }

  // @Patch(":id")
  // @UseGuards(OrderGuard)
  // update(
  //   @Param("id") id: string,
  //   @Body() updateOrder: UpdateOrderDto,
  // ) {
  //   return this.orderService.update( id, updateOrder);
  // }

  // @Delete(":id")
  // @UseGuards(OrderGuard)
  // remove(@User() user: UserEntity, @Param("id") id: string) {
  //   return this.orderService.remove(id);
  // }
}
