// apps/api/src/modules/documents/documents.service.ts
import { ConflictException, Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import type { CreateDocumentDto, ValidateDocumentDto } from './document.dto';
import { DocumentFilters, DocumentRepository } from './document.repository';
import { z } from 'zod';
import { DocumentTypeRepository } from './documentTypeRepository';
import { DocumentInsert, DocumentTypeInsert } from '@/database/db';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class DocumentService {
  constructor(
    private documentRepository: DocumentRepository,
    private docTypeRepo: DocumentTypeRepository,
    private s3Service: S3Service
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
      let document_created = await this.userFileupload(userId, f);
      filesUploaded.push(document_created);
    }

    
    return filesUploaded;
  }

  async userFileupload(
  userId: number,
  file: {
    buffer: Buffer;
    filetype: string;
    filename: string;
    mimetype: string;
    isObligatory?: boolean;
  }
) {
  // 1. Vérifier si un document de ce type existe déjà pour cet utilisateur
  const existingDoc = await this.documentRepository.findOne({userId: userId, type: file.filetype});

  // 2. Si il existe, le supprimer (remplacement)
  if (existingDoc) {
    await this.documentRepository.delete(existingDoc.id);
  }

  // 3. Upload du nouveau fichier
  const uploaded_file = await this.fileUpload(file);

  // 4. Récupérer le type de document
  const docType = await this.getDocumentTypeByName(file.filetype);

  // 5. Créer l'entrée en base
  const document_created = await this.create({
    userId: userId,
    type: file.filetype,
    typeId: docType.id,
    fileId: uploaded_file.fileId,
    publicUrl: uploaded_file.fileUrl,
    isObligatory: file.isObligatory ?? true,
  });

  return document_created;
}


  async fileUpload(file: {
    buffer: Buffer;
    filename: string;
    mimetype: string;
  }): Promise<{ fileId: string; fileUrl: string }> {
    const { buffer, filename, mimetype } = file;
    const uploadedFile = await this.s3Service.uploadFile(
      buffer,
      filename,
      mimetype,
      'documents'
    );
    // uploadedFile contient : { key, url }
    return {
      fileId: uploadedFile.key,          // ✅ ID unique Google Drive
      fileUrl: uploadedFile.url, // ✅ Lien de visualisation
    };
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

    async find(filters: DocumentFilters){
      const document =  await this.documentRepository.findOne(filters);
      return document;
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

  async deleteDocument(id: number, userId: number) {
    const document = await this.documentRepository.findById(id);
    if (!document) throw new NotFoundException('Document introuvable');
    if (document.userId !== userId) {
      throw new UnauthorizedException();
    }

    // 1. Supprimer le fichier sur Google Drive
    try {

      await this.s3Service.deleteFile(document.fileId);
      console.log(`Suppresion du fichier Drive par l'utilisateur ${userId}`);
    } catch (error:any) {
      console.error(`Erreur lors de la suppression du fichier Drive : ${error.message}`);
      throw new BadRequestException();
    }

    // 2. Supprimer l'entrée en base de données
    await this.documentRepository.delete(id);
  }

  async getSignedUrl(fileId: string): Promise<string> {
    // Générer une URL temporaire pour visualiser le document
    const url =  await this.s3Service.getSignedUrl(fileId, 300); // 5 minutes
    return url;
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