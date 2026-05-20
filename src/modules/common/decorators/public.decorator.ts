import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

