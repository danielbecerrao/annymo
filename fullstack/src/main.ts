import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app: INestApplication = await NestFactory.create(AppModule);
  const rawPort: string | undefined = process.env.PORT;
  const parsedPort: number = rawPort ? Number.parseInt(rawPort, 10) : 3000;
  const port: number = Number.isNaN(parsedPort) ? 3000 : parsedPort;

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port);
}

void bootstrap();
