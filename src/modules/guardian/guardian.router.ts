import { Router, Mutation, Query, Input } from 'nestjs-trpc-v2';
import { z } from 'zod';
import { GuardianService } from './guardian.service';
import { LinkPlayerSchema } from './dto/guardian.dto';

@Router({ alias: 'guardian' })
export class GuardianRouter {
  constructor(private readonly guardianService: GuardianService) {}

  @Mutation({ input: LinkPlayerSchema })
  async linkPlayer(@Input() input: any) {
    const { guardianId, playerId, permissions } = input;
    return this.guardianService.linkPlayer(guardianId, playerId, permissions);
  }

  @Query({ input: z.object({ playerId: z.number() }) })
  async getGuardians(@Input('playerId') playerId: number) {
    return this.guardianService.getGuardians(playerId);
  }

  @Query({ input: z.object({ guardianId: z.number() }) })
  async getPlayers(@Input('guardianId') guardianId: number) {
    return this.guardianService.getPlayers(guardianId);
  }
}