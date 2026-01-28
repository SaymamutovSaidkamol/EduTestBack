import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { LikesService } from './likes.service';
import { CreateLikeDto } from './dto/create-like.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { GetLikesQueryDto } from './dto/query-like.dto';

@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) { }

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createLikeDto: CreateLikeDto, @Req() req: Request) {
    return this.likesService.create(createLikeDto, req);
  }

  @Get()
  findAll(@Query() query: GetLikesQueryDto) {
    return this.likesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.likesService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.likesService.remove(id, req);
  }
}
