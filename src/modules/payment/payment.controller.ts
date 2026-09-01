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
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UploadedFile,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import type {
  CreateIntentDto,
  CreateObligationDto,
  CreatePaymentEventDto,
  PaymentObligation,
  UpdatePaymentEventDto,
  VerifyIntentDto,
  VerifyPaymentDto,
} from './payment.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { GetUser } from '../common/decorators/get-user.decorator';
import { AdminOnly } from '../common/decorators/admin-only.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AllRoles } from '../common/decorators/all-roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { PaymentIntentService } from './payment-intent.service';

@Controller('payments')
@UseGuards(RolesGuard)
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService, 
    private readonly paymentIntentService: PaymentIntentService
  ) {}

  // ============================================================
  // GENERATIONS DES PAIEMENTS MENSUELS 
  // ============================================================

  

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
    return this.paymentService.createObligation(dto);
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
  //@Roles(Role.Parent, Role.Admin, Role.Super_Admin)
  @Public()
  async getObligations(
    @GetUser('id') userId: number,
    @Query() query: any
  ) {
    //console.log(`Getting obligations `);
    const obligations = await this.paymentService.getAllObligations(query);
    return obligations;
  }

  @Patch('obligations/:id')
  @AllRoles()
  @HttpCode(HttpStatus.OK)
  async updateObligation(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    
    return this.paymentService.updateObligation(id, data.obligation);
  }

  // ============================================================
  // INTENTIONS DE PAIEMENT (parent)
  // ============================================================

/* // ============================================================
  // CRÉATION (PARENT)
  // ============================================================

  @Post('intents')
  @Roles(Role.Parent, Role.Admin, Role.Super_Admin)
  @UseInterceptors(FileInterceptor('screenshot'))
  async create(
    @GetUser() user: any,
    @Body() dto: CreateIntentDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5 Mo
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|jpg)$/ }),
        ],
      }),
    )
    screenshot: Express.Multer.File,
  ) {
    return this.paymentIntentService.create(user.id, dto, screenshot);
  }

  // ============================================================
  // LISTE DES INTENTIONS D'UNE OBLIGATION (PARENT, ADMIN)
  // ============================================================

  @Get('intents/obligation/:obligationId')
  @Roles(Role.Parent, Role.Admin, Role.Super_Admin)
  async getByObligation(
    @GetUser() user: any,
    @Param('obligationId', ParseIntPipe) obligationId: number,
  ) {
    // TODO: Vérifier que le parent a le droit de voir cette obligation
    return this.paymentIntentService.getByObligation(obligationId, user.id);
  }

  // ============================================================
  // LISTE DES INTENTIONS EN ATTENTE (ADMIN)
  // ============================================================

  @Get('intents/pending')
  @AdminOnly()
  async getPending() {
    return this.paymentIntentService.getPendingForAdmin();
  }

  // ============================================================
  // DÉTAIL D'UNE INTENTION (ADMIN)
  // ============================================================

  @Get('intents/:id')
  @Roles(Role.Admin, Role.Super_Admin, Role.Parent)
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.paymentIntentService.getById(id);
  }

  // ============================================================
  // VÉRIFICATION (ADMIN)
  // ============================================================

  @Patch(':id/verify')
  @AdminOnly()
  @HttpCode(HttpStatus.OK)
  async verify(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() admin: any,
    @Body() dto: VerifyIntentDto,
  ) {
    return this.paymentIntentService.verify(id, admin.id, dto);
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
 */
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
  async getAllObligations(@Query() query: any) {
    // Méthode à ajouter dans le service (non inclus, à implémenter)
    const obligations =  this.paymentService.getAllObligations(query);
    console.log(`requested Obligations: ${obligations}`);
    return obligations;
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