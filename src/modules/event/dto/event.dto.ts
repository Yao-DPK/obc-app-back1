// src/modules/event/dto/event.dto.ts
import { createZodDto } from 'nestjs-zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { events } from '../../../database/schema';
import { z } from 'zod';

// ✅ On remplace les champs Date par des strings ISO
export const EventSelectSchema = createSelectSchema(events);

// ✅ Schéma d'insertion (POST)

export const EventInsertSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
// ✅ DTO pour la création
export class CreateEventDto extends createZodDto(EventInsertSchema) {}

// ✅ DTO pour la mise à jour (partiel)
export const EventUpdateSchema = EventInsertSchema.partial();
export class UpdateEventDto extends createZodDto(EventUpdateSchema) {}

// ✅ DTO pour la réponse
export class EventResponseDto extends createZodDto(EventSelectSchema) {}