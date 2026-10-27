import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth.module.js';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { UsersMapper } from '../users/_utils/mappers/users.mapper.js';
import { User } from '../users/_utils/schemas/users.schema.js';
import { Session } from '../sessions/_utils/schemas/session.schema.js';

// Compile le vrai graphe AuthModule -> UsersModule / SessionsModule,
// avec des modèles Mongoose simulés (aucune connexion à MongoDB)
describe('AuthModule', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({ JWT_SECRET: 'test-secret' })],
        }),
        ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }]),
        AuthModule,
      ],
    })
      .overrideProvider(getModelToken(User.name))
      .useValue({})
      .overrideProvider(getModelToken(Session.name))
      .useValue({})
      .compile();
  });

  afterAll(async () => {
    await module.close();
  });

  it('doit résoudre AuthService et UsersService avec leurs dépendances', () => {
    expect(module.get(AuthService)).toBeInstanceOf(AuthService);
    expect(module.get(UsersService, { strict: false })).toBeInstanceOf(
      UsersService,
    );
  });

  it('doit partager une seule instance de UsersMapper entre AuthService et UsersService', () => {
    const authService = module.get(AuthService);
    const usersService = module.get(UsersService, { strict: false });

    const authMapper = Reflect.get(authService, 'usersMapper');
    const usersMapper = Reflect.get(usersService, 'usersMapper');

    expect(authMapper).toBeInstanceOf(UsersMapper);
    expect(authMapper).toBe(usersMapper);
  });
});
