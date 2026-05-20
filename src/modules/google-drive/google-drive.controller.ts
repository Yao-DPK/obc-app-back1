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
     // Only parse when content-type is multipart
    const { files, fields } = await parseMultipart(req);
    const file = files[0];
    if (!file) throw new Error('No file uploaded');
    // Now you have file.buffer, file.filename, file.mimetype
    // ... your existing Google Drive upload logic
    const result = await this.googleDriveService.uploadFile(
      file.buffer,
      file.filename,
      file.mimetype,
    );

    return { success: true, file: result };
  }
}
