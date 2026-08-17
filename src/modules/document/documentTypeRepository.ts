// src/modules/document/document-type.repository.ts
import { Injectable } from '@nestjs/common';
import { db, documentTypes, eq, inArray, or, ilike, and, gte, lte, asc, desc } from '../../database/db';
import type { DocumentTypeInsert, DocumentTypeSelect } from '../../database/db';
import { sql, SQL } from 'drizzle-orm';

// ========== INTERFACE DES FILTRES ==========
export type DocumentTypeFilters = {
  id?: number;
  name?: string;
  event?: string;
  names?: string[]; // pour plusieurs noms (IN)
  isActive?: boolean;
  isObligatory?: boolean;
  applicableCategories?: string | string[]; // peut être un seul ou plusieurs
  search?: string; // recherche dans name et description
  createdFrom?: Date | string;
  createdTo?: Date | string;
  updatedFrom?: Date | string;
  updatedTo?: Date | string;
  displayOrder?: number; // exact match
};

@Injectable()
export class DocumentTypeRepository {
  // ========== CONSTRUCTEUR DE FILTRES ==========
  private static buildFilters(filters: DocumentTypeFilters): SQL | undefined {
    const conditions: SQL[] = [];

    // 1. Exact matches
    if (filters.id !== undefined) {
      conditions.push(eq(documentTypes.id, filters.id));
    }
    if (filters.name) {
      conditions.push(eq(documentTypes.name, filters.name));
    }

    if (filters.isActive !== undefined) {
      conditions.push(eq(documentTypes.isActive, filters.isActive));
    }
    if (filters.isObligatory !== undefined) {
      conditions.push(eq(documentTypes.isObligatory, filters.isObligatory));
    }
    if (filters.displayOrder !== undefined) {
      conditions.push(eq(documentTypes.displayOrder, filters.displayOrder));
    }

    // 2. IN pour plusieurs noms
    if (filters.names && filters.names.length > 0) {
      conditions.push(inArray(documentTypes.name, filters.names));
    }

    // 3. Applicable categories (array) – on vérifie si la catégorie est dans le tableau
    if (filters.applicableCategories) {
      const categories = Array.isArray(filters.applicableCategories)
        ? filters.applicableCategories
        : [filters.applicableCategories];
      // On veut les types dont le tableau applicableCategories contient au moins une des catégories demandées
      // En SQL avec Drizzle, on peut utiliser `arrayOverlaps` (si disponible) ou `arrayContains` ?
      // Drizzle n'a pas d'opérateur natif pour `&&` (overlap) ou `@>` (contains) pour les tableaux PostgreSQL,
      // donc on va utiliser une approche alternative : on génère une condition OR pour chaque catégorie.
      // Attention : cela peut être lourd si beaucoup de catégories, mais c'est acceptable pour un petit nombre.
      // Sinon, on peut utiliser une fonction SQL brute, mais restons dans l'esprit Drizzle.
      // On va utiliser `arrayContains` si on veut que le tableau contienne *toutes* les catégories,
      // ou `arrayOverlaps` pour *au moins une*.
      // On va opter pour "contient au moins une" (overlap) en utilisant `sql` pour la fonction `&&`.
      const { sql } = require('drizzle-orm');
      conditions.push(sql`${documentTypes.applicableCategories} && ${categories}`);
    }

    // 5. Plages de dates
    if (filters.createdFrom) {
      conditions.push(gte(documentTypes.createdAt, new Date(filters.createdFrom)));
    }
    if (filters.createdTo) {
      conditions.push(lte(documentTypes.createdAt, new Date(filters.createdTo)));
    }
    if (filters.updatedFrom) {
      conditions.push(gte(documentTypes.updatedAt, new Date(filters.updatedFrom)));
    }
    if (filters.updatedTo) {
      conditions.push(lte(documentTypes.updatedAt, new Date(filters.updatedTo)));
    }

    if (conditions.length === 0) return undefined;
    return and(...conditions);
  }

  // ========== MÉTHODE UNIVERSELLE ==========
  async findMany(
    filters?: DocumentTypeFilters,
    options?: {
      orderBy?: 'displayOrder' | 'createdAt' | 'updatedAt' | 'name';
      order?: 'ASC' | 'DESC';
      limit?: number;
      offset?: number;
    }
  ): Promise<DocumentTypeSelect[]> {
    const query = db.select().from(documentTypes);

    const whereClause = filters ? DocumentTypeRepository.buildFilters(filters) : undefined;
    if (whereClause) {
      query.where(whereClause);
    }

    // Tri par défaut : displayOrder ASC
    const orderField = options?.orderBy || 'displayOrder';
    const orderDir = options?.order || 'ASC';
    if(orderDir == 'DESC'){
      query.orderBy(desc(documentTypes[orderField]));
    }
    query.orderBy(asc(documentTypes[orderField]));

    
    if (options?.limit) query.limit(options.limit);
    if (options?.offset) query.offset(options.offset);

    //console.log(`query result: ${JSON.stringify(await query)}`)
    return await query;
  }

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

  async findAll(query: any): Promise<DocumentTypeSelect[]> {
    // On utilise findMany avec un filtre isActive seulement si on ne veut pas les inactifs
    const filters = query.includeInactive ? query : { ...query, isActive: true };
    //console.log(`findAll filters: ${JSON.stringify(filters)}`);

    return this.findMany(filters, {
      orderBy: 'displayOrder',
      order: 'ASC',
    });
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
    const [docType] = await this.findMany({ name }, { limit: 1 });
    return docType || null;
  }

  async findByNames(names: string[]): Promise<DocumentTypeSelect[]> {
    if (!names || names.length === 0) return [];
    return this.findMany({ names });
  }

  // ========== NOUVEAUX MÉTHODES (optionnelles) ==========

  /**
   * Récupère tous les types applicables à une catégorie donnée.
   * Ex: findByCategory('cadets') → tous les types dont le tableau applicableCategories contient 'cadets'
   */
  async findByCategory(category: string): Promise<DocumentTypeSelect[]> {
    return this.findMany({ applicableCategories: category, isActive: true });
  }

  /**
   * Récupère les types obligatoires pour une catégorie donnée (si on veut combiner).
   */
  async findObligatoryForCategory(category: string): Promise<DocumentTypeSelect[]> {
    return this.findMany({
      applicableCategories: category,
      isObligatory: true,
      isActive: true,
    });
  }
}