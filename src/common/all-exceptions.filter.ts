import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { MongoServerError } from 'mongodb';
import { Error as MongooseError } from 'mongoose';

interface ErrorResponseBody {
  message: string | string[];
  error?: string;
  details?: unknown;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<{
      status: (code: number) => { json: (body: unknown) => void };
    }>();
    const req = ctx.getRequest<{ url: string; method: string }>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ErrorResponseBody = { message: 'Internal server error' };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();
      body =
        typeof resp === 'string'
          ? { message: resp }
          : (resp as ErrorResponseBody);
    } else if (exception instanceof MongooseError.ValidationError) {
      status = HttpStatus.BAD_REQUEST;
      body = {
        message: 'Validation failed',
        error: 'ValidationError',
        details: Object.values(exception.errors).map((e) => e.message),
      };
    } else if (exception instanceof MongoServerError) {
      if (exception.code === 11000) {
        status = HttpStatus.CONFLICT;
        body = {
          message: 'Duplicate value',
          error: 'DuplicateKey',
          details: exception.keyValue,
        };
      } else {
        body = { message: exception.message, error: 'MongoError' };
      }
    } else if (exception instanceof Error) {
      body = { message: exception.message };
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${req.method} ${req.url} ${status}`,
        (exception as Error)?.stack,
      );
    }

    res.status(status).json({
      data: null,
      error: body,
      meta: {
        timestamp: new Date().toISOString(),
        path: req.url,
        statusCode: status,
      },
    });
  }
}
