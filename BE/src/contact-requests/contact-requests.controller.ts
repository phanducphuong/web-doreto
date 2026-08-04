import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ContactRequestsService } from './contact-requests.service';
import { CreateContactRequestDto } from './dto/create-contact-request.dto';
import { UpdateContactRequestDoneDto } from './dto/update-contact-request-done.dto';
import { MarkContactSpamDto } from './dto/mark-contact-spam.dto';
import { CreateContactSpamBlockDto } from './dto/create-contact-spam-block.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { ContactSpamKind } from './schemas/contact-spam-block.schema';

@UseGuards(JwtAuthGuard)
@Controller('contact-requests')
export class ContactRequestsController {
  constructor(
    private readonly contactRequestsService: ContactRequestsService,
  ) {}

  @Public()
  @Post()
  create(@Body() body: CreateContactRequestDto) {
    return this.contactRequestsService.create(body);
  }

  @Roles(Role.ADMIN)
  @Get('spam-blocklist')
  findSpamBlocklist(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.contactRequestsService.findSpamBlocklist(page, limit);
  }

  @Roles(Role.ADMIN)
  @Post('spam-blocklist')
  addSpamBlock(@Body() body: CreateContactSpamBlockDto) {
    return this.contactRequestsService.addSpamBlock(body);
  }

  @Roles(Role.ADMIN)
  @Delete('spam-blocklist')
  removeSpamBlock(
    @Query('kind', new ParseEnumPipe(ContactSpamKind)) kind: ContactSpamKind,
    @Query('value') value: string,
  ) {
    return this.contactRequestsService.removeSpamBlock(kind, value);
  }

  @Roles(Role.ADMIN)
  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('done') doneParam?: string,
  ) {
    let done: boolean | undefined;
    if (doneParam === 'true') done = true;
    else if (doneParam === 'false') done = false;
    return this.contactRequestsService.findAllPaginated(page, limit, done);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/done')
  setDone(@Param('id') id: string, @Body() body: UpdateContactRequestDoneDto) {
    return this.contactRequestsService.setDone(id, body.done);
  }

  @Roles(Role.ADMIN)
  @Post(':id/spam')
  markSpam(@Param('id') id: string, @Body() body: MarkContactSpamDto) {
    return this.contactRequestsService.markSpamFromContactRequest(id, body);
  }
}
