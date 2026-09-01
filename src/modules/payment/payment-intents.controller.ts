import { Body, Controller, FileTypeValidator, Get, HttpCode, HttpStatus, MaxFileSizeValidator, Param, ParseFilePipe, ParseIntPipe, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { RolesGuard } from "../common/guards/roles.guard";
import { Role } from "../common/enums/role.enum";
import { Roles } from "../common/decorators/roles.decorator";
import { FileInterceptor } from "@nestjs/platform-express";
import { GetUser } from "../common/decorators/get-user.decorator";
import type { CreateIntentDto, VerifyIntentDto, VerifyPaymentDto } from "./payment.dto";
import { PaymentService } from "./payment.service";
import { PaymentIntentService } from "./payment-intent.service";
import { AdminOnly } from "../common/decorators/admin-only.decorator";
import { AllRoles } from "../common/decorators/all-roles.decorator";
import { IntentFilters } from "./payment-intent.repository";

@Controller('payments/intents')
@UseGuards(RolesGuard)
export class PaymentIntentController{

    constructor(
        private readonly paymentService: PaymentService, 
        private readonly paymentIntentService: PaymentIntentService
      ) {}

    // ============================================================
      // CRÉATION (PARENT)
      // ============================================================
    
      @Post()
      @Roles(Role.Player, Role.Parent, Role.Admin, Role.Super_Admin)
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
      
      @Get()
      @AdminOnly()
      async getIntents(
        @Query('userId') userId?: string,
        @Query('obligationId') obligationId?: string,
        @Query('status') status?: string,
        @Query('createdFrom') createdFrom?: string,
        @Query('createdTo') createdTo?: string,
      ) {
        // Construire l'objet de filtres
        const filters: IntentFilters = {};

        if (userId) filters.userId = Number(userId);
        if (obligationId) filters.obligationId = Number(obligationId);
        if (status) filters.status = status;
        if (createdFrom) filters.createdFrom = createdFrom;
        if (createdTo) filters.createdTo = createdTo;

        return this.paymentIntentService.findIntents(filters);
      }

      @Get()
      @AdminOnly()
      async getIntent(
        @Query('userId') userId?: number,
        @Query('obligationId') obligationId?: number,
        @Query('createdFrom') createdFrom?: string,
        @Query('createdTo') createdTo?: string,
      ) {
        // Construire l'objet de filtres
        const filters: IntentFilters = {};

        if (userId) filters.userId = userId;
        if (obligationId) filters.obligationId = obligationId;
        if (createdFrom) filters.createdFrom = createdFrom;
        if (createdTo) filters.createdTo = createdTo;

        return this.paymentIntentService.findIntent(filters);
      }


      @Get('obligation/:obligationId')
      @AllRoles()
      async getByObligation(
        @GetUser() user: any,
        @Param('obligationId', ParseIntPipe) obligationId: number,
      ) {
        // TODO: Vérifier que le parent a le droit de voir cette obligation
        const intents = await this.paymentIntentService.getByObligation(obligationId, user.id);
        return intents
      }

      
      // ============================================================
      // LISTE DES INTENTIONS EN ATTENTE (ADMIN)
      // ============================================================
      
      @Get('pending')
      @AdminOnly()
      async getPending() {
        return this.paymentIntentService.getPendingForAdmin();
      }
    
      // ============================================================
      // DÉTAIL D'UNE INTENTION (ADMIN)
      // ============================================================
    
      @Get(':id')
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
    
}