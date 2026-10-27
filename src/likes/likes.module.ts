import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ArticlesModule } from '../articles/articles.module.js';

import { Like, LikeSchema } from './_utils/schemas/like.schema.js';
import { LikesRepository } from './likes.repository.js';
import { LikesService } from './likes.service.js';
import { LikesController } from './likes.controller.js';

@Module({
  imports: [
    ArticlesModule,
    MongooseModule.forFeature([{ name: Like.name, schema: LikeSchema }]),
  ],
  controllers: [LikesController],
  providers: [LikesRepository, LikesService],
  exports: [LikesService],
})
export class LikesModule {}
