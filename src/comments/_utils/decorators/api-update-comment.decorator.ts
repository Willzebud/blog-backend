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
import { GetCommentDto } from '../dto/response/get-comment.dto.js';

export function ApiUpdateComment() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOkResponse({
      description: 'Commentaire modifié avec succès',
      type: GetCommentDto,
    }),
    ApiBadRequestResponse({
      description: 'Identifiant ou contenu invalide',
    }),
    ApiNotFoundResponse({
      description: 'Commentaire introuvable',
    }),
    ApiUnauthorizedResponse({
      description: 'Token absent, invalide ou expiré',
    }),
    ApiForbiddenResponse({
      description: "Vous n'êtes pas autorisé à modifier ce commentaire",
    }),
    ApiParam({
      name: 'id',
      description: 'ID du commentaire',
    }),
  );
}
