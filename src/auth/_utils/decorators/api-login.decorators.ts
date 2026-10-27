import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export function ApiLogin() {
  return applyDecorators(
    ApiTooManyRequestsResponse({
      description: 'Trop de tentatives. Veuillez réessayer plus tard.',
    }),
    ApiOkResponse({
      description: 'Connexion réussie',
    }),
    ApiBadRequestResponse({
      description: 'Données de connexion invalides',
    }),
    ApiUnauthorizedResponse({
      description: 'Email ou mot de passe incorrect',
    }),
  );
}
