import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export function ApiUserMe() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOkResponse({
      description: 'Utilisateur connecté récupéré avec succès',
    }),
    ApiUnauthorizedResponse({
      description: 'Token absent, invalide ou expiré',
    }),
    ApiNotFoundResponse({
      description: 'Utilisateur non trouvé',
    }),
  );
}
