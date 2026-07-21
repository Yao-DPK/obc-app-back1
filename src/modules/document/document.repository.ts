// apps/api/src/modules/documents/document.repository.ts
import { db } from 'src/database/db';
import { documents, DocumentSelect } from '../../database/schema';
import { 
  eq, 
  and, 
  or, 
  inArray, 
  ilike, 
  gte, 
  lte, 
  SQL 
} from 'drizzle-orm';
import { CreateDocumentDto } from './document.dto';

// --- Input Types (unchanged) ---

export type UpdateDocumentValidationInput = {
  documentStatus: 'Validé' | 'Rejeté' | 'Expiré' | 'Invalide' | 'En attente de Validation';
  validatedAt: Date;
  validatedBy: number;
};

// --- NEW: Dynamic Filters Interface ---
export type DocumentFilters = {
  id?: number;
  userId?: number;
  typeId?: number;
  documentStatus?: string | string[]; // Allows single status or multiple (e.g., ['Validé', 'En attente'])
  isObligatory?: boolean;
  validatedBy?: number;
  uploadedFrom?: Date | string;
  uploadedTo?: Date | string;
  validatedFrom?: Date | string;
  validatedTo?: Date | string;
  search?: string; // Searches across 'type' and 'documentStatus'
};

export class DocumentRepository {
  
  // --- NEW: The Dynamic Query Builder ---
  private static buildFilters(filters: DocumentFilters): SQL | undefined {
    const conditions: SQL[] = [];

    // 1. Exact Matches
    if (filters.id !== undefined) {
      conditions.push(eq(documents.id, filters.id));
    }
    if (filters.userId !== undefined) {
      conditions.push(eq(documents.userId, filters.userId));
    }
    if (filters.typeId !== undefined) {
      conditions.push(eq(documents.typeId, filters.typeId));
    }
    if (filters.isObligatory !== undefined) {
      conditions.push(eq(documents.isObligatory, filters.isObligatory));
    }
    if (filters.validatedBy !== undefined) {
      conditions.push(eq(documents.validatedBy, filters.validatedBy));
    }

    if (filters.validatedBy !== undefined) {
      conditions.push(eq(documents.validatedBy, filters.validatedBy));
    }

    // 2. Status Handling (Single or Multiple)
    if (filters.documentStatus) {
      if (Array.isArray(filters.documentStatus)) {
        if (filters.documentStatus.length > 0) {
          conditions.push(inArray(documents.documentStatus, filters.documentStatus));
        }
      } else {
        conditions.push(eq(documents.documentStatus, filters.documentStatus));
      }
    }

    // 3. Date Ranges (uploadedAt)
    if (filters.uploadedFrom) {
      conditions.push(gte(documents.uploadedAt, new Date(filters.uploadedFrom)));
    }
    if (filters.uploadedTo) {
      conditions.push(lte(documents.uploadedAt, new Date(filters.uploadedTo)));
    }

    // 4. Date Ranges (validatedAt)
    if (filters.validatedFrom) {
      conditions.push(gte(documents.validatedAt, new Date(filters.validatedFrom)));
    }
    if (filters.validatedTo) {
      conditions.push(lte(documents.validatedAt, new Date(filters.validatedTo)));
    }

    // If no filters were applied, return undefined (so Drizzle skips the WHERE clause)
    if (conditions.length === 0) {
      return undefined;
    }

    // Combine all conditions with AND
    return and(...conditions);
  }

  // --- UPDATED: findAll now returns an ARRAY (fixed the bug) ---
  async findAll(): Promise<DocumentSelect[]> {
    return this.findMany(); // Delegate to the universal method
  }

  // --- NEW: Universal Finder with Dynamic Filters ---
  async findMany(filters?: DocumentFilters): Promise<DocumentSelect[]> {
    const whereClause = filters ? DocumentRepository.buildFilters(filters) : undefined;
    const query = db.select().from(documents);
    
    if (whereClause) {
      query.where(whereClause);
    }
    
    return await query;
  }

  // --- UPDATED: Use the new findMany for cleaner code ---
  async findPending(): Promise<DocumentSelect[]> {
    // Use the filter to get all "pending" documents
    return this.findMany({ documentStatus: 'En attente de Validation' });
  }

  // --- EXISTING METHODS (mostly unchanged, but improved) ---
  
  async create(data: CreateDocumentDto) {
    const [doc] = await db
      .insert(documents)
      .values({
        userId: data.userId,
        type: data.type,
        typeId: data.typeId,
        fileId: data.fileId,
        publicUrl: data.publicUrl,
        isObligatory: data.isObligatory ?? false,
        documentStatus: data.documentStatus ?? 'En attente de Validation',
      })
      .returning();
    return doc;
  }

  async findById(id: number) {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  }

  async findByUser(userId: number) {
    return this.findMany({ userId }); // Delegate to the universal method
  }

  async findByUserAndType(userId: number, typeId: number) {
    return this.findMany({ userId, typeId }); // Delegate to the universal method
  }

  async findByPlayerIds(playerIds: number[]): Promise<DocumentSelect[]> {
    if (!playerIds.length) return [];
    return db.select().from(documents).where(inArray(documents.userId, playerIds));
  }

  async update(id: number, data: Partial<Omit<DocumentSelect, "id">>) {
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