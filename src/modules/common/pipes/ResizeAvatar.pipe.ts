import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import sharp from 'sharp';

@Injectable()
export class ResizeAvatarPipe implements PipeTransform<Express.Multer.File, Promise<Buffer>> {
  async transform(file: Express.Multer.File): Promise<Buffer> {
    try {
      return await sharp(file.buffer)
        .resize(400, 400, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer();
    } catch (error) {
      throw new BadRequestException("Échec du traitement de l'image");
    }
  }
}
