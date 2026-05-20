// google-drive.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, Auth } from 'googleapis';
import { Readable } from 'stream';

@Injectable()
export class GoogleDriveService implements OnModuleInit {
  private readonly logger = new Logger(GoogleDriveService.name);
  private drive: any;
  private oauth2Client: Auth.OAuth2Client;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    // Initialiser le client OAuth2
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      this.configService.get('GOOGLE_REDIRECT_URI')
    );

    // Définir les credentials avec le refresh token
    this.oauth2Client.setCredentials({
      refresh_token: this.configService.get('GOOGLE_REFRESH_TOKEN'),
    });

    // (Optionnel) forcer un rafraîchissement pour vérifier que ça marche
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    this.logger.log('Google Drive OAuth2 initialisé avec succès');

    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
  }

  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    folderId?: string,
  ) {
    const targetFolderId = folderId || this.configService.get('GOOGLE_DRIVE_FOLDER_ID');
    

    try {
      
      // Convertir le Buffer en Readable Stream
      const bufferStream = new Readable();
      bufferStream.push(fileBuffer);
      bufferStream.push(null);   // signale la fin du stream

      const response = await this.drive.files.create({
        requestBody: {
          name: originalName,
          parents: [targetFolderId],
        },
        media: {
          mimeType: mimeType,
          body: bufferStream,   // <- stream, pas Buffer
        },
        fields: 'id, name, webViewLink, webContentLink',
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Upload échoué : ${error.message}`);
      throw error;
    }
  }
}