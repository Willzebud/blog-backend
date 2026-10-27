import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ArticlesCounterService } from './articles-counter.service.js';
import { GetArticleDto } from '../articles/_utils/dto/response/get-article.dto.js';
import { ParseObjectIdPipe } from '../shared/pipes/parse-object-id.pipe.js';
import { ApiGetAllArticles } from '../articles/_utils/decorators/api-get-all-articles.decorator.js';
import { ApiGetArticle } from '../articles/_utils/decorators/api-get-article.decorator.js';
import { GetUserDto } from '../users/_utils/dto/response/get-user.dto.js';
import { JwtAuthGuard } from '../auth/_utils/guards/jwt-auth.guard.js';
import { ApiUpdateArticle } from '../articles/_utils/decorators/api-update-article.decorator.js';
import { UpdateArticleDto } from '../articles/_utils/dto/request/update-article.dto.js';

type AuthenticatedRequest = Request & {
  user: GetUserDto;
};

@ApiTags('Articles')
@Controller('articles')
export class ArticlesCounterController {
  constructor(
    private readonly articlesCounterService: ArticlesCounterService,
  ) {}

  // Get All Articles
  @Get()
  @ApiGetAllArticles()
  findAllArticles(): Promise<GetArticleDto[]> {
    return this.articlesCounterService.findAllArticles();
  }

  // Get Article
  @Get(':id')
  @ApiGetArticle()
  findArticleById(
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<GetArticleDto> {
    return this.articlesCounterService.findArticleById(id);
  }

  // Update Article
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiUpdateArticle()
  updateArticle(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() body: UpdateArticleDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<GetArticleDto> {
    return this.articlesCounterService.updateArticle(id, body, req.user);
  }
}
