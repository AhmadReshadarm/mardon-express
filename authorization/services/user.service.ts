import { singleton } from 'tsyringe';
import { DataSource, Equal, Repository } from 'typeorm';
import { User } from '../../core/entities';
import { Role } from '../../core/enums/roles.enum';
import { UserQueryDTO } from '../auth.dtos';
import { PaginationDTO } from '../../core/lib/dto';
import axios from 'axios';
@singleton()
export class UserService {
  private userRepository: Repository<User>;

  constructor(appDataSource: DataSource) {
    this.userRepository = appDataSource.getRepository(User);
  }

  async getUsers(queryParams: UserQueryDTO): Promise<PaginationDTO<User>> {
    const {
      firstName,
      lastName,
      email,
      isVerified,
      role,
      createdFrom,
      createdTo,
      sortBy = 'email',
      orderBy = 'DESC',
      offset = 0,
      limit = 10,
    } = queryParams;

    const queryBuilder = await this.userRepository.createQueryBuilder('user');

    if (firstName) {
      queryBuilder.andWhere('user.firstName LIKE :firstName', { firstName: `%${firstName}%` });
    }
    if (lastName) {
      queryBuilder.andWhere('user.lastName LIKE :lastName', { lastName: `%${lastName}%` });
    }
    if (email) {
      queryBuilder.andWhere('user.email LIKE :email', { email: `%${email}%` });
    }
    if (isVerified) {
      queryBuilder.andWhere('user.isVerified = :isVerified', { isVerified: isVerified });
    }
    if (role) {
      queryBuilder.andWhere('user.role = :role', { role: role });
    }
    if (createdFrom) {
      queryBuilder.andWhere('user.createdAt >= :dateFrom', { dateFrom: createdFrom });
    }
    if (createdTo) {
      queryBuilder.andWhere('user.createdAt <= :dateTo', { dateTo: createdTo });
    }

    const users = queryBuilder.orderBy(`user.${sortBy}`, orderBy).skip(offset).take(limit);

    return {
      rows: await users.getMany(),
      length: await users.getCount(),
    };
  }

  async getUser(id: string): Promise<User> {
    const user = await this.userRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    return user;
  }

  async getAdmin(): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: {
        role: Equal(Role.Admin),
      },
    });

    return user;
  }

  async getByEmail(email: string) {
    const user = await this.userRepository.findOne({
      where: {
        email: Equal(email),
      },
    });

    return user;
  }

  async createUser(newUser: User): Promise<User> {
    return this.userRepository.save(newUser);
  }

  async updateUser(id: string, userDTO: User) {
    const user = await this.userRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    const newUser = {
      ...user,
      ...userDTO,
    };
    newUser.isVerified = newUser.isVerified ?? user.isVerified;
    newUser.role = newUser.role ?? user.role;

    return this.userRepository.save(newUser);
  }

  async removeUser(id: string) {
    const user = await this.userRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    return this.userRepository.remove(user);
  }
  async subscribeToNewsletter(name: string, email: string): Promise<any> {
    try {
      await axios.post(`${process.env.MAILER_DB}/subscribes`, { name: name, email: email });
    } catch (e: any) {
      console.log(e);
    }
  }
}
