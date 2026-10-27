import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SessionsRepository } from './sessions.repository.js';
import { createHash, randomBytes } from 'node:crypto';

export const REFRESH_TOKEN_DURATION = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class SessionsService {
  constructor(private readonly sessionsRepository: SessionsRepository) {}

  async createSession(userId: string) {
    const { refreshToken, tokenHash } = this.generateRefreshToken();

    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DURATION);

    await this.sessionsRepository.createSession({
      userId,
      tokenHash,
      expiresAt,
    });
    return refreshToken;
  }

  async revokeSessionByRefreshToken(refreshToken: string) {
    if (!refreshToken) {
      return;
    }
    const tokenHash = this.hashToken(refreshToken);

    return await this.sessionsRepository.revokeSessionByTokenHash(tokenHash);
  }

  async rotateRefreshToken(oldRefreshToken: string) {
    if (!oldRefreshToken) {
      throw new UnauthorizedException('Refresh token manquant');
    }

    const oldTokenHash = this.hashToken(oldRefreshToken);

    const { refreshToken, tokenHash } = this.generateRefreshToken();

    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DURATION);

    const session = await this.sessionsRepository.rotateSession(
      oldTokenHash,
      tokenHash,
      expiresAt,
    );

    if (!session) {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    return { refreshToken, userId: session.userId };
  }

  private generateRefreshToken() {
    const refreshToken = randomBytes(32).toString('hex');

    const tokenHash = this.hashToken(refreshToken);

    return { refreshToken, tokenHash };
  }

  private hashToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }
}
