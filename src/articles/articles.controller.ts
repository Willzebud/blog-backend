import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ArticlesService } from './articles.service.js';
import { CreateArticleDto } from './_utils/dto/request/create-article.dto.js';
import { JwtAuthGuard } from '../auth/_utils/guards/jwt-auth.guard.js';
import { GetUserDto } from '../users/_utils/dto/response/get-user.dto.js';
import { GetArticleDto } from './_utils/dto/response/get-article.dto.js';
import { ApiCreateArticle } from './_utils/decorators/api-create-article.decorator.js';

type AuthenticatedRequest = Request & {
  user: GetUserDto;
};

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCreateArticle()
  createArticle(
    @Body() body: CreateArticleDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<GetArticleDto> {
    return this.articlesService.createArticle(body, req.user);
  }
  
}
