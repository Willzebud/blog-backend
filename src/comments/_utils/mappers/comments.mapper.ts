import { Injectable } from '@nestjs/common';
import type { CommentDocument } from '../schemas/comment.schema.js';
import { GetCommentDto } from '../dto/response/get-comment.dto.js';

@Injectable()
export class CommentsMapper {
  toGetCommentDto(comment: CommentDocument): GetCommentDto {
    return {
      id: comment._id.toString(),
      articleId: comment.articleId,
      userId: comment.userId,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }
}
