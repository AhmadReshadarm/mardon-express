import { Role } from '../enums/roles.enum';
const unAuthorized = (role: string, jwtId: string, userId: string) => {
  return jwtId !== userId && role !== Role.Admin;
};

const scope = (jwtId: string, userId: string) => {
  return jwtId !== userId;
};

export { unAuthorized, scope };
