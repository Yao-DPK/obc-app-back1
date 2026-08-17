// src/modules/event/event.module.ts
import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventRepository } from './event.repository';
import { EventController } from './event.controller';

@Module({
  providers: [EventService, EventRepository],
  exports: [EventService, EventRepository],
  controllers: [EventController],
  
})
export class EventModule {}