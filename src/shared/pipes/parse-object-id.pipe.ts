import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isValidObjectId, Types } from 'mongoose';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(id: string): string {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID MongoDB invalide');
    }

    // Forme canonique (hexadécimal minuscule) : les ids sont stockés en string
    return new Types.ObjectId(id).toHexString();
  }
}
