import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment, CommentSchema } from './_utils/schemas/comment.schema.js';
import { CommentsRepository } from './comments.repository.js';
import { CommentsService } from './comments.service.js';
import { ArticlesModule } from '../articles/articles.module.js';
import { CommentsController } from './comments.controller.js';
import { CommentsMapper } from './_utils/mappers/comments.mapper.js';

@Module({
  imports: [
    ArticlesModule,
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
  ],
  controllers: [CommentsController],
  providers: [CommentsRepository, CommentsService, CommentsMapper],
  exports: [CommentsService],
})
export class CommentsModule {}
