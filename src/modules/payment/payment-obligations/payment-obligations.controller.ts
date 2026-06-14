import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard';
import { Roles } from '@/modules/common/decorators/roles.decorator';
import { RolesGuard } from '@/modules/common/guards/roles.guard';
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { CreatePaymentObligationSchema, UpdatePaymentObligationSchema } from './payment-obligation.dto';
import { PaymentObligationService } from './payment-obligations.service';
import { Role } from '@/modules/common/enums/role.enum';

@Controller('payment-obligations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentObligationController {
  constructor(private service: PaymentObligationService) {}

  @Post()
  @Roles(Role.Admin, Role.Super_Admin)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: z.infer<typeof CreatePaymentObligationSchema>) {
    const validated = CreatePaymentObligationSchema.parse(body);
    return this.service.create(validated);
  }

  @Get()
  @Roles(Role.Admin, Role.Super_Admin)
  async findAll() {
    return this.service.findAll();
  }

  @Get('player/:playerId')
  async findByPlayer(@Param('playerId', ParseIntPipe) playerId: number) {
    return this.service.findByPlayer(playerId);
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Put(':id')
  @Roles(Role.Admin, Role.Super_Admin)
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: z.infer<typeof UpdatePaymentObligationSchema>) {
    const validated = UpdatePaymentObligationSchema.parse(body);
    return this.service.update(id, validated);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Super_Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.service.delete(id);
  }

  @Patch(':id/status')
  @Roles(Role.Admin, Role.Super_Admin)
  async updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
    return this.service.updateStatus(id, status);
  }
}