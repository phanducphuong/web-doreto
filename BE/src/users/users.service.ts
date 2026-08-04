import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { Address, User, UserDocument } from './schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { BaseService } from 'src/common/base/base.service';
import { AddressDto } from './dto/address.dto';
import { AdminQueryUsersDto } from './dto/admin-query-users.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService extends BaseService<UserDocument> {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {
    super(userModel);
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).select('-password').exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateUserDto) {
    return this.update(userId, updateProfileDto);
  }

  async queryUsersForAdmin(queryDto: AdminQueryUsersDto) {
    const {
      keyword,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = queryDto;
    const filter: QueryFilter<UserDocument> = {};

    if (keyword?.trim()) {
      const normalizedKeyword = keyword.trim();
      filter.$or = [
        { name: { $regex: normalizedKeyword, $options: 'i' } },
        { email: { $regex: normalizedKeyword, $options: 'i' } },
        { phoneNumber: { $regex: normalizedKeyword, $options: 'i' } },
      ] as any;
    }

    const skip = (page - 1) * limit;
    const [total, data] = await Promise.all([
      this.userModel.countDocuments(filter).exec(),
      this.userModel
        .find(filter)
        .select('-password')
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
    ]);

    return {
      data,
      total,
      page,
      count: limit,
    };
  }

  async changeEmail(userId: string, dto: ChangeEmailDto) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const normalizedNewEmail = dto.newEmail.toLowerCase().trim();
    if (user.email === normalizedNewEmail) {
      throw new BadRequestException('New email must be different');
    }

    await this.checkDuplicateFields({ email: normalizedNewEmail }, userId);
    user.email = normalizedNewEmail;
    await user.save();

    return this.findOne(userId);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const isSamePassword = await bcrypt.compare(dto.newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException('New password must be different');
    }

    user.password = dto.newPassword;
    await user.save();

    return { message: 'Password updated successfully' };
  }

  async addAddress(userId: string, addressDto: AddressDto) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentAddresses = (user.addresses ?? []) as unknown as Address[];
    const shouldSetDefault =
      Boolean(addressDto.isDefault) || currentAddresses.length === 0;
    const nextAddresses = shouldSetDefault
      ? currentAddresses.map((address: any) => ({
          ...address.toObject(),
          isDefault: false,
        }))
      : currentAddresses.map((address: any) => address.toObject());

    nextAddresses.push({
      ...(addressDto as Address),
      country: addressDto.country || 'Việt Nam',
      isDefault: shouldSetDefault,
    });
    user.addresses = nextAddresses as unknown as Address[];
    await user.save();

    return this.findOne(userId);
  }

  async updateAddress(
    userId: string,
    addressId: string,
    addressDto: AddressDto,
  ) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const addressIndex = (user.addresses ?? []).findIndex(
      (address) => String((address as any)._id) === addressId,
    );
    if (addressIndex === -1) {
      throw new NotFoundException('Address not found');
    }

    const existingAddress = user.addresses[addressIndex] as any;
    const shouldSetDefault = Boolean(addressDto.isDefault);
    const addresses = (user.addresses ?? []).map(
      (address: any, index: number) => {
        if (index !== addressIndex) {
          return {
            ...address.toObject(),
            isDefault: shouldSetDefault ? false : address.isDefault,
          };
        }

        return {
          ...existingAddress.toObject(),
          ...addressDto,
          country: addressDto.country || existingAddress.country || 'Việt Nam',
          isDefault: shouldSetDefault ? true : existingAddress.isDefault,
        };
      },
    );

    user.addresses = this.ensureOneDefaultAddress(
      addresses as Address[],
    ) as any;

    await user.save();
    return this.findOne(userId);
  }

  async setDefaultAddress(userId: string, addressId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let matched = false;
    user.addresses = (user.addresses ?? []).map((address: any) => {
      const isTarget = String(address._id) === addressId;
      if (isTarget) {
        matched = true;
      }
      return {
        ...address.toObject(),
        isDefault: isTarget,
      };
    }) as any;

    if (!matched) {
      throw new NotFoundException('Address not found');
    }

    await user.save();
    return this.findOne(userId);
  }

  async removeAddress(userId: string, addressId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const beforeLength = (user.addresses ?? []).length;
    user.addresses = (user.addresses ?? []).filter(
      (address) => String((address as any)._id) !== addressId,
    );

    if (user.addresses.length === beforeLength) {
      throw new NotFoundException('Address not found');
    }

    user.addresses = this.ensureOneDefaultAddress(user.addresses as any) as any;

    await user.save();
    return this.findOne(userId);
  }

  async updateUserByAdmin(id: string, updateDto: AdminUpdateUserDto) {
    return this.update(id, updateDto as UpdateUserDto);
  }

  async update<TUserUpdateResponse>(id: string, updateUserDto: UpdateUserDto) {
    // Check for duplicates before updating
    await this.checkDuplicateFields(updateUserDto, id);

    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, {
        new: true,
      })
      .select('-password')
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user as TUserUpdateResponse;
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async findByPhoneNumber(phoneNumber: string) {
    return this.userModel.findOne({ phoneNumber }).select('+password').exec();
  }

  async updateRefreshToken(userId: string, refreshToken: string | null) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { refreshToken },
      { returnDocument: 'after' },
    );
  }

  /**
   * Check for duplicate email and phone number
   * @param fields - Object containing email and/or phoneNumber
   * @param excludeId - User ID to exclude from check (for updates)
   */
  async checkDuplicateFields(
    fields: { email?: string; phoneNumber?: string },
    excludeId?: string,
  ) {
    const { email, phoneNumber } = fields;

    // Check duplicate email
    if (email) {
      const existingUser = await this.userModel.findOne({
        email,
        ...(excludeId && { _id: { $ne: excludeId } }),
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    // Check duplicate phone number
    if (phoneNumber) {
      const existingUser = await this.userModel.findOne({
        phoneNumber,
        ...(excludeId && { _id: { $ne: excludeId } }),
      });

      if (existingUser) {
        throw new ConflictException('Phone number already exists');
      }
    }
  }

  private ensureOneDefaultAddress(addresses: Address[]) {
    if (!addresses?.length) {
      return [];
    }

    const hasDefault = addresses.some((address: any) =>
      Boolean(address.isDefault),
    );
    if (hasDefault) {
      return addresses;
    }

    const [first, ...rest] = addresses;
    return [{ ...(first as any), isDefault: true }, ...rest];
  }
}
