import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ versionKey: false })
export class User {
  @Prop({ type: String, required: true, unique: true })
  userEmail: string;

  @Prop({ type: String, required: true })
  userPseudo: string;

  @Prop({ type: String, required: true })
  userFirstname: string;

  @Prop({ type: String, required: true })
  userLastname: string;

  @Prop({ type: Number, required: true })
  userAge: number;

  @Prop({ type: String, required: true })
  userPassword: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
