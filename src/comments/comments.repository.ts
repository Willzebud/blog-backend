import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment, CommentDocument } from './_utils/schemas/comment.schema.js';
import { UpdateCommentDto } from './_utils/dto/request/update-comment.dto.js';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectModel(Comment.name)
    private readonly commentModel: Model<Comment>,
  ) {}

  async createComment(articleId: string, userId: string, content: string) {
    return this.commentModel.create({
      articleId,
      userId,
      content,
    });
  }

  async getCommentsByArticleId(articleId: string) {
    return this.commentModel.find({ articleId }).sort({ createdAt: -1 }).exec();
  }

  async findCommentById(id: string): Promise<CommentDocument | null> {
    return this.commentModel.findById(id).exec();
  }

  async updateComment(
    id: string,
    userId: string,
    updateCommentDto: UpdateCommentDto,
  ): Promise<CommentDocument | null> {
    return this.commentModel
      .findOneAndUpdate(
        { _id: id, userId },
        { $set: { content: updateCommentDto.content } },
        {
          new: true,
          runValidators: true,
        },
      )
      .exec();
  }

  async deleteComment(
    id: string,
    userId: string,
  ): Promise<CommentDocument | null> {
    return this.commentModel.findOneAndDelete({ _id: id, userId }).exec();
  }

  async deleteCommentsByArticleId(articleId: string): Promise<void> {
    await this.commentModel.deleteMany({ articleId }).exec();
  }

  async countCommentsByArticleIds(
    articleIds: string[],
  ): Promise<Map<string, number>> {
    if (articleIds.length === 0) {
      return new Map();
    }

    const results = await this.commentModel.aggregate<{
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
