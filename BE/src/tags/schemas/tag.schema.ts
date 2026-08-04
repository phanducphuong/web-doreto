import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TagDocument = HydratedDocument<Tag>;

@Schema({ timestamps: true })
export class Tag {
  @Prop({ type: Number })
  _id?: number;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: String, default: null })
  icon?: string;

  @Prop({ type: Number, default: 0, min: 0 })
  order?: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const TagSchema = SchemaFactory.createForClass(Tag);
TagSchema.set('_id', true);
