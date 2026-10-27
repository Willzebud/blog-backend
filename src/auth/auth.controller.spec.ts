import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { vi } from 'vitest';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { GlobalExceptionFilter } from '../shared/filters/http-exception.filter.js';

const validUser = {
  id: 'user-1',
  userFirstname: 'willyam',
  userLastname: 'rib',
  userPseudo: 'willy',
  userEmail: 'willyam@test.dev',
};

const validCredentials = {
  userEmail: 'willyam@test.dev',
  userPassword: 'MotDePasseTresLoooooooong',
};

const authServiceMock = {
  validateUser: vi.fn(),
  login: vi.fn(),
};

// Même configuration HTTP que main.ts
async function createApp(module: TestingModule): Promise<INestApplication> {
  const app = module.createNestApplication();

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.use(cookieParser());

  await app.init();

  return app;
}

describe('AuthController', () => {
  let app: INestApplication;
  let controller: AuthController;

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    controller = module.get<AuthController>(AuthController);
    app = await createApp(module);
  });

  afterEach(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /api/auth/login', () => {
    it.each([
      ['un body vide', {}],
      ['un email invalide', { ...validCredentials, userEmail: 'nope' }],
      ['un mot de passe absent', { userEmail: validCredentials.userEmail }],
      ['un email numérique', { ...validCredentials, userEmail: 123 }],
      [
        'un mot de passe numérique',
        { ...validCredentials, userPassword: 123456 },
      ],
      ['un champ non autorisé', { ...validCredentials, admin: true }],
    ])(
      'doit renvoyer 400 sans vérifier les identifiants pour %s',
      async (_label, body) => {
        await request(app.getHttpServer())
          .post('/api/auth/login')
          .send(body)
          .expect(400);

        expect(authServiceMock.validateUser).not.toHaveBeenCalled();
        expect(authServiceMock.login).not.toHaveBeenCalled();
      },
    );

    it("doit refuser les identifiants transmis uniquement dans l'URL", async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .query(validCredentials)
        .expect(400);

      expect(authServiceMock.validateUser).not.toHaveBeenCalled();
    });

    it('doit renvoyer 401 si les identifiants sont incorrects', async () => {
      authServiceMock.validateUser.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(validCredentials)
        .expect(401);

      expect(response.body.message).toBe('Unauthorized');
      expect(authServiceMock.validateUser).toHaveBeenCalledWith(
        validCredentials.userEmail,
        validCredentials.userPassword,
      );
      expect(authServiceMock.login).not.toHaveBeenCalled();
    });

    it("doit renvoyer 200 avec l'access token et le cookie refresh token", async () => {
      authServiceMock.validateUser.mockResolvedValue(validUser);
      authServiceMock.login.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(validCredentials)
        .expect(200);

      expect(response.body).toEqual({ accessToken: 'access-token' });
      expect(authServiceMock.login).toHaveBeenCalledWith(validUser);

      const cookie = response.headers['set-cookie']?.[0];
      expect(cookie).toContain('refreshToken=refresh-token');
      expect(cookie).toContain('Path=/api/auth');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Lax');
    });
  });
});

describe('AuthController - limitation des tentatives de login', () => {
  let app: INestApplication;

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }])],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    app = await createApp(module);
  });

  afterEach(async () => {
    await app.close();
  });

  it('doit renvoyer 429 à la 6e tentative en une minute', async () => {
    authServiceMock.validateUser.mockResolvedValue(null);

    for (let attempt = 1; attempt <= 5; attempt++) {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(validCredentials)
        .expect(401);
    }

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send(validCredentials)
      .expect(429);
  });
});
