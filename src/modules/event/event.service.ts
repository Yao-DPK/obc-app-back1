// src/modules/event/event.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { EventRepository } from './event.repository';
import type { EventInsert, EventSelect } from '../../database/db';

@Injectable()
export class EventService {
  constructor(private readonly eventRepo: EventRepository) {}

  // ========== CRUD ==========

  async create(data: EventInsert): Promise<EventSelect> {
    // Vérifier l'unicité du nom
    const existing = await this.eventRepo.findByName(data.name);
    if (existing) {
      throw new ConflictException(`Un événement avec le nom "${data.name}" existe déjà`);
    }
    return this.eventRepo.create(data);
  }

  async findAll(filters?: any): Promise<EventSelect[]> {
    return this.eventRepo.findAll(filters);
  }

  async findActive(): Promise<EventSelect[]> {
    return this.eventRepo.findAllActive();
  }

  async findOne(id: number): Promise<EventSelect> {
    const event = await this.eventRepo.findById(id);
    if (!event) {
      throw new NotFoundException(`Événement avec l'ID ${id} non trouvé`);
    }
    return event;
  }

  async update(id: number, data: Partial<EventInsert>): Promise<EventSelect> {
    // Vérifier que l'événement existe
    await this.findOne(id);

    // Si le nom change, vérifier l'unicité
    if (data.name) {
      const existing = await this.eventRepo.findByName(data.name);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Un événement avec le nom "${data.name}" existe déjà`);
      }
    }

    const updated = await this.eventRepo.update(id, data);
    if (!updated) {
      throw new NotFoundException(`Événement avec l'ID ${id} non trouvé`);
    }
    return updated;
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id); // Vérifie l'existence
    await this.eventRepo.delete(id);
  }

  // ========== MÉTHODES UTILITAIRES ==========

  /**
   * Récupère les événements associés à un type de document.
   * Utilise le JSONB eventIds dans document_types pour filtrer.
   * Nécessite une requête SQL avec `@>` sur le champ JSONB.
   */
  async findByDocumentType(documentTypeId: number): Promise<EventSelect[]> {
    // Cette méthode pourrait être implémentée en interrogeant les document_types
    // pour obtenir les eventIds, puis en récupérant les événements correspondants.
    // Mais la relation est stockée dans document_types.eventIds, pas dans events.
    // Donc on doit d'abord récupérer les eventIds associés à ce documentTypeId,
    // puis faire un `findByIds` sur events.
    // Cependant, cela suppose que documentTypeId est un nombre et que la relation est correcte.
    // Pour l'instant, laissons cette méthode non implémentée, ou retournons un tableau vide.
    // On pourrait aussi utiliser une requête SQL inverse : 
    // SELECT * FROM events WHERE id = ANY(
    //   SELECT unnest(eventIds) FROM document_types WHERE id = $1
    // )
    // Mais ce n'est pas trivial avec Drizzle.
    // Pour l'instant, on peut laisser ce commentaire.
    throw new Error('Méthode findByDocumentType non implémentée');
  }

  /**
   * Récupère les événements associés à un événement de paiement.
   * Similaire à findByDocumentType, mais avec payment_events.eventIds.
   */
  async findByPaymentEvent(paymentEventId: number): Promise<EventSelect[]> {
    // Même remarque : la relation est dans payment_events.eventIds.
    // On peut soit faire une requête inverse, soit laisser de côté.
    throw new Error('Méthode findByPaymentEvent non implémentée');
  }
}