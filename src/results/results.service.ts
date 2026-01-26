import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { CreateResultDto } from './dto/create-result.dto';
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

      let checkuser = await this.prisma.user.findUnique({
        where: {
          id: req['user'].userId
        }
      })

      if (!checkuser) {
        throw new HttpException('User not found', 404);
      }

      body.studentId = req['user'].userId;

      let checktest = await this.prisma.test.findUnique({
        where: {
          id: body.testId
        }
      })

      if (!checktest) {
        throw new HttpException('Test not found', 404);
      }

      const score = body.score ?? 0;

      let newResult = await this.prisma.result.create({
        data: {
          studentId: body.studentId,
          testId: body.testId,
          variantId: body.variantId,
          score: score
        }
      })

      return { data: newResult, message: 'Test started successfully' };

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

  async update(id: string, body: UpdateResultDto, req: Request) {
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



      let updatedResult = await this.prisma.result.update({
        where: {
          id: id
        },
        data: body
      })

      return { data: updatedResult, message: 'Result updated successfully' };
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
