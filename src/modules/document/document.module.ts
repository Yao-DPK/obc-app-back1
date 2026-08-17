import { Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { DocumentRepository } from './document.repository';

import { DocumentTypeRepository } from './documentTypeRepository';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [S3Module],
  controllers: [DocumentController],
  providers: [DocumentService, DocumentRepository, DocumentTypeRepository],
  exports: [DocumentService],
})
export class DocumentModule {}
