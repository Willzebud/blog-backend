import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ArticlesService } from './articles.service.js';
import { CreateArticleDto } from './_utils/dto/request/create-article.dto.js';
import { JwtAuthGuard } from '../auth/_utils/guards/jwt-auth.guard.js';
import { GetUserDto } from '../users/_utils/dto/response/get-user.dto.js';
import { GetArticleDto } from './_utils/dto/response/get-article.dto.js';
import { ApiCreateArticle } from './_utils/decorators/api-create-article.decorator.js';
import { CurrentUser } from '../shared/decorators/current-user.decorator.js';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCreateArticle()
  createArticle(
    @Body() body: CreateArticleDto,
    @CurrentUser() user: GetUserDto,
  ): Promise<GetArticleDto> {
    return this.articlesService.createArticle(body, user);
  }
}
