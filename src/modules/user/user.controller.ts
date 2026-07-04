import {
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { GetUser } from '../common/decorators/get-user.decorator';
import { AdminOnly } from '../common/decorators/admin-only.decorator';
import { UserRepository } from './user.repository';
import { Public } from '../common/decorators/public.decorator';


@Controller('users')
@UseGuards(RolesGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private userRepository: UserRepository,
  ) {}

  // ========== ADMIN / SUPER_ADMIN ==========

  @Get()
  @AdminOnly()
  async getUsers() {
    return this.userRepository.findAll();
  }

  @Post('batch')
  async getUsersByIds(@Body() { ids }: { ids: number[] }) {
    if (!ids || !ids.length) throw new BadRequestException('IDs requis');
    if (ids.length > 100) throw new BadRequestException('Trop d\'IDs (max 100)');
    
    return this.userRepository.findByIds(ids);
  }

  @Get(':role')
  @UseGuards(RolesGuard)
  @Roles(Role.Super_Admin)
  async getUsersByRole(@Param('role') role: 'player' | 'parent' | 'admin') {
    if (!['player', 'parent', 'admin'].includes(role)) {
      throw new BadRequestException('Rôle invalide');
    }
    return this.userRepository.findByRole(role);
  }

  @Patch(':userId/validate-registration')
  @AdminOnly()
  async validateRegistration(@Param('userId') userId: string) {
    const id = parseInt(userId, 10);
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    await this.userRepository.update(id, { registrationStatus: 'inscrit' });
    return { message: 'Inscription validée' };
  }

  @Patch(':userId/reject-registration')
  @AdminOnly()
  async rejectRegistration(@Param('userId') userId: string) {
    const id = parseInt(userId, 10);
    await this.userRepository.update(id, { registrationStatus: 'rejeté' });
    return { message: 'Inscription rejetée' };
  }

  // ========== AUTHENTIFIED USER (profil) ==========


  @Get(':userId')
  
  @Roles(Role.Parent, Role.Player, Role.Admin, Role.Super_Admin)
  async getUser(
    @GetUser() authUser: any,
    @Param('userId') userId: string,
  ) {
    const targetId = parseInt(userId, 10);
    const isAdmin = ['admin', 'super_admin'].includes(authUser.role);

    // Seul l'admin ou l'utilisateur lui-même peut voir le profil
    if (!isAdmin && authUser.id !== targetId) {
      // Tu peux lever une exception ou retourner une version restreinte
      return this.userService.getUserRestricted(targetId);
    }

    return this.userService.getUser(targetId);
  }

  // ========== MISE À JOUR ==========

  @Patch(':userId')
  @HttpCode(HttpStatus.OK)
  async updateProfile(@Param('userId') userId: string, @Body() input: any) {
    return this.userService.updateProfile(parseInt(userId, 10), input);
  }

  @Patch(':userId/change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@Param('userId') userId: string, @Body() input: any) {
    const { oldPassword, newPassword } = input;
    return this.userService.changePassword(
      parseInt(userId, 10),
      oldPassword,
      newPassword,
    );
  }
}