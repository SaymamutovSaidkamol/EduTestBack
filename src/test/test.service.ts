import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTestDto } from './dto/create-test.dto';
import * as PDFDocument from 'pdfkit';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoleUser } from 'src/enum/enums';

import * as path from 'path';
import { existsSync } from 'fs';

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

  // async exportTestsToPDF(): Promise<Buffer> {
  //   // 1️⃣ Testlarni olish
  //   const tests = await this.prisma.test.findMany({
  //     include: {
  //       questions: {
  //         include: {
  //           options: true, // variantlarni olish
  //         },
  //       },
  //     },
  //   });

  //   if (!tests || tests.length === 0) {
  //     throw new NotFoundException('Testlar topilmadi');
  //   }

  //   // 2️⃣ PDF yaratish
  //   const doc = new PDFDocument({ margin: 30 });
  //   const buffers: Uint8Array[] = [];

  //   doc.on('data', (chunk) => buffers.push(chunk));
  //   doc.on('end', () => { });

  //   // 3️⃣ Logo yo'li (dev va build uchun)
  //   const logoPath = path.resolve(__dirname, '..', '..', 'assets', 'logo.png');

  //   if (!existsSync(logoPath)) {
  //     throw new NotFoundException(`Logo topilmadi: ${logoPath}`);
  //   }

  //   // 4️⃣ PDF sahifa kengligi
  //   const pageWidth = doc.page.width;

  //   // 5️⃣ Logo + EduTest markazlashgan
  //   const logoWidth = 60;
  //   const logoX = (pageWidth - logoWidth - 120) / 2; // 120 → matn uchun joy
  //   const logoY = 40;

  //   doc.image(logoPath, logoX, logoY, { width: logoWidth })
  //     .font('Helvetica-Bold')
  //     .fontSize(28)
  //     .fillColor('black')
  //     .text('EduTest', logoX + logoWidth + 10, logoY + 10);

  //   // 6️⃣ Tagiga chiziq
  //   const lineY = logoY + 60;
  //   doc.moveTo(50, lineY)
  //     .lineTo(pageWidth - 50, lineY)
  //     .strokeColor('#000000')
  //     .lineWidth(1)
  //     .stroke();

  //   doc.moveDown(3);

  //   // 7️⃣ Sarlavha
  //   doc.fontSize(18).fillColor('black').text('Testlar ro‘yxati', { align: 'center' });
  //   doc.moveDown();

  //   // 8️⃣ Testlar va savollar
  //   tests.forEach((test, index) => {
  //     doc.fontSize(14).fillColor('black')
  //       .text(`${index + 1}. Test: ${test.title}`, { align: 'left' });
  //     doc.fontSize(12).fillColor('gray')
  //       .text(`Tavsif: ${test.description}`, { align: 'left' });
  //     doc.moveDown(0.5);

  //     test.questions.forEach((question, qIndex) => {
  //       doc.fontSize(12).fillColor('black')
  //         .text(`   ${qIndex + 1}) ${question.questionText}`, { align: 'left' });

  //       question.options.forEach((option, oIndex) => {
  //         const label = String.fromCharCode(65 + oIndex);
  //         doc.fontSize(11).fillColor('black')
  //           .text(`       ${label}) ${option.optionText} ${option.isCorrect ? '(To‘g‘ri)' : ''}`, { align: 'left' });
  //       });

  //       doc.moveDown(0.5);
  //     });

  //     doc.moveDown(1);
  //   });

  //   doc.end();

  //   // 9️⃣ Buffer qaytarish
  //   return new Promise<Buffer>((resolve, reject) => {
  //     doc.on('end', () => resolve(Buffer.concat(buffers)));
  //     doc.on('error', (err) => reject(err));
  //   });

  // }

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
