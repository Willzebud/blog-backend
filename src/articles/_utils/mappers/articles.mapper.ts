import { Injectable } from '@nestjs/common';
import type { ArticleDocument } from '../schemas/articles.schema.js';
import { GetArticleDto } from '../dto/response/get-article.dto.js';

export interface ArticleCounts {
  commentsCount: number;
  likesCount: number;
}

@Injectable()
export class ArticlesMapper {
  toGetArticleDto(
    article: ArticleDocument,
    counts: ArticleCounts = { commentsCount: 0, likesCount: 0 },
  ): GetArticleDto {
    return {
      id: article._id.toString(),
      title: article.articleTitle,
      content: article.articleContent,
      categories: article.articleCategory,
      authorId: article.authorId,
      commentsCount: counts.commentsCount,
      likesCount: counts.likesCount,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    };
  }
}
