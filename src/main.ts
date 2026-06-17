import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { db } from './database/db';
import fs from 'fs';


async function createApp() {
  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),{
      rawBody: true,
    }

  );
  
  
  app.use((req, res, next) => {
  console.log(`📥 Incoming ${req.method} ${req.url} from ${req.headers.origin}`);
  next();
});

  const allowedOrigins: any = [];
  if (process.env.ALLOWED_ORIGINS){
    const ALLOWED_ORIGINS_LIST = process.env.ALLOWED_ORIGINS.split(',');
    for (let idx=0; idx < ALLOWED_ORIGINS_LIST.length; idx++ ){
      const o = ALLOWED_ORIGINS_LIST[idx];
      allowedOrigins.push(o);
    }
  }

  if (process.env.FRONTEND_PLATFORM === 'VERCEL') {
    allowedOrigins.push(
      '/^https:\/\/obc-app-front1-.*-yao-dpks-projects\.vercel\.app$/',
    );
  }

  /* app.use(
    cors({
      origin: (origin, callback) => {
        if (
          !origin ||
          allowedOrigins.some(
            (validOrigin) =>
              validOrigin === origin || origin.match(validOrigin),
          )
        ) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cookie'],
    }),
  ); */

  app.use(
  cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cookie'],
  })
);

  app.use(cookieParser(process.env.COOKIE_SECRET));

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3031;
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });

  await app.init();
  return expressApp;
}
createApp();


