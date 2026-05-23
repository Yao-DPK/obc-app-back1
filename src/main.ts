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
  const allowedOrigins = frontendUrl ? [frontendUrl, 'https://obc-app-front1.vercel.app', 'https://obc-app-front1-aqbm9bvoz-yao-dpks-projects.vercel.app'] : ['http://localhost:5173', 'https://obc-app-front1-aqbm9bvoz-yao-dpks-projects.vercel.app'];

  /* app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cookie'],
  })); */

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