import { applyDecorators } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse } from '@nestjs/swagger';
import { GetArticleDto } from '../dto/response/get-article.dto.js';

export function ApiGetAllArticles() {
  return applyDecorators(
    ApiOkResponse({
      description: 'Liste des articles récupérée avec succès',
      type: GetArticleDto,
      isArray: true,
    }),
    ApiNotFoundResponse({
      description: 'Articles introuvables',
    }),
  );
}
