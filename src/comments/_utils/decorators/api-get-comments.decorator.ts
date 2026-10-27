import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';
import { GetCommentDto } from '../dto/response/get-comment.dto.js';

export function ApiGetComments() {
  return applyDecorators(
    ApiOkResponse({
      description: "Liste des commentaires de l'article",
      type: GetCommentDto,
      isArray: true,
    }),
    ApiBadRequestResponse({
      description: 'Identifiant article invalide',
    }),
    ApiNotFoundResponse({
      description: 'Article introuvable',
    }),
    ApiParam({
      name: 'articleId',
      description: "ID article",
    }),
  );
}
