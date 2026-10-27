import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { vi } from 'vitest';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';
import { SessionsService } from '../sessions/sessions.service.js';
import { UsersMapper } from '../users/_utils/mappers/users.mapper.js';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
import { CreateUserDto } from '../users/_utils/dto/request/create-user.dto.js';

describe('AuthService', () => {
  let service: AuthService;

  let storedUsers: { _id: string; userEmail: string; userPassword?: string }[];

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

  it("doit normaliser l'email (espaces et majuscules) à l'inscription, sans toucher aux autres champs", async () => {
    const payload: CreateUserDto = {
      userEmail: '  WillYam@Test.DEV  ',
      userPseudo: ' Willy ',
      userFirstname: 'Willyam',
      userLastname: 'Rib',
      userAge: 32,
      userPassword: 'MotDePasseTresLoooooooong',
    };

    await service.register(payload);

    expect(usersServiceMock.findUserEmail).toHaveBeenCalledWith(
      'willyam@test.dev',
    );
    expect(usersServiceMock.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        userEmail: 'willyam@test.dev',
        userPseudo: ' Willy ',
        userFirstname: 'Willyam',
        userLastname: 'Rib',
      }),
    );
  });

  it('doit détecter un doublon dont l’email contient des espaces et des majuscules', async () => {
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
      service.register({ ...payload, userEmail: '  WillYam@Test.DEV  ' }),
    ).rejects.toThrow(new ConflictException('Adresse email déjà utilisée'));
    expect(usersServiceMock.createUser).toHaveBeenCalledOnce();
  });

  it.each([
    ['normalisé', 'willyam@test.dev'],
    ['avec majuscules', 'WillYam@Test.DEV'],
    ['avec espaces et majuscules', '  WillYam@Test.DEV  '],
  ])(
    'doit authentifier un utilisateur avec un email %s',
    async (_label, email) => {
      const userPassword = await bcrypt.hash('MotDePasseTresLoooooooong', 4);
      const storedUser = {
        _id: 'user-1',
        userEmail: 'willyam@test.dev',
        userPassword,
      };
      storedUsers.push(storedUser);
      usersMapperMock.toGetUserDto.mockReturnValue({
        id: 'user-1',
        userEmail: 'willyam@test.dev',
      });

      const user = await service.validateUser(
        email,
        'MotDePasseTresLoooooooong',
      );

      expect(usersServiceMock.findUserEmail).toHaveBeenCalledWith(
        'willyam@test.dev',
      );
      expect(usersMapperMock.toGetUserDto).toHaveBeenCalledWith(storedUser);
      expect(user).toEqual({ id: 'user-1', userEmail: 'willyam@test.dev' });
    },
  );

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

describe('AuthService - access tokens JWT', () => {
  let service: AuthService;

  const jwtService = new JwtService({
    secret: 'test-secret',
    signOptions: { expiresIn: '15m' },
  });

  const usersServiceMock = {
    findUserEmail: vi.fn(),
    findUserById: vi.fn(),
    createUser: vi.fn(),
  };

  const sessionsServiceMock = {
    createSession: vi.fn(),
    rotateRefreshToken: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    usersServiceMock.findUserEmail.mockResolvedValue(null);
    usersServiceMock.createUser.mockImplementation(
      async (data: CreateUserDto) => ({ ...data, _id: 'user-1' }),
    );
    usersServiceMock.findUserById.mockResolvedValue({
      id: 'user-1',
      userEmail: 'willyam@test.dev',
    });
    sessionsServiceMock.createSession.mockResolvedValue('refresh-token');
    sessionsServiceMock.rotateRefreshToken.mockResolvedValue({
      refreshToken: 'nouveau-refresh-token',
      userId: 'user-1',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersMapper,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: JwtService, useValue: jwtService },
        { provide: SessionsService, useValue: sessionsServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  async function expectAccessToken(accessToken: string) {
    const payload = await jwtService.verifyAsync(accessToken);

    expect(Object.keys(payload).sort()).toEqual([
      'exp',
      'iat',
      'sub',
      'userEmail',
    ]);
    expect(payload).toMatchObject({
      sub: 'user-1',
      userEmail: 'willyam@test.dev',
    });
    expect(payload.exp - payload.iat).toBe(900);
  }

  it("doit signer l'access token de l'inscription avec sub, userEmail et 15 min", async () => {
    const { accessToken } = await service.register({
      userEmail: 'willyam@test.dev',
      userPseudo: 'willy',
      userFirstname: 'willyam',
      userLastname: 'rib',
      userAge: 32,
      userPassword: 'MotDePasseTresLoooooooong',
    });

    await expectAccessToken(accessToken);
  });

  it("doit signer l'access token du login avec sub, userEmail et 15 min", async () => {
    const { accessToken } = await service.login({
      id: 'user-1',
      userFirstname: 'willyam',
      userLastname: 'rib',
      userPseudo: 'willy',
      userEmail: 'willyam@test.dev',
    });

    await expectAccessToken(accessToken);
  });

  it("doit signer l'access token du refresh avec sub, userEmail et 15 min", async () => {
    const { accessToken, refreshToken } = await service.refresh(
      'ancien-refresh-token',
    );

    expect(refreshToken).toBe('nouveau-refresh-token');
    await expectAccessToken(accessToken);
  });
});
