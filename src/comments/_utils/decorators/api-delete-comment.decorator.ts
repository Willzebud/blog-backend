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

export function ApiDeleteComment() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiNoContentResponse({
      description: 'Commentaire supprimé avec succès',
    }),
    ApiBadRequestResponse({
      description: 'Identifiant invalide',
    }),
    ApiNotFoundResponse({
      description: 'Commentaire introuvable',
    }),
    ApiUnauthorizedResponse({
      description: 'Token absent, invalide ou expiré',
    }),
    ApiForbiddenResponse({
      description: "Vous n'êtes pas autorisé à supprimer ce commentaire",
    }),
    ApiParam({
      name: 'id',
      description: 'ID du commentaire',
    }),
  );
}
