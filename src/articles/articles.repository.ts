import { Injectable } from '@nestjs/common';
import { CreateArticleDto } from './_utils/dto/request/create-article.dto.js';
import { Article, ArticleDocument } from './_utils/schemas/articles.schema.js';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UpdateArticleDto } from './_utils/dto/request/update-article.dto.js';

type CreateArticleData = CreateArticleDto & {
  authorId: string;
};

@Injectable()
export class ArticlesRepository {
  constructor(
    @InjectModel(Article.name) private readonly articleModel: Model<Article>,
  ) {}

  async createArticle(article: CreateArticleData): Promise<ArticleDocument> {
    return this.articleModel.create(article);
  }

  async findAllarticles(): Promise<ArticleDocument[]> {
    return this.articleModel.find().sort({ createdAt: -1 }).exec();
  }

  async findArticleById(id: string): Promise<ArticleDocument | null> {
    return this.articleModel.findById(id).exec();
  }

  async updateArticle(
    id: string,
    authorId: string,
    article: UpdateArticleDto,
  ): Promise<ArticleDocument | null> {
    return this.articleModel
      .findOneAndUpdate(
        { _id: id, authorId },
        { $set: article },
        {
          new: true,
          runValidators: true,
        },
      )
      .exec();
  }

  async deleteArticle(
    id: string,
    authorId: string,
  ): Promise<ArticleDocument | null> {
    return this.articleModel.findOneAndDelete({ _id: id, authorId }).exec();
  }
}
