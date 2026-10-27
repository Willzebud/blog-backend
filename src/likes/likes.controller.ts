import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { LikesService } from './likes.service.js';
import { JwtAuthGuard } from '../auth/_utils/guards/jwt-auth.guard.js';
import { ParseObjectIdPipe } from '../shared/pipes/parse-object-id.pipe.js';
import { GetUserDto } from '../users/_utils/dto/response/get-user.dto.js';
import { ApiCreateLike } from './_utils/decorators/api-create-like.decorator.js';
import { ApiDeleteLike } from './_utils/decorators/api-delete-like.decorator.js';
import { CurrentUser } from '../shared/decorators/current-user.decorator.js';

@Controller('articles/:articleId/likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCreateLike()
  async createLike(
    @Param('articleId', ParseObjectIdPipe) articleId: string,
    @CurrentUser() user: GetUserDto,
  ): Promise<void> {
    await this.likesService.createLike(articleId, user.id);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiDeleteLike()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLike(
    @Param('articleId', ParseObjectIdPipe) articleId: string,
    @CurrentUser() user: GetUserDto,
  ): Promise<void> {
    await this.likesService.deleteLike(articleId, user.id);
  }
}
