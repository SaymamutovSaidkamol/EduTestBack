import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ResultsService } from './results.service';
import { CreateResultDto } from './dto/create-result.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RoleGuard } from 'src/auth/role.guard';
import { RoleUser } from 'src/enum/enums';
import { Roles } from 'src/decorators/role.decorator';

@Controller('results')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) { }

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createResultDto: CreateResultDto, @Req() req: Request) {
    return this.resultsService.create(createResultDto, req);
  }

  @Roles(RoleUser.ADMIN)
  @UseGuards(AuthGuard)
  @Get()
  findAll() {
    return this.resultsService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.resultsService.findOne(id, req);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateResultDto: UpdateResultDto, @Req() req: Request) {
    return this.resultsService.update(id, updateResultDto, req);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.resultsService.remove(id, req);
  }
}
