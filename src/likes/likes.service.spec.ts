import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { mongo } from 'mongoose';
import { vi } from 'vitest';
import { LikesService } from './likes.service.js';
import { LikesRepository } from './likes.repository.js';
import { ArticlesService } from '../articles/articles.service.js';

describe('LikesService', () => {
  let service: LikesService;

  const likesRepositoryMock = {
    createLike: vi.fn(),
  };

  const articlesServiceMock = {
    findArticleById: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    articlesServiceMock.findArticleById.mockResolvedValue({ id: 'article-1' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikesService,
        {
          provide: LikesRepository,
          useValue: likesRepositoryMock,
        },
        {
          provide: ArticlesService,
          useValue: articlesServiceMock,
        },
      ],
    }).compile();

    service = module.get<LikesService>(LikesService);
  });

  it('doit lever une ConflictException si le like existe déjà (E11000)', async () => {
    likesRepositoryMock.createLike.mockRejectedValue(
      new mongo.MongoServerError({
        message: 'E11000 duplicate key error collection: likes',
        code: 11000,
      }),
    );

    await expect(service.createLike('article-1', 'user-1')).rejects.toThrow(
      new ConflictException('Vous avez déjà liké cet article'),
    );
  });

  it('doit propager les autres erreurs MongoDB sans les transformer', async () => {
    const error = new mongo.MongoServerError({
      message: 'not primary',
      code: 10107,
    });
    likesRepositoryMock.createLike.mockRejectedValue(error);

    await expect(service.createLike('article-1', 'user-1')).rejects.toBe(error);
  });

  it('doit propager les erreurs non MongoDB sans les transformer', async () => {
    const error = new Error('connexion perdue');
    likesRepositoryMock.createLike.mockRejectedValue(error);

    await expect(service.createLike('article-1', 'user-1')).rejects.toBe(error);
  });
});
