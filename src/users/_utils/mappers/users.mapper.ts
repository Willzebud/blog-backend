import { GetUserDto } from '../dto/response/get-user.dto.js';
import { UserDocument } from '../schemas/users.schema.js';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersMapper {
  toGetUserDto = (user: UserDocument): GetUserDto => ({
    id: user._id.toString(),
    userFirstname: user.userFirstname,
    userLastname: user.userLastname,
    userPseudo: user.userPseudo,
    userEmail: user.userEmail,
  });
}
