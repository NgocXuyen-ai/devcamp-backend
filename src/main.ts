import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix(config.get<string>('app.apiPrefix', 'api'));
  app.enableCors({ origin: config.get<string>('app.corsOrigin', '*') });

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
