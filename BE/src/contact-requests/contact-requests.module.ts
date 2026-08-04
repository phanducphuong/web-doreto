import { Module } from '@nestjs/common';
import { ContactRequestsService } from './contact-requests.service';
import { ContactRequestsController } from './contact-requests.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ContactRequestsController],
  providers: [ContactRequestsService],
})
export class ContactRequestsModule {}
