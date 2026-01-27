import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { CreateTestVariantDto } from './dto/create-test-variant.dto';
import { UpdateTestVariantDto } from './dto/update-test-variant.dto';
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

  async findAll() {
    try {

      const findAllVariant = await this.prisma.testVariants.findMany({
        include: {
          test: true,
        },
      });

      if (!findAllVariant) {
        throw new HttpException('Variant not found', 404);
      }

      return { data: findAllVariant };

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
