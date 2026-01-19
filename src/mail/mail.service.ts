import { Injectable } from '@nestjs/common';
import *as nodemailer from 'nodemailer';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'saymamutovsaidkamol6@gmail.com',
        pass: 'elhx txxs pdhn ggvs',
      },
    });
  }

  async sendMail({ to, subject, html }: MailOptions) {
    return await this.transporter.sendMail({
      from: `"Your App" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });


    // return message;
  }
}