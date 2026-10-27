import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import {
  GUARDS_METADATA,
  ROUTE_ARGS_METADATA,
} from '@nestjs/common/constants.js';
import request from 'supertest';
import { vi } from 'vitest';
import { GlobalExceptionFilter } from '../filters/http-exception.filter.js';
import { JwtAuthGuard } from '../../auth/_utils/guards/jwt-auth.guard.js';
import { GetUserDto } from '../../users/_utils/dto/response/get-user.dto.js';
import { ArticlesController } from '../../articles/articles.controller.js';
import { ArticlesService } from '../../articles/articles.service.js';
import { ArticlesCounterController } from '../../articles-counter/articles-counter.controller.js';
import { ArticlesCounterService } from '../../articles-counter/articles-counter.service.js';
import { ArticleDeletionController } from '../../article-deletion/article-deletion.controller.js';
import { ArticleDeletionService } from '../../article-deletion/article-deletion.service.js';
import { CommentsController } from '../../comments/comments.controller.js';
import { CommentsService } from '../../comments/comments.service.js';
import { LikesController } from '../../likes/likes.controller.js';
import { LikesService } from '../../likes/likes.service.js';
import { UsersController } from '../../users/users.controller.js';
import { CurrentUser } from './current-user.decorator.js';

const ID = '6ae1186a93b1c3b39ee7496b';

const currentUser: GetUserDto = {
  id: 'user-1',
  userFirstname: 'willyam',
  userLastname: 'rib',
  userPseudo: 'willy',
  userEmail: 'willyam@test.dev',
};

function getParamDecoratorFactory(decorator: () => ParameterDecorator) {
  class TestController {
    handler(@decorator() _value: unknown) {}
  }

  const args = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    TestController,
    'handler',
  );

  return args[Object.keys(args)[0]].factory;
}

describe('CurrentUser', () => {
  function contextWithRequest(req: object): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => req }),
    } as ExecutionContext;
  }

  it('doit renvoyer request.user', () => {
    const factory = getParamDecoratorFactory(CurrentUser);

    expect(factory(undefined, contextWithRequest({ user: currentUser }))).toBe(
      currentUser,
    );
  });

  it("doit renvoyer undefined si aucun utilisateur n'est authentifié", () => {
    const factory = getParamDecoratorFactory(CurrentUser);

    expect(factory(undefined, contextWithRequest({}))).toBeUndefined();
  });
});

describe('Utilisateur authentifié dans les contrôleurs', () => {
  let app: INestApplication;

  const articlesServiceMock = { createArticle: vi.fn() };
  const articlesCounterServiceMock = { updateArticle: vi.fn() };
  const articleDeletionServiceMock = { deleteArticle: vi.fn() };
  const commentsServiceMock = {
    createComment: vi.fn(),
    updateComment: vi.fn(),
    deleteComment: vi.fn(),
  };
  const likesServiceMock = { createLike: vi.fn(), deleteLike: vi.fn() };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [
        ArticlesController,
        ArticlesCounterController,
        ArticleDeletionController,
        CommentsController,
        LikesController,
        UsersController,
      ],
      providers: [
        { provide: ArticlesService, useValue: articlesServiceMock },
        {
          provide: ArticlesCounterService,
          useValue: articlesCounterServiceMock,
        },
        {
          provide: ArticleDeletionService,
          useValue: articleDeletionServiceMock,
        },
        { provide: CommentsService, useValue: commentsServiceMock },
        { provide: LikesService, useValue: likesServiceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          context.switchToHttp().getRequest().user = currentUser;
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

  it("POST /articles doit transmettre l'utilisateur complet", async () => {
    const body = {
      articleTitle: 'Titre article',
      articleContent: 'Contenu suffisamment long ici.',
      articleCategory: ['dev'],
    };

    await request(server()).post('/api/articles').send(body).expect(201);

    expect(articlesServiceMock.createArticle).toHaveBeenCalledWith(
      body,
      currentUser,
    );
  });

  it("PATCH /articles/:id doit transmettre l'utilisateur complet", async () => {
    const body = { articleTitle: 'Nouveau titre' };

    await request(server()).patch(`/api/articles/${ID}`).send(body).expect(200);

    expect(articlesCounterServiceMock.updateArticle).toHaveBeenCalledWith(
      ID,
      body,
      currentUser,
    );
  });

  it("DELETE /articles/:id doit transmettre l'utilisateur complet", async () => {
    await request(server()).delete(`/api/articles/${ID}`).expect(204);

    expect(articleDeletionServiceMock.deleteArticle).toHaveBeenCalledWith(
      ID,
      currentUser,
    );
  });

  it("POST /articles/:articleId/comments doit transmettre l'id de l'utilisateur", async () => {
    await request(server())
      .post(`/api/articles/${ID}/comments`)
      .send({ content: 'commentaire' })
      .expect(201);

    expect(commentsServiceMock.createComment).toHaveBeenCalledWith(
      ID,
      currentUser.id,
      'commentaire',
    );
  });

  it("PATCH /comments/:id doit transmettre l'id de l'utilisateur", async () => {
    await request(server())
      .patch(`/api/comments/${ID}`)
      .send({ content: 'modifié' })
      .expect(200);

    expect(commentsServiceMock.updateComment).toHaveBeenCalledWith(
      ID,
      { content: 'modifié' },
      currentUser.id,
    );
  });

  it("DELETE /comments/:id doit transmettre l'id de l'utilisateur", async () => {
    await request(server()).delete(`/api/comments/${ID}`).expect(204);

    expect(commentsServiceMock.deleteComment).toHaveBeenCalledWith(
      ID,
      currentUser.id,
    );
  });

  it("POST /articles/:articleId/likes doit transmettre l'id de l'utilisateur", async () => {
    await request(server()).post(`/api/articles/${ID}/likes`).expect(201);

    expect(likesServiceMock.createLike).toHaveBeenCalledWith(
      ID,
      currentUser.id,
    );
  });

  it("DELETE /articles/:articleId/likes doit transmettre l'id de l'utilisateur", async () => {
    await request(server()).delete(`/api/articles/${ID}/likes`).expect(204);

    expect(likesServiceMock.deleteLike).toHaveBeenCalledWith(
      ID,
      currentUser.id,
    );
  });

  it("GET /users/me doit renvoyer l'utilisateur authentifié", async () => {
    const response = await request(server()).get('/api/users/me').expect(200);

    expect(response.body).toEqual(currentUser);
  });
});

describe('Protection JWT des routes authentifiées', () => {
  it.each([
    [
      'ArticlesController.createArticle',
      ArticlesController.prototype.createArticle,
    ],
    [
      'ArticlesCounterController.updateArticle',
      ArticlesCounterController.prototype.updateArticle,
    ],
    [
      'ArticleDeletionController.deleteArticle',
      ArticleDeletionController.prototype.deleteArticle,
    ],
    ['CommentsController.create', CommentsController.prototype.create],
    ['CommentsController.update', CommentsController.prototype.update],
    [
      'CommentsController.deleteComment',
      CommentsController.prototype.deleteComment,
    ],
    ['LikesController.createLike', LikesController.prototype.createLike],
    ['LikesController.deleteLike', LikesController.prototype.deleteLike],
    ['UsersController.getUserME', UsersController.prototype.getUserME],
  ])('%s doit être protégée par JwtAuthGuard', (_name, handler) => {
    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toContain(
      JwtAuthGuard,
    );
  });
});
