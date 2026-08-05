import { PartialType } from '@nestjs/mapped-types';
import { CreateImageFrameDto } from './create-image-frame.dto';

export class UpdateImageFrameDto extends PartialType(CreateImageFrameDto) {}
