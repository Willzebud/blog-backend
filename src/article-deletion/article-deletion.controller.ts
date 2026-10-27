import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';

import { ArticleDeletionService } from './article-deletion.service.js';
import { JwtAuthGuard } from '../auth/_utils/guards/jwt-auth.guard.js';
import { ParseObjectIdPipe } from '../shared/pipes/parse-object-id.pipe.js';
import { GetUserDto } from '../users/_utils/dto/response/get-user.dto.js';
import { ApiDeleteArticle } from '../articles/_utils/decorators/api-delete-article.decorator.js';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../shared/decorators/current-user.decorator.js';

@ApiTags('Articles')
@Controller('articles')
export class ArticleDeletionController {
  constructor(
    private readonly articleDeletionService: ArticleDeletionService,
  ) {}

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiDeleteArticle()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteArticle(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: GetUserDto,
  ): Promise<void> {
    await this.articleDeletionService.deleteArticle(id, user);
  }
}
