import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardResponse<T> {
  data: T;
  meta: {
    timestamp: string;
    path: string;
    statusCode: number;
  };
}

/**
 * Wraps every successful response with a consistent envelope so the
 * frontend can rely on `response.data` everywhere.
 *
 * If the controller already returns a payload shaped like
 * `{ data, meta }`, it's passed through untouched.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  StandardResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<StandardResponse<T>> {
    const http = context.switchToHttp();
    const req = http.getRequest<{ url: string }>();
    const res = http.getResponse<{ statusCode: number }>();

    return next.handle().pipe(
      map((data) => ({
        data,
        meta: {
          timestamp: new Date().toISOString(),
          path: req.url,
          statusCode: res.statusCode,
        },
      })),
    );
  }
}
