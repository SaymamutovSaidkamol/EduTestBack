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
      const userId = req['user'].userId;

      // 1️⃣ User check
      const checkUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!checkUser) {
        throw new HttpException('User not found', 404);
      }

      // 2️⃣ Category check
      const checkCategory = await this.prisma.testCategory.findUnique({
        where: { id: body.categoryId },
      });

      if (!checkCategory) {
        throw new HttpException('Category not found', 404);
      }

      // 3️⃣ Create test + questions + options
      await this.prisma.test.create({
        data: {
          title: body.title,
          description: body.description,
          categoryId: body.categoryId,
          teacherId: userId,
          isActive: body.isActive,

          questions: {
            create: body.questions.map((question) => ({
              questionText: question.questionText,

              options: {
                create: question.options.map((option) => ({
                  optionText: option.optionText,
                  isCorrect: option.isCorrect,
                })),
              },
            })),
          },
        },
      });

      return { message: 'Test created successfully' };
    } catch (error) {
      this.Error(error);
    }
  }


  async findAll() {

    try {
      let allTest = await this.prisma.test.findMany({ include: { questions: { include: { options: true } }, _count: { select: { stars: true, comments: true, likes: true } } } })

      if (!allTest) {
        throw new HttpException('Test not found', 404);
      }

      // return { allTest }

      // 2️⃣ Har bir test uchun stars avg va foiz hisoblash
      const testsWithStars = await Promise.all(
        allTest.map(async (test) => {
          // Barcha stars larni olish
          const stars = await this.prisma.stars.findMany({
            where: { testId: test.id },
            select: { stars: true },
          });

          let avgStar = 0;
          let starsPercent = 0;

          if (stars.length > 0) {
            const totalScore = stars.reduce((sum, s) => sum + s.stars, 0);
            avgStar = totalScore / stars.length;
            starsPercent = (avgStar / 5) * 100;
          }

          return {
            ...test,
            average_star: Number(avgStar.toFixed(2)),
            stars_percent: Number(starsPercent.toFixed(2)),
            stars_count: stars.length,
          };
        }),
      );

      return { allTests: testsWithStars };
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
