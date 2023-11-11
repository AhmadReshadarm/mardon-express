import { Role } from '../core/enums/roles.enum';

export interface UserQueryDTO {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly email?: string;
  readonly isVerified?: boolean;
  readonly role?: Role;
  readonly createdFrom?: string;
  readonly createdTo?: string;
  readonly sortBy?: string;
  readonly orderBy?: 'DESC' | 'ASC';
  readonly limit?: number;
  readonly offset?: number;
}
