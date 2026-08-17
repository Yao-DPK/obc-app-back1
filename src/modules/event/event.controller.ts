// src/modules/event/event.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EventService } from './event.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminOnly } from '../common/decorators/admin-only.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { AllRoles } from '../common/decorators/all-roles.decorator';
import { CreateEventDto, EventResponseDto, UpdateEventDto } from './dto/event.dto';

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
@UseGuards(RolesGuard)
export class EventController {
  constructor(private readonly eventService: EventService) {}

  // ============================================================
  // 1. LISTE DES ÉVÉNEMENTS (publique pour les utilisateurs connectés)
  // ============================================================
  @Get()
  @AllRoles()
  @ApiOperation({ summary: 'Récupérer tous les événements' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, type: [EventResponseDto] })
  async findAll(
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;
    return this.eventService.findAll(filters);
  }

  // ============================================================
  // 2. ÉVÉNEMENTS ACTIFS (pour le frontend parent/joueur)
  // ============================================================
  @Get('active')
  @Roles(Role.Parent, Role.Player, Role.Admin, Role.Super_Admin)
  @ApiOperation({ summary: 'Récupérer les événements actifs' })
  @ApiResponse({ status: 200, type: [EventResponseDto] })
  async findActive() {
    return this.eventService.findActive();
  }

  // ============================================================
  // 3. DÉTAIL D'UN ÉVÉNEMENT
  // ============================================================
  @Get(':id')
  @Roles(Role.Parent, Role.Player, Role.Admin, Role.Super_Admin)
  @ApiOperation({ summary: 'Récupérer un événement par son ID' })
  @ApiResponse({ status: 200, type: EventResponseDto })
  @ApiResponse({ status: 404, description: 'Événement non trouvé' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventService.findOne(id);
  }

  // ============================================================
  // 4. CRÉATION (Admin only)
  // ============================================================
  @Post()
  @AdminOnly()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un nouvel événement' })
  @ApiResponse({ status: 201, type: EventResponseDto })
  @ApiResponse({ status: 409, description: 'Nom déjà utilisé' })
  async create(@Body() dto: CreateEventDto) {
    console.log(`Création Evenement`);
    return this.eventService.create(dto);
  }

  // ============================================================
  // 5. MISE À JOUR (Admin only)
  // ============================================================
  @Patch(':id')
  @AdminOnly()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mettre à jour un événement' })
  @ApiResponse({ status: 200, type: EventResponseDto })
  @ApiResponse({ status: 404, description: 'Événement non trouvé' })
  @ApiResponse({ status: 409, description: 'Nom déjà utilisé' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventService.update(id, dto);
  }

  // ============================================================
  // 6. SUPPRESSION (Admin only)
  // ============================================================
  @Delete(':id')
  @AdminOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un événement' })
  @ApiResponse({ status: 204, description: 'Supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Événement non trouvé' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.eventService.remove(id);
  }
}