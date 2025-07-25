import { SetMetadata } from '@nestjs/common';
import { Role } from '../../types/enums';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);