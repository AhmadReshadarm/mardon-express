import { AuthController } from './controllers/auth.controller';
import { UserController } from './controllers/user.controller';

const loadControllers = () => {
  return [AuthController, UserController];
};

export default loadControllers;
