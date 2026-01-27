import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateStarDto } from './dto/create-star.dto';
import { UpdateStarDto } from './dto/update-star.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StarsService {

  constructor(private prisma: PrismaService) { }


  private Error(error: any): never {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new BadRequestException(error.message);
  }

  async create(body: CreateStarDto, req: Request) {
    try {
      const studentId = req['user']?.userId;

      if (!studentId) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      // 1️⃣ Student mavjudligini tekshirish
      const student = await this.prisma.user.findUnique({
        where: { id: studentId },
      });

      if (!student) {
        throw new HttpException('Student not found', HttpStatus.NOT_FOUND);
      }

      // 2️⃣ Test mavjudligini tekshirish
      const test = await this.prisma.test.findUnique({
        where: { id: body.testId },
      });

      if (!test) {
        throw new HttpException('Test not found', HttpStatus.NOT_FOUND);
      }

      // 3️⃣ Avval baho qo‘yilganmi?
      const existingStar = await this.prisma.stars.findFirst({
        where: {
          studentId,
          testId: body.testId,
        },
      });

      if (existingStar) {
        throw new HttpException(
          'You have already rated this test',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (body.star < 0.5 || body.star > 5 || body.star % 0.5 !== 0) {
        throw new HttpException('Invalid star value', 400);
      }

      // 4️⃣ Star yaratish
      const star = await this.prisma.stars.create({
        data: {
          stars: body.star,

          student: {
            connect: { id: studentId },
          },

          test: {
            connect: { id: body.testId },
          },
        },
      });

      return {
        message: 'Star created successfully',
        data: star,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll() {
    try {

    } catch (error) {

    }
  }

  async findOne(id: number) {
    try {

    } catch (error) {

    }
  }


  async remove(id: string, req: Request) {
    try {
      const studentId = req['user']?.userId;

      if (!studentId) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      const checkUser = await this.prisma.user.findUnique({
        where: { id: studentId },
      });

      if (!checkUser) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const checkStar = await this.prisma.stars.findUnique({
        where: { id },
      });

      if (!checkStar) {
        throw new HttpException('Star not found', HttpStatus.NOT_FOUND);
      }

      if (checkStar.studentId !== studentId) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      const star = await this.prisma.stars.delete({
        where: { id },
      });

      return {
        message: 'Star deleted successfully',
        data: star,
      };
    } catch (error) {

    }
  }
}
