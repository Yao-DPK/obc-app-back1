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

  async sendPasswordResetEmail(to: string, token: string, frontendUrl: string): Promise<void> {
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;
  const subject = 'Réinitialisation de votre mot de passe';
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Réinitialisation du mot de passe</h2>
      <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>Ce lien expire dans 1 heure.</p>
      <p>Si vous n’êtes pas à l’origine de cette demande, ignorez cet email.</p>
    </div>
  `;
  await this.transporter.sendMail({ to, subject, html });
}
}