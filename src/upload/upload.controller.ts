import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Req,
  Get,
  Param,
  Res,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Request, Response } from 'express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {


  private Error(error: any): never {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new BadRequestException(error.message);
  }

  constructor(private readonly uploadService: UploadService) { }

  @Post('image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    const host = `${req.protocol}://${req.get('host')}`;
    return this.uploadService.uploadFile(file, host);
  }

  @Get('image/:filename')
  getFile(@Param('filename') filename: string, @Res() res: Response) {
    try {
      return res.sendFile(join(process.cwd(), 'uploads', filename));
    } catch (error) {
      this.Error(error);
    }
  }
}
