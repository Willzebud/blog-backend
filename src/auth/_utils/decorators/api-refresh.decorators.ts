import { applyDecorators } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export function ApiRefresh() {
  return applyDecorators(
    ApiTooManyRequestsResponse({
      description: 'Trop de tentatives. Veuillez réessayer plus tard.',
    }),
    ApiOkResponse({
      description: 'Tokens renouvelés avec succès',
    }),
    ApiUnauthorizedResponse({
      description: 'Refresh token manquant, invalide ou expiré',
    }),
  );
}
