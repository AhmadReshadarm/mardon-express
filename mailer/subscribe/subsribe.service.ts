import { singleton } from 'tsyringe';
import { DataSource, Equal, Repository } from 'typeorm';
import { Subscribe } from '../../core/entities';

@singleton()
export class SubsribeService {
  private subscribeRepository: Repository<Subscribe>;

  constructor(dataSource: DataSource) {
    this.subscribeRepository = dataSource.getRepository(Subscribe);
  }

  async getSubscribers() {
    return await this.subscribeRepository.find();
  }

  async createSubscribe(newSubscribe: Subscribe): Promise<Subscribe> {
    return this.subscribeRepository.save(newSubscribe);
  }
  // : Promise<Subscribe>
  async getSubscriberByEmail(email: string) {
    return await this.subscribeRepository.findOne({
      where: {
        email: Equal(email),
      },
    });
  }

  // user = await this.userRepository.findOne({
  //   where: {
  //     email: Equal(email),
  //   },
  // });

  async removeSubscribe(email: string): Promise<Subscribe> {
    const mail = await this.subscribeRepository.findOneOrFail({
      where: {
        email: Equal(email),
      },
    });

    return this.subscribeRepository.remove(mail);
  }
}
