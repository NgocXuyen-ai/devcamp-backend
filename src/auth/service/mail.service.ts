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
    const port = this.config.get<number>('mail.port', 587);
    if (host && user && password) {
      // Gmail (and most SMTP) use STARTTLS on 587 (secure:false) and
      // implicit TLS on 465 (secure:true). Pick based on the port so the
      // handshake matches the server, otherwise auth silently times out.
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        requireTLS: port !== 465,
        auth: { user, pass: password },
      });
      // Surface auth/connection problems at startup instead of on first send.
      this.transporter.verify().then(
        () => this.logger.log(`Mail SMTP ready (${host}:${port} as ${user})`),
        (err: unknown) =>
          this.logger.error(
            `Mail SMTP verification failed: ${(err as Error).message}`,
          ),
      );
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
    try {
      const info = (await this.transporter.sendMail({
        from: this.config.get<string>('mail.from'),
        to,
        subject,
        html,
      })) as { messageId?: string };
      this.logger.log(`Mail sent to ${to} (${subject}) — ${info.messageId}`);
    } catch (err) {
      this.logger.error(
        `Failed to send mail to ${to} (${subject}): ${(err as Error).message}`,
      );
      throw err;
    }
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
