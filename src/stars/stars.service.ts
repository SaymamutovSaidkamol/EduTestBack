import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateStarDto } from './dto/create-star.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateStarDto } from './dto/update-star.dto';
import { GetTopTestsQueryDto } from './dto/query-star.dto';

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
      this.Error(error);
    }
  }

  async findAll(query: GetTopTestsQueryDto) {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const skip = (page - 1) * limit;

      // 2️⃣ Sort
      const order: 'asc' | 'desc' =
        query.sortBy === 'lowest-scoring' ? 'asc' : 'desc';

      // 3️⃣ Where filter
      let where: any = undefined;
      if (query.minStar !== undefined || query.maxStar !== undefined) {
        where = {
          stars: {
            ...(query.minStar !== undefined ? { gte: Number(query.minStar) } : {}),
            ...(query.maxStar !== undefined ? { lte: Number(query.maxStar) } : {}),
          },
        };
      }

      // 4️⃣ GroupBy
      const grouped = await this.prisma.stars.groupBy({
        by: ['testId'],
        where,
        _avg: { stars: true },
        _count: { stars: true },
        orderBy: { _avg: { stars: order } },
        skip,
        take: limit,
      });

      const testIds = grouped.map((g) => g.testId);

      // 5️⃣ Test ma’lumotlarini olish
      const tests = await this.prisma.test.findMany({
        where: { id: { in: testIds } },
        select: { id: true, title: true, description: true },
      });

      const testMap = new Map(tests.map((t) => [t.id, t]));

      // 6️⃣ Natijani tayyorlash
      const data = grouped.map((g) => {
        const test = testMap.get(g.testId);
        return {
          testId: g.testId,
          title: test?.title ?? null,
          description: test?.description ?? null,
          avgStar: Number((g._avg?.stars ?? 0).toFixed(2)),
          votes: g._count?.stars ?? 0,
        };
      });

      return {
        meta: {
          page,
          limit,
          total: data.length,
          sortBy: query.sortBy,
          minStar: query.minStar ?? null,
          maxStar: query.maxStar ?? null,
        },
        data,
      };


    } catch (error) {
      this.Error(error);
    }
  }

  async findOne(id: string) {
    try {

      let checkStar = await this.prisma.stars.findUnique({
        where: { id },
      });

      if (!checkStar) {
        throw new HttpException('Star not found', HttpStatus.NOT_FOUND);
      }

      return { data: checkStar };
    } catch (error) {
      this.Error(error);
    }
  }

  async update(id: string, body: UpdateStarDto, req: Request) {
    try {

      let checkUser = await this.prisma.user.findUnique({
        where: { id: req['user']?.userId },
      });

      if (!checkUser) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      let checkStar = await this.prisma.stars.findUnique({
        where: { id },
      });

      if (!checkStar) {
        throw new HttpException('Star not found', HttpStatus.NOT_FOUND);
      }

      if (body.star < 0.5 || body.star > 5 || body.star % 0.5 !== 0) {
        throw new HttpException('Invalid star value', 400);
      }

      if (checkStar.studentId !== checkUser.id) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      const star = await this.prisma.stars.update({
        where: { id },
        data: {
          stars: body.star,
        },
      });

      return {
        message: 'Star updated successfully',
        data: star,
      };
    } catch (error) {
      this.Error(error);
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
      this.Error(error);
    }
  }
}
