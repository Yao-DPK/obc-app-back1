// apps/api/src/modules/documents/document.router.spec.ts
jest.mock('src/database/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  eq: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { DocumentRouter } from './document.router';
import { DocumentService } from './document.service';
import { documents } from 'src/database/schema';
import { db, eq } from 'src/database/db';

const mockDocumentService = {
  create: jest.fn(),
};

describe('DocumentRouter', () => {
  let router: DocumentRouter;
  let documentService: DocumentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentRouter,
        { provide: DocumentService, useValue: mockDocumentService },
      ],
    }).compile();

    router = module.get<DocumentRouter>(DocumentRouter);
    documentService = module.get<DocumentService>(DocumentService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call documentService.create with input and return result', async () => {
      const input = { userId: 1, type: 'medical', fileId: 'abc', publicUrl: 'https://example.com', isObligatory: true };
      const mockDoc = { id: 1, ...input, uploadedAt: new Date() };
      mockDocumentService.create.mockResolvedValue(mockDoc);

      const result = await router.create(input);

      expect(documentService.create).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockDoc);
    });
  });

  describe('findByUser', () => {
    it('should call db.select with correct where clause', async () => {
      const input = { userId: 2 };
      const mockDocs = [{ id: 1, userId: 2, type: 'test' }];
      
      const whereMock = jest.fn().mockResolvedValue(mockDocs);
      const fromMock = jest.fn().mockReturnValue({ where: whereMock });
      (db.select as jest.Mock).mockReturnValue({ from: fromMock });

      const result = await router.findByUser(input);

      expect(db.select).toHaveBeenCalled();
      expect(fromMock).toHaveBeenCalledWith(documents);
      expect(whereMock).toHaveBeenCalled();
      expect(eq).toHaveBeenCalledWith(documents.userId, 2);
      expect(result).toEqual(mockDocs);
    });
  });
});