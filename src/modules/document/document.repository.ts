// document.repository.ts
import { db } from 'src/database/db';
import { documents } from 'src/database/schema';
import { eq, and } from 'drizzle-orm';

export type CreateDocumentInput = {
  userId: number;
  type: string;
  fileId: string;
  publicUrl: string;
  isObligatory?: boolean;
};

export type UpdateDocumentValidationInput = {
  validatedAt?: Date | null;
};

export class DocumentRepository {
  async create(data: CreateDocumentInput) {
    const [doc] = await db.insert(documents).values({
      userId: data.userId,
      type: data.type,
      fileId: data.fileId,
      publicUrl: data.publicUrl,
      isObligatory: data.isObligatory ?? false,
    }).returning();
    return doc;
  }

  async findById(id: number) {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  }

  async findByUser(userId: number) {
    return await db.select().from(documents).where(eq(documents.userId, userId));
  }

  async findByUserAndType(userId: number, type: string) {
    return await db.select().from(documents).where(
      and(eq(documents.userId, userId), eq(documents.type, type))
    );
  }

  async updateValidation(id: number, data: UpdateDocumentValidationInput) {
    const [updated] = await db.update(documents)
      .set({ validatedAt: data.validatedAt ?? new Date() })
      .where(eq(documents.id, id))
      .returning();
    return updated;
  }

  async delete(id: number) {
    const [deleted] = await db.delete(documents).where(eq(documents.id, id)).returning();
    return deleted;
  }

  async setObligatoryStatus(id: number, isObligatory: boolean) {
    const [updated] = await db.update(documents)
      .set({ isObligatory })
      .where(eq(documents.id, id))
      .returning();
    return updated;
  }
}