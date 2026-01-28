import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { TestVariantsService } from './test-variants.service';
import { CreateTestVariantDto } from './dto/create-test-variant.dto';
import { UpdateTestVariantDto } from './dto/update-test-variant.dto';
import { QueryTestVariantDto } from './dto/query-test-variant.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/decorators/role.decorator';
import { RoleUser } from 'src/enum/enums';

@Controller('test-variants')
export class TestVariantsController {
  constructor(private readonly testVariantsService: TestVariantsService) { }

  @Roles(RoleUser.ADMIN)
  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createTestVariantDto: CreateTestVariantDto) {
    return this.testVariantsService.create(createTestVariantDto);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Query() query: QueryTestVariantDto) {
    return this.testVariantsService.findAll(query);
  }


  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.testVariantsService.findOne(id);
  }


  @Roles(RoleUser.ADMIN)
  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTestVariantDto: UpdateTestVariantDto) {
    return this.testVariantsService.update(id, updateTestVariantDto);
  }


  @Roles(RoleUser.ADMIN, RoleUser.TEACHER)
  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testVariantsService.remove(id);
  }
}
