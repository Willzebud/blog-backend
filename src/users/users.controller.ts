import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/_utils/guards/jwt-auth.guard.js';
import { ApiUserMe } from './_utils/decorators/api-user-me.decorators.js';
import { GetUserDto } from './_utils/dto/response/get-user.dto.js';
import { CurrentUser } from '../shared/decorators/current-user.decorator.js';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor() {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiUserMe()
  getUserME(@CurrentUser() user: GetUserDto) {
    return user;
  }
}
