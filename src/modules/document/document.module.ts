import { Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentRouter } from './document.router';
import { DocumentController } from './document.controller';
import { DocumentRepository } from './document.repository';
import { GoogleDriveService } from '../google-drive/google-drive.service';

@Module({
  controllers: [DocumentController],
  providers: [DocumentService, DocumentRouter, DocumentRepository, GoogleDriveService],
  exports: [DocumentService],
})
export class DocumentModule {}
