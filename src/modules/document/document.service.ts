// apps/api/src/modules/documents/documents.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateDocumentDto, ValidateDocumentDto } from './document.dto';
import { DocumentRepository } from './document.repository';
import { z } from 'zod';
import { GoogleDriveService } from '../google-drive/google-drive.service';
import { DocumentTypeRepository } from './documentTypeRepository';
import { DocumentInsert, DocumentTypeInsert } from '@/database/db';

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
      console.log(`filetype : ${f.filetype}`);
      const docType = await this.getDocumentTypeByName(f.filetype);      
      let document_created = await this.create({
        userId: userId,
        type: f.filetype,
        typeId: docType.id,
        fileId: uploaded_file.fileId,
        publicUrl: uploaded_file.fileUrl,
        isObligatory: true,
      });
      filesUploaded.push(document_created);
    }

    
    return filesUploaded;
  }

  async userFileupload (userId: number,
    file: {
      buffer: Buffer;
      filetype: string;
      filename: string;
      mimetype: string;
      isObligatory?: boolean;
    }
  ){
      const uploaded_file = await this.fileUpload(file);
      console.log(`filetype : ${file.filetype}`);
      const docType = await this.getDocumentTypeByName(file.filetype);
      const document_created = await this.create({
        userId: userId,
        type: file.filetype,
        typeId: docType.id,
        fileId: uploaded_file.fileId,
        publicUrl: uploaded_file.fileUrl,
        isObligatory: true,
      });
    return document_created;
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
    const documents = await  this.documentRepository.findByUser(userId);
    const docs_with_types = await Promise.all(
      documents.map(async (doc) => {
        // Handle the case where typeId might be null (as seen in your earlier data!)
        const docType = doc.typeId ? await this.getDocumentTypeById(doc.typeId) : null;
        
        // Merge the fetched type into the document
        return { ...doc, type: docType };
      })
    );
    return docs_with_types;
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

  async getDocumentTypes(query: any) {
    const documents = await this.docTypeRepo.findAll(query)
    //console.log(`found Documents: ${JSON.stringify(documents)}`);
    return documents;
  }

  async getDocumentTypeById(id: number) {
    const docType = await this.docTypeRepo.findById(id);
    if (!docType) throw new NotFoundException('Type de document non trouvé');

    return docType;
  }

  async getDocumentTypeByName(name: string) {
    const docType = await this.docTypeRepo.findByName(name);
    if (!docType) throw new NotFoundException('Type de document non trouvé');
    return docType;
  }

  async getDocumentTypeByNames(names: string[]) {
    const docTypes = await this.docTypeRepo.findByNames(names);
    if (!docTypes) throw new NotFoundException('Type de document non trouvé');
    return docTypes;
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