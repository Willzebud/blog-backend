import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiParam,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export function ApiDeleteLike() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiNoContentResponse({
      description: 'Like supprimé avec succès',
    }),
    ApiBadRequestResponse({
      description: "ID de l'article invalide",
    }),
    ApiUnauthorizedResponse({
      description: 'Token absent, invalide ou expiré',
    }),
    ApiParam({
      name: 'articleId',
      description: "ID article",
    }),
  );
}
