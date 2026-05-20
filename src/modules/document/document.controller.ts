import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { DocumentService } from './document.service';
import { z } from 'zod';
import { Public } from '../common/decorators/public.decorator';
import { CreateDocumentSchema } from './document.dto';

@Controller('documents')
export class DocumentController {
  constructor(private readonly documentsService: DocumentService) {}

  //@Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() input: z.infer<typeof CreateDocumentSchema>) {
    return this.documentsService.create(input);
  }

  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string) {
    const parsed = parseInt(userId, 10);
    return this.documentsService.findByUser(parsed);
  }
}