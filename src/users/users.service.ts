import { BadRequestException, HttpException, Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { AddAdminUserDto, isValidPassword, LoginUserDto, RegisterUserDto, ResetPasswordUserDto, SendOTPUserDto, VerifyOTPUserDto } from './dto/create-user.dto';
import { resetPasswordDto, UpdateUserDto, UpdateUserForAdminDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RoleUser } from 'src/enum/enums';
import { JwtService } from '@nestjs/jwt';
import * as ExcelJS from 'exceljs';

import { config } from 'dotenv';
import { totp } from 'otplib';
import { MailService } from 'src/mail/mail.service';
import { EskizService } from 'src/eskiz/eskiz.service';

config();

let otp_secret = process.env.SECRET_OTP;
let otp_secret_reset_password = process.env.RESET_PASSWORD_OTP_SECRET;

totp.options = { step: 120 };

@Injectable()
export class UsersService {

  constructor(private prisma: PrismaService,
    private jwtService: JwtService,
    private mailer: MailService,
    private eskiz: EskizService
  ) { }

  private Error(error: any): never {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new BadRequestException(error.message);
  }


  async exportUsersToExcel() {
    const users = await this.prisma.user.findMany();

    if (!users || users.length === 0) {
      throw new NotFoundException('Foydalanuvchilar topilmadi');
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Ism', key: 'firstName', width: 30 },
      { header: 'Familya', key: 'lastName', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Password', key: 'password', width: 30 },
      { header: 'Rol', key: 'role', width: 15 },
      { header: 'Holat', key: 'isActive', width: 10 },
      { header: 'Yaratilgan sana', key: 'createdAt', width: 20 },
    ];

    users.forEach(user => {
      worksheet.addRow({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: user.password,
        role: user.role,
        isActive: user.isActive ? 'Faol' : 'Nofaol',
        createdAt: user.createdAt.toISOString().split('T')[0],
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }


  async register(body: RegisterUserDto) {
    try {

      let checkUser = await this.prisma.user.findFirst({ where: { email: body.email } })

      if (checkUser) {
        throw new BadRequestException("This User alredy exist!")
      }

      if (body.role === RoleUser.ADMIN) {
        throw new BadRequestException("You cannot register as an administrator.")
      }

      if (!isValidPassword(body.password)) {
        throw new BadRequestException("Incorrect password. Your password must be at least 8 characters long and include at least one uppercase letter, one special character, and one number.")
      }

      let hashPassword = bcrypt.hashSync(body.password, 7)
      body.password = hashPassword

      let otp = totp.generate(otp_secret + body.email);

      let sendOtp = await this.mailer.sendMail({
        to: body.email,
        subject: 'Your OTP Code 🔐',
        html: `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #4CAF50;">Your OTP Code</h2>
      <p style="font-size: 16px;">Use the code below to verify your email:</p>
      <div style="margin: 20px auto; padding: 10px 20px; font-size: 24px; font-weight: bold; color: #fff; background-color: #4CAF50; width: fit-content; border-radius: 5px;">
        ${otp}
      </div>
      <p style="font-size: 12px; color: #888;">If you did not request this code, please ignore this email.</p>
    </div>
  `,
      });

      let newUSer = await this.prisma.user.create({
        data: {
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          password: body.password,
          image: body.image
        }
      })

      return { message: "Registration was completed successfully✅", data: newUSer, otp_code: otp };

    } catch (error) {
      this.Error(error)
    }
  }

  async login(body: LoginUserDto) {
    try {

      let checkUser = await this.prisma.user.findFirst({ where: { email: body.email } })

      if (!checkUser) {
        throw new NotAcceptableException("User not found")
      }

      if (checkUser.isActive !== true) {
        throw new BadRequestException("Please activate your profile.")
      }

      let checkPassword = bcrypt.compareSync(body.password, checkUser.password);

      if (!checkPassword) {
        throw new BadRequestException('Wrong password');
      }

      let accessToken = this.genAccessToken({
        userId: checkUser.id,
        role: checkUser.role
      })

      let refreshToken = this.genRefreshToken({
        userId: checkUser.id,
        role: checkUser.role
      })

      return { accessToken, refreshToken }

    } catch (error) {
      this.Error(error)
    }
  }

  async sendOtp(body: SendOTPUserDto) {
    try {

      let checkUser = await this.prisma.user.findFirst({ where: { email: body.email } })

      if (!checkUser) {
        throw new NotFoundException("User not found")
      }

      let otp = totp.generate(otp_secret + body.email)

      let sendOtp = await this.mailer.sendMail({
        to: body.email,
        subject: 'Your OTP Code 🔐',
        html: `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #4CAF50;">Your OTP Code</h2>
      <p style="font-size: 16px;">Use the code below to verify your email:</p>
      <div style="margin: 20px auto; padding: 10px 20px; font-size: 24px; font-weight: bold; color: #fff; background-color: #4CAF50; width: fit-content; border-radius: 5px;">
        ${otp}
      </div>
      <p style="font-size: 12px; color: #888;">If you did not request this code, please ignore this email.</p>
    </div>
  `,
      });

      return { message: `Your OTP Code`, otp }

    } catch (error) {
      this.Error(error)
    }
  }

  async verifyOtp(body: VerifyOTPUserDto) {
    try {
      let checkUser = await this.prisma.user.findFirst({ where: { email: body.email } })

      if (!checkUser) {
        throw new NotFoundException("User not found")
      }

      let checkUserStatus = await this.prisma.user.findFirst({ where: { email: body.email, isActive: true } })

      if (checkUserStatus) {
        throw new BadRequestException("Your account has already been activated😊")
      }

      let secret = otp_secret + body.email

      let verifyOtp = totp.verify({ token: String(body.otp), secret })

      if (!verifyOtp) {
        throw new BadRequestException("Wrong OTP Code❌")
      }

      await this.prisma.user.update({ where: { email: body.email }, data: { isActive: true } })

      return { message: "Your account has been successfully activated✅" }
    } catch (error) {
      this.Error(error)
    }
  }

  async getMe(req: Request) {
    try {
      let userId = req['user'].userId;

      let user = await this.prisma.user.findFirst({ where: { id: userId }, include: { comments: true, likes: true, results: true, stars: true, tests: true } })

      if (!user) {
        throw new NotFoundException("User not found")
      }

      return { data: user }
    } catch (error) {
      this.Error(error)
    }
  }

  async findAll(query: QueryUserDto, req: Request) {

    if (req['user'].role !== RoleUser.ADMIN) {
      throw new BadRequestException("Only admins are authorized to perform this action");
    }

    const { firstName, lastName, email, role, isActive, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const skip = (page - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};

    if (firstName) {
      where.firstName = { contains: firstName, mode: 'insensitive' };
    }

    if (lastName) {
      where.lastName = { contains: lastName, mode: 'insensitive' };
    }

    if (email) {
      where.email = { contains: email, mode: 'insensitive' };
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      if (typeof isActive === 'string') {
        where.isActive = isActive === 'true'; // "true" → true, "false" → false
      } else {
        where.isActive = Boolean(isActive); // all other cases
      }
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      message: "Users fetched successfully",
      data: users,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async findOne(id: string, req: Request) {
    try {

      let checkUser = await this.prisma.user.findFirst({ where: { id } })

      if (!checkUser) {
        throw new NotFoundException("User not found")
      }

      if (checkUser.id !== req['user'].userId) {
        throw new BadRequestException("You are not authorized to perform this action")
      }

      let user = await this.prisma.user.findFirst({ where: { id } })

      return { data: user }
    } catch (error) {
      this.Error(error)
    }
  }


  async update(id: string, body: UpdateUserDto, req: Request) {
    try {
      let userId = req['user'].userId;

      let checkUser = await this.prisma.user.findFirst({ where: { id } })

      if (!checkUser) {
        throw new NotFoundException("User not found")
      }

      if (checkUser.id !== userId) {
        throw new BadRequestException("You are not authorized to update this user")
      }

      let updateUSer = await this.prisma.user.update({
        where: { id },
        data: body
      })

      return { message: "User updated successfully✅", data: updateUSer }

    } catch (error) {
      this.Error(error)
    }

  }

  async updateForAdmin(id: string, body: UpdateUserForAdminDto, req: Request) {
    try {
      let role = req['user'].role;

      let checkUserAdmin = await this.prisma.user.findFirst({ where: { id: req['user'].userId } })

      if (!checkUserAdmin) {
        throw new NotFoundException("User Admin not found")
      }

      let checkUser = await this.prisma.user.findFirst({ where: { id } });

      if (!checkUser) {
        throw new NotFoundException("User not found");
      }

      let updateUser = await this.prisma.user.update({
        where: { id },
        data: {
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          role: body.role,
          isActive: body.isActive,
        },
      });
      return { message: "User updated successfully by admin✅" };
    } catch (error) {
      this.Error(error)
    }

  }

  async resetPasswordOTP(body: SendOTPUserDto, req: Request) {
    try {
      let userId = req['user'].userId;

      let checkUser = await this.prisma.user.findFirst({ where: { id: userId } })

      if (!checkUser) {
        throw new NotFoundException("User not found")
      }

      let otp = totp.generate(otp_secret_reset_password + body.email)

      let sendOtp = await this.mailer.sendMail({
        to: body.email,
        subject: 'Your OTP Code 🔐',
        html: `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #4CAF50;">Your OTP Code</h2>
      <p style="font-size: 16px;">Use the code below to verify your email:</p>
      <div style="margin: 20px auto; padding: 10px 20px; font-size: 24px; font-weight: bold; color: #fff; background-color: #4CAF50; width: fit-content; border-radius: 5px;">
        ${otp}
      </div>
      <p style="font-size: 12px; color: #888;">If you did not request this code, please ignore this email.</p>
    </div>
  `,
      });

      return { message: `Your OTP Code`, otp }
    } catch (error) {
      this.Error(error)
    }
  }

  async resetPassword(id: string, body: ResetPasswordUserDto, req: Request) {
    try {
      let userId = req['user'].userId;

      let checkUser = await this.prisma.user.findUnique({ where: { id } })

      if (!checkUser) {
        throw new NotFoundException("User not found")
      }

      if (checkUser.id !== userId) {
        throw new BadRequestException("You are not authorized to reset this user's password")
      }

      let secret = otp_secret_reset_password + checkUser.email

      let verifyOtp = totp.verify({ token: String(body.otp), secret })

      if (!verifyOtp) {
        throw new BadRequestException("Wrong OTP Code❌")
      }

      if (!isValidPassword(body.password)) {
        throw new BadRequestException(`Invalid password format example: Saidkamol_2006`)
      }

      let hashPassword = bcrypt.hashSync(body.password, 7)
      body.password = hashPassword

      await this.prisma.user.update({ where: { id: userId }, data: { password: body.password } })

      return { message: "Your password has been successfully updated✅" }

    } catch (error) {
      this.Error(error)
    }
  }

  async remove(id: string, req: Request) {
    try {
      let userId = req['user'].userId;

      let checkUser = await this.prisma.user.findFirst({ where: { id } })

      if (!checkUser) {
        throw new NotFoundException("User not found")
      }

      if (checkUser.id !== userId) {
        throw new BadRequestException("You are not authorized to remove this user")
      }

      let removeUser = await this.prisma.user.delete({ where: { id } })

      return { message: "User removed successfully✅", data: removeUser }
    } catch (error) {
      this.Error(error)
    }
  }

  async addAdmin(body: AddAdminUserDto, req: Request) {
    try {
      let role = req['user'].role;

      let checkUserAdmin = await this.prisma.user.findFirst({ where: { id: req['user'].userId } })

      if (!checkUserAdmin) {
        throw new NotFoundException("User Admin not found")
      }

      if (role !== 'ADMIN') {
        throw new BadRequestException("Only admins are authorized to perform this action");
      }

      let checkUser = await this.prisma.user.findFirst({ where: { email: body.email } });

      if (!checkUser) {
        throw new NotFoundException("This user exists.");
      }

      let newAdmin = await this.prisma.user.create({ data: body })

      return { message: "User updated successfully by admin✅" };
    } catch (error) {
      this.Error(error)
    }
  }

  genRefreshToken(payload: object) {
    return this.jwtService.sign(payload, {
      secret: process.env.REFKEY,
      expiresIn: '7d',
    });
  }

  genAccessToken(payload: object) {
    return this.jwtService.sign(payload, {
      secret: process.env.ACCKEY,
      expiresIn: '12h',
    });
  }
}
