import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { vi } from 'vitest';
import { ParseObjectIdPipe } from './parse-object-id.pipe.js';
import { GlobalExceptionFilter } from '../filters/http-exception.filter.js';
import { JwtAuthGuard } from '../../auth/_utils/guards/jwt-auth.guard.js';
import { CommentsController } from '../../comments/comments.controller.js';
import { CommentsService } from '../../comments/comments.service.js';
import { LikesController } from '../../likes/likes.controller.js';
import { LikesService } from '../../likes/likes.service.js';
import { ArticlesCounterController } from '../../articles-counter/articles-counter.controller.js';
import { ArticlesCounterService } from '../../articles-counter/articles-counter.service.js';
import { ArticleDeletionController } from '../../article-deletion/article-deletion.controller.js';
import { ArticleDeletionService } from '../../article-deletion/article-deletion.service.js';

const LOWER_ID = '6ae1186a93b1c3b39ee7496b';
const UPPER_ID = '6AE1186A93B1C3B39EE7496B';

describe('ParseObjectIdPipe', () => {
  const pipe = new ParseObjectIdPipe();

  it('doit conserver un ObjectId valide en minuscules', () => {
    expect(pipe.transform(LOWER_ID)).toBe(LOWER_ID);
  });

  it('doit normaliser en minuscules un ObjectId en majuscules ou en casse mixte', () => {
    expect(pipe.transform(UPPER_ID)).toBe(LOWER_ID);
    expect(pipe.transform('6Ae1186A93b1C3b39Ee7496B')).toBe(LOWER_ID);
  });

  it.each([
    ['trop court', 'abc'],
    ['12 caractères', '0123456789ab'],
    ['caractère non hexadécimal', '6ae1186a93b1c3b39ee7496g'],
    ['espaces autour', ` ${LOWER_ID} `],
    ['vide', ''],
  ])('doit rejeter un identifiant invalide (%s)', (_label, id) => {
    expect(() => pipe.transform(id)).toThrow(
      new BadRequestException('ID MongoDB invalide'),
    );
  });
});

describe('ParseObjectIdPipe - routes HTTP', () => {
  let app: INestApplication;

  const commentsServiceMock = {
    getCommentsByArticleId: vi.fn(),
    createComment: vi.fn(),
    updateComment: vi.fn(),
    deleteComment: vi.fn(),
  };
  const likesServiceMock = {
    createLike: vi.fn(),
    deleteLike: vi.fn(),
  };
  const articlesCounterServiceMock = {
    findArticleById: vi.fn(),
    updateArticle: vi.fn(),
  };
  const articleDeletionServiceMock = {
    deleteArticle: vi.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [
        CommentsController,
        LikesController,
        ArticlesCounterController,
        ArticleDeletionController,
      ],
      providers: [
        { provide: CommentsService, useValue: commentsServiceMock },
        { provide: LikesService, useValue: likesServiceMock },
        {
          provide: ArticlesCounterService,
          useValue: articlesCounterServiceMock,
        },
        {
          provide: ArticleDeletionService,
          useValue: articleDeletionServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          context.switchToHttp().getRequest().user = { id: 'user-1' };
          return true;
        },
      })
      .compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  it.each([
    [
      'GET /articles/:articleId/comments',
      () => request(server()).get(`/api/articles/${UPPER_ID}/comments`),
      () => commentsServiceMock.getCommentsByArticleId,
    ],
    [
      'POST /articles/:articleId/comments',
      () =>
        request(server())
          .post(`/api/articles/${UPPER_ID}/comments`)
          .send({ content: 'commentaire' }),
      () => commentsServiceMock.createComment,
    ],
    [
      'PATCH /comments/:id',
      () =>
        request(server())
          .patch(`/api/comments/${UPPER_ID}`)
          .send({ content: 'modifié' }),
      () => commentsServiceMock.updateComment,
    ],
    [
      'DELETE /comments/:id',
      () => request(server()).delete(`/api/comments/${UPPER_ID}`),
      () => commentsServiceMock.deleteComment,
    ],
    [
      'POST /articles/:articleId/likes',
      () => request(server()).post(`/api/articles/${UPPER_ID}/likes`),
      () => likesServiceMock.createLike,
    ],
    [
      'DELETE /articles/:articleId/likes',
      () => request(server()).delete(`/api/articles/${UPPER_ID}/likes`),
      () => likesServiceMock.deleteLike,
    ],
    [
      'GET /articles/:id',
      () => request(server()).get(`/api/articles/${UPPER_ID}`),
      () => articlesCounterServiceMock.findArticleById,
    ],
    [
      'PATCH /articles/:id',
      () =>
        request(server())
          .patch(`/api/articles/${UPPER_ID}`)
          .send({ articleTitle: 'Nouveau titre' }),
      () => articlesCounterServiceMock.updateArticle,
    ],
    [
      'DELETE /articles/:id',
      () => request(server()).delete(`/api/articles/${UPPER_ID}`),
      () => articleDeletionServiceMock.deleteArticle,
    ],
  ])(
    '%s doit transmettre au service l’id normalisé en minuscules',
    async (_route, send, serviceMethod) => {
      await send();

      expect(serviceMethod()).toHaveBeenCalledOnce();
      expect(serviceMethod().mock.calls[0][0]).toBe(LOWER_ID);
    },
  );

  it('doit toujours répondre 400 pour un identifiant invalide', async () => {
    const response = await request(server())
      .get('/api/articles/pas-un-object-id')
      .expect(400);

    expect(response.body.message).toBe('ID MongoDB invalide');
    expect(articlesCounterServiceMock.findArticleById).not.toHaveBeenCalled();
  });
});
