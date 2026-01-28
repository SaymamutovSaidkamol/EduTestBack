import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetCommentsQueryDto } from './dto/query.comment';

@Injectable()
export class CommentsService {

  constructor(private prisma: PrismaService) { }

  private Error(error: any): never {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new BadRequestException(error.message);
  }

  async create(body: CreateCommentDto, req: Request) {
    try {

      let checkUser = await this.prisma.user.findUnique({
        where: {
          id: req['user'].userId
        }
      })

      if (!checkUser) {
        throw new HttpException('User not found', 404);
      }

      body.studentId = req['user'].userId

      let checkTest = await this.prisma.test.findUnique({
        where: {
          id: body.testId
        }
      })

      if (!checkTest) {
        throw new HttpException('Test not found', 404);
      }

      let createComment = await this.prisma.comment.create({
        data: body
      })

      return {
        message: 'Comment created successfully',
        data: createComment
      }

    } catch (error) {
      this.Error(error);
    }
  }

  async findAll(query: GetCommentsQueryDto) {
    try {
      // 1️⃣ Pagination
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const skip = (page - 1) * limit;

      // 2️⃣ Sort
      const order: 'asc' | 'desc' = query.sortBy === 'oldest' ? 'asc' : 'desc';

      // 3️⃣ Where filter
      const where: any = {};
      if (query.studentId) where.studentId = query.studentId;
      if (query.testId) where.testId = query.testId;
      if (query.textComment) {
        where.commentText = { contains: query.textComment, mode: 'insensitive' };
      }

      // 4️⃣ Query comments
      const comments = await this.prisma.comment.findMany({
        where,
        orderBy: { createdAt: order },
        skip,
        take: limit,
        include: {
          student: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      // 5️⃣ Total count
      const total = await this.prisma.comment.count({ where });

      return {
        meta: {
          page,
          limit,
          total,
          sortBy: query.sortBy,
        },
        data: comments,
      };
    } catch (error) {
      this.Error(error);
    }
  }

  async findOne(id: string) {
    try {
      let findComment = await this.prisma.comment.findUnique({
        where: {
          id: id
        }
      })

      if (!findComment) {
        throw new HttpException('Comment not found', 404);
      }

      return {
        message: 'Comment found successfully',
        data: findComment
      }

    } catch (error) {
      this.Error(error);
    }
  }

  async update(id: string, body: UpdateCommentDto, req: Request) {
    try {
      let checkComment = await this.prisma.comment.findUnique({
        where: {
          id: id
        }
      })

      if (!checkComment) {
        throw new HttpException('Comment not found', 404);
      }

      if (checkComment.studentId !== req['user'].userId) {
        throw new HttpException('You are not authorized to update this comment', 401);
      }

      let updateComment = await this.prisma.comment.update({
        where: {
          id: id
        },
        data: body
      })

      return {
        message: 'Comment updated successfully',
        data: updateComment
      }

    } catch (error) {
      this.Error(error);
    }
  }

  async remove(id: string, req: Request) {
    try {
      let checkComment = await this.prisma.comment.findUnique({
        where: {
          id: id
        }
      })

      if (!checkComment) {
        throw new HttpException('Comment not found', 404);
      }

      if (checkComment.studentId !== req['user'].userId) {
        throw new HttpException('You are not authorized to delete this comment', 401);
      }

      let deleteComment = await this.prisma.comment.delete({
        where: {
          id: id
        }
      })

      return {
        message: 'Comment deleted successfully',
        data: deleteComment
      }

    } catch (error) {
      this.Error(error);
    }
  }
}
