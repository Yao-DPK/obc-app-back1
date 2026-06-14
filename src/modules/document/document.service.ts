// apps/api/src/modules/documents/documents.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateDocumentDto, ValidateDocumentDto } from './document.dto';
import { DocumentRepository } from './document.repository';
import { z } from 'zod';
import { GoogleDriveService } from '../google-drive/google-drive.service';

@Injectable()
export class DocumentService {
  constructor(
    private documentRepository: DocumentRepository,
    private googleDriveService: GoogleDriveService,

  ) {}

  async userFilesupload (userId: number,
    files: {
      buffer: Buffer;
      filetype: string;
      filename: string;
      mimetype: string;
      isObligatory?: boolean;
    }[]
  ){
    let filesUploaded: any[] = [];
    for (let idx = 0; idx < files.length; idx++) {
      const f = files[idx];
      const uploaded_file = await this.fileUpload(f);
      let document_created = await this.create({
        userId: userId,
        type: f.filetype,
        fileId: uploaded_file.fileId,
        publicUrl: uploaded_file.fileUrl,
        isObligatory: true,
      });
      filesUploaded.push(document_created);
    }
    return filesUploaded;
  }

  async fileUpload(file: {
      buffer: Buffer;
      filename: string;
      mimetype: string;
    }): Promise<{ fileId: string; fileUrl: string }> {
      const fileBuffer = await file.buffer;
      const originalName = file.filename;
      const mimeType = file.mimetype;
      const fileUpload: {
        id: string;
        name: string;
        webContentLink: string;
        webViewLink: string;
      } = await this.googleDriveService.uploadFile(
        fileBuffer,
        originalName,
        mimeType,
      );
      const fileId = fileUpload.webContentLink;
      const fileUrl = fileUpload.webContentLink; // ajustez selon votre
      return { fileId: fileId, fileUrl: fileUrl };
    }

  
  
  async create(input: CreateDocumentDto) {
    return this.documentRepository.create(input);
  }

  async findByUser(userId: number) {
    return this.documentRepository.findByUser(userId);
  }

  async findPending(){
    return this.documentRepository.findPending();
  }

  async validateDocument(data: ValidateDocumentDto) {
    const { documentId, adminId, status } = data;
    const doc = await this.documentRepository.findById(documentId);
    if (!doc) {
      throw new NotFoundException('Document non trouvé');
    }
    const now = new Date();
    return this.documentRepository.updateValidation(documentId, {
      documentStatus: status,
      validatedAt: now,
      validatedBy: adminId,
    });
  }

  async areAllDocumentsValid(userId: number): Promise<boolean> {
    return this.documentRepository.areAllDocumentsValid(userId);
  }
}