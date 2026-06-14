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
} from '@nestjs/common';
import { DocumentService } from './document.service';
import type { Request } from 'express';
import { z } from 'zod';
import { CreateDocumentSchema, RequestDocumentSchema, ValidateDocumentSchema } from './document.dto';
import { parseMultipart } from '../common/utils/multipart-parser';

@Controller('documents')
export class DocumentController {
  constructor(private readonly documentsService: DocumentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() input: z.infer<typeof CreateDocumentSchema>) {
    return this.documentsService.create(input);
  }

  @Post('upload')
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
      console.log('✅ JSON parsed successfully');
    } catch (err) {
      console.error('❌ JSON parse error:', err);
      throw new Error('Invalid JSON in data field');
    }

    const validated = RequestDocumentSchema.parse(data);
    console.log("Zod Validation passed")

    return this.documentsService.userFilesupload(
      validated.userId,
      request_files
    )
    
  }

  @Get('/pending')
  async findPending(){
    return this.documentsService.findPending();
  }

  @Get('user/:userId')
  async findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.documentsService.findByUser(userId);
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
    return this.documentsService.validateDocument(validatedData);
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
    return this.documentsService.validateDocument(validatedData);
  }

  @Get('user/:userId/valid')
  async areAllDocumentsValid(@Param('userId', ParseIntPipe) userId: number) {
    const isValid = await this.documentsService.areAllDocumentsValid(userId);
    return { userId, allValid: isValid };
  }
}