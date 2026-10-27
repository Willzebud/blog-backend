import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({ example: 'willyam@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  userEmail: string;

  @ApiProperty({ example: 'MotDePasseTresLoooooooong' })
  @IsString()
  @IsNotEmpty()
  userPassword: string;
}
