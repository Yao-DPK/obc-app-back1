// common/decorators/admin-only.decorator.ts
import { Roles } from './roles.decorator';
import { Role } from '../enums/role.enum';

export const AllRoles = () => Roles(Role.Parent, Role.Player, Role.Admin, Role.Super_Admin);