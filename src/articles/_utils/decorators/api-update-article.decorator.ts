import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetArticleDto } from '../dto/response/get-article.dto.js';

export function ApiUpdateArticle() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOkResponse({
      description: 'Article modifié avec succès',
      type: GetArticleDto,
    }),
    ApiBadRequestResponse({
      description: 'Identifiant ou données de modification invalides',
    }),
    ApiUnauthorizedResponse({
      description: 'Token absent, invalide ou expiré',
    }),
    ApiForbiddenResponse({
      description: "Vous n'êtes pas autorisé à modifier cet article",
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
