import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoleUser } from 'src/enum/enums';

@Injectable()
export class TestService {

  constructor(private prisma: PrismaService) { }

  private Error(error: any): never {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new BadRequestException(error.message);
  }

  async create(body: CreateTestDto, req: Request) {
    try {

      console.log(req['user'].userId);

      const body_test = {
        title: body.title,
        description: body.description,
        categoryId: body.categoryId,
        teacherId: req['user'].userId,
        isActive: body.isActive,
      }

      let checkUser = await this.prisma.user.findUnique({
        where: {
          id: req['user'].userId
        }
      })

      if (!checkUser) {
        throw new HttpException('User not found', 404);
      }

      let checkCategory = await this.prisma.testCategory.findUnique({
        where: {
          id: body.categoryId
        }
      })

      if (!checkCategory) {
        throw new HttpException('Category not found', 404);
      }

      let newTest = await this.prisma.test.create({
        data: body_test
      })

      const body_question = {
        testId: newTest.id,
        questionText: body.questions[0].questionText,
      }

      let checkTest = await this.prisma.test.findUnique({
        where: {
          id: newTest.id
        }
      })

      if (!checkTest) {
        throw new HttpException('Test not found', 404);
      }

      let new_question = await this.prisma.question.create({
        data: body_question
      })

      console.log(body_test);



      const body_option = {
        questionId: new_question.id,
        optionText: body.questions[0].options[0].optionText,
        isCorrect: body.questions[0].options[0].isCorrect,
      }

      let checkQuestion = await this.prisma.question.findUnique({
        where: {
          id: new_question.id
        }
      })

      if (!checkQuestion) {
        throw new HttpException('Question not found', 404);
      }

      let new_option = await this.prisma.options.create({
        data: body_option
      })

      console.log(body_option);

      return { message: 'Test created successfully' }


    } catch (error) {
      this.Error(error);
    }
  }

  async findAll() {

    try {
      let allTest = await this.prisma.test.findMany({ include: { questions: { include: { options: true } } } })

      if (!allTest) {
        throw new HttpException('Test not found', 404);
      }

      return { allTest }
    } catch (error) {
      this.Error(error);
    }
  }

  async findOne(id: string) {
    try {
      let test = await this.prisma.test.findUnique({ where: { id } })

      if (!test) {
        throw new HttpException('Test not found', 404);
      }

      return { test }
    } catch (error) {
      this.Error(error);
    }
  }

  async remove(id: string, req: Request) {
    try {

      let checkUser = await this.prisma.user.findUnique({ where: { id: req['user'].userId } })

      if (!checkUser) {
        throw new HttpException('User not found', 404);
      }

      let test = await this.prisma.test.findUnique({ where: { id } })

      if (!test) {
        throw new HttpException('Test not found', 404);
      }



      const isAdmin = checkUser.role === RoleUser.ADMIN;
      const isOwnerTeacher =
        checkUser.role === RoleUser.TEACHER &&
        test.teacherId === checkUser.id;

      if (!isAdmin && !isOwnerTeacher) {
        throw new HttpException('You are not authorized', 401);
      }

      let checkQuestion = await this.prisma.question.findFirst({ where: { testId: test.id } })

      console.log(checkQuestion);
      if (!checkQuestion) {
        throw new HttpException('Question not found', 404);
      }

      let checkOption = await this.prisma.options.findFirst({ where: { questionId: checkQuestion.id } })

      console.log(checkOption);


      if (!checkOption) {
        throw new HttpException('Option not found', 404);
      }

      await this.prisma.test.delete({ where: { id } })
      // await this.prisma.question.delete({ where: { id: checkQuestion.id } })
      // await this.prisma.options.delete({ where: { id: checkOption.id } })

      return { message: 'Test deleted successfully' }
    } catch (error) {
      this.Error(error);
    }
  }
}
