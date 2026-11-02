import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

// common/guards/service-token.guard.ts
@Injectable()
export class ServiceTokenGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = req.headers['x-service-token'];
    return token === this.config.get('SERVICE_TOKEN');
  }
}