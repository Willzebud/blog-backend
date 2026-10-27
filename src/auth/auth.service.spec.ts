import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { SessionsService } from '../sessions/sessions.service.js';
import { UsersMapper } from '../users/_utils/mappers/users.mapper.js';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {},
        },
        {
          provide: UsersMapper,
          useValue: {},
        },
        {
          provide: SessionsService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
