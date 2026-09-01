// apps/api/src/modules/user/user.repository.ts
import { Injectable } from '@nestjs/common';
import { db } from 'src/database/db';
import { users, UserSelect } from '../../database/schema';
import {
  eq,
  and,
  or,
  inArray,
  ilike,
  gte,
  lte,
  SQL,
  sql,
} from 'drizzle-orm';
import { UserInsert } from '../../database/db';

// ============================================================
// FILTRES DYNAMIQUES
// ============================================================
export type Role = "parent" | "player" | "admin" | "super_admin"

export type UserFilters = {
  id?: number;
  email?: string;
  role?: Role  | Role[]; // single or multiple roles
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  registrationStatus?: string | string[];
  isVerified?: boolean;
  createdFrom?: Date | string;
  createdTo?: Date | string;
  updatedFrom?: Date | string;
  updatedTo?: Date | string;
  search?: string; // recherche dans firstName, lastName, email
};

@Injectable()
export class UserRepository {
  // ============================================================
  // CONSTRUCTEUR DE FILTRES
  // ============================================================
  private static buildFilters(filters: UserFilters): SQL | undefined {
    const conditions: SQL[] = [];

    // 1. Exact matches
    if (filters.id !== undefined) {
      conditions.push(eq(users.id, filters.id));
    }
    if (filters.email) {
      conditions.push(eq(users.email, filters.email));
    }
    if (filters.firstName) {
      conditions.push(eq(users.firstName, filters.firstName));
    }
    if (filters.lastName) {
      conditions.push(eq(users.lastName, filters.lastName));
    }
    if (filters.phone) {
      conditions.push(eq(users.phone, filters.phone));
    }
    if (filters.address) {
      conditions.push(eq(users.address, filters.address));
    }
    if (filters.isVerified !== undefined) {
      conditions.push(eq(users.isVerified, filters.isVerified));
    }

    // 2. Role (single or multiple)
    if (filters.role) {
      if (Array.isArray(filters.role)) {
        if (filters.role.length > 0) {
          conditions.push(inArray(users.role, filters.role));
        }
      } else {
        conditions.push(eq(users.role, filters.role));
      }
    }

    // 3. Registration status (single or multiple)
    if (filters.registrationStatus) {
      if (Array.isArray(filters.registrationStatus)) {
        if (filters.registrationStatus.length > 0) {
          conditions.push(inArray(users.registrationStatus, filters.registrationStatus));
        }
      } else {
        conditions.push(eq(users.registrationStatus, filters.registrationStatus));
      }
    }

    // 4. Date ranges
    if (filters.createdFrom) {
      conditions.push(gte(users.createdAt, new Date(filters.createdFrom)));
    }
    if (filters.createdTo) {
      conditions.push(lte(users.createdAt, new Date(filters.createdTo)));
    }
    if (filters.updatedFrom) {
      conditions.push(gte(users.updatedAt, new Date(filters.updatedFrom)));
    }
    if (filters.updatedTo) {
      conditions.push(lte(users.updatedAt, new Date(filters.updatedTo)));
    }


    if (conditions.length === 0) {
      return undefined;
    }
    return and(...conditions);
  }

  // ============================================================
  // MÉTHODES UNIVERSELLES
  // ============================================================

  async findMany(filters?: UserFilters): Promise<UserSelect[]> {
    const whereClause = filters ? UserRepository.buildFilters(filters) : undefined;
    const query = db.select().from(users);
    if (whereClause) {
      query.where(whereClause);
    }
    // Tri par défaut : id croissant (ou tu peux ajouter un paramètre d'options)
    return await query;
  }

  async findOne(filters?: UserFilters): Promise<UserSelect | null> {
    const whereClause = filters ? UserRepository.buildFilters(filters) : undefined;
    const query = db.select().from(users);
    if (whereClause) {
      query.where(whereClause);
    }
    const [result] = await query.limit(1);
    return result || null;
  }

  // ============================================================
  // CRUD EXISTANT (refactorisé)
  // ============================================================

  async create(data: UserInsert): Promise<UserSelect> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async findById(id: number): Promise<UserSelect | null> {
    return this.findOne({ id });
  }

  async findByIdAndRole(id: number, role: 'player' | 'parent' | 'admin'): Promise<UserSelect | null> {
    return this.findOne({ id, role });
  }

  async findByIds(ids: number[]): Promise<UserSelect[]> {
    if (!ids || ids.length === 0) return [];
    // Utiliser findMany avec un filtre d'IDs multiple nécessite un inArray,
    // mais on peut aussi utiliser la méthode findMany avec un filtre personnalisé.
    const query = db.select().from(users).where(inArray(users.id, ids));
    return await query;
  }

  async findByEmail(email: string): Promise<UserSelect | null> {
    return this.findOne({ email });
  }

  async update(id: number, data: Partial<UserInsert>): Promise<UserSelect | null> {
    const [updated] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated || null;
  }

  async delete(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // ============================================================
  // LISTES (refactorisées)
  // ============================================================

  async findAll(): Promise<UserSelect[]> {
    return this.findMany();
  }

  async findByRole(role: 'player' | 'parent' | 'admin' | 'super_admin'): Promise<UserSelect[]> {
    return this.findMany({ role });
  }

  async findByStatus(
    status: 'pre_inscrit' | 'inscrit' | 'rejeté' | 'suspendu' | 'parent_invité' | 'parent_inscrit',
  ): Promise<UserSelect[]> {
    return this.findMany({ registrationStatus: status });
  }

  // ============================================================
  // STATISTIQUES (inchangées)
  // ============================================================

  async countByRole(role: 'admin' | 'super_admin' | 'player' | 'parent'): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, role));
    return Number(result[0]?.count || 0);
  }

  async countPendingRegistrations(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        or(
          eq(users.registrationStatus, 'pre_inscrit'),
          // eq(users.registrationStatus, 'attestation_signee') // si besoin
        )
      );
    return Number(result[0]?.count || 0);
  }

  async countTotalUsers(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    return Number(result[0]?.count || 0);
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================

  async exists(id: number): Promise<boolean> {
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, id));
    return !!user;
  }
}