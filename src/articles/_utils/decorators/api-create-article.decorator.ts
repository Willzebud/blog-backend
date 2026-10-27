import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetArticleDto } from '../dto/response/get-article.dto.js';

export function ApiCreateArticle() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiCreatedResponse({
      description: 'Article créé avec succès',
      type: GetArticleDto,
    }),
    ApiBadRequestResponse({
      description: 'Données de l’article invalides',
    }),
    ApiUnauthorizedResponse({
      description: 'Token absent, invalide ou expiré',
    }),
  );
}
