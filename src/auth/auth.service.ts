import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/_utils/dto/request/create-user.dto.js';
import { JwtService } from '@nestjs/jwt';
import { UsersMapper } from '../users/_utils/mappers/users.mapper.js';
import { SessionsService } from '../sessions/sessions.service.js';
import { GetUserDto } from '../users/_utils/dto/response/get-user.dto.js';

@Injectable()
export class AuthService {
  private readonly saltRounds: number = 10;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly usersMapper: UsersMapper,
    private readonly sessionsService: SessionsService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.usersService.findUserEmail(normalizedEmail);

    if (!user) {
      return null;
    }

    const match = await bcrypt.compare(password, user.userPassword);

    if (!match) {
      return null;
    }

    return this.usersMapper.toGetUserDto(user);
  }

  async login(user: GetUserDto) {
    const payload = { userEmail: user.userEmail, sub: user.id };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });

    const refreshToken = await this.sessionsService.createSession(user.id);

    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(refreshToken: string) {
    return await this.sessionsService.revokeSessionByRefreshToken(refreshToken);
  }

  async register(payload: CreateUserDto) {
    const email = payload.userEmail.trim().toLowerCase();
    const user = await this.usersService.findUserEmail(email);

    if (user !== null) {
      throw new ConflictException('Adresse email déjà utilisée');
    }

    const hashPassword = await bcrypt.hash(
      payload.userPassword,
      this.saltRounds,
    );

    const data = {
      ...payload,
      userEmail: email,
      userPassword: hashPassword,
    };

    const newUser = await this.usersService.createUser(data);

    const accessToken = await this.jwtService.signAsync(
      {
        sub: newUser._id.toString(),
        userEmail: newUser.userEmail,
      },
      { expiresIn: '15m' },
    );

    const refreshToken = await this.sessionsService.createSession(
      newUser._id.toString(),
    );

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
      user: this.usersMapper.toGetUserDto(newUser),
    };
  }

  async refresh(oldRefreshToken: string) {
    const { refreshToken, userId } =
      await this.sessionsService.rotateRefreshToken(oldRefreshToken);

    let user: GetUserDto;

    try {
      user = await this.usersService.findUserById(userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException('Utilisateur inexistant');
      }

      throw error;
    }

    const accessToken = await this.jwtService.signAsync(
      { sub: userId, userEmail: user.userEmail },
      { expiresIn: '15m' },
    );
    return { refreshToken, accessToken };
  }
}
