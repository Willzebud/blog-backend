import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';
import { GetArticleDto } from '../dto/response/get-article.dto.js';

export function ApiGetArticle() {
  return applyDecorators(
    ApiOkResponse({
      description: 'Article récupéré avec succès',
      type: GetArticleDto,
    }),
    ApiBadRequestResponse({
      description: 'ID invalide',
    }),
    ApiNotFoundResponse({
      description: 'Article introuvable',
    }),
    ApiParam({
      name: 'id',
      description: 'ID article',
    }),
  );
}
