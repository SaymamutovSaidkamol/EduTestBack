import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTestDto } from './dto/create-test.dto';
import * as PDFDocument from 'pdfkit';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoleUser } from 'src/enum/enums';

import * as path from 'path';
import { existsSync } from 'fs';
import { QueryTestDto } from './dto/query.test.dto';
import { UpdateTestDto } from './dto/update-test.dto';

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


  async findAll(query: QueryTestDto) {
    try {
      const {
        search,
        title,
        categoryId,
        isActive,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = query;


      const skip = (page - 1) * Number(limit);
      const take = Number(limit);

      // 1️⃣ Where filter
      const where: any = {};

      if (title) {
        where.title = { contains: title, mode: 'insensitive' };
      } else if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (isActive !== undefined) {
        if (typeof isActive === 'string') {
          where.isActive = isActive === 'true'; // "true" → true, "false" → false
        } else {
          where.isActive = Boolean(isActive); // all other cases
        }
      }

      // 2️⃣ Barcha testlarni pagination bilan olish
      const [allTest, total] = await Promise.all([
        this.prisma.test.findMany({
          where,
          skip,
          take,
          orderBy: { [sortBy]: sortOrder },
          include: {
            questions: { include: { options: true } },
            _count: { select: { stars: true, comments: true, likes: true } },
          },
        }),
        this.prisma.test.count({ where }),
      ]);

      if (!allTest || allTest.length === 0) {
        return {
          allTests: [],
          meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
      }

      // 3️⃣ Barcha starslarni bitta query bilan olish va avg hisoblash
      const starsGrouped = await this.prisma.stars.groupBy({
        by: ['testId'],
        _avg: { stars: true },
        _count: { stars: true },
        where: { testId: { in: allTest.map((t) => t.id) } },
      });

      // 4️⃣ Testlarga avgStar va starsPercent biriktirish
      const testsWithStars = allTest.map((test) => {
        const starData = starsGrouped.find((g) => g.testId === test.id);
        const avgStar = starData?._avg?.stars ?? 0;
        const starsPercent = (avgStar / 5) * 100;
        const starsCount = starData?._count?.stars ?? 0;

        return {
          ...test,
          average_star: Number(avgStar.toFixed(2)),
          stars_percent: Number(starsPercent.toFixed(2)),
          stars_count: starsCount,
        };
      });

      return {
        allTests: testsWithStars,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
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

  async update(id: string, body: UpdateTestDto, req: Request) {
    try {

      let checkUser = await this.prisma.user.findUnique({ where: { id: req['user'].userId } })

      if (!checkUser) {
        throw new HttpException('User not found', 404);
      }

      let test = await this.prisma.test.findUnique({ where: { id } })

      if (!test) {
        throw new HttpException('Test not found', 404);
      }

      if (checkUser.role !== RoleUser.ADMIN && checkUser.id !== test.teacherId) {
        throw new HttpException('You are not authorized', 401);
      }

      let updateTest = await this.prisma.test.update({ where: { id }, data: body })

      return { data: updateTest, message: 'Test updated successfully' }
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


  async exportTestsToPDF(): Promise<Buffer> {
    // 1️⃣ Testlarni olish
    const tests = await this.prisma.test.findMany({
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!tests || tests.length === 0) {
      throw new NotFoundException('Testlar topilmadi');
    }

    // 2️⃣ PDF yaratish
    const doc = new PDFDocument({ margin: 30 });
    const buffers: Uint8Array[] = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => { });

    // 3️⃣ Logo yo'li
    const logoPath = path.resolve(__dirname, '..', '..', 'assets', 'logo.png');

    console.log(logoPath);

    if (!existsSync(logoPath)) {
      throw new NotFoundException(`Logo topilmadi: ${logoPath}`);
    }

    // 4️⃣ Sahifa kengligi
    const pageWidth = doc.page.width;

    // 5️⃣ Logo + EduTest markazlashgan
    const logoWidth = 60;
    const logoX = (pageWidth - logoWidth - 120) / 2; // 120 → matn uchun joy
    const logoY = 40;

    // Logo va EduTest
    doc.image(logoPath, logoX, logoY, { width: logoWidth })
      .font('Helvetica-Bold')
      .fontSize(22)
      .fillColor('black')
      .text('EduTest', logoX + logoWidth + 10, logoY + 10);

    // 6️⃣ Tagiga chiziq
    const lineY = logoY + 60;
    doc.moveTo(50, lineY)
      .lineTo(pageWidth - 50, lineY)
      .strokeColor('#000000')
      .lineWidth(1)
      .stroke();

    doc.moveDown(3);

    const startX = 50; // chapdan boshlash
    const questionIndent = 20;
    const optionIndent = 40;


    // 8️⃣ Testlar va savollar (chapdan)
    tests.forEach((test, index) => {
      doc.fontSize(14).fillColor('black')
        .text(`${index + 1}. Test: ${test.title}`, startX, doc.y);

      doc.fontSize(12).fillColor('gray')
        .text(`Tavsif: ${test.description}`, startX, doc.y);

      doc.moveDown(0.5);

      test.questions.forEach((question, qIndex) => {
        doc.fontSize(12).fillColor('black')
          .text(`${qIndex + 1}) ${question.questionText}`, startX + questionIndent, doc.y);

        question.options.forEach((option, oIndex) => {
          const label = String.fromCharCode(65 + oIndex);
          doc.fontSize(11).fillColor('black')
            .text(`${label}) ${option.optionText} ${option.isCorrect ? '(To‘g‘ri)' : ''}`, startX + optionIndent, doc.y);
        });

        doc.moveDown(0.5);
      });

      doc.moveDown(1);
    });

    // 9️⃣ PDF tugatish
    doc.end();

    // 10️⃣ Buffer qaytarish
    return new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));
    });
  }

}
