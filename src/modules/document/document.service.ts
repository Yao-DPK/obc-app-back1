// apps/api/src/modules/documents/documents.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateDocumentDto, ValidateDocumentDto } from './document.dto';
import { DocumentRepository } from './document.repository';
import { z } from 'zod';
import { GoogleDriveService } from '../google-drive/google-drive.service';
import { DocumentTypeRepository } from './documentTypeRepository';
import { DocumentTypeInsert } from '@/database/db';

@Injectable()
export class DocumentService {
  constructor(
    private documentRepository: DocumentRepository,
    private googleDriveService: GoogleDriveService,
    private docTypeRepo: DocumentTypeRepository

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

  async getDocumentsByPlayerIds(playerIds: number[]) {
  if (!playerIds.length) return [];
  return this.documentRepository.findByPlayerIds(playerIds);
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

  async getDocumentsByUser(userId: number) {
    return this.documentRepository.findByUser(userId);
  }

  async getAllDocuments() {
    return this.documentRepository.findAll();
  }

  // ========== TYPES DE DOCUMENTS ==========

  async getDocumentTypes(includeInactive = false) {
    return this.docTypeRepo.findAll(includeInactive);
  }

  async getDocumentTypeById(id: number) {
    const docType = await this.docTypeRepo.findById(id);
    if (!docType) throw new NotFoundException('Type de document non trouvé');
    return docType;
  }

  async createDocumentType(data: DocumentTypeInsert) {
    const existing = await this.docTypeRepo.findByName(data.name);
    if (existing) throw new ConflictException('Un type avec ce nom existe déjà');
    return this.docTypeRepo.create(data);
  }

  async updateDocumentType(id: number, data: Partial<DocumentTypeInsert>) {
    const docType = await this.docTypeRepo.findById(id);
    if (!docType) throw new NotFoundException('Type de document non trouvé');

    if (data.name) {
      const existing = await this.docTypeRepo.findByName(data.name);
      if (existing && existing.id !== id) {
        throw new ConflictException('Un type avec ce nom existe déjà');
      }
    }

    return this.docTypeRepo.update(id, data);
  }

  async deleteDocumentType(id: number) {
    const docType = await this.docTypeRepo.findById(id);
    if (!docType) throw new NotFoundException('Type de document non trouvé');
    await this.docTypeRepo.delete(id);
  }
}