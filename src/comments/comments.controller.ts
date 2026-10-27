import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';

import { CommentsService } from './comments.service.js';
import { CreateCommentDto } from './_utils/dto/request/create-comment.dto.js';
import { UpdateCommentDto } from './_utils/dto/request/update-comment.dto.js';
import { GetCommentDto } from './_utils/dto/response/get-comment.dto.js';

import { JwtAuthGuard } from '../auth/_utils/guards/jwt-auth.guard.js';
import { GetUserDto } from '../users/_utils/dto/response/get-user.dto.js';
import { ParseObjectIdPipe } from '../shared/pipes/parse-object-id.pipe.js';
import { ApiGetComments } from './_utils/decorators/api-get-comments.decorator.js';
import { ApiCreateComment } from './_utils/decorators/api-create-comment.decorator.js';
import { ApiUpdateComment } from './_utils/decorators/api-update-comment.decorator.js';
import { ApiDeleteComment } from './_utils/decorators/api-delete-comment.decorator.js';

type AuthenticatedRequest = Request & {
  user: GetUserDto;
};

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  // Get comments by article
  @Get('articles/:articleId/comments')
  @ApiGetComments()
  getCommentsByArticleId(
    @Param('articleId', ParseObjectIdPipe) articleId: string,
  ): Promise<GetCommentDto[]> {
    return this.commentsService.getCommentsByArticleId(articleId);
  }

  // Create comment
  @Post('articles/:articleId/comments')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiCreateComment()
  create(
    @Param('articleId', ParseObjectIdPipe) articleId: string,
    @Body() body: CreateCommentDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<GetCommentDto> {
    return this.commentsService.createComment(
      articleId,
      req.user.id,
      body.content,
    );
  }

  // Update comment
  @Patch('comments/:id')
  @UseGuards(JwtAuthGuard)
  @ApiUpdateComment()
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() body: UpdateCommentDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<GetCommentDto> {
    return this.commentsService.updateComment(id, body, req.user.id);
  }

  // Delete comment
  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  @ApiDeleteComment()
  @HttpCode(HttpStatus.NO_CONTENT)
  DeleteArticle(
    @Param('id', ParseObjectIdPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.commentsService.deleteComment(id, req.user.id);
  }
}
