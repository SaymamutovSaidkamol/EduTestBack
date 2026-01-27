import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { CreateResultAnswerDto, CreateResultDto, FinishTestDto, IsCorrect, ResultStatus } from './dto/create-result.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoleUser } from 'src/enum/enums';

@Injectable()
export class ResultsService {

  constructor(private prisma: PrismaService) { }


  private Error(error: any): never {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new BadRequestException(error.message);
  }

  async create(body: CreateResultDto, req: Request) {
    try {
      const userId = req['user'].userId;

      /* 1️⃣ USER TEKSHIRISH */
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new HttpException('User not found', 404);
      }

      /* 2️⃣ TEST TEKSHIRISH */
      const test = await this.prisma.test.findUnique({
        where: { id: body.testId },
      });

      if (!test) {
        throw new HttpException('Test not found', 404);
      }

      /* 3️⃣ VARIANT TEKSHIRISH */
      const variant = await this.prisma.testVariants.findUnique({
        where: { id: body.variantId },
      });

      if (!variant) {
        throw new HttpException('Variant not found', 404);
      }

      /* 4️⃣ RESULT YARATISH (TEST BOSHLANDI) */
      const newResult = await this.prisma.result.create({
        data: {
          studentId: userId,
          testId: body.testId,
          variantId: body.variantId,
          score: 0,
          status: ResultStatus.IN_PROGRESS,
        },
      });

      /* 5️⃣ TESTDAGI SAVOLLARNI OLISH */
      const questions = await this.prisma.question.findMany({
        where: { testId: body.testId },
        select: { id: true },
      });

      if (questions.length === 0) {
        throw new HttpException('This test has no questions', 400);
      }

      /* 6️⃣ HAR BIR SAVOL UCHUN ResultAnswer YARATISH */
      const resultAnswers = questions.map((q) => ({
        resultId: newResult.id,
        questionId: q.id,
        isCorrect: IsCorrect.PENDING,
      }));

      await this.prisma.resultAnswer.createMany({
        data: resultAnswers,
      });

      /* 7️⃣ RESPONSE */
      return {
        message: 'Test started successfully',
        data: {
          resultId: newResult.id,
          totalQuestions: questions.length,
        },
      };

    } catch (error) {
      this.Error(error);
    }
  }

  // ✅ 2. Student javob beradi
  async answerQuestion(body: CreateResultAnswerDto, req: Request) {
    try {
      const userId = req['user'].userId;

      // 1️⃣ Result tekshirish
      const result = await this.prisma.result.findUnique({
        where: { id: body.resultId }
      });
      if (!result || result.studentId !== userId) {
        throw new HttpException('Result not found', 404);
      }

      // 2️⃣ Savol va javoblarni olish
      const question = await this.prisma.question.findUnique({
        where: { id: body.questionId },
        include: { options: true }, // har bir savolning Optionslarini olish
      });
      if (!question) {
        throw new HttpException('Question not found', 404);
      }

      // 3️⃣ To‘g‘ri javobni tekshirish
      let correctness: IsCorrect = IsCorrect.WRONG;
      const correctOption = question.options.find(o => o.isCorrect === true);
      if (correctOption && correctOption.id === body.selectOptionId) {
        correctness = IsCorrect.CORRECT;
      }

      // 4️⃣ ResultAnswer update
      const answer = await this.prisma.resultAnswer.update({
        where: { id: body.resultAnswerId },
        data: {
          selectOptionId: body.selectOptionId,
          isCorrect: correctness,
          answerAt: new Date(),
        },
      });

      return { message: 'Answer saved', data: answer };

    } catch (error) {
      this.Error(error);
    }
  }


  // ✅ 3. Test tugadi
  async finishTest(resultId: string, userId: string) {
    // 1️⃣ Result tekshirish
    const result = await this.prisma.result.findUnique({ where: { id: resultId } });
    if (!result || result.studentId !== userId) {
      throw new HttpException('Result not found', 404);
    }

    // 2️⃣ Testdagi javoblarni olish
    const answers = await this.prisma.resultAnswer.findMany({ where: { resultId } });

    // 3️⃣ Score hisoblash (1 ta to'g'ri javob = 1 ball)
    const score = answers.filter((a) => a.isCorrect === 'CORRECT').length;

    // 4️⃣ Result yangilash
    const updatedResult = await this.prisma.result.update({
      where: { id: resultId },
      data: {
        score,
        status: ResultStatus.FINISHED,
        updateAt: new Date(),  // updateAt ustuni mavjud bo'lishi kerak
      },
    });

    // 5️⃣ Response qaytarish
    return { message: 'Test completed', data: updatedResult };
  }

  async meResults(userId: string) {
    try {

      let checkResult = await this.prisma.result.findMany({
        where: { studentId: userId },
      })

      if (!checkResult) {
        throw new HttpException('Result not found', 404);
      }

      let checkResultAnswer = await this.prisma.resultAnswer.findMany({
        where: { resultId: checkResult[0].id },
        select: {
          id: true,
          questionId: true,
          result: {
            select: {
              id: true,
              student: { select: { id: true, firstName: true, lastName: true } }
            }
          },
          question: { select: { questionText: true } },
          selectOption: { select: { id: true, optionText: true, isCorrect: true } }
        }
      });

      if (!checkResultAnswer) {
        throw new HttpException('ResultAnswer not found', 404);
      }
      return { checkResultAnswer, message: 'Results found successfully' };
    } catch (error) {
      this.Error(error);
    }
  }

  async findAll() {
    try {
      let results = await this.prisma.result.findMany();

      if (!results) {
        throw new HttpException('Results not found', 404);
      }

      return { data: results, message: 'Results found successfully' };
    } catch (error) {
      this.Error(error);
    }
  }

  async findAllResultAnswer() {
    try {
      let results = await this.prisma.resultAnswer.findMany();

      if (!results) {
        throw new HttpException('Results answer not found', 404);
      }

      return { data: results, message: 'Results answer found successfully' };
    } catch (error) {
      this.Error(error);
    }
  }

  async findOne(id: string, req: Request) {
    try {
      let checkuser = await this.prisma.user.findUnique({
        where: {
          id: req['user'].userId
        }
      })

      if (!checkuser) {
        throw new HttpException('User not found', 404);
      }

      let checkresult = await this.prisma.result.findUnique({
        where: {
          id: id
        }
      })

      if (!checkresult) {
        throw new HttpException('Result not found', 404);
      }

      return { data: checkresult, message: 'Result found successfully' };
    } catch (error) {
      this.Error(error);
    }
  }

  async update(resultId: string, userId: string) {
    try {

    } catch (error) {
      this.Error(error);
    }
  }

  async remove(id: string, req: Request) {
    try {
      let checkuser = await this.prisma.user.findUnique({
        where: {
          id: req['user'].userId
        }
      })

      if (!checkuser) {
        throw new HttpException('User not found', 404);
      }

      let checkresult = await this.prisma.result.findUnique({
        where: {
          id: id
        }
      })

      if (!checkresult) {
        throw new HttpException('Result not found', 404);
      }

      if (checkuser.role !== RoleUser.ADMIN && checkuser.id !== checkresult.studentId) {
        throw new HttpException('You are not authorized', 401);
      }

      let deletedResult = await this.prisma.result.delete({
        where: {
          id: id
        }
      })

      return { data: deletedResult, message: 'Result deleted successfully' };
    } catch (error) {
      this.Error(error);
    }
  }
}
