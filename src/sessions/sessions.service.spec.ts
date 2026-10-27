import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { SessionsService } from './sessions.service.js';
import { SessionsRepository } from './sessions.repository.js';
import { vi } from 'vitest';
import { createHash } from 'node:crypto';

describe('SessionsService', () => {
  let service: SessionsService;

  const sessionsRepositoryMock = {
    rotateSession: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: SessionsRepository,
          useValue: sessionsRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
  });

  it('doit générer un nouveau refresh token lors de la rotation', async () => {
    const oldRefreshToken = 'ancien-refresh-token';
    const userId = 'user-123';

    sessionsRepositoryMock.rotateSession.mockResolvedValue({
      userId,
    });

    const result = await service.rotateRefreshToken(oldRefreshToken);

    expect(result.userId).toBe(userId);

    expect(result.refreshToken).not.toBe(oldRefreshToken);

    const oldTokenHash = createHash('sha256')
      .update(oldRefreshToken)
      .digest('hex');

    const newTokenHash = createHash('sha256')
      .update(result.refreshToken)
      .digest('hex');

    expect(sessionsRepositoryMock.rotateSession).toHaveBeenCalledWith(
      oldTokenHash,
      newTokenHash,
      expect.any(Date),
    );
  });

  it('doit refuser un refresh token invalide', async () => {
    sessionsRepositoryMock.rotateSession.mockResolvedValue(null);

    await expect(
      service.rotateRefreshToken('ancien-token-invalide'),
    ).rejects.toThrow(UnauthorizedException);

    expect(sessionsRepositoryMock.rotateSession).toHaveBeenCalledOnce();
  });
});
