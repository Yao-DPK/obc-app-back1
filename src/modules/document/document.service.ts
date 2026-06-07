// apps/api/src/modules/documents/documents.service.ts
import { Injectable } from '@nestjs/common';
import type { CreateDocumentSchema } from './document.dto';
import { DocumentRepository } from './document.repository';
import { z } from 'zod';

@Injectable()
export class DocumentService {
  constructor(private documentRepository: DocumentRepository) {}

  async create(input: z.infer<typeof CreateDocumentSchema>) {
    return this.documentRepository.create(input);
  }

  async findByUser(userId: number) {
    return this.documentRepository.findByUser(userId);
  }
}
