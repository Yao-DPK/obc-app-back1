// src/modules/document/document-type.repository.ts
import { Injectable } from '@nestjs/common';
import { db, documentTypes, eq, inArray } from '../../database/db';
import type { DocumentTypeInsert, DocumentTypeSelect } from '../../database/db';

@Injectable()
export class DocumentTypeRepository {
  // ========== CRUD ==========

  async create(data: DocumentTypeInsert): Promise<DocumentTypeSelect> {
    const [docType] = await db.insert(documentTypes).values(data).returning();
    return docType;
  }

  async findById(id: number): Promise<DocumentTypeSelect | null> {
    const [docType] = await db
      .select()
      .from(documentTypes)
      .where(eq(documentTypes.id, id));
    return docType || null;
  }

  async findAll(includeInactive = false): Promise<DocumentTypeSelect[]> {
    const query = db.select().from(documentTypes);
    if (!includeInactive) {
      query.where(eq(documentTypes.isActive, true));
    }
    return query.orderBy(documentTypes.displayOrder);
  }

  async update(id: number, data: Partial<DocumentTypeInsert>): Promise<DocumentTypeSelect | null> {
    const [updated] = await db
      .update(documentTypes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(documentTypes.id, id))
      .returning();
    return updated || null;
  }

  async delete(id: number): Promise<void> {
    await db.delete(documentTypes).where(eq(documentTypes.id, id));
  }

  // ========== UTILITAIRES ==========

  async exists(id: number): Promise<boolean> {
    const [docType] = await db
      .select({ id: documentTypes.id })
      .from(documentTypes)
      .where(eq(documentTypes.id, id));
    return !!docType;
  }

  async findByName(name: string): Promise<DocumentTypeSelect | null> {
    const [docType] = await db
      .select()
      .from(documentTypes)
      .where(eq(documentTypes.name, name));
    return docType || null;
  }
}