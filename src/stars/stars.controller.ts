import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { StarsService } from './stars.service';
import { CreateStarDto } from './dto/create-star.dto';
import { UpdateStarDto } from './dto/update-star.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('stars')
export class StarsController {
  constructor(private readonly starsService: StarsService) { }


  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createStarDto: CreateStarDto, @Req() req: Request) {
    return this.starsService.create(createStarDto, req);
  }

  @Get()
  findAll() {
    return this.starsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.starsService.findOne(+id);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.starsService.remove(id, req);
  }
}
