import { Controller, Post, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { InscriptionService } from './inscription.service';
import { FullRegistrationSchema } from './dto/player-registration.dto';

@Controller('inscription')
export class InscriptionController {
  constructor(private readonly inscriptionService: InscriptionService) {}

  @Post('pre-register')
  async preRegister(@Req() req: FastifyRequest) {
    console.log("🔵 Accessing pre-register");
    console.log("📋 Headers:", JSON.stringify(req.headers, null, 2));

    let dataStr: string | null = null;
    let signatureFile: any = null;

    // Parcours unique de toutes les parties (champs et fichiers)
    const parts = req.parts();
    let partCount = 0;
    for await (const part of parts) {
      partCount++;
      console.log(`\n📦 Part #${partCount}:`);
      console.log(`   type: ${part.type}`);
      console.log(`   fieldname: ${part.fieldname}`);
      
      if (part.type === 'field') {
        console.log(`   value: ${part.value}`);
      } else if (part.type === 'file') {
        console.log(`   filename: ${part.filename}`);
        console.log(`   mimetype: ${part.mimetype}`);
        console.log(`   file size: ${part.file.bytesRead || 'unknown'}`);
      }
      
      if (part.type === 'field' && part.fieldname === 'data') {
        dataStr = part.value as string | null;
        console.log(`   ✅ data field captured (length: ${dataStr?.length})`);
      } else if (part.type === 'file' && part.fieldname === 'signature') {
        signatureFile = part;
        console.log(`   ✅ signature file captured: ${part.filename}`);
      }
    }
    
    console.log(`\n📊 Total parts received: ${partCount}`);
    console.log(`📝 dataStr exists: ${!!dataStr}`);
    console.log(`🖼️ signatureFile exists: ${!!signatureFile}`);

    if (!dataStr) {
      console.error("❌ Missing data field");
      throw new Error('Missing data field');
    }
    if (!signatureFile) {
      console.error("❌ Missing signature file");
      throw new Error('Missing signature file');
    }

    // Afficher le début du JSON pour déboguer
    console.log(`📄 dataStr preview: ${dataStr.substring(0, 200)}${dataStr.length > 200 ? '...' : ''}`);
    
    let data;
    try {
      data = JSON.parse(dataStr);
      console.log("✅ JSON parsed successfully");
    } catch (err) {
      console.error("❌ JSON parse error:", err);
      throw new Error('Invalid JSON in data field');
    }
    
    const validated = FullRegistrationSchema.parse(data);
    console.log("✅ Zod validation passed");

    // Passe le fichier (avec sa méthode toBuffer) au service
    return this.inscriptionService.preRegister(validated, signatureFile);
  }
}