import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { TestCategoryService } from './test-category.service';
import { CreateTestCategoryDto } from './dto/create-test-category.dto';
import { UpdateTestCategoryDto } from './dto/update-test-category.dto';
import { QueryTestCategoryDto } from './dto/query.test-category.dto';
import { Roles } from 'src/decorators/role.decorator';
import { RoleUser } from 'src/enum/enums';
import { AuthGuard } from 'src/auth/auth.guard';
import { RoleGuard } from 'src/auth/role.guard';

@Controller('test-category')
export class TestCategoryController {
  constructor(private readonly testCategoryService: TestCategoryService) { }

  @Roles(RoleUser.ADMIN)
  @UseGuards(AuthGuard, RoleGuard)
  @Post()
  create(@Body() createTestCategoryDto: CreateTestCategoryDto) {
    return this.testCategoryService.create(createTestCategoryDto);
  }

  @Get()
  findAll(@Query() query: QueryTestCategoryDto) {
    return this.testCategoryService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.testCategoryService.findOne(id);
  }

  @Roles(RoleUser.ADMIN)
  @UseGuards(AuthGuard, RoleGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTestCategoryDto: UpdateTestCategoryDto) {
    return this.testCategoryService.update(id, updateTestCategoryDto);
  }


  @Roles(RoleUser.ADMIN)
  @UseGuards(AuthGuard, RoleGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testCategoryService.remove(id);
  }
}
