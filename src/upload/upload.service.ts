import { BadRequestException, HttpException, Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {


  private Error(error: any): never {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new BadRequestException(error.message);
  }

  uploadFile(file: Express.Multer.File, host: string) {
    try {
      return {
        url: `${host}/upload/image/${file.filename}`,
      };
    } catch (error) {
      this.Error(error);
    }
  }
}
