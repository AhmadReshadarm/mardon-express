import { AddressController } from './address/address.controller';
import { BasketController } from './basket/basket.controller';
import { CheckoutController } from './checkout/checkout.controller';
import { OrderProductController } from './orderProducts/orderProduct.controller';
import { PaymentController } from './payment/payment.controller';

const loadControllers = () => {
  return [OrderProductController, AddressController, BasketController, CheckoutController, PaymentController];
};

export default loadControllers;
