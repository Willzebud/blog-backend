import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'willyam@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  userEmail: string;

  @ApiProperty({ example: 'willy' })
  @IsString()
  @IsNotEmpty()
  userPseudo: string;

  @ApiProperty({ example: 'willyam' })
  @IsString()
  @IsNotEmpty()
  userFirstname: string;

  @ApiProperty({ example: 'rib' })
  @IsString()
  @IsNotEmpty()
  userLastname: string;

  @ApiProperty({ example: 32 })
  @IsNumber()
  @IsNotEmpty()
  userAge: number;

  @ApiProperty({
    example: 'MotDePasseTresLoooooooong',
    minLength: 12,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(12, {
    message: 'Le mot de passe doit contenir au moins 12 caractères',
  })
  userPassword: string;
}
