import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/common/enums/role.enum';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class Address {
  @Prop({ required: false })
  addressName: string; // Tên địa chỉ (ví dụ: "Nhà riêng", "Văn phòng")

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  detailedAddress: string; // Địa chỉ cụ thể (ví dụ: "123 Đường ABC")

  @Prop({ required: true })
  ward: string; // Phường/Xã

  @Prop({ required: true })
  district: string; // Quận/Huyện

  @Prop({ required: true })
  city: string; // Thành phố/Tỉnh

  @Prop({ default: 'Việt Nam' })
  country?: string; // Quốc gia (tùy chọn, mặc định Việt Nam)

  @Prop({ default: false })
  isDefault?: boolean;
}

export const AddressSchema = SchemaFactory.createForClass(Address);

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  refreshToken?: string;

  @Prop({
    type: String,
    enum: Role,
    default: Role.CUSTOMER,
  })
  role: Role;

  @Prop({ type: [AddressSchema] })
  addresses: Address[]; // Mảng các địa chỉ

  @Prop({ unique: true, sparse: true, trim: true })
  phoneNumber?: string;

  @Prop()
  avatarUrl?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// 2. Chèn Hook pre-save vào đây
UserSchema.pre('save', async function (this: UserDocument) {
  const UserModel = this.constructor as Model<UserDocument>;

  // Check trùng email (Dù database đã có unique, check ở đây để throw error rõ ràng hơn)
  if (this.isModified('email')) {
    const existingUser = await UserModel.findOne({
      email: this.email,
      _id: { $ne: this._id },
    });
    if (existingUser) throw new Error('Email already exists');
  }

  // Check trùng phone
  if (this.isModified('phoneNumber') && this.phoneNumber) {
    const existingUser = await UserModel.findOne({
      phoneNumber: this.phoneNumber,
      _id: { $ne: this._id },
    });
    if (existingUser) throw new Error('Phone number already exists');
  }

  // Hash password
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});
