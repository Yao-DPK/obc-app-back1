import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';



async function createApp() {
  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  const frontendUrl = process.env.PUBLIC_APP_FRONT_BASE_URL;
  const allowedOrigins: any = [];
  if (frontendUrl) frontendUrl ? [frontendUrl] : ['http://localhost:5173'];

  if (process.env.NODE_ENV === 'production'){
    allowedOrigins.push(process.env.FRONTEND_PRODUCTION_URL!);
  }

  if (process.env.VERCEL_ENV === 'preview'){
    allowedOrigins.push(/^https:\/\/obc-app-front1-.*-yao-dpks-projects\.vercel\.app$/)
  }

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some(validOrigin => validOrigin === origin || origin.match(validOrigin))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cookie'],
  }));


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