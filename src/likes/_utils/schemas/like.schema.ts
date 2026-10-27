import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LikeDocument = HydratedDocument<Like>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Like {
  @Prop({
    type: String,
    required: true,
    index: true,
  })
  articleId: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  userId: string;

  createdAt: Date;
  updatedAt: Date;
}

export const LikeSchema = SchemaFactory.createForClass(Like);

LikeSchema.index({ articleId: 1, userId: 1 }, { unique: true });
