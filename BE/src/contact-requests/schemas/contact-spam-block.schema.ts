import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum ContactSpamKind {
  EMAIL = 'email',
  PHONE = 'phone',
}

export type ContactSpamBlockDocument = HydratedDocument<ContactSpamBlock>;

@Schema({ timestamps: true })
export class ContactSpamBlock {
  @Prop({ required: true, enum: ContactSpamKind })
  kind: ContactSpamKind;

  /** Chuẩn hóa: email lowercase + trim; phone trim (khớp khi tạo liên hệ). */
  @Prop({ required: true, trim: true })
  value: string;
}

export const ContactSpamBlockSchema =
  SchemaFactory.createForClass(ContactSpamBlock);

ContactSpamBlockSchema.index({ kind: 1, value: 1 }, { unique: true });
