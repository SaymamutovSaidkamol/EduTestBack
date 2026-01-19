import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { resetPasswordDto, UpdateUserDto, UpdateUserForAdminDto } from './dto/update-user.dto';
import { AddAdminUserDto, LoginUserDto, RegisterUserDto, ResetPasswordUserDto, SendOTPUserDto, VerifyOTPUserDto } from './dto/create-user.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RoleGuard } from 'src/auth/role.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post('register')
  register(@Body() RegisterUserDto: RegisterUserDto) {
    return this.usersService.register(RegisterUserDto);
  }

  @Post('login')
  login(@Body() LoginUserDto: LoginUserDto) {
    return this.usersService.login(LoginUserDto);
  }

  @UseGuards(AuthGuard)
  @Post('add-admin')
  addAdmin(@Body() AddAdminUserDto: AddAdminUserDto, @Req() req: Request) {

    return this.usersService.addAdmin(AddAdminUserDto, req);
  }

  @Post('send-otp')
  sendOTP(@Body() SendOTPUserDto: SendOTPUserDto) {
    return this.usersService.sendOtp(SendOTPUserDto);
  }

  @Post('verify-otp')
  VerifyOTP(@Body() VerifyOTPUserDto: VerifyOTPUserDto) {
    return this.usersService.verifyOtp(VerifyOTPUserDto);
  }

  @UseGuards(AuthGuard)
  @Post('reset-password/send-otp')
  resetPasswordOTP(@Body() SendOTPUserDto: SendOTPUserDto, @Req() req: Request) {

    return this.usersService.resetPasswordOTP(SendOTPUserDto, req);
  }


  @UseGuards(AuthGuard)
  @Post('reset-password/verify-otp')
  resetPassword(@Body() ResetPasswordUserDto: ResetPasswordUserDto, @Req() req: Request) {

    return this.usersService.resetPassword(ResetPasswordUserDto, req);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  getMe(@Req() req: Request) {
    return this.usersService.getMe(req);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Req() req: Request) {
    return this.usersService.findAll(req);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.usersService.findOne(id, req);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req: Request) {

    return this.usersService.update(id, updateUserDto, req);
  }




  @UseGuards(AuthGuard)
  @Patch('for-admin/:id')
  updateForAdmin(@Param('id') id: string, @Body() UpdateUserForAdminDto: UpdateUserForAdminDto, @Req() req: Request) {
    return this.usersService.updateForAdmin(id, UpdateUserForAdminDto, req);
  }


  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.usersService.remove(id, req);
  }
}
