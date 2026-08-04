import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Post,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ChangeEmailDto } from 'src/users/dto/change-email.dto';
import { ChangePasswordDto } from 'src/users/dto/change-password.dto';
import { UpdateProfileDto } from 'src/users/dto/update-profile.dto';
import { AddressDto } from 'src/users/dto/address.dto';
import { AdminQueryUsersDto } from 'src/users/dto/admin-query-users.dto';
import { AdminUpdateUserDto } from 'src/users/dto/admin-update-user.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('management')
  @Roles(Role.ADMIN)
  findAllForManagement(@Query() queryDto: AdminQueryUsersDto) {
    return this.usersService.queryUsersForAdmin(queryDto);
  }

  @Get('profile')
  getProfile(@CurrentUser('userId') userId: string) {
    return this.usersService.findOne(userId);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, updateProfileDto);
  }

  @Patch('profile/email')
  changeEmail(
    @CurrentUser('userId') userId: string,
    @Body() changeEmailDto: ChangeEmailDto,
  ) {
    return this.usersService.changeEmail(userId, changeEmailDto);
  }

  @Patch('profile/password')
  changePassword(
    @CurrentUser('userId') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(userId, changePasswordDto);
  }

  @Post('profile/addresses')
  addAddress(
    @CurrentUser('userId') userId: string,
    @Body() addressDto: AddressDto,
  ) {
    return this.usersService.addAddress(userId, addressDto);
  }

  @Patch('profile/addresses/:addressId')
  updateAddress(
    @CurrentUser('userId') userId: string,
    @Param('addressId') addressId: string,
    @Body() addressDto: AddressDto,
  ) {
    return this.usersService.updateAddress(userId, addressId, addressDto);
  }

  @Patch('profile/addresses/:addressId/default')
  setDefaultAddress(
    @CurrentUser('userId') userId: string,
    @Param('addressId') addressId: string,
  ) {
    return this.usersService.setDefaultAddress(userId, addressId);
  }

  @Delete('profile/addresses/:addressId')
  removeAddress(
    @CurrentUser('userId') userId: string,
    @Param('addressId') addressId: string,
  ) {
    return this.usersService.removeAddress(userId, addressId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updateUserDto: AdminUpdateUserDto) {
    return this.usersService.updateUserByAdmin(id, updateUserDto);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  findOneForAdmin(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
