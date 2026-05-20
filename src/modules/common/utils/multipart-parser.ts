import { FastifyRequest } from 'fastify';
import Busboy from 'busboy';

export interface MultipartParseResult {
  fields: Record<string, any>;
  files: { filename: string; buffer: Buffer; mimetype: string }[];
}

export async function parseMultipart(req: FastifyRequest): Promise<MultipartParseResult> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    const fields: Record<string, any> = {};
    const files: { filename: string; buffer: Buffer; mimetype: string }[] = [];

    busboy.on('field', (fieldname, value) => {
      fields[fieldname] = value;
    });

    busboy.on('file', (fieldname, file, { filename, mimeType }) => {
      const chunks: Buffer[] = [];
      file.on('data', (chunk) => chunks.push(chunk));
      file.on('end', () => {
        files.push({ filename, buffer: Buffer.concat(chunks), mimetype: mimeType });
      });
    });

    busboy.on('error', (err) => reject(err));
    busboy.on('finish', () => resolve({ fields, files }));

    req.raw.pipe(busboy);
  });
}