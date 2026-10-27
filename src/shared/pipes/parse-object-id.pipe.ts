import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isValidObjectId, Types } from 'mongoose';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(id: string): string {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID MongoDB invalide');
    }

    return new Types.ObjectId(id).toHexString();
  }
}
