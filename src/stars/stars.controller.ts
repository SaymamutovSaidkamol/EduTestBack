import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { StarsService } from './stars.service';
import { CreateStarDto } from './dto/create-star.dto';
import { UpdateStarDto } from './dto/update-star.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/decorators/role.decorator';
import { GetTopTestsQueryDto } from './dto/query-star.dto';

@Controller('stars')
export class StarsController {
  constructor(private readonly starsService: StarsService) { }


  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createStarDto: CreateStarDto, @Req() req: Request) {
    return this.starsService.create(createStarDto, req);
  }

  @Get()
  findAll(@Query() query: GetTopTestsQueryDto) {
    return this.starsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.starsService.findOne(+id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStarDto: UpdateStarDto, @Req() req: Request) {
    return this.starsService.update(id, updateStarDto, req);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.starsService.remove(id, req);
  }
}
