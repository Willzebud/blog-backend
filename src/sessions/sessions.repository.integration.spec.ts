import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SessionsRepository } from './sessions.repository.js';
import { Session, SessionSchema } from './_utils/schemas/session.schema.js';

describe('SessionsRepository - Integration', () => {
  let module: TestingModule;
  let repository: SessionsRepository;
  let sessionModel: Model<Session>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot('mongodb://127.0.0.1:27017/blog_test'),
        MongooseModule.forFeature([
          { name: Session.name, schema: SessionSchema },
        ]),
      ],
      providers: [SessionsRepository],
    }).compile();

    repository = module.get<SessionsRepository>(SessionsRepository);
    sessionModel = module.get<Model<Session>>(getModelToken(Session.name));
  });

  afterAll(async () => {
    await module?.close();
  });

  it('doit autoriser une seule rotation simultanée du même token', async () => {
    const tokenA = 'hash-token-concurrent-A';
    const tokenB = 'hash-token-concurrent-B';
    const tokenC = 'hash-token-concurrent-C';

    const expiresAt = new Date(Date.now() + 60_000);

    const session = await repository.createSession({
      userId: 'test-user-concurrent',
      tokenHash: tokenA,
      expiresAt,
    });

    try {
      const results = await Promise.all([
        repository.rotateSession(tokenA, tokenB, expiresAt),
        repository.rotateSession(tokenA, tokenC, expiresAt),
      ]);

      const successes = results.filter((result) => result !== null);
      const failures = results.filter((result) => result === null);

      expect(successes).toHaveLength(1);
      expect(failures).toHaveLength(1);

      const updatedSession = await sessionModel.findById(session._id).exec();

      expect([tokenB, tokenC]).toContain(updatedSession?.tokenHash);
    } finally {
      await sessionModel.deleteOne({ _id: session._id });
    }
  });

  it('doit empêcher la réutilisation d’un token après rotation', async () => {
    const tokenA = 'hash-token-A';
    const tokenB = 'hash-token-B';
    const tokenC = 'hash-token-C';

    const expiresAt = new Date(Date.now() + 60_000);

    const session = await repository.createSession({
      userId: 'test-user-456',
      tokenHash: tokenA,
      expiresAt,
    });

    try {
      const firstRotation = await repository.rotateSession(
        tokenA,
        tokenB,
        expiresAt,
      );

      expect(firstRotation).not.toBeNull();
      expect(firstRotation?.tokenHash).toBe(tokenB);

      const secondRotation = await repository.rotateSession(
        tokenA,
        tokenC,
        expiresAt,
      );

      expect(secondRotation).toBeNull();

      const thirdRotation = await repository.rotateSession(
        tokenB,
        tokenC,
        expiresAt,
      );

      expect(thirdRotation).not.toBeNull();
      expect(thirdRotation?.tokenHash).toBe(tokenC);
    } finally {
      await sessionModel.deleteOne({ _id: session._id });
    }
  });

  it('doit créer une session dans MongoDB', async () => {
    const session = await repository.createSession({
      userId: 'test-user-123',
      tokenHash: 'test-token-hash',
      expiresAt: new Date(Date.now() + 60_000),
    });

    expect(session.userId).toBe('test-user-123');
    expect(session.tokenHash).toBe('test-token-hash');

    await sessionModel.deleteOne({ _id: session._id });
  });
});
