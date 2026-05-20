import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import type { FastifyReply } from 'fastify';
import { Public } from '../common/decorators/public.decorator';

@Controller('google')
export class GoogleAuthController {
  private oAuth2Client: OAuth2Client;

  constructor(private configService: ConfigService) {
    this.oAuth2Client = new OAuth2Client(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      this.configService.get('GOOGLE_REDIRECT_URI'),
    );
  }

  //@Public()
  @Get('redirect')
  async oauth2callback(@Query('code') code: string, @Res() res: FastifyReply) {
    console.log(`📥 Callback route atteinte avec le code : ${code}`);

    if (!code) {
      return res.status(HttpStatus.BAD_REQUEST).send('Missing authorization code');
    }

    try {
      const { tokens } = await this.oAuth2Client.getToken(code);
      console.log('✅ Tokens reçus avec succès !');

      if (tokens.refresh_token) {
        console.log(`🔑 Refresh Token: ${tokens.refresh_token}`);
      } else {
        console.warn('⚠️ Aucun refresh token reçu. Vérifiez access_type=offline');
      }

      console.log(`🕒 Access Token (début): ${tokens.access_token?.substring(0, 10)}...`);

      // Réponse simple en texte
      return res.status(HttpStatus.OK).type('text/html').send(`
        <h1>Authentification réussie !</h1>
        <p>Vous pouvez fermer cette page.</p>
      `);
    } catch (error) {
      console.error('❌ Erreur échange code:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(`Erreur: ${error.message}`);
    }
  }
}