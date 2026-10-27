import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { vi } from 'vitest';
import { AuthService } from './auth.service.js';
import { SessionsService } from '../sessions/sessions.service.js';
import { UsersMapper } from '../users/_utils/mappers/users.mapper.js';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
import { CreateUserDto } from '../users/_utils/dto/request/create-user.dto.js';

describe('AuthService', () => {
  let service: AuthService;

  // Base utilisateurs en mémoire : l'email est stocké tel que reçu par createUser
  let storedUsers: { _id: string; userEmail: string }[];

  const usersServiceMock = {
    findUserEmail: vi.fn(),
    findUserById: vi.fn(),
    createUser: vi.fn(),
  };

  const jwtServiceMock = {
    signAsync: vi.fn(),
  };

  const usersMapperMock = {
    toGetUserDto: vi.fn(),
  };

  const sessionsServiceMock = {
    createSession: vi.fn(),
    rotateRefreshToken: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    storedUsers = [];

    usersServiceMock.findUserEmail.mockImplementation(
      async (userEmail: string) =>
        storedUsers.find((user) => user.userEmail === userEmail) ?? null,
    );
    usersServiceMock.createUser.mockImplementation(
      async (data: CreateUserDto) => {
        const user = { ...data, _id: `user-${storedUsers.length + 1}` };
        storedUsers.push(user);
        return user;
      },
    );
    jwtServiceMock.signAsync.mockResolvedValue('access-token');
    sessionsServiceMock.createSession.mockResolvedValue('refresh-token');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
        {
          provide: UsersMapper,
          useValue: usersMapperMock,
        },
        {
          provide: SessionsService,
          useValue: sessionsServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('doit refuser une inscription avec le même email dans une casse différente', async () => {
    const payload: CreateUserDto = {
      userEmail: 'willyam@test.dev',
      userPseudo: 'willy',
      userFirstname: 'willyam',
      userLastname: 'rib',
      userAge: 32,
      userPassword: 'MotDePasseTresLoooooooong',
    };

    await service.register(payload);

    await expect(
      service.register({ ...payload, userEmail: 'WillYam@Test.DEV' }),
    ).rejects.toThrow(new ConflictException('Adresse email déjà utilisée'));

    expect(usersServiceMock.findUserEmail).toHaveBeenNthCalledWith(
      2,
      'willyam@test.dev',
    );
    expect(usersServiceMock.createUser).toHaveBeenCalledOnce();
    expect(usersServiceMock.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ userEmail: 'willyam@test.dev' }),
    );
  });

  it("doit renvoyer 401 lors du refresh si l'utilisateur de la session n'existe plus", async () => {
    sessionsServiceMock.rotateRefreshToken.mockResolvedValue({
      refreshToken: 'nouveau-refresh-token',
      userId: 'utilisateur-supprime',
    });
    usersServiceMock.findUserById.mockRejectedValue(
      new NotFoundException('ID utilisateur non trouvé'),
    );

    await expect(service.refresh('ancien-refresh-token')).rejects.toThrow(
      new UnauthorizedException('Utilisateur inexistant'),
    );

    expect(sessionsServiceMock.rotateRefreshToken).toHaveBeenCalledWith(
      'ancien-refresh-token',
    );
    expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
  });
});
