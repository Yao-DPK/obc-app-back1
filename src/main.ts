/* import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';

async function createApp() {
  const expressApp = express();
  const port = process.env.PORT || 3031;

  // 🚀 CRITICAL FIX: Bind the port IMMEDIATELY (synchronous call).
  // This happens within milliseconds, satisfying Hostinger's 3-second rule.
  const server = expressApp.listen(port, () => {
    console.log(`🔌 Server binding to port ${port} (NestJS is still initializing...)`);
  });


  // --- NOW do the heavy async work (this might take 4-6 seconds) ---
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    { rawBody: true },
  );

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`📥 Incoming ${req.method} ${req.url} from ${req.headers.origin}`);
    next();
  });

  // CORS Configuration
  const allowedOrigins: any = [];
  if (process.env.ALLOWED_ORIGINS) {
    const ALLOWED_ORIGINS_LIST = process.env.ALLOWED_ORIGINS.split(',');
    for (let idx = 0; idx < ALLOWED_ORIGINS_LIST.length; idx++) {
      const o = ALLOWED_ORIGINS_LIST[idx];
      allowedOrigins.push(o);
    }
  }

  if (process.env.FRONTEND_PLATFORM === 'VERCEL') {
    allowedOrigins.push(
      '/^https:\/\/obc-app-front1-.*-yao-dpks-projects\.vercel\.app$/',
    );
  }

  console.log(`allowed Orgins: ${allowedOrigins}`);

  app.use(
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
  );

  app.use(cookieParser(process.env.COOKIE_SECRET));
  app.setGlobalPrefix('api');

  // 🧹 IMPORTANT: Remove the old 'app.listen()' call from here to avoid EADDRINUSE (port already bound).
  // Also remove 'await app.init()' - NestFactory.create() already initializes the app.

  console.log('✅ NestJS fully initialized. Ready to handle requests.');
  return expressApp;
}

// Start the app
createApp(); */

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
    new ExpressAdapter(expressApp),{
      rawBody: true,
    }

  );
  
  const port = process.env.PORT || 3031;
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });

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

  app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.status(204).send();
  }
  next();
});

  app.use(
    cors({
      origin: '*'/* (origin, callback) => {
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
      } */,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cookie'],
    }),
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser(process.env.COOKIE_SECRET));

  app.setGlobalPrefix('api');
  console.log(`allowed Orgins: ${allowedOrigins}`);


  

  await app.init();
  return expressApp;
}
createApp();