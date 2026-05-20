// inscription.controller.ts
import { Controller, Post, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { InscriptionService } from './inscription.service';
import { FullRegistrationSchema } from './dto/player-registration.dto';
import { parseMultipart } from '../common/utils/multipart-parser'; // à créer

@Controller('inscription')
export class InscriptionController {
  constructor(private readonly inscriptionService: InscriptionService) {}

  @Post('pre-register')
  async preRegister(@Req() req: FastifyRequest) {
    console.log("🔵 Accessing pre-register");

    // Vérifier que la requête est bien multipart
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      throw new Error('Expected multipart request');
    }

    // Utiliser le parseur busboy
    const { fields, files } = await parseMultipart(req);

    // Récupérer le champ 'data' (string JSON)
    const dataStr = fields['data'] as string | undefined;
    if (!dataStr) {
      throw new Error('Missing data field');
    }

    // Récupérer le fichier 'signature'
    const signatureFile = files.find(f => f.filename === 'signature');
    if (!signatureFile) {
      throw new Error('Missing signature file');
    }

    // Parser le JSON
    let data;
    try {
      data = JSON.parse(dataStr);
      console.log("✅ JSON parsed successfully");
    } catch (err) {
      console.error("❌ JSON parse error:", err);
      throw new Error('Invalid JSON in data field');
    }

    // Valider avec Zod
    const validated = FullRegistrationSchema.parse(data);
    console.log("✅ Zod validation passed");

    // Passer les données au service – signatureFile contient { buffer, filename, mimetype, fieldname }
    return this.inscriptionService.preRegister(validated, {
      buffer: signatureFile.buffer,
      filename: signatureFile.filename,
      mimetype: signatureFile.mimetype,
    });
  }
}