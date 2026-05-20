import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { db } from 'src/database/db';
import { auditLogs } from 'src/database/db';

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const originalSend = res.send;
    res.send = function (body) {
      // Ne logguer que certaines méthodes (POST, PUT, PATCH, DELETE)
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        const userId = (req as any).user?.sub || null;
        db.insert(auditLogs).values({
          userId,
          action: `${req.method} ${req.route?.path || req.url}`,
          oldValue: req.body ? JSON.stringify(req.body) : null,
          newValue: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null,
          ip: req.ip,
          userAgent: req.get('user-agent'),
        }).catch(err => console.error('Audit log failed', err));
      }
      return originalSend.call(this, body);
    };
    next();
  }
}