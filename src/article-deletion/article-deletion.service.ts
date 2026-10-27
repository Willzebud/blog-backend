import { Injectable } from '@nestjs/common';

import { ArticlesService } from '../articles/articles.service.js';
import { CommentsService } from '../comments/comments.service.js';
import { GetUserDto } from '../users/_utils/dto/response/get-user.dto.js';
import { LikesService } from '../likes/likes.service.js';

@Injectable()
export class ArticleDeletionService {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly commentsService: CommentsService,
    private readonly likesService: LikesService,
  ) {}

  async deleteArticle(id: string, user: GetUserDto): Promise<void> {
    await this.articlesService.deleteArticle(id, user);
    await this.likesService.deleteLikesByArticleId(id);
    await this.commentsService.deleteCommentsByArticleId(id);
  }
}
