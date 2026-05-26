import { Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { InscriptionService } from './inscription.service';
import { FullRegistrationSchema } from './dto/player-registration.dto';
import { parseMultipart } from '../common/utils/multipart-parser';
import { Public } from '../common/decorators/public.decorator';


@Controller('inscription')
export class InscriptionController {
  constructor(private readonly inscriptionService: InscriptionService) {}


  @Public()
  @Post('pre-register')
  async preRegister(@Req() req: Request) {
    console.log("🔵 Accessing pre-register");

    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      throw new Error('Expected multipart request');
    }

    const { fields, files } = await parseMultipart(req);

    const dataStr = fields['data'] as string | undefined;
    if (!dataStr) {
      throw new Error('Missing data field');
    }

    const signatureFile = files.find(f => f.fieldname === 'signature');
    if (!signatureFile) {
      throw new Error('Missing signature file');
    }

    let otherFiles: { buffer: Buffer; filetype: string; filename: string; mimetype: string; isObligatory?: boolean }[] = []

    for (let idx = 0; idx < files.length; idx ++){
      const f = files[idx];
      if (f.filename !== 'signature'){
        otherFiles.push({ buffer:f.buffer, filetype: f.fieldname, filename:f.filename, mimetype: f.mimetype })
      }
    }


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

    return this.inscriptionService.preRegister(validated, {
      buffer: signatureFile.buffer,
      filename: signatureFile.filename,
      mimetype: signatureFile.mimetype,
    }, 
    otherFiles
    );
  }
}