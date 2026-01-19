import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from 'src/mail/mail.module';
import { EskizService } from 'src/eskiz/eskiz.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, EskizService],
  imports: [JwtModule.register({ global: true }), MailModule]
})
export class UsersModule { }
