import { Test, TestingModule } from '@nestjs/testing';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';

jest.mock('../../database/config/db.config', () => ({
  db: {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([{ id: 1, userId: 1 }]),
      }),
    }),
  },
  documents: {},
  eq: jest.fn(),
}));

describe('DocumentsController', () => {
  let controller: DocumentController;
  let service: DocumentService;

  const mockService = {
    create: jest.fn().mockResolvedValue({ id: 1 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentController],
      providers: [{ provide: DocumentService, useValue: mockService }],
    }).compile();

    controller = module.get<DocumentController>(DocumentController);
    service = module.get<DocumentService>(DocumentService);
  });

  it('should create a document', async () => {
    const input = { userId: 1, type: 'test', fileId: 'abc', publicUrl: 'http://ex.com' };
    const result = await controller.create(input);
    expect(service.create).toHaveBeenCalledWith(input);
    expect(result).toEqual({ id: 1 });
  });

  it('should find documents by user', async () => {
    const result = await controller.findByUser('1');
    expect(result).toEqual([{ id: 1, userId: 1 }]);
  });
});