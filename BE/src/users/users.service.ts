import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AddressDto } from './dto/address.dto';
import { AdminQueryUsersDto } from './dto/admin-query-users.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const USER_INCLUDE = {
  addresses: { orderBy: { createdAt: 'asc' as const } },
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // Bỏ mọi trường nhạy cảm khỏi response: password và cả hash refreshToken
  private omitPassword<T extends { password?: string; refreshToken?: string | null }>(
    user: T,
  ) {
    if (!user) return user;
    const { password: _pw, refreshToken: _rt, ...rest } = user;
    return rest;
  }

  /** Tạo user mới (hash password vì không còn hook Mongoose). */
  async create(data: {
    email: string;
    name: string;
    password: string;
    phoneNumber?: string;
    role?: string;
    avatarUrl?: string;
  }) {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(data.password, salt);
    return this.prisma.user.create({
      data: { ...data, password: hashed } as Prisma.UserCreateInput,
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: USER_INCLUDE,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.omitPassword(user);
  }

  /** Chỉ dùng nội bộ cho luồng refresh token — không đưa vào response API. */
  async getRefreshTokenHash(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { refreshToken: true },
    });
    return user?.refreshToken ?? null;
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
    // Whitelist cột sắp xếp — chốt lại lần nữa dù DTO đã @IsIn (tránh orderBy field lạ)
    const ALLOWED_SORT = ['createdAt', 'updatedAt', 'name', 'email'] as const;
    const sortField = ALLOWED_SORT.includes(sortBy as never)
      ? sortBy
      : 'createdAt';

    const where: Prisma.UserWhereInput = {};
    if (keyword?.trim()) {
      const kw = keyword.trim();
      where.OR = [
        { name: { contains: kw, mode: 'insensitive' } },
        { email: { contains: kw, mode: 'insensitive' } },
        { phoneNumber: { contains: kw, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [total, data] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: USER_INCLUDE,
        omit: { password: true, refreshToken: true },
        orderBy: { [sortField]: sortOrder === 'asc' ? 'asc' : 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { data, total, page, count: limit };
  }

  async changeEmail(userId: string, dto: ChangeEmailDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
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
    await this.prisma.user.update({
      where: { id: userId },
      data: { email: normalizedNewEmail },
    });

    return this.findOne(userId);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
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

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(dto.newPassword, salt);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return { message: 'Password updated successfully' };
  }

  // ==== Địa chỉ (bảng riêng, thay mảng nhúng cũ) ====

  async addAddress(userId: string, addressDto: AddressDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const count = await this.prisma.address.count({ where: { userId } });
    const shouldSetDefault = Boolean(addressDto.isDefault) || count === 0;

    await this.prisma.$transaction(async (tx) => {
      if (shouldSetDefault) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }
      await tx.address.create({
        data: {
          userId,
          addressName: addressDto.addressName,
          phoneNumber: addressDto.phoneNumber,
          name: addressDto.name,
          detailedAddress: addressDto.detailedAddress,
          ward: addressDto.ward,
          district: addressDto.district,
          city: addressDto.city,
          country: addressDto.country || 'Việt Nam',
          isDefault: shouldSetDefault,
        },
      });
    });

    return this.findOne(userId);
  }

  async updateAddress(
    userId: string,
    addressId: string,
    addressDto: AddressDto,
  ) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    const shouldSetDefault = Boolean(addressDto.isDefault);

    await this.prisma.$transaction(async (tx) => {
      if (shouldSetDefault) {
        await tx.address.updateMany({
          where: { userId, id: { not: addressId } },
          data: { isDefault: false },
        });
      }
      await tx.address.update({
        where: { id: addressId },
        data: {
          addressName: addressDto.addressName,
          phoneNumber: addressDto.phoneNumber,
          name: addressDto.name,
          detailedAddress: addressDto.detailedAddress,
          ward: addressDto.ward,
          district: addressDto.district,
          city: addressDto.city,
          country: addressDto.country || address.country || 'Việt Nam',
          isDefault: shouldSetDefault ? true : address.isDefault,
        },
      });
    });

    await this.ensureOneDefaultAddress(userId);
    return this.findOne(userId);
  }

  async setDefaultAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
      await tx.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    });

    return this.findOne(userId);
  }

  async removeAddress(userId: string, addressId: string) {
    const res = await this.prisma.address.deleteMany({
      where: { id: addressId, userId },
    });
    if (res.count === 0) {
      throw new NotFoundException('Address not found');
    }

    await this.ensureOneDefaultAddress(userId);
    return this.findOne(userId);
  }

  async updateUserByAdmin(id: string, updateDto: AdminUpdateUserDto) {
    return this.update(id, updateDto as UpdateUserDto);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.checkDuplicateFields(updateUserDto, id);

    // Bỏ `addresses` khỏi payload — địa chỉ được quản lý qua các endpoint riêng.
    const { addresses: _addresses, ...rest } = updateUserDto;

    // Lỗi Prisma (P2025 → 404) do PrismaExceptionFilter toàn cục ánh xạ
    return this.prisma.user.update({
      where: { id },
      data: rest as Prisma.UserUpdateInput,
      include: USER_INCLUDE,
      omit: { password: true, refreshToken: true },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByPhoneNumber(phoneNumber: string) {
    return this.prisma.user.findUnique({ where: { phoneNumber } });
  }

  async updateRefreshToken(userId: string, refreshToken: string | null) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }

  async checkDuplicateFields(
    fields: { email?: string; phoneNumber?: string },
    excludeId?: string,
  ) {
    const { email, phoneNumber } = fields;

    if (email) {
      const existing = await this.prisma.user.findFirst({
        where: { email, ...(excludeId ? { id: { not: excludeId } } : {}) },
      });
      if (existing) {
        throw new ConflictException('Email already exists');
      }
    }

    if (phoneNumber) {
      const existing = await this.prisma.user.findFirst({
        where: {
          phoneNumber,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      });
      if (existing) {
        throw new ConflictException('Phone number already exists');
      }
    }
  }

  /** Đảm bảo luôn có đúng 1 địa chỉ mặc định (nếu còn địa chỉ). */
  private async ensureOneDefaultAddress(userId: string) {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    if (!addresses.length) return;
    if (addresses.some((a) => a.isDefault)) return;
    await this.prisma.address.update({
      where: { id: addresses[0].id },
      data: { isDefault: true },
    });
  }
}
