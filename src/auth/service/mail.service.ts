import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter?: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('mail.host');
    const user = this.config.get<string>('mail.user');
    const password = this.config.get<string>('mail.password');
    if (host && user && password) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('mail.port', 587),
        secure: false,
        auth: { user, pass: password },
      });
    } else {
      this.logger.warn(
        'Mail SMTP not configured — emails will be logged instead of sent.',
      );
    }
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`[MAIL→${to}] ${subject}\n${html}`);
      return;
    }
    await this.transporter.sendMail({
      from: this.config.get<string>('mail.from'),
      to,
      subject,
      html,
    });
  }

  sendOtpEmail(to: string, code: string): Promise<void> {
    return this.send(
      to,
      'Code-For-Glory — Password Reset Code',
      `<p>Your verification code is <strong>${code}</strong>. It expires in 10 minutes.</p>`,
    );
  }

  sendSuspiciousLoginEmail(to: string): Promise<void> {
    return this.send(
      to,
      'Code-For-Glory — Suspicious login attempt',
      `<p>We detected suspicious login activity on your account.
       If this was not you, please change your password immediately.</p>`,
    );
  }

  sendWelcomeEmail(to: string, username: string): Promise<void> {
    return this.send(
      to,
      'Welcome to Code-For-Glory',
      `<p>Hi ${username}, welcome aboard! Start your adventure.</p>`,
    );
  }
}
