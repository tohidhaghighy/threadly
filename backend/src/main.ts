import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./modules/app/app.module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  mkdirSync(join(process.cwd(), "uploads"), { recursive: true });

  const app = await NestFactory.create(AppModule, { cors: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Threadly API")
    .setDescription("Threadly backend API (NestJS + TypeORM + SQL Server + JWT).")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();
  const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, swaggerDoc);

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3001);
}

void bootstrap();

