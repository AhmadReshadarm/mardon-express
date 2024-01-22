import { singleton } from 'tsyringe';
import { DataSource, Equal, Repository } from 'typeorm';
import { Mailing, Subscribe } from '../../core/entities';
import { validation } from '../../core/lib/validator';
import { createTransport, Transporter } from 'nodemailer';
import { MAIL_FROM, transportConfig } from './config';
import { MailOptionsDTO } from '../mailer.dtos';
import { CustomExternalError } from '../../core/domain/error/custom.external.error';
import { ErrorCode } from '../../core/domain/error/error.code';
import { HttpStatus } from '../../core/lib/http-status';
import { CustomInternalError } from '../../core/domain/error/custom.internal.error';

@singleton()
export class MailingService {
  private mailingRepository: Repository<Mailing>;
  private smptTransporter: Transporter;

  constructor(dataSource: DataSource) {
    this.mailingRepository = dataSource.getRepository(Mailing);
    this.smptTransporter = createTransport(transportConfig);
  }

  async getMailings(): Promise<Mailing[]> {
    return this.mailingRepository.find();
  }

  async getMailing(id: string): Promise<Mailing> {
    const mailing = await this.mailingRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    return mailing;
  }

  async createMailing(mailingDTO: Mailing): Promise<Mailing> {
    const newMailing = await validation(new Mailing(mailingDTO));

    return this.mailingRepository.save(newMailing);
  }

  async updateMailing(id: string, mailingDTO: Mailing) {
    const mailing = await this.mailingRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    return this.mailingRepository.save({
      ...mailing,
      ...mailingDTO,
    });
  }

  async removeMailing(id: string) {
    const mailing = await this.mailingRepository.findOneOrFail({
      where: {
        id: Equal(id),
      },
    });

    return this.mailingRepository.remove(mailing);
  }

  async sendMail(options: MailOptionsDTO) {
    this.validateMailOptions(options);

    let result: any;
    await this.smptTransporter.sendMail(
      {
        ...options,
        from: MAIL_FROM,
      },
      (err, info) => {
        if (err) {
          result = {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            response: {
              message: `Mail was unsuccessfull to be sent to ${options.to}, ${err}`,
            },
          };
        }
        result = {
          status: HttpStatus.OK,
          response: {
            message: `Mail was successfull to be sent to ${options.to}`,
          },
        };
      },
    );

    // if (result.response === '250 2.0.0 Ok: queued') {
    //   return {
    //     status: HttpStatus.OK,
    //     response: {
    //       message: `Mail was successfully sent to ${options.to}`,
    //     },
    //   };
    // }
    return result;
  }

  async sendToAllSubscribers(mailingId: string, subscribers: Subscribe[]) {
    const mailing = await this.getMailing(mailingId);
    let counter: number = 0;

    try {
      for (let subscriber of subscribers) {
        const res = await this.sendMail({
          to: subscriber.email,
          subject: mailing.subject,
          html: mailing.html,
        });

        counter += res?.status === HttpStatus.OK ? 1 : 0;
      }

      return {
        status: HttpStatus.OK,
        response: {
          message: `Mails was successfully sent to subscribers`,
          mailsSent: counter,
        },
      };
    } catch (e: any) {
      if (counter !== 0) {
        return {
          status: HttpStatus.PARTIAL_CONTENT,
          response: {
            message: 'Mails was sent partial',
            mailsSent: counter,
          },
        };
      } else {
        throw new CustomInternalError(e.message);
      }
    }
  }

  async sendToSelectedSubscribers(mailingId: string, subscribers: Subscribe[]) {
    const mailing = await this.getMailing(mailingId);
    let counter: number = 0;

    try {
      for (let subscriber of subscribers) {
        const res = await this.sendMail({
          to: subscriber.email,
          subject: mailing.subject,
          html: mailing.html,
        });

        counter += res?.status === HttpStatus.OK ? 1 : 0;
      }

      return {
        status: HttpStatus.OK,
        response: {
          message: `Mails was successfully sent to subscribers`,
          mailsSent: counter,
        },
      };
    } catch (e: any) {
      if (counter !== 0) {
        return {
          status: HttpStatus.PARTIAL_CONTENT,
          response: {
            message: 'Mails was sent partial',
            mailsSent: counter,
          },
        };
      } else {
        throw new CustomInternalError(e.message);
      }
    }
  }

  validateMailOptions(options: MailOptionsDTO) {
    if (!options.to || !options.html || !options.subject) {
      throw new CustomExternalError([ErrorCode.MAIL_OPTIONS], HttpStatus.BAD_REQUEST);
    }
  }
}
