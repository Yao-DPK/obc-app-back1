import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import multipart from '@fastify/multipart';
import { AppModule } from './app.module';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';

let cachedApp: NestFastifyApplication | null = null;

async function createApp() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  const fastify = app.getHttpAdapter().getInstance();

  // 🔥 Intercepter OPTIONS avant tout (y compris avant CORS et multipart)
  fastify.addHook('onRequest', (request, reply, done) => {
    if (request.method === 'OPTIONS') {
      reply.status(204).send();
      return;
    }
    done();
  });

  const frontendUrl = process.env.PUBLIC_APP_FRONT_BASE_URL;
  const allowedOrigins = frontendUrl ? [frontendUrl] : ['http://localhost:5173'];

  await app.register(fastifyCors, {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cookie'],
  });

  app.setGlobalPrefix('api');

  await app.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET,
  });

  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  await app.init();
  return app;
}

export default async function handler(req: any, res: any) {
  if (!cachedApp) {
    cachedApp = await createApp();
  }
  const instance = cachedApp.getHttpAdapter().getInstance();
  instance.server.emit('request', req, res);
}

if (!process.env.VERCEL) {
  createApp().then(async (app) => {
    const port = process.env.PORT || 3031;
    await app.listen(port, '0.0.0.0');
    console.log(`Server running on http://localhost:${port}`);
  });
}