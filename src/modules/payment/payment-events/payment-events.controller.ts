import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PaymentEventsService } from './payment-events.service';
import { RolesGuard } from '../../../modules/common/guards/roles.guard';
import { Roles } from '../../../modules/common/decorators/roles.decorator';
import { Role } from '../../../modules/common/enums/role.enum';
import type { CreatePaymentEventDto, UpdatePaymentEventDto } from '../dto/payment.dto';

@Controller('admin/payment-events')
@UseGuards(RolesGuard)
@Roles(Role.Admin, Role.Super_Admin)
export class PaymentEventsController {
  constructor(private readonly service: PaymentEventsService) {}

  @Post()
  create(@Body() dto: CreatePaymentEventDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll(false);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePaymentEventDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}

// Endpoint public pour récupérer les événements actifs
@Controller('payment-events')
export class PublicPaymentEventsController {
  constructor(private readonly service: PaymentEventsService) {}

  @Get()
  getActiveEvents() {
    return this.service.findAll(true);
  }
}