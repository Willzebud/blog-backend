import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository.js';
import { CreateUserDto } from './_utils/dto/request/create-user.dto.js';
import { UsersMapper } from './_utils/mappers/users.mapper.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersMapper: UsersMapper,
  ) {}

  createUser(user: CreateUserDto) {
    return this.usersRepository.createUser(user);
  }

  findUserEmail(userEmail: string) {
    return this.usersRepository.findUserEmail(userEmail);
  }

  async findUserById(userId: string) {
    const userById = await this.usersRepository.findUserById(userId);

    if (userById === null) {
      throw new NotFoundException('ID utilisateur non trouvé');
    }

    return this.usersMapper.toGetUserDto(userById);
  }
}
