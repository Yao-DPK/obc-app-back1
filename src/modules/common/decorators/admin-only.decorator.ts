// common/decorators/admin-only.decorator.ts
import { Roles } from './roles.decorator';
import { Role } from '../enums/role.enum';

export const AdminOnly = () => Roles(Role.Admin, Role.Super_Admin);