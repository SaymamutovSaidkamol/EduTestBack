import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { MailService } from './mail/mail.service';
import { MailModule } from './mail/mail.module';
import { EskizService } from './eskiz/eskiz.service';
import { TestCategoryModule } from './test-category/test-category.module';
import { TestModule } from './test/test.module';

@Module({
  imports: [PrismaModule, UsersModule, MailModule, TestCategoryModule, TestModule],
  controllers: [AppController],
  providers: [AppService, MailService, EskizService],
})
export class AppModule {}
