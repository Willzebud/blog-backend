import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommentsRepository } from './comments.repository.js';
import { ArticlesService } from '../articles/articles.service.js';
import { CommentsMapper } from './_utils/mappers/comments.mapper.js';
import { GetCommentDto } from './_utils/dto/response/get-comment.dto.js';
import { UpdateCommentDto } from './_utils/dto/request/update-comment.dto.js';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly articlesService: ArticlesService,
    private readonly commentsMapper: CommentsMapper,
  ) {}

  async createComment(
    articleId: string,
    userId: string,
    content: string,
  ): Promise<GetCommentDto> {
    await this.articlesService.findArticleById(articleId);

    const createdComment = await this.commentsRepository.createComment(
      articleId,
      userId,
      content,
    );

    return this.commentsMapper.toGetCommentDto(createdComment);
  }

  async getCommentsByArticleId(articleId: string): Promise<GetCommentDto[]> {
    await this.articlesService.findArticleById(articleId);

    const comments =
      await this.commentsRepository.getCommentsByArticleId(articleId);

    return comments.map((comment) =>
      this.commentsMapper.toGetCommentDto(comment),
    );
  }

  async updateComment(
    id: string,
    updateCommentDto: UpdateCommentDto,
    userId: string,
  ): Promise<GetCommentDto> {
    const updatedComment = await this.commentsRepository.updateComment(
      id,
      userId,
      updateCommentDto,
    );

    if (updatedComment) {
      return this.commentsMapper.toGetCommentDto(updatedComment);
    }

    const comment = await this.commentsRepository.findCommentById(id);

    if (!comment) {
      throw new NotFoundException('Commentaire introuvable');
    }

    throw new ForbiddenException(
      "Vous n'êtes pas autorisé à modifier ce commentaire",
    );
  }

  async deleteComment(id: string, userId: string): Promise<void> {
    const deletedComment = await this.commentsRepository.deleteComment(
      id,
      userId,
    );

    if (deletedComment) {
      return;
    }

    const comment = await this.commentsRepository.findCommentById(id);

    if (!comment) {
      throw new NotFoundException('Commentaire introuvable');
    }

    throw new ForbiddenException(
      "Vous n'êtes pas autorisé à supprimer ce commentaire",
    );
  }

  async deleteCommentsByArticleId(articleId: string): Promise<void> {
    await this.commentsRepository.deleteCommentsByArticleId(articleId);
  }

  async countCommentsByArticleIds(
    articleIds: string[],
  ): Promise<Map<string, number>> {
    return this.commentsRepository.countCommentsByArticleIds(articleIds);
  }
}
