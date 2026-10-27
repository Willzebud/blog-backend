import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ArticleDocument = HydratedDocument<Article>;

@Schema({ timestamps: true })
export class Article {
  @Prop({ type: String, required: true })
  articleTitle: string;

  @Prop({ type: String, required: true })
  articleContent: string;

  @Prop({ type: String, required: true })
  authorId: string;

  @Prop({ type: [String], required: true })
  articleCategory: string[];

  createdAt: Date;
  updatedAt: Date;
}

export const ArticleSchema = SchemaFactory.createForClass(Article);
