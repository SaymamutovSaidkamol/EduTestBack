import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ResultsService } from './results.service';
import { CreateResultAnswerDto, CreateResultDto, FinishTestDto } from './dto/create-result.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RoleUser } from 'src/enum/enums';
import { Roles } from 'src/decorators/role.decorator';

@Controller('results')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) { }

  @UseGuards(AuthGuard)
  @Post('start-test')
  create(@Body() createResultDto: CreateResultDto, @Req() req: Request) {
    return this.resultsService.create(createResultDto, req);
  }

  @UseGuards(AuthGuard)
  @Post('answer')
  async answer(@Body() body: CreateResultAnswerDto, @Req() req: Request) {
    return this.resultsService.answerQuestion(body, req);
  }

  @UseGuards(AuthGuard) // JWT orqali userId olinadi
  @Post("finish")
  async finishTest(@Body() dto: FinishTestDto, @Req() req) {
    const userId = req.user.userId; // JWT token orqali kelgan userId
    return await this.resultsService.finishTest(dto.resultId, userId);
  }

  @Roles(RoleUser.ADMIN)
  @UseGuards(AuthGuard)
  @Get('me-results')
  MeResults(@Req() req: Request) {
    return this.resultsService.meResults(req['user'].userId);
  }

  @Roles(RoleUser.ADMIN)
  @UseGuards(AuthGuard)
  @Get()
  findAll() {
    return this.resultsService.findAll();
  }

  @Roles(RoleUser.ADMIN)
  @UseGuards(AuthGuard)
  @Get('result-answer')
  findAllResultAnswer() {
    return this.resultsService.findAllResultAnswer();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.resultsService.findOne(id, req);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/')
  update(@Param('id') id: string, @Body() updateResultDto: UpdateResultDto, @Req() req: Request) {
    return this.resultsService.update(id, req['user'].userId);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.resultsService.remove(id, req);
  }
}
