import { SubscribeController } from "./subscribe/subscribe.controller";
import { MailingController } from './mailing/mailing.controller';


const loadControllers = () => {
  return [
    SubscribeController,
    MailingController
  ];
}

export default loadControllers;
