import { Module } from '@nestjs/common';

import { ArticlesModule } from '../articles/articles.module.js';
import { CommentsModule } from '../comments/comments.module.js';
import { ArticleDeletionService } from './article-deletion.service.js';
import { ArticleDeletionController } from './article-deletion.controller.js';
import { LikesModule } from '../likes/likes.module.js';

@Module({
  imports: [ArticlesModule, CommentsModule, LikesModule],
  controllers: [ArticleDeletionController],
  providers: [ArticleDeletionService],
})
export class ArticleDeletionModule {}
