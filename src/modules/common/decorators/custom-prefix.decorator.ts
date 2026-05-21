import { applyDecorators, Controller } from '@nestjs/common';

export function ApiController(prefix: string) {
  return applyDecorators(Controller(`api/${prefix}`));
}