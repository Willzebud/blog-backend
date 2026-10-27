import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';

export function ApiRegister() {
  return applyDecorators(
    ApiTooManyRequestsResponse({
      description: 'Trop de tentatives. Veuillez réessayer plus tard.',
    }),
    ApiCreatedResponse({
      description: 'Utilisateur créé avec succès',
    }),
    ApiBadRequestResponse({
      description: 'Données utilisateur invalides',
    }),
    ApiConflictResponse({
      description: 'Adresse email déjà utilisée',
    }),
  );
}
