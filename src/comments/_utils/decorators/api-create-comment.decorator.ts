import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetCommentDto } from '../dto/response/get-comment.dto.js';

export function ApiCreateComment() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiCreatedResponse({
      description: 'Commentaire créé avec succès',
      type: GetCommentDto,
    }),
    ApiBadRequestResponse({
      description: 'Identifiant ou contenu invalide',
    }),
    ApiNotFoundResponse({
      description: 'Article introuvable',
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
