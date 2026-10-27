import { Injectable } from '@nestjs/common';
import { ArticlesService } from '../articles/articles.service.js';
import { CommentsService } from '../comments/comments.service.js';
import { LikesService } from '../likes/likes.service.js';
import { GetArticleDto } from '../articles/_utils/dto/response/get-article.dto.js';
import { UpdateArticleDto } from '../articles/_utils/dto/request/update-article.dto.js';
import { GetUserDto } from '../users/_utils/dto/response/get-user.dto.js';

@Injectable()
export class ArticlesCounterService {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly commentsService: CommentsService,
    private readonly likesService: LikesService,
  ) {}

  async findAllArticles(): Promise<GetArticleDto[]> {
    const articles = await this.articlesService.findAllArticles();

    if (articles.length === 0) {
      return [];
    }

    return this.withCounts(articles);
  }

  async findArticleById(id: string): Promise<GetArticleDto> {
    const article = await this.articlesService.findArticleById(id);

    const [articleWithCounts] = await this.withCounts([article]);

    return articleWithCounts;
  }

  async updateArticle(
    id: string,
    body: UpdateArticleDto,
    user: GetUserDto,
  ): Promise<GetArticleDto> {
    const updatedArticle = await this.articlesService.updateArticle(
      id,
      body,
      user,
    );

    const [articleWithCounts] = await this.withCounts([updatedArticle]);

    return articleWithCounts;
  }

  private async withCounts(
    articles: GetArticleDto[],
  ): Promise<GetArticleDto[]> {
    const articleIds = articles.map((article) => article.id);

    const [commentsCounts, likesCounts] = await Promise.all([
      this.commentsService.countCommentsByArticleIds(articleIds),
      this.likesService.countLikesByArticleIds(articleIds),
    ]);

    return articles.map((article) => ({
      ...article,
      commentsCount: commentsCounts.get(article.id) ?? 0,
      likesCount: likesCounts.get(article.id) ?? 0,
    }));
  }
}
