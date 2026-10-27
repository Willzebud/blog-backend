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
  logout: vi.fn(),
  refresh: vi.fn(),
};

// Découpe un en-tête Set-Cookie en { name, value, attributes }
function parseSetCookie(header: string | undefined) {
  const [pair, ...attributes] = (header ?? '').split('; ');
  const [name, value] = pair.split('=');

  return {
    name,
    value,
    attributes: Object.fromEntries(
      attributes.map((attribute) => {
        const [key, attributeValue = true] = attribute.split('=');
        return [key, attributeValue];
      }),
    ),
  };
}

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

  describe('cookie refresh token', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    async function loginRefreshAndLogout() {
      authServiceMock.validateUser.mockResolvedValue(validUser);
      authServiceMock.login.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      authServiceMock.refresh.mockResolvedValue({
        accessToken: 'access-token-2',
        refreshToken: 'refresh-token-2',
      });

      const login = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(validCredentials)
        .expect(200);
      const refresh = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', 'refreshToken=refresh-token')
        .expect(200);
      const logout = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', 'refreshToken=refresh-token-2')
        .expect(204);

      return {
        login: parseSetCookie(login.headers['set-cookie']?.[0]),
        refresh: parseSetCookie(refresh.headers['set-cookie']?.[0]),
        logout: parseSetCookie(logout.headers['set-cookie']?.[0]),
      };
    }

    it('doit poser le cookie au login et au refresh avec les mêmes attributs', async () => {
      const { login, refresh } = await loginRefreshAndLogout();

      for (const cookie of [login, refresh]) {
        expect(cookie.name).toBe('refreshToken');
        expect(cookie.attributes).toMatchObject({
          'Max-Age': '604800',
          Path: '/api/auth',
          HttpOnly: true,
          SameSite: 'Lax',
        });
        expect(cookie.attributes).not.toHaveProperty('Secure');
      }

      expect(login.value).toBe('refresh-token');
      expect(refresh.value).toBe('refresh-token-2');
      expect(authServiceMock.refresh).toHaveBeenCalledWith('refresh-token');
    });

    it('doit révoquer la session et effacer le cookie avec le même Path au logout', async () => {
      const { login, logout } = await loginRefreshAndLogout();

      expect(authServiceMock.logout).toHaveBeenCalledWith('refresh-token-2');
      expect(logout.name).toBe('refreshToken');
      expect(logout.value).toBe('');
      expect(logout.attributes.Path).toBe(login.attributes.Path);
      expect(logout.attributes).toMatchObject({
        Expires: 'Thu, 01 Jan 1970 00:00:00 GMT',
        HttpOnly: true,
        SameSite: 'Lax',
      });
      expect(logout.attributes).not.toHaveProperty('Max-Age');
    });

    it('doit ajouter Secure à la création et à la suppression en production', async () => {
      process.env.NODE_ENV = 'production';

      const { login, refresh, logout } = await loginRefreshAndLogout();

      expect(login.attributes.Secure).toBe(true);
      expect(refresh.attributes.Secure).toBe(true);
      expect(logout.attributes.Secure).toBe(true);
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
