import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { GetUserDto } from '../../users/_utils/dto/response/get-user.dto.js';

// Utilisateur placé dans request.user par JwtStrategy (à utiliser avec JwtAuthGuard)
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): GetUserDto => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: GetUserDto }>();

    return request.user;
  },
);
