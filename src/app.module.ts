import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ArticlesModule } from './articles/articles.module.js';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CommentsModule } from './comments/comments.module.js';
import { ArticleDeletionModule } from './article-deletion/article-deletion.module.js';
import { LikesModule } from './likes/likes.module.js';
import { ArticlesCounterModule } from './articles-counter/articles-counter.module.js';

@Module({
  imports: [
    ArticlesModule,
    ArticlesCounterModule,
    LikesModule,
    ArticleDeletionModule,
    AuthModule,
    UsersModule,
    CommentsModule,
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('DATABASE_URL'),
      }),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 5,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
