import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { CreateLikeDto } from './dto/create-like.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetLikesQueryDto } from './dto/query-like.dto';

@Injectable()
export class LikesService {

  constructor(private prisma: PrismaService) { }

  private Error(error: any): never {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new BadRequestException(error.message);
  }

  async create(body: CreateLikeDto, req: Request) {
    try {

      let checkUser = await this.prisma.user.findUnique({ where: { id: req['user'].userId } })
      if (!checkUser) {
        throw new BadRequestException('User not found');
      }

      body.studentId = req['user'].userId;

      let checkTest = await this.prisma.test.findUnique({ where: { id: body.testId } })
      if (!checkTest) {
        throw new BadRequestException('Test not found');
      }

      let checkLike = await this.prisma.likes.findFirst({ where: { isLike: true, testId: body.testId, studentId: req['user'].userId } })
      if (checkLike) {
        let deleteLike = await this.prisma.likes.delete({ where: { id: checkLike.id } })
        return { data: deleteLike, message: 'Like deleted successfully' }
      }

      let createLike = await this.prisma.likes.create({ data: { studentId: req['user'].userId, testId: body.testId, isLike: true } })
      return { data: createLike, message: 'Like created successfully' }
    } catch (error) {
      this.Error(error);
    }
  }

  async findAll(query: GetLikesQueryDto) {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const skip = (page - 1) * limit;

      // Sort
      const order: 'asc' | 'desc' = query.sortBy === 'oldest' ? 'asc' : 'desc';

      // Where filter
      const where: any = {};
      if (query.studentId) where.studentId = query.studentId;
      if (query.testId) where.testId = query.testId;
      if (query.isLike !== undefined) {
        // Agar query.isLike 'true' bo'lsa true, 'false' bo'lsa false
        if (typeof query.isLike === 'string') {
          where.isLike = query.isLike === 'true';
        } else {
          where.isLike = query.isLike; // agar allaqachon boolean bo'lsa
        }
      }

      // Query likes
      const likes = await this.prisma.likes.findMany({
        where,
        orderBy: { createdAt: order },
        skip,
        take: limit,
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      const total = await this.prisma.likes.count({ where });

      return {
        meta: {
          page,
          limit,
          total,
          sortBy: query.sortBy,
          studentId: query.studentId ?? null,
          testId: query.testId ?? null,
          isLike: query.isLike ?? null,
        },
        data: likes,
      };
    } catch (error) {
      this.Error(error);
    }
  }

  async findOne(id: string) {
    try {
      let findOne = await this.prisma.likes.findUnique({ where: { id } })
      return { data: findOne, message: 'Like found successfully' }
    } catch (error) {
      this.Error(error);
    }
  }

  async remove(id: string, req: Request) {
    try {
      let checkUser = await this.prisma.user.findUnique({ where: { id: req['user'].userId } })
      if (!checkUser) {
        throw new BadRequestException('User not found');
      }

      let checkLike = await this.prisma.likes.findUnique({ where: { id } })
      if (!checkLike) {
        throw new BadRequestException('Like not found');
      }

      if (checkLike.studentId !== req['user'].userId) {
        throw new BadRequestException('You are not authorized to remove this like');
      }

      let removeLike = await this.prisma.likes.delete({ where: { id } })
      return { data: removeLike, message: 'Like removed successfully' }
    } catch (error) {
      this.Error(error);
    }
  }
}
