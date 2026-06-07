import { Injectable, BadRequestException } from '@nestjs/common';
import { randomInt } from 'crypto';
import { EmailService } from '../email/email.service';

@Injectable()
export class OtpService {
  // En production, remplacez ce Map par Redis
  private otpStore = new Map<string, { otp: string; expiresAt: Date }>();

  constructor(private emailService: EmailService) {}

  private generateOtp(): string {
    return randomInt(100000, 999999).toString();
  }

  async sendEmailOtp(email: string): Promise<void> {
    const otp = this.generateOtp();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes

    this.otpStore.set(email, { otp, expiresAt });
    await this.emailService.sendVerificationEmail(email, otp);
  }

  verifyEmailOtp(email: string, otp: string): boolean {
    const record = this.otpStore.get(email);
    if (!record) {
      throw new BadRequestException('Aucun code envoyé à cet email');
    }
    if (record.expiresAt < new Date()) {
      this.otpStore.delete(email);
      throw new BadRequestException('Code expiré');
    }
    if (record.otp !== otp) {
      throw new BadRequestException('Code invalide');
    }
    this.otpStore.delete(email);
    return true;
  }
}
