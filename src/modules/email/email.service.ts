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
      secure: false, // true pour port 465, false pour 587
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

  async sendPasswordResetEmail(
    to: string,
    token: string,
    frontendUrl: string,
    purpose: "email_confirmation" | "password_reset" | "first_login" | "invite",
  ): Promise<void> {
    const resetLink = `${frontendUrl}/reset-password?token=${token}&purpose=${purpose}`;
    const subject = 'Réinitialisation de votre mot de passe';
    const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Réinitialisation du mot de passe</h2>
      <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
      <a href="${resetLink}">${subject}</a>
      <p>Ce lien expire dans 1 heure.</p>
    </div>
  `;
    await this.transporter.sendMail({ to, subject, html });
  }

  async sendFirstLoginEmail(
    to: string,
    token: string,
    frontendUrl: string,
    purpose: "email_confirmation" | "password_reset" | "first_login" | "invite",
  ): Promise<void> {
    const LoginLink = `${frontendUrl}/reset-password?token=${token}&purpose=${purpose}`;
    const subject = 'Création de votre mot de passe';
    const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Création de votre mot de passe</h2>
      <p>Vous venez de vous inscrire à OBC avec l'email suivant: ${to}.</p>
      <p> Cliquez sur le lien suivant pour définir votre mot de passe : </p>
      <a href="${LoginLink}">${subject}</a>
      <p>Ce lien expire dans 1 heure.</p>
    </div>
  `;
    await this.transporter.sendMail({ to, subject, html });
  }


  // email.service.ts
async sendGuardianConfirmationEmail(
  to: string,
  player_info: { firstname: string; lastname: string },
  guardian_info: { gender: string; lastname: string; firstname: string },
  frontendUrl: string,
  token: string // Un seul token pour tout !
): Promise<void> {
  const confirmationLink = `${frontendUrl}/confirm-guardian?token=${token}&action=confirm`;
  const rejectionLink = `${frontendUrl}/confirm-guardian?token=${token}&action=reject`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        /* ... styles ... */
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⛹️ OBC</h1>
          <p>Confirmation de votre rôle de garant</p>
        </div>
        
        <div class="content">
          <p>Bonjour <strong>${guardian_info.firstname} ${guardian_info.lastname}</strong>,</p>
          
          <p>Vous avez été désigné(e) comme <strong>garant</strong> pour le joueur :</p>
          
          <div class="player-card">
            <p style="font-size: 28px; font-weight: bold; margin: 0; color: #1e3c72;">
              ${player_info.firstname} ${player_info.lastname}
            </p>
          </div>

          <p>Pour finaliser cette inscription, vous devez :</p>
          <ol>
            <li>✅ Créer votre compte OBC (ou vous connecter si vous en avez déjà un)</li>
            <li>✅ Confirmer votre rôle de garant</li>
          </ol>

          <div class="actions">
            <a href="${confirmationLink}" class="btn-confirm">
              🔐 Créer mon compte et confirmer mon rôle
            </a>
          </div>

          <div class="info-box">
            <strong>⏰ Attention :</strong> Ce lien expirera dans <strong>24 heures</strong>.
          </div>

          <hr />

          <div style="text-align: center; margin-top: 20px;">
            <p style="font-size: 14px; color: #6b7280;">
              Si vous n'êtes pas à l'origine de cette demande :
            </p>
            <a href="${rejectionLink}" style="color: #dc2626; text-decoration: none; font-weight: 600;">
              ❌ Refuser cette responsabilité
            </a>
          </div>
        </div>

        <div class="footer">
          <p>Cet email vous a été envoyé automatiquement dans le cadre de l'inscription d'un joueur à OBC.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await this.transporter.sendMail({
    from: this.configService.get('EMAIL_FROM'),
    to,
    subject: '🔐 Confirmation de votre rôle de garant - OBC',
    html,
  });
}
}
