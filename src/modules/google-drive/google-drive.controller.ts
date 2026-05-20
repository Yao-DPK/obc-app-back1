import { Controller, Post, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { GoogleDriveService } from '../google-drive/google-drive.service';
import { Public } from '../common/decorators/public.decorator';


@Controller('upload')
export class GoogleDriveController {
  constructor(private readonly googleDriveService: GoogleDriveService) {}

  //@Public()
  @Post('file') 
  async uploadFile(@Req() req: FastifyRequest) {
    const file = await req.file();               // récupère le fichier multipart
    if (!file) {
      throw new Error('Aucun fichier fourni');
    }

    const fileBuffer = await file.toBuffer();    // convertit en Buffer
    const originalName = file.filename;
    const mimeType = file.mimetype;

    const result = await this.googleDriveService.uploadFile(
      fileBuffer,
      originalName,
      mimeType,
    );

    return { success: true, file: result };
  }
}
