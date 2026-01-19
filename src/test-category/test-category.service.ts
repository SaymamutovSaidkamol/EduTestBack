import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { CreateTestCategoryDto } from './dto/create-test-category.dto';
import { UpdateTestCategoryDto } from './dto/update-test-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoleUser } from 'src/enum/enums';

@Injectable()
export class TestCategoryService {
  constructor(private prisma: PrismaService) { }

  private Error(error: any): never {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new BadRequestException(error.message);
  }
  async create(body: CreateTestCategoryDto) {
    try {

      let checkCategory = await this.prisma.testCategory.findFirst({ where: { categoryName: body.categoryName } })

      if (checkCategory) {
        throw new BadRequestException("This category alredy exist")
      }

      let newCategory = await this.prisma.testCategory.create({ data: body })

      return { message: "Category created successfully", data: newCategory }
    } catch (error) {
      this.Error(error);
    }
  }

  async findAll() {
    try {
      let categories = await this.prisma.testCategory.findMany()
      return { message: "Categories fetched successfully", data: categories }
    } catch (error) {
      this.Error(error);
    }
  }

  async findOne(id: string) {
    try {
      let category = await this.prisma.testCategory.findUnique({ where: { id } })

      if (!category) {
        throw new BadRequestException("Category not found")
      }

      return { message: "Category fetched successfully", data: category }
    } catch (error) {
      this.Error(error);
    }
  }

  async update(id: string, body: UpdateTestCategoryDto) {
    try {
      let category = await this.prisma.testCategory.findUnique({ where: { id } })

      if (!category) {
        throw new BadRequestException("Category not found")
      }

      let checkCategory = await this.prisma.testCategory.findFirst({ where: { categoryName: body.categoryName } })

      if (checkCategory) {
        throw new BadRequestException("This category alredy exist")
      }

      let updatedCategory = await this.prisma.testCategory.update({ where: { id }, data: body })

      return { message: "Category updated successfully", data: updatedCategory }
    } catch (error) {
      this.Error(error);
    }
  }

  async remove(id: string) {
    try {
      let category = await this.prisma.testCategory.findUnique({ where: { id } })

      if (!category) {
        throw new BadRequestException("Category not found")
      }

      await this.prisma.testCategory.delete({ where: { id } })

      return { message: "Category deleted successfully" }

    } catch (error) {
      this.Error(error)
    }
  }
}
