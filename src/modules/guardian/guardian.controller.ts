import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Patch,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { GuardianService } from './guardian.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('guardian')
@UseGuards(RolesGuard)
export class GuardianController {
  constructor(private readonly guardianService: GuardianService) {}

  // ========== ADMIN / SUPER_ADMIN ==========

  @Post('link')
  @Roles(Role.Admin, Role.Super_Admin)
  @HttpCode(HttpStatus.CREATED)
  async linkPlayer(@Body() input: { guardianId: number; playerId: number; permissions?: any }) {
    return this.guardianService.linkPlayer(input.guardianId, input.playerId, input.permissions);
  }

  @Delete('unlink')
  @Roles(Role.Admin, Role.Super_Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async unlinkPlayer(@Body() input: { guardianId: number; playerId: number }) {
    await this.guardianService.unlinkPlayer(input.guardianId, input.playerId);
  }

  @Patch('permissions')
  @Roles(Role.Admin, Role.Super_Admin)
  async updatePermissions(
    @Body() input: { guardianId: number; playerId: number; permissions: any },
  ) {
    return this.guardianService.updatePermissions(
      input.guardianId,
      input.playerId,
      input.permissions,
    );
  }

  // ========== PARENT (ses propres enfants) ==========

  /* @Get('players')
  @Roles(Role.Parent)
  async getMyPlayers(@GetUser() user: any) {
    return this.guardianService.getPlayersByGuardian(user.sub);
  }

  @Get('players/:guardianId')
  @Roles(Role.Admin, Role.Super_Admin)
  async getPlayersByGuardian(@Param('guardianId') guardianId: string) {
    return this.guardianService.getPlayersByGuardian(parseInt(guardianId, 10));
  }

  @Get('guardians/:playerId')
  @Roles(Role.Admin, Role.Super_Admin)
  async getGuardiansByPlayer(@Param('playerId') playerId: string) {
    return this.guardianService.getGuardiansByPlayer(parseInt(playerId, 10));
  } */

  // ========== VÉRIFICATION D'EXISTENCE ==========

  @Get('check/:guardianId/:playerId')
  @Roles(Role.Admin, Role.Super_Admin, Role.Parent)
  async checkRelation(
    @Param('guardianId') guardianId: string,
    @Param('playerId') playerId: string,
  ) {
    const link = await this.guardianService.findRelationship(
      parseInt(guardianId, 10),
      parseInt(playerId, 10),
    );
    return { exists: !!link, link };
  }
}