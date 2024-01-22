import { Request, Response } from 'express';
import { singleton } from 'tsyringe';
import * as bcrypt from 'bcrypt';
import { HttpStatus } from '../../core/lib/http-status';
import { UserService } from '../services/user.service';
import { emailToken } from '../functions/email.token';
import { sendHelpDiskMail, sendMail, sendMailToken } from '../functions/send.mail';
import { emailConfirmationLimiter, sendTokenLimiter } from '../functions/rate.limit';
import { isAdmin, isUser, verifyToken, verifyUserId } from '../../core/middlewares';
import { Controller, Delete, Get, Middleware, Post, Put } from '../../core/decorators';
import { Role } from '../../core/enums/roles.enum';
import { validation } from '../../core/lib/validator';
import { User } from '../../core/entities';
import { changePasswordLimiter } from '../functions/rate.limit';
@singleton()
@Controller('/users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('')
  @Middleware([verifyToken, isAdmin])
  async getUsers(req: Request, resp: Response) {
    try {
      const users = await this.userService.getUsers(req.query);

      const result = users.rows.map(user => {
        const { password, ...other } = user;
        return other;
      });

      resp
        .json({
          rows: result,
          length: users.length,
        })
        .status(HttpStatus.OK);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong: ${error}` });
    }
  }

  @Get('inner/:id')
  async getUserById(req: Request, resp: Response) {
    const { secretKey } = req.body;

    if (secretKey !== process.env.INNER_AUTH_CALL_SECRET_KEY) {
      resp.status(HttpStatus.FORBIDDEN).json({ message: 'not authorized' });
      return;
    }
    const { id } = req.params;
    try {
      const user = await this.userService.getUser(id);
      const { password, ...others } = user;
      return resp.json(others);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong: ${error}` });
    }
  }
  // isUser, verifyUserId
  @Get('user/:id')
  @Middleware([verifyToken, isUser, verifyUserId])
  async getUser(req: Request, resp: Response) {
    const { jwt } = resp.locals;

    try {
      const userById = await this.userService.getUser(jwt.id);
      const { password, ...other } = userById;
      resp.status(HttpStatus.OK).json({ user: { ...other } });
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong: ${error}` });
    }
  }
  // sendTokenLimiter, emailConfirmationLimiter
  @Post('email-confirmation')
  @Middleware([verifyToken, isUser])
  async sendMailConfirmation(req: Request, resp: Response) {
    const { jwt } = resp.locals;
    const payload = {
      isVerified: false,
      id: jwt.id,
      firstName: jwt.firstName,
      lastName: jwt.lastName,
      email: jwt.email,
      role: jwt.role !== Role.Admin ? Role.User : Role.Admin,
    };

    try {
      const token = emailToken(payload);
      sendMailToken({
        userName: payload.email,
        confirmationURL: `https://nbhoz.ru/profile/verify/${token}`,
        email: payload.email,
      });
      resp.status(HttpStatus.OK).json(payload);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(`server error :${error}`);
    }
  }

  @Get('get-by-email/:email')
  @Middleware([verifyToken, isAdmin])
  async getUserByEmail(req: Request, resp: Response) {
    const { email } = req.params;
    try {
      const user = await this.userService.getByEmail(email);

      if (!user) {
        resp.status(HttpStatus.NOT_FOUND).json({ message: 'User not fount' });
        return;
      }
      const { password, ...others } = user;
      resp.status(HttpStatus.OK).json(others);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong: ${error}` });
    }
  }

  @Post('')
  @Middleware([verifyToken, isAdmin])
  async createUser(req: Request, resp: Response) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPass = await bcrypt.hash(req.body.password, salt);
      const { firstName, lastName, email, role, image } = req.body;
      const payload = {
        id: '',
        firstName: firstName,
        lastName: lastName,
        email: email,
        isVerified: true,
        password: hashedPass,
        role: role,
        image: image ?? '',
      };
      const newUser = await validation(new User(payload));
      const created = await this.userService.createUser(newUser);
      const { id } = created;

      resp.status(HttpStatus.CREATED).json({ id });
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Put('user/:id')
  @Middleware([verifyToken, isUser, verifyUserId])
  async updateUser(req: Request, resp: Response) {
    const { id } = req.params;
    const { email, firstName, lastName, image } = req.body;
    const { jwt } = resp.locals;

    try {
      const user = await this.userService.getUser(id);
      if (email === user.email) {
        resp.status(HttpStatus.CONFLICT).json({ message: "can't change the email" });
        return;
      }

      if (email) {
        const { password, ...others } = user;
        const token = emailToken(others);
        const payload = {
          email: user.email,
          userName: user.firstName,
          token: token,
        };
        sendMailToken(payload);
      }
      const updated = await this.userService.updateUser(id, {
        id: user.id,
        firstName: firstName ?? user.firstName,
        lastName: lastName ?? user.lastName,
        email: email ?? user.email,
        password: user.password,
        isVerified: user.isVerified ? (email ? false : true) : false,
        role: jwt.role !== Role.Admin ? Role.User : Role.Admin,
        image: image ?? user.image,
      });
      const { password, ...others } = updated;
      resp.status(HttpStatus.OK).json({ user: { ...others } });
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong: ${error}` });
    }
  }

  @Put('changepsw/:id')
  @Middleware([verifyToken, isUser, verifyUserId, changePasswordLimiter])
  async changePassword(req: Request, resp: Response) {
    const { id } = req.params;
    const { password, oldPassword } = req.body;
    const { jwt } = resp.locals;
    if (password === oldPassword) {
      resp.status(HttpStatus.CONFLICT).json({ message: 'Can not use the same password as previous' });
      return;
    }
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPass = await bcrypt.hash(password, salt);
      const user = await this.userService.getUser(id);
      const validatedOldPsw = await bcrypt.compare(oldPassword, user.password);
      if (!validatedOldPsw) {
        resp.status(HttpStatus.UNAUTHORIZED).json({ message: 'Old password did not match' });
        return;
      }
      const validated = await bcrypt.compare(password, user.password);
      if (validated) {
        resp.status(HttpStatus.CONFLICT).json({ message: 'Can not use the same password as previous' });
        return;
      }

      const payload = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: hashedPass,
        isVerified: user.isVerified ? true : false,
        role: jwt.role !== Role.Admin ? Role.User : Role.Admin,
        image: user.image,
      };

      await this.userService.updateUser(id, payload);
      resp.status(HttpStatus.OK).json({ message: 'password changed' });
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: `somthing went wrong: ${error}` });
    }
  }

  @Post('help')
  async helpUser(req: Request, resp: Response) {
    const { email, text } = req.body;
    try {
      const admins = await this.userService.getUsers({ role: Role.Admin });
      admins.rows.map(admin => {
        sendHelpDiskMail(email, admin.email, text);
      });
      resp.send(HttpStatus.OK);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Delete('user/:id')
  @Middleware([verifyToken, isAdmin])
  async removeUser(req: Request, resp: Response) {
    const { id } = req.params;
    try {
      const removed = await this.userService.removeUser(id);

      resp.status(HttpStatus.OK).json(removed);
    } catch (error) {
      resp.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }
}
