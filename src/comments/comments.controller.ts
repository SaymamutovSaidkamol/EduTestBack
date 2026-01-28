import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { GetCommentsQueryDto } from './dto/query.comment';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) { }

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createCommentDto: CreateCommentDto, @Req() req: Request) {
    return this.commentsService.create(createCommentDto, req);
  }

  @Get()
  findAll(@Query() query: GetCommentsQueryDto) {
    return this.commentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commentsService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto, @Req() req: Request) {
    return this.commentsService.update(id, updateCommentDto, req);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.commentsService.remove(id, req);
  }
}
