import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('EMAIL_HOST'),
      port: this.configService.get('EMAIL_PORT'),
      secure: false,          // true pour port 465, false pour 587
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASSWORD'),
      },
    });
  }

  async sendVerificationEmail(to: string, otp: string): Promise<void> {
    const subject = 'Vérification de votre adresse email';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px;">
        <h2>Code de vérification</h2>
        <p>Votre code est : <strong style="font-size: 24px;">${otp}</strong></p>
        <p>Ce code expirera dans <strong>10 minutes</strong>.</p>
        <hr />
        <small>Si vous n’êtes pas à l’origine de cette demande, ignorez cet email.</small>
      </div>
    `;

    await this.transporter.sendMail({
      from: this.configService.get('EMAIL_FROM'),
      to,
      subject,
      html,
    });
  }
}