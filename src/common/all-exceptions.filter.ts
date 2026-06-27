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
  code?: string;
  error?: string;
  details?: unknown;
}

/** Fallback short code per HTTP status, used when the thrower didn't set one. */
const STATUS_CODE_NAMES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
  [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
};

/** Coerce the message (which may be an array) into a single readable sentence. */
function toMessageString(message: string | string[]): string {
  if (Array.isArray(message)) {
    return message.filter(Boolean).join('. ') || 'Request failed';
  }
  return message;
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
        message: Object.values(exception.errors)
          .map((e) => e.message)
          .join('. '),
        code: 'VALIDATION_ERROR',
        details: Object.values(exception.errors).map((e) => e.message),
      };
    } else if (exception instanceof MongoServerError) {
      if (exception.code === 11000) {
        status = HttpStatus.CONFLICT;
        body = {
          message: 'This value already exists.',
          code: 'DUPLICATE_KEY',
          details: exception.keyValue,
        };
      } else {
        body = { message: exception.message, code: 'DATABASE_ERROR' };
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

    // Never leak internal error details to the client.
    const message =
      status >= HttpStatus.INTERNAL_SERVER_ERROR
        ? 'Something went wrong on our side. Please try again later.'
        : toMessageString(body.message);

    res.status(status).json({
      data: null,
      error: {
        message,
        code: body.code ?? STATUS_CODE_NAMES[status] ?? 'ERROR',
        statusCode: status,
        ...(body.details !== undefined ? { details: body.details } : {}),
      },
      meta: {
        timestamp: new Date().toISOString(),
        path: req.url,
        statusCode: status,
      },
    });
  }
}
