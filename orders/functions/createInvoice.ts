import { Basket, OrderProduct } from 'core/entities';
import { PaymentMethod } from '../../core/enums/payment-method.enum';
import { BasketDTO } from 'orders/order.dtos';

interface templetDTO {
  receiverName?: string;
  receiverPhone?: string;
  receiverEmail?: string;
  address?: string;
  roomOrOffice?: string;
  door?: string;
  floor?: string;
  rignBell?: string;
  zipCode?: string;
  comment?: string;
  cart: Basket | null;
}

// const getTotalPrice = (cart: any) => {
//   const totalAmount = cart?.orderProducts?.reduce((accum: any, item: any) => {
//     return accum + Number(item.qty) * Number(item.productVariant?.price);
//   }, 0)!;

//   return totalAmount;
// };

const getTotalPrice = (cart: BasketDTO | any, selectedMethod: number) => {
  const totalAmount = cart?.orderProducts?.reduce((accum: any, item: any) => {
    return accum + Number(item.qty) * Number(item.productVariant?.price);
  }, 0)!;

  // return totalAmount;
  switch (selectedMethod) {
    case PaymentMethod.Cash:
      return totalAmount;
    case PaymentMethod.NoCash:
      return totalAmount + (totalAmount * 5) / 100;
    case PaymentMethod.BankTransfer:
      return totalAmount + (totalAmount * 12) / 100;
    default:
      return totalAmount;
  }
};

const calculateIndvidualProductTotal = (selectedMethod: number, productPrice: number, qty: number) => {
  switch (selectedMethod) {
    case PaymentMethod.Cash:
      return productPrice * qty;
    case PaymentMethod.NoCash:
      return (productPrice + (productPrice * 5) / 100) * qty;
    case PaymentMethod.BankTransfer:
      return (productPrice + (productPrice * 12) / 100) * qty;
    default:
      return productPrice * qty;
  }
};

const calculateIndvidualPercent = (selectedMethod: number, productPrice: number) => {
  switch (selectedMethod) {
    case PaymentMethod.Cash:
      return productPrice;
    case PaymentMethod.NoCash:
      return (productPrice * 5) / 100 + productPrice;
    case PaymentMethod.BankTransfer:
      return (productPrice * 12) / 100 + productPrice;
    default:
      return productPrice;
  }
};

const generateUpdateInoviceTemplet = (payload: any) => {
  return `
      <div>
        <h1>Статус заказа был изменен на ${payload.status}</h1>
      </div>
      <div>
        <span>Здравствуйте ${payload.receiverName},</span>
      </div>
      <div>
        <span>Статус вашего заказа был изменен на ${payload.status}</span>
      </div>
      <div>
        <span>Вы также можете проверить статус вашего заказа здесь. <a href="https://nbhoz.ru/orders">NBHOZ > Мои заказы</a></span>
      </div>
  `;
};

const generateInvoiceTemplet = (payload: templetDTO, cidImageMap: Record<string, string>, paymentOption: number) => {
  return `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Форма заказа | site name</title>
    </head>
    <body>
      <div  style="width: 90%; padding: 40px;">
        <div>
          <h1>Данные получателя</h1>
        </div>
        <div><span>Имя и фамилия: </span> <span>${payload.receiverName}</span></div>
        <div><span>Телефон: </span> <span>${payload.receiverPhone}</span></div>
        <div><span>Ад. эл.: </span> <span>${payload.receiverEmail}</span></div>
        <div>
          <h1>Адрес доставки</h1>
        </div>
        <div>
          <span>Адрес: </span> <span>${payload.address}</span>
        </div>

        <div>
          <h1>Заказ покупателя</h1>
        </div>
        ${payload.cart?.orderProducts
          ?.map((orderproduct: any) => {
            const productImageCid = `productImage_${orderproduct.productVariant?.artical}`;
            cidImageMap[productImageCid] = productImageCid;
            return `<div class="product-wrapper" style="width: 150px; margin: 1%; float: left;">
              <div>
                <a href="https://nbhoz.ru/product/${orderproduct.product?.url}">
                <img
                  src="cid:${productImageCid}"
                  alt="${orderproduct.product?.name}"
                  style="width: 100%; height: 150px; min-height: 150px; border: 1px solid gray; border-radius: 20px;"
                />
                </a>
                <a href="https://nbhoz.ru/product/${orderproduct.product?.url}">
                <h4 class="product-title">${orderproduct.product?.name?.split('(')[0]} ${
              orderproduct?.productVariant?.artical!.includes('|')
                ? orderproduct?.productVariant?.artical!.split('|')[0].toUpperCase()
                : orderproduct?.productVariant?.artical!.toUpperCase()
            }</h4>
                </a>
                <div class="product-details">
                  <span>${orderproduct!.qty} шт</span>
                  <span>*</span>
                  <span>${calculateIndvidualPercent(paymentOption, orderproduct.productVariant?.price!)}₽</span>
                  <span>=</span>
                  <span>${calculateIndvidualProductTotal(
                    paymentOption,
                    orderproduct.productVariant?.price!,
                    orderproduct.qty!,
                  )}₽</span>
                </div>
                <div class="product-artical">
                  <span>Артикул:</span>
                  <span>${orderproduct.productVariant?.artical}</span>
                </div>
              </div>
            </div>
            `;
          })
          .join('')}


        <div style="clear: both; padding: 30px 0 30px 0;">
          <span>
            <h1>Итого:</h1>
          </span>
          <h2>${getTotalPrice(payload.cart, paymentOption)}₽</h2>
        </div>
        <div class="comment-title-wrapper">
          <h1>Комментарий</h1>
        </div>
        <div class="comment-wrapper">
          <span>${payload.comment}</span>
        </div>
      </div>
    </body>
    </html>
  `;
};

export { generateInvoiceTemplet, generateUpdateInoviceTemplet };
