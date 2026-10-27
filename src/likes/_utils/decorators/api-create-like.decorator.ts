import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export function ApiCreateLike() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiCreatedResponse({
      description: 'Article liké avec succès',
    }),
    ApiBadRequestResponse({
      description: "ID de l'article invalide",
    }),
    ApiUnauthorizedResponse({
      description: 'Token absent, invalide ou expiré',
    }),
    ApiNotFoundResponse({
      description: 'Article introuvable',
    }),
    ApiConflictResponse({
      description: 'Vous avez déjà liké cet article',
    }),
    ApiParam({
      name: 'articleId',
      description: "ID article",
    }),
  );
}
