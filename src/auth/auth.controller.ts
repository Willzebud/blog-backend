import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from '../users/_utils/dto/request/create-user.dto.js';
import { AuthService } from './auth.service.js';
import { AuthGuard } from '@nestjs/passport';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { LoginUserDto } from '../users/_utils/dto/request/login-user.dto.js';
import type { Request, Response } from 'express';
import { ApiRegister } from './_utils/decorators/api-register.decorators.js';
import { ApiLogin } from './_utils/decorators/api-login.decorators.js';
import { ApiLogout } from './_utils/decorators/api-logout-decorators.js';
import { ApiRefresh } from './_utils/decorators/api-refresh.decorators.js';
import { GetUserDto } from '../users/_utils/dto/response/get-user.dto.js';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

type AuthenticatedRequest = Request & {
  user: GetUserDto;
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Post Register
  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiRegister()
  async register(
    @Body() body: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.register(body);

    this.setRefreshTokenCookie(res, refreshToken);

    return { accessToken, user };
  }

  // Post Login
  @Post('login')
  @UseGuards(ThrottlerGuard, AuthGuard('local'))
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiLogin()
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() _body: LoginUserDto,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(
      req.user,
    );

    this.setRefreshTokenCookie(res, refreshToken);

    return { accessToken };
  }

  // Post Logout
  @Post('logout')
  @ApiLogout()
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken;

    try {
      await this.authService.logout(refreshToken);
    } finally {
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/auth',
      });
    }
  }

  // Post Refresh
  @Post('refresh')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiRefresh()
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const oldRefreshToken = req.cookies?.refreshToken;

    const { accessToken, refreshToken } =
      await this.authService.refresh(oldRefreshToken);

    this.setRefreshTokenCookie(res, refreshToken);

    return {
      accessToken,
    };
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
