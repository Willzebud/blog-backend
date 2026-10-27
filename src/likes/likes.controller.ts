import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';
import { LikesService } from './likes.service.js';
import { JwtAuthGuard } from '../auth/_utils/guards/jwt-auth.guard.js';
import { ParseObjectIdPipe } from '../shared/pipes/parse-object-id.pipe.js';
import { GetUserDto } from '../users/_utils/dto/response/get-user.dto.js';
import { ApiCreateLike } from './_utils/decorators/api-create-like.decorator.js';
import { ApiDeleteLike } from './_utils/decorators/api-delete-like.decorator.js';

type AuthenticatedRequest = Request & {
  user: GetUserDto;
};

@Controller('articles/:articleId/likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  // Ajouter like
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCreateLike()
  async createLike(
    @Param('articleId', ParseObjectIdPipe) articleId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.likesService.createLike(articleId, req.user.id);
  }

  // Retirer like
  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiDeleteLike()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLike(
    @Param('articleId', ParseObjectIdPipe) articleId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.likesService.deleteLike(articleId, req.user.id);
  }
}
