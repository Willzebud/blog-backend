import { ConflictException, Injectable } from '@nestjs/common';
import { mongo } from 'mongoose';

import { LikesRepository } from './likes.repository.js';
import { ArticlesService } from '../articles/articles.service.js';

@Injectable()
export class LikesService {
  constructor(
    private readonly likesRepository: LikesRepository,
    private readonly articlesService: ArticlesService,
  ) {}

  async createLike(articleId: string, userId: string): Promise<void> {
    await this.articlesService.findArticleById(articleId);

    try {
      await this.likesRepository.createLike(articleId, userId);
    } catch (error: unknown) {
      if (error instanceof mongo.MongoServerError && error.code === 11000) {
        throw new ConflictException('Vous avez déjà liké cet article');
      }

      throw error;
    }
  }

  async deleteLike(articleId: string, userId: string): Promise<void> {
    await this.likesRepository.deleteLike(articleId, userId);
  }

  async deleteLikesByArticleId(articleId: string): Promise<void> {
    await this.likesRepository.deleteLikesByArticleId(articleId);
  }

  async countLikesByArticleIds(
    articleIds: string[],
  ): Promise<Map<string, number>> {
    return this.likesRepository.countLikesByArticleIds(articleIds);
  }
}
