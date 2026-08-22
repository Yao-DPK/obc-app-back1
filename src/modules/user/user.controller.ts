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
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { GetUser } from '../common/decorators/get-user.decorator';
import { AdminOnly } from '../common/decorators/admin-only.decorator';
import { UserRepository } from './user.repository';
import { AllRoles } from '../common/decorators/all-roles.decorator';
import type { UpdateProfileDto } from './dto/user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from '../document/document.service';
import { ResizeAvatarPipe } from '../common/pipes/ResizeAvatar.pipe';
import { S3Service } from '../s3/s3.service';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly documentService: DocumentService,
    private readonly userRepository: UserRepository,
    private readonly s3Service: S3Service,
  ) {}

  // ============================================================
  // PROFIL UTILISATEUR CONNECTÉ
  // ============================================================

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(Role.Super_Admin, Role.Admin, Role.Parent, Role.Player)
  async getProfile(@GetUser() user: any) {
    return this.userService.findById(user.id);
  }

  @Get('me/photo')
  @UseGuards(RolesGuard)
  @Roles(Role.Player, Role.Parent, Role.Admin)
  async getProfilePhoto(@GetUser() authUser: any) {
    if (!authUser) {
      throw new NotFoundException('Aucune photo de profil');
    }
    const user = await this.userService.findById(authUser.id);
    if (!user) {
      throw new NotFoundException('Joueur inexistant');
    }
    const document = await this.documentService.find({ userId: authUser.id, type: 'Photo' });
    const signedUrl = await this.s3Service.getSignedUrl(document?.fileId!, 300);
    return { signedUrl };
  }

  @Get('photo/:userId')
  @UseGuards(RolesGuard)
  @Roles(Role.Player, Role.Parent, Role.Admin, Role.Super_Admin)
  async getUserPhoto(@GetUser() authUser: any, @Param('userId') userId: number) {
    if (authUser.role === 'player' && Number(userId) !== authUser.id) {
        throw new UnauthorizedException("Vous n'avez pas accès à cette ressource");

    }
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('Joueur inexistant');
    }
    const document = await this.documentService.find({ userId, type: 'Photo' });
    const signedUrl = await this.s3Service.getSignedUrl(document?.fileId!, 300);
    return { signedUrl };
  }

  @Get('me/players')
  @UseGuards(RolesGuard)
  @Roles(Role.Parent, Role.Player, Role.Admin, Role.Super_Admin)
  async getMyPlayers(@GetUser() authUser: any) {
    return this.userService.getPlayersByGuardian(authUser.id);
  }

  @Get('me/guardians')
  @Roles(Role.Player)
  async getMyGuardians(@GetUser() authUser: any) {
    return this.userService.getGuardiansByPlayer(authUser.id);
  }

  @Patch('me')
  @AllRoles()
  async updateProfile(@GetUser() authUser: any, @Body() input: UpdateProfileDto) {
    return this.userService.updateProfile(authUser.id, input);
  }

  @Post('me/upload')
  @AllRoles()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFileAndValidate(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|jpg)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @UploadedFile(ResizeAvatarPipe) resizedBuffer: Buffer,
    @GetUser() authUser: any,
  ) {
    const uploadedDocument = await this.documentService.userFileupload(authUser.id, {
      ...file,
      buffer: resizedBuffer,
      filename: file.originalname,
      filetype: 'Photo',
    });
    return uploadedDocument;
  }

  // ============================================================
  // ADMIN / SUPER_ADMIN
  // ============================================================

  @Get()
  @AdminOnly()
  async getUsers() {
    // Utilise le service pour omettre les mots de passe
    return this.userService.findUsers();
  }

  @Post('batch')
  @AdminOnly()
  async getUsersByIds(@Body() { ids }: { ids: number[] }) {
    if (!ids || !ids.length) throw new BadRequestException('IDs requis');
    if (ids.length > 100) throw new BadRequestException("Trop d'IDs (max 100)");
    return this.userRepository.findByIds(ids);
  }

  @Get('guardian/:guardianId/players')
  @Roles(Role.Admin, Role.Super_Admin)
  async getPlayersByGuardian(@Param('guardianId') guardianId: string) {
    return this.userService.getPlayersByGuardian(parseInt(guardianId, 10));
  }

  @Get('players/:playerId/guardians')
  @Roles(Role.Admin, Role.Super_Admin)
  async getGuardiansByPlayer(@Param('playerId') playerId: string) {
    return this.userService.getGuardiansByPlayer(parseInt(playerId, 10));
  }

  @Get(':role')
  @UseGuards(RolesGuard)
  @Roles(Role.Super_Admin, Role.Admin, Role.Parent)
  async getUsersByRole(@GetUser() authUser: any, @Param('role') role: 'player' | 'parent' | 'admin') {
    // Vérification des droits
    if (authUser.role === 'super_admin') {
      if (!['player', 'parent', 'admin'].includes(role)) {
        throw new BadRequestException('Rôle invalide');
      }
    } else if (authUser.role === 'admin' || authUser.role === 'parent') {
      if (!['player', 'parent'].includes(role)) {
        throw new BadRequestException('Rôle invalide');
      }
    } else {
      throw new UnauthorizedException('Accès non autorisé');
    }
    // Utilisation du service avec filtres
    return this.userService.findUsers({ role });
  }

  @Get(':role/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Super_Admin, Role.Admin, Role.Parent)
  async getUserByRoleAndId(
    @GetUser() authUser: any,
    @Param('role') role: 'player' | 'parent' | 'admin',
    @Param('id') id: number,
  ) {
    if (authUser.role === 'super_admin') {
      if (!['player', 'parent', 'admin'].includes(role)) {
        throw new BadRequestException('Rôle invalide');
      }
    } else if (authUser.role === 'admin' || authUser.role === 'parent') {
      if (!['player', 'parent'].includes(role)) {
        throw new BadRequestException('Rôle invalide');
      }
    } else {
      throw new UnauthorizedException('Accès non autorisé');
    }
    return this.userService.findByRoleAndId(id, role);
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

  // ============================================================
  // ACCÈS À UN UTILISATEUR SPÉCIFIQUE (avec restrictions)
  // ============================================================

  @Get(':userId')
  @UseGuards(RolesGuard)
  @Roles(Role.Parent, Role.Player, Role.Admin, Role.Super_Admin)
  async getUser(@GetUser() authUser: any, @Param('userId') userId: string) {
    const targetId = parseInt(userId, 10);
    const isAdmin = ['admin', 'super_admin'].includes(authUser.role);

    if (!isAdmin && authUser.id !== targetId) {
      return this.userService.getUserRestricted(targetId);
    }
    return this.userService.findById(targetId);
  }

  // ============================================================
  // MISE À JOUR (admin / self)
  // ============================================================

  @Patch(':userId')
  @HttpCode(HttpStatus.OK)
  @AllRoles()
  async updateUser(@Param('userId') userId: string, @Body() input: UpdateProfileDto) {
    return this.userService.updateProfile(parseInt(userId, 10), input);
  }

  @Patch(':userId/change-password')
  @HttpCode(HttpStatus.OK)
  @AllRoles()
  async changePassword(@Param('userId') userId: string, @Body() input: any) {
    const { oldPassword, newPassword } = input;
    return this.userService.changePassword(parseInt(userId, 10), oldPassword, newPassword);
  }
}