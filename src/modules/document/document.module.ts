import { Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentRouter } from './document.router';
import { DocumentController } from './document.controller';
import { DocumentRepository } from './document.repository';

@Module({
  controllers: [DocumentController],
  providers: [DocumentService, DocumentRouter, DocumentRepository],
})
export class DocumentModule {}
