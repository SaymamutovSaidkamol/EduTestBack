import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { 
  PrismaClientValidationError, 
  PrismaClientKnownRequestError 
} from '@prisma/client/runtime/library';

@Catch(PrismaClientValidationError, PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();

    let responseBody: any = {
      name: exception.name,
      message: exception.message,
    };

    if (exception instanceof PrismaClientKnownRequestError) {
      responseBody.code = exception.code;
      responseBody.meta = exception.meta;
    }

    return res.status(HttpStatus.BAD_REQUEST).json(responseBody);
  }
}
