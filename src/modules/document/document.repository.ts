// apps/api/src/modules/documents/document.repository.ts
import { db } from 'src/database/db';
import { documents, DocumentSelect } from '../../database/schema';
import type { Document } from './document.dto';
import { eq, and, inArray } from 'drizzle-orm';

export type CreateDocumentInput = {
  userId: number;
  type: string;
  fileId: string;
  publicUrl: string;
  isObligatory?: boolean;
  documentStatus?: 'En attente de Validation' | 'Validé' | 'Rejeté' | 'Expiré' | 'Invalide';
};

export type UpdateDocumentValidationInput = {
  documentStatus: 'Validé' | 'Rejeté' | 'Expiré' | 'Invalide' | 'En attente de Validation';
  validatedAt: Date;
  validatedBy: number;
};

export class DocumentRepository {
  async create(data: CreateDocumentInput) {
    const [doc] = await db
      .insert(documents)
      .values({
        userId: data.userId,
        type: data.type,
        fileId: data.fileId,
        publicUrl: data.publicUrl,
        isObligatory: data.isObligatory ?? false,
        documentStatus: data.documentStatus ?? 'En attente de Validation',
      })
      .returning();
    return doc;
  }

  async findAll() {
    const [doc] = await db.select().from(documents);
    return doc;
  }


  async findById(id: number) {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  }

  async findPending(){
    const docs = await db.select().from(documents).where(eq(documents.documentStatus, 'En attente de Validation'));
    return docs.length;
  }


  async findByUser(userId: number) {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId));
  }

  async findByUserAndType(userId: number, type: string) {
    return await db
      .select()
      .from(documents)
      .where(and(eq(documents.userId, userId), eq(documents.type, type)));
  }

  async findByPlayerIds(playerIds: number[]): Promise<DocumentSelect[]> {
  if (!playerIds.length) return [];
  return db.select().from(documents).where(inArray(documents.userId, playerIds));
}

  async update(id: number, data: Partial<Omit<Document, "id">>) {
    const [updated] = await db
      .update(documents)
      .set(data)
      .where(eq(documents.id, id))
      .returning();
    return updated;
  }

  async updateValidation(id: number, data: UpdateDocumentValidationInput) {
    const [updated] = await db
      .update(documents)
      .set({
        documentStatus: data.documentStatus,
        validatedAt: data.validatedAt,
        validatedBy: data.validatedBy,
      })
      .where(eq(documents.id, id))
      .returning();
    return updated;
  }

  async delete(id: number) {
    const [deleted] = await db
      .delete(documents)
      .where(eq(documents.id, id))
      .returning();
    return deleted;
  }

  async setObligatoryStatus(id: number, isObligatory: boolean) {
    const [updated] = await db
      .update(documents)
      .set({ isObligatory })
      .where(eq(documents.id, id))
      .returning();
    return updated;
  }

  async areAllDocumentsValid(userId: number): Promise<boolean> {
    const userDocs = await this.findByUser(userId);
    return userDocs.every(doc => doc.documentStatus === 'Validé');
  }
}