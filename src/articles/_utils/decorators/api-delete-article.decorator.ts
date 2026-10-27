import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export function ApiDeleteArticle() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiNoContentResponse({
      description: 'Article supprimé avec succès',
    }),
    ApiBadRequestResponse({
      description: 'ID invalide',
    }),
    ApiNotFoundResponse({
      description: 'Article introuvable',
    }),
    ApiUnauthorizedResponse({
      description: 'Token absent, invalide ou expiré',
    }),
    ApiForbiddenResponse({
      description: "Vous n'êtes pas autorisé à supprimer cet article",
    }),
    ApiParam({
      name: 'id',
      description: "ID article",
    }),
  );
}
