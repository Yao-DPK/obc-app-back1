// src/modules/payment/payment.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
  Query,
  Delete,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import type {
  CreateIntentDto,
  CreateObligationDto,
  CreatePaymentEventDto,
  UpdatePaymentEventDto,
  VerifyPaymentDto,
} from './payment.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { GetUser } from '../common/decorators/get-user.decorator';
import { AdminOnly } from '../common/decorators/admin-only.decorator';

@Controller('payments')
@UseGuards(RolesGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // ============================================================
  // ÉVÉNEMENTS (public / parent)
  // ============================================================

  @Get('events')
  @Roles(Role.Parent, Role.Admin, Role.Super_Admin)
  async getActiveEvents() {
    return this.paymentService.getActiveEvents();
  }

  @Get('events/:id')
  @Roles(Role.Parent, Role.Admin, Role.Super_Admin)
  async getEventById(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.getEventById(id);
  }

  // ============================================================
  // OBLIGATIONS (parent)
  // ============================================================

  @Post('obligations')
  @Roles(Role.Parent, Role.Admin, Role.Super_Admin)
  @HttpCode(HttpStatus.CREATED)
  async createObligation(
    @GetUser('id') userId: number,
    @Body() dto: CreateObligationDto,
  ) {
    return this.paymentService.createObligation(userId, dto);
  }

  @Get('obligations')
  @Roles(Role.Parent, Role.Admin, Role.Super_Admin)
  async getMyObligations(@GetUser('id') userId: number) {
    return this.paymentService.getObligationsByUser(userId);
  }

  @Get('obligations/:id')
  @Roles(Role.Parent, Role.Admin, Role.Super_Admin)
  async getObligationWithIntents(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.getObligationWithIntents(id);
  }

  @Patch('obligations/:id/cancel')
  @Roles(Role.Parent)
  @HttpCode(HttpStatus.OK)
  async cancelObligation(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.paymentService.cancelObligation(id, userId);
  }

  @Get('obligations')
  @Roles(Role.Parent, Role.Admin, Role.Super_Admin)
  async getObligations(
    @GetUser('id') userId: number,
    @Query('playerIds') playerIds?: string,
  ) {
    if (playerIds) {
      const ids = playerIds.split(',').map(id => parseInt(id));
      return this.paymentService.getObligationsByPlayerIds(ids);
    }
    return this.paymentService.getObligationsByUser(userId);
  }

  @Patch('obligations/:id/status')
  @AdminOnly()
  @HttpCode(HttpStatus.OK)
  async updateObligationStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    return this.paymentService.updateObligationStatus(id, status);
  }

  // ============================================================
  // INTENTIONS DE PAIEMENT (parent)
  // ============================================================

  @Post('intents')
  @Roles(Role.Parent, Role.Admin, Role.Super_Admin)
  @HttpCode(HttpStatus.CREATED)
  async createIntent(
    @GetUser('id') userId: number,
    @Body() dto: CreateIntentDto,
  ) {
    return this.paymentService.createIntent(userId, dto);
  }

  @Get('intents')
  @Roles(Role.Parent, Role.Admin, Role.Super_Admin)
  async getMyIntents(@GetUser('id') userId: number) {
    return this.paymentService.getIntentsByUser(userId);
  }

  @Get('intents/:id')
  @Roles(Role.Parent, Role.Admin, Role.Super_Admin)
  async getIntentById(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.getIntentById(id);
  }

  @Get('intents/reference/:ref')
  @Roles(Role.Admin, Role.Super_Admin)
  async getIntentByReference(@Param('ref') ref: string) {
    return this.paymentService.getTransactionByReference(ref);
  }

  // ============================================================
  // VÉRIFICATION (admin)
  // ============================================================

  @Patch('verify')
  @AdminOnly()
  @HttpCode(HttpStatus.OK)
  async verifyPayment(
    @GetUser('id') adminId: number,
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.paymentService.verifyPayment(adminId, dto);
  }

  // ============================================================
  // RÉSUMÉ (parent)
  // ============================================================

  @Get('summary')
  @Roles(Role.Parent, Role.Admin, Role.Super_Admin)
  async getMySummary(@GetUser('id') userId: number) {
    return this.paymentService.getUserPaymentSummary(userId);
  }

  // ============================================================
  // ADMIN / SUPER_ADMIN : VUE GLOBALE
  // ============================================================

  @Get('admin/obligations')
  @AdminOnly()
  async getAllObligations() {
    // Méthode à ajouter dans le service (non inclus, à implémenter)
    return this.paymentService.getAllObligations();
  }

  @Get('admin/intents')
  @AdminOnly()
  async getAllIntents() {
    // Méthode à ajouter dans le service (non inclus, à implémenter)
    return this.paymentService.getAllIntents();
  }

  @Get('admin/summary/:userId')
  @AdminOnly()
  async getUserSummary(@Param('userId', ParseIntPipe) userId: number) {
    return this.paymentService.getUserPaymentSummary(userId);
  }

  // ============================================================
  // ADMIN : GESTION DES ÉVÉNEMENTS
  // ============================================================

  @Get('admin/events')
  @AdminOnly()
  async getAllEvents(@Query('includeInactive') includeInactive: string) {
    const include = includeInactive === 'true';
    return this.paymentService.getAllEvents(include);
  }

  @Post('admin/events')
  @AdminOnly()
  @HttpCode(HttpStatus.CREATED)
  async createEvent(@Body() dto: CreatePaymentEventDto) {
    return this.paymentService.createEvent(dto);
  }

  @Patch('admin/events/:id')
  @AdminOnly()
  @HttpCode(HttpStatus.OK)
  async updateEvent(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePaymentEventDto,
  ) {
    return this.paymentService.updateEvent(id, dto);
  }

  @Delete('admin/events/:id')
  @AdminOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEvent(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.deleteEvent(id);
  }
}