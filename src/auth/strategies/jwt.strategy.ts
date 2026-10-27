import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service.js';
import { ExtractJwt } from 'passport-jwt';
import { PayloadType } from './types/payload.type.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly userService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: PayloadType) {
  try {
    return await this.userService.findUserById(payload.sub);
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw new UnauthorizedException('Utilisateur inexistant');
    }

    throw error;
  }
}
}
