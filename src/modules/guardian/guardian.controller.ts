import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { GuardianService } from './guardian.service';
import { LinkPlayerSchema } from './dto/guardian.dto';

@Controller('guardian')
export class GuardianController {
  constructor(private readonly guardianService: GuardianService) {}

  @Post('link')
  @HttpCode(HttpStatus.CREATED)
  async linkPlayer(@Body() input: any) {
    const { guardianId, playerId, permissions } = input;
    return this.guardianService.linkPlayer(guardianId, playerId, permissions);
  }

  @Get('guardians/:playerId')
  async getGuardians(@Param('playerId') playerId: string) {
    return this.guardianService.getGuardians(parseInt(playerId, 10));
  }

  @Get('players/:guardianId')
  async getPlayers(@Param('guardianId') guardianId: string) {
    return this.guardianService.getPlayers(parseInt(guardianId, 10));
  }
}