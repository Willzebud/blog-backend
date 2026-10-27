import { applyDecorators } from '@nestjs/common';
import {
  ApiNoContentResponse,
} from '@nestjs/swagger';

export function ApiLogout() {
  return applyDecorators(
    ApiNoContentResponse({
        description: 'Déconnexion réussi',
      }),
  );
}
