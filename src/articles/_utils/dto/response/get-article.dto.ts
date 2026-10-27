import { ApiProperty } from '@nestjs/swagger';

export class GetArticleDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ type: [String] })
  categories: string[];

  @ApiProperty()
  authorId: string;

  @ApiProperty()
  commentsCount: number;

  @ApiProperty()
  likesCount: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
