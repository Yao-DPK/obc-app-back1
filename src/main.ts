import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import multipart from '@fastify/multipart';
import { AppModule } from './app.module';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';

let cachedApp: NestFastifyApplication | null = null;

async function createApp() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  const frontendUrl = process.env.PUBLIC_APP_FRONT_BASE_URL;
  const allowedOrigins = frontendUrl ? [frontendUrl] : ['http://localhost:5173'];

  await app.register(fastifyCors, {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cookie'],
  });

  // Middleware OPTIONS (sécurité supplémentaire)
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', frontendUrl || 'https://obc-app-front1.vercel.app');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.status(200).send();
      return;
    }
    next();
  });

  app.setGlobalPrefix('api');

  app.getHttpAdapter().getInstance().addHook('preParsing', async (request, reply) => {
  if (request.method === 'OPTIONS') {
    reply.status(204).send(); // No Content
    return reply; // court-circuite le reste des hooks
  }
});

  await app.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET,
  });

  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 },
  });



  await app.init();
  return app;
}

// Export pour Vercel (serverless)
export default async function handler(req: any, res: any) {
  if (!cachedApp) {
    cachedApp = await createApp();
  }
  const instance = cachedApp.getHttpAdapter().getInstance();
  instance.server.emit('request', req, res);
}

// Lancement local
if (!process.env.VERCEL) {
  createApp().then(async (app) => {
    const port = process.env.PORT || 3031;
    await app.listen(port, '0.0.0.0');
    console.log(`Server running on http://localhost:${port}`);
  });
}