// apps/api/src/modules/documents/documents.router.ts
import { Router, Query, Mutation, Input } from 'nestjs-trpc-v2';
import { z } from 'zod';
import { DocumentService } from './document.service';
import { CreateDocumentSchema, DocumentSchema, FindByUserSchema } from './document.dto';



@Router({ alias: 'document' })
export class DocumentRouter {
  constructor(private readonly documentsService: DocumentService) {}

  // Mutation pour créer un document
  @Mutation({
    input: CreateDocumentSchema,
    output: DocumentSchema,
  })
  async create(@Input() input: z.infer<typeof CreateDocumentSchema>) {
    return this.documentsService.create(input);
  }

  // Query pour récupérer par utilisateur
  @Query({ 
    input: FindByUserSchema,
    output: z.array(DocumentSchema)
   })
  async findByUser(@Input() input: z.infer<typeof FindByUserSchema>) {
    return this.documentsService.findByUser(input.userId);
  }

}