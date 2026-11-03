// src/modules/s3/s3.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private s3Client: S3Client;
  private isLocal: boolean; 
  private bucketName: string | undefined;
  private publicUrl: string | undefined;

  constructor(private configService: ConfigService) {
    const region = this.configService.get('AWS_REGION');
    this.isLocal = this.configService.get('CURRENT_ENV') == 'LOCAL';
    this.bucketName = this.isLocal ? this.configService.get('AWS_S3_BUCKET_TEST_NAME') : this.configService.get('AWS_S3_BUCKET_NAME');
    this.publicUrl = this.isLocal ? this.configService.get('AWS_S3_PUBLIC_TEST_URL') : this.configService.get('AWS_S3_PUBLIC_URL');
    const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY');

    if (!region || !accessKeyId || !secretAccessKey) {
        throw new Error('Missing AWS environment variables');
    }

    this.s3Client = new S3Client({
        region,
        credentials: { accessKeyId, secretAccessKey },
    });
  }

  


  // ========== UPLOAD ==========

  async uploadFile(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    folder?: string,
  ): Promise<{ key: string; url: string }> {
    const key = folder ? `${folder}/${Date.now()}-${fileName}` : `${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    });

    try {
      await this.s3Client.send(command);
      this.logger.log(`Fichier uploadé avec succès : ${key}`);

      // URL publique (si le bucket est public) ou URL signée
      const publicUrl = `${this.configService.get('AWS_S3_PUBLIC_URL')}/${key}`;

      return { key, url: publicUrl };
    } catch (error:any) {
      this.logger.error(`Erreur upload : ${error.message}`);
      throw error;
    }
  }

  // ========== DELETE ==========

  async deleteFile(key: string): Promise<void> {

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
      this.logger.log(`Fichier supprimé : ${key}`);
    } catch (error:any) {
      this.logger.error(`Erreur suppression : ${error.message}`);
      throw error;
    }
  }

  // ========== URL PRÉ-SIGNÉE (accès temporaire) ==========

  async getSignedUrl(key: string, expiresInSeconds: number = 300): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
      return signedUrl;
    } catch (error) {
      this.logger.error(`Erreur génération URL signée : ${error.message}`);
      throw error;
    }
  }

  // ========== VÉRIFICATION D'EXISTENCE ==========

  async fileExists(key: string): Promise<boolean> {
        console.log(`vbucketName: ${this.bucketName}`);

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3Client.send(command);
      return true;
    } catch (error:any) {
      if (error.name === 'NoSuchKey') {
        return false;
      }
      throw error;
    }
  }
}