import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ContactRequestDocument = HydratedDocument<ContactRequest>;

@Schema({ timestamps: true })
export class ContactRequest {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ default: false })
  done: boolean;

  @Prop({ type: Date })
  doneAt?: Date;
}

export const ContactRequestSchema =
  SchemaFactory.createForClass(ContactRequest);
