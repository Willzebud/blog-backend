import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateArticleDto {
  @ApiProperty({
    example: 'Apprendre Java avec Spring Boot',
    minLength: 5,
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(150)
  articleTitle: string;

  @ApiProperty({
    example: 'Dans cet article, nous allons découvrir les bases de Java...',
    minLength: 20,
    maxLength: 50000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  @MaxLength(50000)
  articleContent: string;

  @ApiProperty({
    example: ['Développement', 'Java'],
    type: [String],
    minItems: 1,
    maxItems: 5,
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  articleCategory: string[];
}
