import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Like, LikeDocument } from './_utils/schemas/like.schema.js';

@Injectable()
export class LikesRepository {
  constructor(
    @InjectModel(Like.name)
    private readonly likeModel: Model<Like>,
  ) {}

  async createLike(articleId: string, userId: string): Promise<LikeDocument> {
    return this.likeModel.create({
      articleId,
      userId,
    });
  }

  async deleteLike(
    articleId: string,
    userId: string,
  ): Promise<LikeDocument | null> {
    return this.likeModel.findOneAndDelete({ articleId, userId }).exec();
  }

  async deleteLikesByArticleId(articleId: string): Promise<void> {
    await this.likeModel.deleteMany({ articleId }).exec();
  }

  async countLikesByArticleIds(
    articleIds: string[],
  ): Promise<Map<string, number>> {
    if (articleIds.length === 0) {
      return new Map();
    }

    const results = await this.likeModel.aggregate<{
      _id: string;
      count: number;
    }>([
      {
        $match: {
          articleId: { $in: articleIds },
        },
      },
      {
        $group: {
          _id: '$articleId',
          count: { $sum: 1 },
        },
      },
    ]);

    return new Map(results.map((result) => [result._id, result.count]));
  }
}
