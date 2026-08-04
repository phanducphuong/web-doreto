import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactRequestsService } from './contact-requests.service';
import { ContactRequestsController } from './contact-requests.controller';
import {
  ContactRequest,
  ContactRequestSchema,
} from './schemas/contact-request.schema';
import {
  ContactSpamBlock,
  ContactSpamBlockSchema,
} from './schemas/contact-spam-block.schema';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ContactRequest.name, schema: ContactRequestSchema },
      { name: ContactSpamBlock.name, schema: ContactSpamBlockSchema },
    ]),
    AuthModule,
  ],
  controllers: [ContactRequestsController],
  providers: [ContactRequestsService],
})
export class ContactRequestsModule {}
