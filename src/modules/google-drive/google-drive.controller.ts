import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GoogleDriveService } from './google-drive.service';
import type { Request } from 'express';
import type { Express } from 'express';
import { Multer } from 'multer';
import { Public } from '../common/decorators/public.decorator';

@Controller('upload')
export class GoogleDriveController {
  constructor(private readonly googleDriveService: GoogleDriveService) {}

  @Public()
  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    // file contient buffer, originalname, mimetype, size...
    if (!file) {
      throw new Error('No file uploaded');
    }
    const result = await this.googleDriveService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
    );
    return result;
  }
}
