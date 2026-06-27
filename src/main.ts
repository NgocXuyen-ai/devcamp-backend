import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

/** Collect every human-readable constraint message, including nested ones. */
function flattenValidationMessages(errors: ValidationError[]): string[] {
  const messages: string[] = [];
  for (const error of errors) {
    if (error.constraints) {
      messages.push(...Object.values(error.constraints));
    }
    if (error.children?.length) {
      messages.push(...flattenValidationMessages(error.children));
    }
  }
  return messages;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      // Return a single readable sentence instead of the default array, so the
      // client can show the error text directly instead of a bare status code.
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = flattenValidationMessages(errors);
        return new BadRequestException({
          message: messages[0] ?? 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: messages,
        });
      },
    }),
  );
  app.setGlobalPrefix(config.get<string>('app.apiPrefix', 'api'));

  const corsOrigin = config.get<string>('app.corsOrigin', '*');
  app.enableCors({
    origin:
      corsOrigin === '*' ? true : corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Code For Glory API')
    .setDescription('Backend API for the Code For Glory learning platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    'docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  const port = config.get<number>('app.port', 3000);
  await app.listen(port);

  console.log(`Server is running at: http://localhost:${port}`);
  console.log(`API docs available at: http://localhost:${port}/docs`);
}
void bootstrap();
