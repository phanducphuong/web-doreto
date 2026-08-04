import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class NonLoginUser {
  @Prop({ required: false, trim: true, lowercase: true })
  email?: string;
}

export const NonLoginUserSchema = SchemaFactory.createForClass(NonLoginUser);
