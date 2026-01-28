import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Res, Query } from '@nestjs/common';
import { TestService } from './test.service';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { QueryTestDto } from './dto/query.test.dto';
import { Roles } from 'src/decorators/role.decorator';
import { RoleUser } from 'src/enum/enums';
import { AuthGuard } from 'src/auth/auth.guard';
import { RoleGuard } from 'src/auth/role.guard';
import { Response } from 'express';

@Controller('test')
export class TestController {
  constructor(private readonly testService: TestService) { }


  @Roles(RoleUser.ADMIN, RoleUser.TEACHER)
  @UseGuards(AuthGuard, RoleGuard)
  @Post()
  create(@Body() createTestDto: CreateTestDto, @Req() req: Request) {
    return this.testService.create(createTestDto, req);
  }

  @Get('export-to-pdf')
  // @UseGuards(AuthGuard)
  async exportPDF(@Res() res: Response) {
    const buffer = await this.testService.exportTestsToPDF();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=tests.pdf');
    return res.send(buffer);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Query() query: QueryTestDto) {
    return this.testService.findAll(query);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.testService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTestDto: UpdateTestDto, @Req() req: Request) {
    return this.testService.update(id, updateTestDto, req);
  }

  // @UseGuards(AuthGuard)
  // @Patch(':id')
  // async exportExcel(@Res() res: Response) {
  //   const buffer = await this.testService.exportTestsToPDF();

  //   res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  //   res.setHeader('Content-Disposition', 'attachment; filename=tests.xlsx');
  //   return res.send(buffer);
  // }

  @Roles(RoleUser.ADMIN, RoleUser.TEACHER)
  @UseGuards(AuthGuard, RoleGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.testService.remove(id, req);
  }
}
