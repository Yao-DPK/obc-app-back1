// apps/api/src/modules/documents/document.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Req,
  Patch,
  UseGuards,
  Query,
  Delete,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DocumentService } from './document.service';
import type { Request } from 'express';
import { RequestDocumentSchema, ValidateDocumentSchema } from './document.dto';
import { parseMultipart } from '../common/utils/multipart-parser';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { AdminOnly } from '../common/decorators/admin-only.decorator';
import type { DocumentTypeInsert } from '@/database/schema';
import { Public } from '../common/decorators/public.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';


@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  async fileUpload(@Req() req: Request){
    console.log('🔵 Uploading Files');
    
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      throw new Error('Expected multipart request');
    }

    const { fields, files } = await parseMultipart(req);

    const dataStr = fields['data'] as string | undefined;
    if (!dataStr) {
      throw new Error('Missing data field');
    }


    let request_files: {
      buffer: Buffer;
      filetype: string;
      filename: string;
      mimetype: string;
      isObligatory?: boolean;
    }[] = [];
        

    for (let idx = 0; idx < files.length; idx++) {
      const f = files[idx];
      request_files.push({
        buffer: f.buffer,
        filetype: f.fieldname,
        filename: f.filename,
        mimetype: f.mimetype,
      });

    }

    let data;
    try {
      data = JSON.parse(dataStr);
      console.log(`data : ${JSON.stringify(data)}`);
      console.log('✅ JSON parsed successfully');
    } catch (err) {
      console.error('❌ JSON parse error:', err);
      throw new Error('Invalid JSON in data field');
    }

    const validated = RequestDocumentSchema.parse(data);
    console.log("Zod Validation passed")

    return this.documentService.userFilesupload(
      validated.userId,
      request_files
    )
    
  }

  @Get('/:id/signed-url')
  @Roles(Role.Parent, Role.Player, Role.Admin)
  async getSignedDocumentUrl(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    console.log('Getting signed Url');
    const document = await this.documentService.find({id: Number(id)});
    if (!document) throw new NotFoundException("You can't find me");
    // Vérifier que l'utilisateur a le droit de voir ce document
    if (document.userId !== user.id && !['parent', 'admin', 'super_admin'].includes(user.role)) {
      throw new UnauthorizedException("You can't see me");
    }

    const signedUrl = await this.documentService.getSignedUrl(document.fileId);
    return { signedUrl };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Super_Admin, Role.Parent, Role.Player)
  async getDocuments(
    @Query('userId') userId?: string,
    @Query('playerIds') playerIds?: string,
  ) {
    if (userId) {
      const documents = await this.documentService.getDocumentsByUser(parseInt(userId));
      return documents;
    }
    if (playerIds) {
      const ids = playerIds.split(',').map(id => parseInt(id));
      return this.documentService.getDocumentsByPlayerIds(ids);
    }
    return this.documentService.getAllDocuments();
  }

  @Get('/pending')
  async findPending(){
    return this.documentService.findPending();
  }

  @Get('user/:userId')
  async findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.documentService.findByUser(userId);
  }

  @Put(':id/validate')
  @HttpCode(HttpStatus.OK)
  async validateDocument(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { adminId: number; status: 'Validé' | 'Rejeté' | 'Expiré' | 'Invalide'| 'En attente de Validation' }
  ) {
    const validatedData = ValidateDocumentSchema.parse({
      documentId: id,
      adminId: body.adminId,
      status: body.status,
    });
    return this.documentService.validateDocument(validatedData);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateDocumentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { adminId: number; status: 'Validé' | 'Rejeté' | 'Expiré' | 'Invalide' }
  ) {
    const validatedData = ValidateDocumentSchema.parse({
      documentId: id,
      adminId: body.adminId,
      status: body.status,
    });
    return this.documentService.validateDocument(validatedData);
  }

  @Get('user/:userId/valid')
  async areAllDocumentsValid(@Param('userId', ParseIntPipe) userId: number) {
    const isValid = await this.documentService.areAllDocumentsValid(userId);
    return { userId, allValid: isValid };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Parent, Role.Player, Role.Admin, Role.Super_Admin)
  async deleteDocument(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    await this.documentService.deleteDocument(
      Number(id),
      user.id,        // ✅ ID fiable (JWT)
    );
    return { message: 'Document supprimé' };
  }

  // ========== TYPES DE DOCUMENTS (Admin Only) ==========
  
  @Get('types/:id')
  @AdminOnly()
  async getDocumentTypeById(@Param('id', ParseIntPipe) id: number) {
    return this.documentService.getDocumentTypeById(id);
  }

  @Public()
  @Get('types')
  async getDocumentTypes(@Query() query: any) {

    const cleanQuery = Object.fromEntries(
      Object.entries(query).filter(([_, value]) => value !== undefined && value !== 'undefined')
    );
    const names = cleanQuery['names[]'] || cleanQuery.names;

    // Si c'est une chaîne (ex: "valeur1,valeur2"), on la transforme en tableau
    const namesArray = Array.isArray(names)
      ? names
      : typeof names === 'string'
      ? names.split(',')
      : undefined;

    // On reconstruit l'objet query avec le bon format
    const normalizedQuery = {
      ...query,
      names: namesArray,
    };
    /* console.log(`query: ${JSON.stringify(normalizedQuery)}`);
    console.log(`names: ${JSON.stringify(names)}`); */

    return this.documentService.getDocumentTypes(normalizedQuery);
  }

  


  @Post('types')
  @AdminOnly()
  @HttpCode(HttpStatus.CREATED)
  async createDocumentType(@Body() data: DocumentTypeInsert) {
    return this.documentService.createDocumentType(data);
  }

  @Patch('types/:id')
  @AdminOnly()
  @HttpCode(HttpStatus.OK)
  async updateDocumentType(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<DocumentTypeInsert>,
  ) {
    return this.documentService.updateDocumentType(id, data);
  }

  @Delete('types/:id')
  @AdminOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDocumentType(@Param('id', ParseIntPipe) id: number) {
    await this.documentService.deleteDocumentType(id);
  }
}