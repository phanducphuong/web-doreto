import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ContactRequest,
  ContactRequestDocument,
} from './schemas/contact-request.schema';
import {
  ContactSpamBlock,
  ContactSpamBlockDocument,
  ContactSpamKind,
} from './schemas/contact-spam-block.schema';
import { CreateContactRequestDto } from './dto/create-contact-request.dto';
import { MarkContactSpamDto } from './dto/mark-contact-spam.dto';
import { CreateContactSpamBlockDto } from './dto/create-contact-spam-block.dto';

@Injectable()
export class ContactRequestsService {
  constructor(
    @InjectModel(ContactRequest.name)
    private readonly contactRequestModel: Model<ContactRequestDocument>,
    @InjectModel(ContactSpamBlock.name)
    private readonly contactSpamBlockModel: Model<ContactSpamBlockDocument>,
  ) {}

  private normalizeEmail(value: string): string {
    return value.trim().toLowerCase();
  }

  private normalizePhone(value: string): string {
    return value.trim();
  }

  private async assertNotSpamBlocked(dto: CreateContactRequestDto) {
    if (dto.email) {
      const value = this.normalizeEmail(dto.email);
      const hit = await this.contactSpamBlockModel
        .findOne({ kind: ContactSpamKind.EMAIL, value })
        .exec();
      if (hit) {
        throw new BadRequestException('Email này đã bị chặn');
      }
    }
    if (dto.phone) {
      const value = this.normalizePhone(dto.phone);
      const hit = await this.contactSpamBlockModel
        .findOne({ kind: ContactSpamKind.PHONE, value })
        .exec();
      if (hit) {
        throw new BadRequestException('Số điện thoại này đã bị chặn');
      }
    }
  }

  async create(dto: CreateContactRequestDto) {
    await this.assertNotSpamBlocked(dto);
    const doc = new this.contactRequestModel({
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
    });
    return doc.save();
  }

  async findAllPaginated(page: number = 1, limit: number = 20, done?: boolean) {
    const skip = (page - 1) * limit;
    const filter = done === undefined ? {} : { done };

    const [data, total] = await Promise.all([
      this.contactRequestModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.contactRequestModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  async setDone(id: string, done: boolean) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Không tìm thấy yêu cầu liên hệ');
    }

    const doc = await this.contactRequestModel
      .findByIdAndUpdate(
        id,
        done
          ? { $set: { done: true, doneAt: new Date() } }
          : { $set: { done: false }, $unset: { doneAt: 1 } },
        { new: true },
      )
      .exec();

    if (!doc) {
      throw new NotFoundException('Không tìm thấy yêu cầu liên hệ');
    }

    return doc;
  }

  async findSpamBlocklist(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.contactSpamBlockModel
        .find()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.contactSpamBlockModel.countDocuments().exec(),
    ]);
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  async addSpamBlock(dto: CreateContactSpamBlockDto) {
    const value =
      dto.kind === ContactSpamKind.EMAIL
        ? this.normalizeEmail(dto.value)
        : this.normalizePhone(dto.value);
    if (!value) {
      throw new BadRequestException('Giá trị không hợp lệ');
    }
    await this.contactSpamBlockModel.findOneAndUpdate(
      { kind: dto.kind, value },
      { $setOnInsert: { kind: dto.kind, value } },
      { upsert: true, new: true },
    );
    return { kind: dto.kind, value };
  }

  private async upsertSpamBlock(kind: ContactSpamKind, rawValue: string) {
    const value =
      kind === ContactSpamKind.EMAIL
        ? this.normalizeEmail(rawValue)
        : this.normalizePhone(rawValue);
    if (!value) return;
    await this.contactSpamBlockModel.findOneAndUpdate(
      { kind, value },
      { $setOnInsert: { kind, value } },
      { upsert: true, new: true },
    );
  }

  async markSpamFromContactRequest(id: string, dto: MarkContactSpamDto) {
    if (!dto.blockEmail && !dto.blockPhone) {
      throw new BadRequestException(
        'Chọn ít nhất email hoặc số điện thoại để chặn',
      );
    }

    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Không tìm thấy yêu cầu liên hệ');
    }

    const doc = await this.contactRequestModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Không tìm thấy yêu cầu liên hệ');
    }

    if (dto.blockEmail) {
      if (!doc.email?.trim()) {
        throw new BadRequestException('Liên hệ này không có email để chặn');
      }
      await this.upsertSpamBlock(ContactSpamKind.EMAIL, doc.email);
    }

    if (dto.blockPhone) {
      if (!doc.phone?.trim()) {
        throw new BadRequestException(
          'Liên hệ này không có số điện thoại để chặn',
        );
      }
      await this.upsertSpamBlock(ContactSpamKind.PHONE, doc.phone);
    }

    return { ok: true };
  }

  async removeSpamBlock(kind: ContactSpamKind, rawValue: string) {
    const value =
      kind === ContactSpamKind.EMAIL
        ? this.normalizeEmail(rawValue)
        : this.normalizePhone(rawValue);
    if (!value) {
      throw new BadRequestException('Giá trị không hợp lệ');
    }
    const res = await this.contactSpamBlockModel
      .deleteOne({ kind, value })
      .exec();
    if (res.deletedCount === 0) {
      throw new NotFoundException('Không tìm thấy mục chặn');
    }
    return { ok: true };
  }
}
