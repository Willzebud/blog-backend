import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller.js';
import { ArticlesService } from './articles.service.js';
import { ArticlesRepository } from './articles.repository.js';
import { MongooseModule } from '@nestjs/mongoose';
import { Article, ArticleSchema } from './_utils/schemas/articles.schema.js';
import { ArticlesMapper } from './_utils/mappers/articles.mapper.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Article.name, schema: ArticleSchema }]),
  ],
  controllers: [ArticlesController],
  providers: [ArticlesService, ArticlesRepository, ArticlesMapper],
  exports: [ArticlesService],
})
export class ArticlesModule {}
