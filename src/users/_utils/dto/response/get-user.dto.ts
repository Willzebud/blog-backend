import { ApiProperty } from '@nestjs/swagger';

export class GetUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userFirstname: string;

  @ApiProperty()
  userLastname: string;

  @ApiProperty()
  userPseudo: string;

  @ApiProperty()
  userEmail: string;
}
