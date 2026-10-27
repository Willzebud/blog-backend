export interface CreateSessionDto {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}
