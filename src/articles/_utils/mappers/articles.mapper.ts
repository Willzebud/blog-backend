import { Injectable } from '@nestjs/common';
import type { ArticleDocument } from '../schemas/articles.schema.js';
import { GetArticleDto } from '../dto/response/get-article.dto.js';

@Injectable()
export class ArticlesMapper {
  toGetArticleDto(article: ArticleDocument): GetArticleDto {
    return {
      id: article._id.toString(),
      title: article.articleTitle,
      content: article.articleContent,
      categories: article.articleCategory,
      authorId: article.authorId,
      commentsCount: 0,
      likesCount: 0,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    };
  }
}
