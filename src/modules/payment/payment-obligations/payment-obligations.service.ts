import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentObligationRepository } from './payment-obligation.repository';
import type { CreatePaymentObligationDto, UpdatePaymentObligationDto } from './payment-obligation.dto';

@Injectable()
export class PaymentObligationService {
  constructor(private repository: PaymentObligationRepository) {}

  async create(data: CreatePaymentObligationDto) {
    return this.repository.create(data);
  }

  async findById(id: number) {
    const obligation = await this.repository.findById(id);
    if (!obligation) throw new NotFoundException('Obligation non trouvée');
    return obligation;
  }

  async findByPlayer(playerId: number) {
    return this.repository.findByPlayer(playerId);
  }

  async findAll() {
    return this.repository.findAll();
  }

  async update(id: number, data: UpdatePaymentObligationDto) {
    await this.findById(id);
    return this.repository.update(id, data);
  }

  async delete(id: number) {
    await this.findById(id);
    return this.repository.delete(id);
  }

  async updateStatus(id: number, status: string) {
    await this.findById(id);
    return this.repository.updateStatus(id, status);
  }
}