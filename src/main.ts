import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import multipart from '@fastify/multipart';
import { AppModule } from './app.module';
import fastifyCookie from "@fastify/cookie"
import fastifyCors from '@fastify/cors';



async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  const frontendUrl = process.env.PUBLIC_APP_FRONT_BASE_URL;
  const port = process.env.PORT || 3031;
  const allowedOrigins = frontendUrl ? [frontendUrl] : ['http://localhost:5173'];

  /* app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  } ); */

  // ✅ Register @fastify/cors explicitly
  await app.register(fastifyCors, {
    origin: process.env.PUBLIC_APP_FRONT_BASE_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cookie'],
  });

  app.setGlobalPrefix('api')


  await app.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET
  })

  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB
    },
  });
  

  await app.listen(port, '0.0.0.0');
}

bootstrap();