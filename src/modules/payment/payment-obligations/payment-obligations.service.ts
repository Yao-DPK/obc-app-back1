import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentObligationRepository } from './payment-obligation.repository';
import type { CreatePaymentObligationDto, UpdatePaymentObligationDto } from './payment-obligation.dto';
import { db, payments, eq, paymentIntents } from '../../../database/db';

@Injectable()
export class PaymentObligationService {
  constructor(private repository: PaymentObligationRepository) {}

  async create(data: CreatePaymentObligationDto) {
    return this.repository.create(data);
  }

  async findById(id: number) {
    const obligation = await this.repository.findById(id);
    if (!obligation) throw new NotFoundException('Obligation non trouvée');
    const withStatus = {...obligation, status: await this.computeStatus(obligation.id)}
    return withStatus;
  }

  async findByPlayer(playerId: number) {
    return this.repository.findByPlayer(playerId);
  }

  async findAll() {
    const obligations = await this.repository.findAll();
    const withStatus = await Promise.all(
    obligations.map(async (ob) => ({
        ...ob,
        status: await this.computeStatus(ob.id),
      }))
    );
    return withStatus;
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

  // payment-obligation.service.ts
  async computeStatus(obligationId: number): Promise<string> {
    const obligation = await this.repository.findById(obligationId);
    if (!obligation) throw new NotFoundException();

    const payments_list = await db.select()
      .from(payments)
      .where(eq(payments.obligationId, obligationId));

    const totalPaid = payments_list.reduce((sum, p) => sum + Number(p.amount), 0);
    const required = Number(obligation.amount);
    const now = new Date();
    const due = obligation.dueDate ? new Date(obligation.dueDate) : null;

    if (obligation.status === 'cancelled') return 'cancelled';

    if (totalPaid >= required) return 'paid';

    if (due && now > due) return 'overdue';

    if (totalPaid > 0) return 'ongoing';

    return 'pending';
}
}