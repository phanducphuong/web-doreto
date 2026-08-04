import { BaseService } from 'src/common/base/base.service';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import {
  OptionValue,
  OptionValueDocument,
} from './schemas/option-value.schema';
import { Model } from 'mongoose';

@Injectable()
export class ProductOptionValueService extends BaseService<OptionValueDocument> {
  constructor(
    @InjectModel(OptionValue.name)
    private readonly optionValueModel: Model<OptionValueDocument>,
  ) {
    super(optionValueModel);
  }
}
