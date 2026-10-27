import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './_utils/schemas/users.schema.js';
import { Model } from 'mongoose';
import { CreateUserDto } from './_utils/dto/request/create-user.dto.js';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  async createUser(user: CreateUserDto): Promise<UserDocument> {
    return this.userModel.create(user);
  }

  async findUserEmail(userEmail: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ userEmail: userEmail });
  }

  async findUserById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId);
  }
}
