import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { vi } from 'vitest';
import { ArticlesCounterService } from './articles-counter.service.js';
import { ArticlesService } from '../articles/articles.service.js';
import { CommentsService } from '../comments/comments.service.js';
import { LikesService } from '../likes/likes.service.js';
import { GetArticleDto } from '../articles/_utils/dto/response/get-article.dto.js';
import { GetUserDto } from '../users/_utils/dto/response/get-user.dto.js';

const ID_1 = '6ae1186a93b1c3b39ee7496b';
const ID_2 = '6ae1186a93b1c3b39ee7496c';
const ID_3 = '6ae1186a93b1c3b39ee7496d';

function buildArticle(id: string): GetArticleDto {
  return {
    id,
    title: `Titre ${id}`,
    content: 'Contenu suffisamment long ici.',
    categories: ['dev'],
    authorId: 'user-1',
    commentsCount: 0,
    likesCount: 0,
    createdAt: new Date('2026-10-27T10:00:00.000Z'),
    updatedAt: new Date('2026-10-27T11:00:00.000Z'),
  };
}

const user: GetUserDto = {
  id: 'user-1',
  userFirstname: 'willyam',
  userLastname: 'rib',
  userPseudo: 'willy',
  userEmail: 'willyam@test.dev',
};

describe('ArticlesCounterService', () => {
  let service: ArticlesCounterService;

  const articlesServiceMock = {
    findAllArticles: vi.fn(),
    findArticleById: vi.fn(),
    updateArticle: vi.fn(),
  };
  const commentsServiceMock = {
    countCommentsByArticleIds: vi.fn(),
  };
  const likesServiceMock = {
    countLikesByArticleIds: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    commentsServiceMock.countCommentsByArticleIds.mockResolvedValue(new Map());
    likesServiceMock.countLikesByArticleIds.mockResolvedValue(new Map());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesCounterService,
        { provide: ArticlesService, useValue: articlesServiceMock },
        { provide: CommentsService, useValue: commentsServiceMock },
        { provide: LikesService, useValue: likesServiceMock },
      ],
    }).compile();

    service = module.get<ArticlesCounterService>(ArticlesCounterService);
  });

  describe('findArticleById', () => {
    it("doit renvoyer l'article avec ses compteurs de commentaires et de likes", async () => {
      articlesServiceMock.findArticleById.mockResolvedValue(buildArticle(ID_1));
      commentsServiceMock.countCommentsByArticleIds.mockResolvedValue(
        new Map([[ID_1, 3]]),
      );
      likesServiceMock.countLikesByArticleIds.mockResolvedValue(
        new Map([[ID_1, 5]]),
      );

      const article = await service.findArticleById(ID_1);

      expect(article).toEqual({
        ...buildArticle(ID_1),
        commentsCount: 3,
        likesCount: 5,
      });
      expect(articlesServiceMock.findArticleById).toHaveBeenCalledWith(ID_1);
      expect(
        commentsServiceMock.countCommentsByArticleIds,
      ).toHaveBeenCalledExactlyOnceWith([ID_1]);
      expect(
        likesServiceMock.countLikesByArticleIds,
      ).toHaveBeenCalledExactlyOnceWith([ID_1]);
    });

    it('doit renvoyer des compteurs à zéro sans commentaires ni likes', async () => {
      articlesServiceMock.findArticleById.mockResolvedValue(buildArticle(ID_1));

      const article = await service.findArticleById(ID_1);

      expect(article).toEqual(buildArticle(ID_1));
      expect(article.commentsCount).toBe(0);
      expect(article.likesCount).toBe(0);
    });

    it("doit propager la 404 d'un article inexistant sans compter", async () => {
      articlesServiceMock.findArticleById.mockRejectedValue(
        new NotFoundException(`Article ${ID_1} introuvable`),
      );

      await expect(service.findArticleById(ID_1)).rejects.toThrow(
        new NotFoundException(`Article ${ID_1} introuvable`),
      );
      expect(
        commentsServiceMock.countCommentsByArticleIds,
      ).not.toHaveBeenCalled();
      expect(likesServiceMock.countLikesByArticleIds).not.toHaveBeenCalled();
    });
  });

  describe('findAllArticles', () => {
    it('doit associer à chaque article ses propres compteurs, dans le même ordre', async () => {
      articlesServiceMock.findAllArticles.mockResolvedValue([
        buildArticle(ID_1),
        buildArticle(ID_2),
        buildArticle(ID_3),
      ]);
      commentsServiceMock.countCommentsByArticleIds.mockResolvedValue(
        new Map([
          [ID_1, 2],
          [ID_3, 7],
        ]),
      );
      likesServiceMock.countLikesByArticleIds.mockResolvedValue(
        new Map([
          [ID_2, 4],
          [ID_3, 1],
        ]),
      );

      const articles = await service.findAllArticles();

      expect(articles).toEqual([
        { ...buildArticle(ID_1), commentsCount: 2, likesCount: 0 },
        { ...buildArticle(ID_2), commentsCount: 0, likesCount: 4 },
        { ...buildArticle(ID_3), commentsCount: 7, likesCount: 1 },
      ]);
      expect(
        commentsServiceMock.countCommentsByArticleIds,
      ).toHaveBeenCalledExactlyOnceWith([ID_1, ID_2, ID_3]);
      expect(
        likesServiceMock.countLikesByArticleIds,
      ).toHaveBeenCalledExactlyOnceWith([ID_1, ID_2, ID_3]);
    });

    it('doit renvoyer une liste vide sans appeler les services de comptage', async () => {
      articlesServiceMock.findAllArticles.mockResolvedValue([]);

      const articles = await service.findAllArticles();

      expect(articles).toEqual([]);
      expect(
        commentsServiceMock.countCommentsByArticleIds,
      ).not.toHaveBeenCalled();
      expect(likesServiceMock.countLikesByArticleIds).not.toHaveBeenCalled();
    });
  });

  describe('updateArticle', () => {
    const body = { articleTitle: 'Nouveau titre' };

    it("doit renvoyer l'article modifié avec ses compteurs", async () => {
      articlesServiceMock.updateArticle.mockResolvedValue({
        ...buildArticle(ID_1),
        title: 'Nouveau titre',
      });
      commentsServiceMock.countCommentsByArticleIds.mockResolvedValue(
        new Map([[ID_1, 2]]),
      );
      likesServiceMock.countLikesByArticleIds.mockResolvedValue(
        new Map([[ID_1, 1]]),
      );

      const article = await service.updateArticle(ID_1, body, user);

      expect(article).toEqual({
        ...buildArticle(ID_1),
        title: 'Nouveau titre',
        commentsCount: 2,
        likesCount: 1,
      });
      expect(articlesServiceMock.updateArticle).toHaveBeenCalledWith(
        ID_1,
        body,
        user,
      );
      expect(
        commentsServiceMock.countCommentsByArticleIds,
      ).toHaveBeenCalledExactlyOnceWith([ID_1]);
      expect(
        likesServiceMock.countLikesByArticleIds,
      ).toHaveBeenCalledExactlyOnceWith([ID_1]);
    });

    it.each([
      [
        '403 si la modification est interdite',
        new ForbiddenException(
          "Vous n'êtes pas autorisé à modifier cet article",
        ),
      ],
      [
        '404 si l’article est inexistant',
        new NotFoundException('Article introuvable'),
      ],
    ])('doit propager la %s sans compter', async (_label, error) => {
      articlesServiceMock.updateArticle.mockRejectedValue(error);

      await expect(service.updateArticle(ID_1, body, user)).rejects.toBe(error);
      expect(
        commentsServiceMock.countCommentsByArticleIds,
      ).not.toHaveBeenCalled();
      expect(likesServiceMock.countLikesByArticleIds).not.toHaveBeenCalled();
    });
  });
});
