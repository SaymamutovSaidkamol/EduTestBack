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
import { TestVariantsModule } from './test-variants/test-variants.module';
import { ResultsModule } from './results/results.module';
import { StarsModule } from './stars/stars.module';
import { CommentsModule } from './comments/comments.module';
import { LikesModule } from './likes/likes.module';
import { UploadModule } from './upload/upload.module';
import { BotModule } from './bot/bot.module';
import { ConfigModule } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';

@Module({
  imports: [PrismaModule, UsersModule, MailModule, TestCategoryModule, TestModule, TestVariantsModule, ResultsModule, StarsModule, CommentsModule, LikesModule, UploadModule,
    ConfigModule.forRoot({ isGlobal: true }),
    TelegrafModule.forRoot({
      token: process.env.BOT_TOKEN!,
      middlewares: [
        session({
          getSessionKey: (ctx) => ctx.from ? `${ctx.from.id}` : undefined
        })
      ],
    }),
    BotModule,
  ],
  controllers: [AppController],
  providers: [AppService, MailService, EskizService],
})
export class AppModule { }
