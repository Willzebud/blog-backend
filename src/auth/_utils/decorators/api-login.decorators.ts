import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginUserDto } from '../../../users/_utils/dto/request/login-user.dto.js';

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
    ApiBody({ type: LoginUserDto }),
  );
}
