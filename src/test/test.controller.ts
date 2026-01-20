import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { TestService } from './test.service';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { Roles } from 'src/decorators/role.decorator';
import { RoleUser } from 'src/enum/enums';
import { AuthGuard } from 'src/auth/auth.guard';
import { RoleGuard } from 'src/auth/role.guard';

@Controller('test')
export class TestController {
  constructor(private readonly testService: TestService) { }


  @Roles(RoleUser.ADMIN, RoleUser.TEACHER)
  @UseGuards(AuthGuard, RoleGuard)
  @Post()
  create(@Body() createTestDto: CreateTestDto, @Req() req: Request) {
    return this.testService.create(createTestDto, req);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll() {
    return this.testService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.testService.findOne(id);
  }

  @Roles(RoleUser.ADMIN, RoleUser.TEACHER)
  @UseGuards(AuthGuard, RoleGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.testService.remove(id, req);
  }
}
