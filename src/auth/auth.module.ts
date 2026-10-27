import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { UsersModule } from '../users/users.module.js';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { ConfigService } from '@nestjs/config';
import { UsersMapper } from '../users/_utils/mappers/users.mapper.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { LocalStrategy } from './strategies/local.strategy.js';
import { SessionsModule } from '../sessions/sessions.module.js';

@Module({
  imports: [
    SessionsModule,
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      global: true,
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UsersMapper, JwtStrategy, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
