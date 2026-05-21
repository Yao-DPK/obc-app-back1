import { Request } from 'express';
import Busboy from 'busboy';

export interface MultipartParseResult {
  fields: Record<string, any>;
  files: { fieldname: string; filename: string; buffer: Buffer; mimetype: string }[];
}

export async function parseMultipart(req: Request): Promise<MultipartParseResult> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    const fields: Record<string, any> = {};
    const files: { fieldname: string; filename: string; buffer: Buffer; mimetype: string }[] = [];

    busboy.on('field', (fieldname, value) => {
      fields[fieldname] = value;
    });

    busboy.on('file', (fieldname, file, { filename, mimeType }) => {
      const chunks: Buffer[] = [];
      file.on('data', (chunk) => chunks.push(chunk));
      file.on('end', () => {
        files.push({ fieldname, filename, buffer: Buffer.concat(chunks), mimetype: mimeType });
      });
    });

    busboy.on('error', (err) => reject(err));
    busboy.on('finish', () => resolve({ fields, files }));

    // ✅ Express : req est directement un flux (IncomingMessage)
    req.pipe(busboy);
  });
}