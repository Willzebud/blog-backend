import { Injectable } from '@nestjs/common';
import { CreateSessionDto } from './_utils/dto/request/create-session.data.js';
import { Model } from 'mongoose';
import { Session } from './_utils/schemas/session.schema.js';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectModel(Session.name) private readonly sessionModel: Model<Session>,
  ) {}

  async createSession(data: CreateSessionDto) {
    return this.sessionModel.create(data);
  }

  async revokeSessionByTokenHash(tokenHash: string) {
    return this.sessionModel
      .findOneAndUpdate(
        { tokenHash, revokedAt: null },
        { $set: { revokedAt: new Date() } },
        { returnDocument: 'after' },
      )
      .exec();
  }

  async rotateSession(
    oldTokenHash: string,
    newTokenHash: string,
    expiresAt: Date,
  ) {
    return this.sessionModel
      .findOneAndUpdate(
        {
          tokenHash: oldTokenHash,
          revokedAt: null,
          expiresAt: { $gt: new Date() },
        },
        {
          $set: {
            tokenHash: newTokenHash,
            expiresAt,
          },
        },
        { returnDocument: 'after' },
      )
      .exec();
  }
}
