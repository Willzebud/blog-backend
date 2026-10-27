import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { REFRESH_TOKEN_DURATION, SessionsService } from './sessions.service.js';
import { SessionsRepository } from './sessions.repository.js';
import { vi } from 'vitest';
import { createHash } from 'node:crypto';

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

describe('SessionsService', () => {
  let service: SessionsService;

  const sessionsRepositoryMock = {
    createSession: vi.fn(),
    rotateSession: vi.fn(),
    revokeSessionByTokenHash: vi.fn(),
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

  afterEach(() => {
    vi.useRealTimers();
  });

  it('doit fixer la durée de vie des refresh tokens à 7 jours', () => {
    expect(REFRESH_TOKEN_DURATION).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('doit créer une session expirant après REFRESH_TOKEN_DURATION avec le hash du token', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-27T12:00:00.000Z'));

    const refreshToken = await service.createSession('user-123');

    expect(refreshToken).toMatch(/^[0-9a-f]{64}$/);
    expect(sessionsRepositoryMock.createSession).toHaveBeenCalledWith({
      userId: 'user-123',
      tokenHash: sha256(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_DURATION),
    });
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

  it("doit renouveler l'expiration de la session lors de la rotation", async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-27T12:00:00.000Z'));
    sessionsRepositoryMock.rotateSession.mockResolvedValue({
      userId: 'user-123',
    });

    await service.rotateRefreshToken('ancien-refresh-token');

    expect(sessionsRepositoryMock.rotateSession).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      new Date(Date.now() + REFRESH_TOKEN_DURATION),
    );
  });

  it('doit refuser un refresh token invalide', async () => {
    sessionsRepositoryMock.rotateSession.mockResolvedValue(null);

    await expect(
      service.rotateRefreshToken('ancien-token-invalide'),
    ).rejects.toThrow(UnauthorizedException);

    expect(sessionsRepositoryMock.rotateSession).toHaveBeenCalledOnce();
  });

  it('doit révoquer la session avec le même hash que celui utilisé à la création', async () => {
    const refreshToken = await service.createSession('user-123');

    await service.revokeSessionByRefreshToken(refreshToken);

    const createdHash =
      sessionsRepositoryMock.createSession.mock.calls[0][0].tokenHash;
    expect(
      sessionsRepositoryMock.revokeSessionByTokenHash,
    ).toHaveBeenCalledWith(createdHash);
    expect(createdHash).toBe(sha256(refreshToken));
  });

  it('doit accepter à la rotation le token émis à la création', async () => {
    const refreshToken = await service.createSession('user-123');
    sessionsRepositoryMock.rotateSession.mockResolvedValue({
      userId: 'user-123',
    });

    await service.rotateRefreshToken(refreshToken);

    const createdHash =
      sessionsRepositoryMock.createSession.mock.calls[0][0].tokenHash;
    expect(sessionsRepositoryMock.rotateSession.mock.calls[0][0]).toBe(
      createdHash,
    );
  });
});
