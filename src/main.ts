import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';

let cachedServer: any;

async function createApp() {
  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  const frontendUrl = process.env.PUBLIC_APP_FRONT_BASE_URL;
  const allowedOrigins = frontendUrl ? [frontendUrl] : ['http://localhost:5173'];

  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cookie'],
  }));

  app.use(cookieParser(process.env.COOKIE_SECRET));

  app.setGlobalPrefix('api');

  await app.init();
  return expressApp;
}

export default async function handler(req: any, res: any) {
  if (!cachedServer) {
    cachedServer = await createApp();
  }
  cachedServer(req, res);
}

if (!process.env.VERCEL) {
  createApp().then((app) => {
    const port = process.env.PORT || 3031;
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  });
}