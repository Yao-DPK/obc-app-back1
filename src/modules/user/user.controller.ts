import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateProfileSchema, ChangePasswordSchema } from './dto/user.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRepository } from './user.repository';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private userRepository: UserRepository,
  ) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Super_Admin)
  async getUsers() {
    return this.userRepository.getUsers();
  }

  @Get('/players')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Super_Admin)
  async getPlayers() {
    console.log('Fetching Players');
    return this.userRepository.getUsersByRoles('player');
  }

  @Get('/parents')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Super_Admin)
  async getParents() {
    console.log('Fetching Players');
    return this.userRepository.getUsersByRoles('parent');
  }

  @Get('/admins')
  @UseGuards(RolesGuard)
  @Roles(Role.Super_Admin)
  async getAdmins() {
    return this.userRepository.getUsersByRoles('admin');
  }

  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Super_Admin)
  @Get(':userId')
  async getProfile(@Param('userId') userId: string) {
    console.log(`Getting User ${userId}`);
    return this.userService.getProfile(parseInt(userId, 10));
  }

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

  @Patch(':userId/validate-registration')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Super_Admin)
  async validateRegistration(@Param('userId') userId: string) {
    const id = parseInt(userId);
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    // Mettre à jour le statut
    await this.userRepository.update(id, { registrationStatus: 'inscrit' });
    // Optionnel : envoyer un email de bienvenue
    return { message: 'Inscription validée' };
  }

  @Patch(':userId/reject-registration')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Super_Admin)
  async rejectRegistration(@Param('userId') userId: string) {
    const id = parseInt(userId);
    // Soit supprimer l'utilisateur, soit passer à 'rejeté'
    await this.userRepository.update(id, { registrationStatus: 'rejeté' });
    return { message: 'Inscription rejetée' };
  }
}
