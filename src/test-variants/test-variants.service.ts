import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { CreateTestVariantDto } from './dto/create-test-variant.dto';
import { UpdateTestVariantDto } from './dto/update-test-variant.dto';
import { QueryTestVariantDto } from './dto/query-test-variant.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TestVariantsService {

  constructor(private prisma: PrismaService) { }


  private Error(error: any): never {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new BadRequestException(error.message);
  }

  async create(body: CreateTestVariantDto) {
    try {
      const checkVariant = await this.prisma.testVariants.findFirst({
        where: {
          name: body.name,
          testId: body.testId,
        },
      });
      if (checkVariant) {
        throw new BadRequestException('Variant already exists');
      }

      const checkTest = await this.prisma.test.findUnique({
        where: {
          id: body.testId,
        },
      });
      if (!checkTest) {
        throw new HttpException('Test not found', 404);
      }

      const createVariant = await this.prisma.testVariants.create({
        data: body,
      });
      return { data: createVariant };
    } catch (error) {
      this.Error(error)
    }
  }

  async findAll(query: QueryTestVariantDto) {
    try {
      const { name, testId, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;

      const skip = (page - 1) * Number(limit);
      const take = Number(limit);

      const where: any = {};

      if (name) {
        where.name = { contains: name, mode: 'insensitive' };
      }

      if (testId) {
        where.testId = testId;
      }

      const [variants, total] = await Promise.all([
        this.prisma.testVariants.findMany({
          where,
          skip,
          take,
          orderBy: { [sortBy]: sortOrder },
          include: { test: true },
        }),
        this.prisma.testVariants.count({ where }),
      ]);

      return {
        message: "Test variants fetched successfully",
        data: variants,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      };

    } catch (error) {
      this.Error(error)
    }
  }

  async findOne(id: string) {
    try {
      const findOneVariant = await this.prisma.testVariants.findUnique({
        where: {
          id: id,
        },
      });

      if (!findOneVariant) {
        throw new HttpException('Variant not found', 404);
      }
      return { data: findOneVariant };
    } catch (error) {
      this.Error(error)
    }
  }

  async update(id: string, body: UpdateTestVariantDto) {
    try {
      const updateVariant = await this.prisma.testVariants.update({
        where: {
          id,
        },
        data: body,
      });

      if (!updateVariant) {
        throw new HttpException('Variant not found', 404);
      }
      return { data: updateVariant };
    } catch (error) {
      this.Error(error)
    }
  }

  async remove(id: string) {
    try {
      const removeVariant = await this.prisma.testVariants.delete({
        where: {
          id,
        },
      });

      if (!removeVariant) {
        throw new HttpException('Variant not found', 404);
      }
      return { data: removeVariant };
    } catch (error) {
      this.Error(error)
    }
  }
} 
