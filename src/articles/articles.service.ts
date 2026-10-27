import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateArticleDto } from './_utils/dto/request/create-article.dto.js';
import { ArticlesRepository } from './articles.repository.js';
import { GetUserDto } from '../users/_utils/dto/response/get-user.dto.js';
import { ArticlesMapper } from './_utils/mappers/articles.mapper.js';
import { GetArticleDto } from './_utils/dto/response/get-article.dto.js';
import { UpdateArticleDto } from './_utils/dto/request/update-article.dto.js';

@Injectable()
export class ArticlesService {
  constructor(
    private readonly articleRepository: ArticlesRepository,
    private readonly articleMapper: ArticlesMapper,
  ) {}

  async createArticle(
    article: CreateArticleDto,
    user: GetUserDto,
  ): Promise<GetArticleDto> {
    const createdArticle = await this.articleRepository.createArticle({
      ...article,
      authorId: user.id,
    });

    return this.articleMapper.toGetArticleDto(createdArticle);
  }

  async findAllArticles(): Promise<GetArticleDto[]> {
    const articles = await this.articleRepository.findAllarticles();

    return articles.map((article) =>
      this.articleMapper.toGetArticleDto(article),
    );
  }

  async findArticleById(id: string): Promise<GetArticleDto> {
    const article = await this.articleRepository.findArticleById(id);

    if (!article) {
      throw new NotFoundException(`Article ${id} introuvable`);
    }

    return this.articleMapper.toGetArticleDto(article);
  }

  async updateArticle(
    id: string,
    updateArticleDto: UpdateArticleDto,
    user: GetUserDto,
  ): Promise<GetArticleDto> {
    const updatedArticle = await this.articleRepository.updateArticle(
      id,
      user.id,
      updateArticleDto,
    );

    if (updatedArticle) {
      return this.articleMapper.toGetArticleDto(updatedArticle);
    }

    const article = await this.articleRepository.findArticleById(id);

    if (!article) {
      throw new NotFoundException('Article introuvable');
    }

    throw new ForbiddenException(
      "Vous n'êtes pas autorisé à modifier cet article",
    );
  }

  async deleteArticle(id: string, user: GetUserDto): Promise<void> {
    const deletedArticle = await this.articleRepository.deleteArticle(
      id,
      user.id,
    );

    if (deletedArticle) {
      return;
    }

    const article = await this.articleRepository.findArticleById(id);

    if (!article) {
      throw new NotFoundException('Article introuvable');
    }

    throw new ForbiddenException(
      "Vous n'êtes pas autorisé à supprimer cet article",
    );
  }
}
