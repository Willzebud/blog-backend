import { Module } from '@nestjs/common';

import { ArticlesModule } from '../articles/articles.module.js';
import { CommentsModule } from '../comments/comments.module.js';
import { LikesModule } from '../likes/likes.module.js';
import { ArticlesCounterService } from './articles-counter.service.js';
import { ArticlesCounterController } from './articles-counter.controller.js';

@Module({
  imports: [ArticlesModule, CommentsModule, LikesModule],
  controllers: [ArticlesCounterController],
  providers: [ArticlesCounterService],
})
export class ArticlesCounterModule {}
