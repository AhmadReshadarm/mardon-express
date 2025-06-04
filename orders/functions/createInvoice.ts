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

// const generateInvoiceTemplet = (payload: templetDTO, cidImageMap: Record<string, string>, paymentOption: number) => {
//   return `
//     <!DOCTYPE html>
//     <html lang="ru">
//     <head>
//       <meta charset="UTF-8" />
//       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//       <title>Форма заказа | site name</title>
//     </head>
//     <body>
//       <div  style="width: 90%; padding: 40px;">
//         <div>
//           <h1>Данные получателя</h1>
//         </div>
//         <div><span>Имя и фамилия: </span> <span>${payload.receiverName}</span></div>
//         <div><span>Телефон: </span> <span>${payload.receiverPhone}</span></div>
//         <div><span>Ад. эл.: </span> <span>${payload.receiverEmail}</span></div>
//         <div>
//           <h1>Адрес доставки</h1>
//         </div>
//         <div>
//           <span>Адрес: </span> <span>${payload.address}</span>
//         </div>

//         <div>
//           <h1>Заказ покупателя</h1>
//         </div>
//         ${payload.cart?.orderProducts
//           ?.map((orderproduct: any) => {
//             const productImageCid = `productImage_${orderproduct.productVariant?.artical}`;
//             cidImageMap[productImageCid] = productImageCid;
//             return `<div class="product-wrapper" style="width: 150px; margin: 1%; float: left;">
//               <div>
//                 <a href="https://nbhoz.ru/product/${orderproduct.product?.url}">
//                 <img
//                   src="cid:${productImageCid}"
//                   alt="${orderproduct.product?.name}"
//                   style="width: 100%; height: 150px; min-height: 150px; border: 1px solid gray; border-radius: 20px;"
//                 />
//                 </a>
//                 <a href="https://nbhoz.ru/product/${orderproduct.product?.url}">
//                 <h4 class="product-title">${orderproduct.product?.name?.split('(')[0]} ${
//               orderproduct?.productVariant?.artical!.includes('|')
//                 ? orderproduct?.productVariant?.artical!.split('|')[0].toUpperCase()
//                 : orderproduct?.productVariant?.artical!.toUpperCase()
//             }</h4>
//                 </a>
//                 <div class="product-details">
//                   <span>${orderproduct!.qty} шт</span>
//                   <span>*</span>
//                   <span>${calculateIndvidualPercent(paymentOption, orderproduct.productVariant?.price!)}₽</span>
//                   <span>=</span>
//                   <span>${calculateIndvidualProductTotal(
//                     paymentOption,
//                     orderproduct.productVariant?.price!,
//                     orderproduct.qty!,
//                   )}₽</span>
//                 </div>
//                 <div class="product-artical">
//                   <span>Артикул:</span>
//                   <span>${orderproduct.productVariant?.artical}</span>
//                 </div>
//               </div>
//             </div>
//             `;
//           })
//           .join('')}

//         <div style="clear: both; padding: 30px 0 30px 0;">
//           <span>
//             <h1>Итого:</h1>
//           </span>
//           <h2>${getTotalPrice(payload.cart, paymentOption)}₽</h2>
//         </div>
//         <div class="comment-title-wrapper">
//           <h1>Комментарий</h1>
//         </div>
//         <div class="comment-wrapper">
//           <span>${payload.comment}</span>
//         </div>
//       </div>
//     </body>
//     </html>
//   `;
// };

const generateInvoiceTemplet = (payload: templetDTO, cidImageMap: Record<string, string>, paymentOption: number) => {
  const paymentMethod = ['Наличные +0%', 'По безналичному расчету +5%', 'Расчётный счёт +12%'];
  return `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Заказ ${payload.receiverName} | NBHOZ</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <!-- Main container -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eee8dc">
        <tr>
          <td align="center" style="padding: 30px 0;">
            <!-- Content container -->
            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="border-collapse: collapse; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr style="background-color:#eee8dc; height:100px;">
                <td align="center" style="padding: 20px; border-bottom: 1px solid #eeeeee;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="50%" align="left" style="font-size: 24px; font-weight: bold; color: #000000;">NBHOZ</td>
                      <td width="50%" align="right" style="font-size: 20px; color: #000000;">Счет-фактура</td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Customer Info -->
              <tr>
                <td style="padding: 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td colspan="2" style="font-size: 18px; font-weight: bold; padding-bottom: 10px; border-bottom: 2px solid #0000004a; margin-bottom: 15px;">
                        Данные получателя
                      </td>
                    </tr>
                    <tr>
                      <td width="30%" style="padding: 5px 0; font-weight: bold; color: #7f8c8d;">Имя и фамилия:</td>
                      <td width="70%" style="padding: 5px 0;">${payload.receiverName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; font-weight: bold; color: #7f8c8d;">Телефон:</td>
                      <td style="padding: 5px 0;">${payload.receiverPhone}</td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; font-weight: bold; color: #7f8c8d;">Эл. почта:</td>
                      <td style="padding: 5px 0;">${payload.receiverEmail}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Delivery Address -->
              <tr>
                <td style="padding: 0 20px 20px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td colspan="2" style="font-size: 18px; font-weight: bold; padding-bottom: 10px; border-bottom: 2px solid #0000004a; margin-bottom: 15px;">
                        Адрес доставки
                      </td>
                    </tr>
                    <tr>
                      <td width="30%" style="padding: 5px 0; font-weight: bold; color: #7f8c8d;">Адрес:</td>
                      <td width="70%" style="padding: 5px 0;">${payload.address}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Order Items -->
              <tr>
                <td style="padding: 0 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="font-size: 18px; font-weight: bold; padding-bottom: 10px; border-bottom: 2px solid #0000004a;">
                        Детали заказа
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              ${payload.cart?.orderProducts
                ?.map((orderproduct: any) => {
                  const productImageCid = `productImage_${orderproduct.productVariant?.artical}`;
                  cidImageMap[productImageCid] = productImageCid;

                  return `
                  <tr>
                    <td style="padding: 10px;">
                      <table style="padding: 10px; border: 1px solid #0000004a; border-radius: 15px;" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td width="120" valign="top" style="padding-right: 15px;">
                            <a href="https://nbhoz.ru/product/${orderproduct.product?.url}">
                              <img 
                                src="cid:${productImageCid}" 
                                alt="${orderproduct.product?.name}" 
                                style="display: block; width: 120px; height: 120px; border: 1px solid #00000014; border-radius: 10px;"
                              />
                            </a>
                          </td>
                          <td valign="top">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td style="padding-bottom: 5px;">
                                  <a href="https://nbhoz.ru/product/${
                                    orderproduct.product?.url
                                  }" style="color: #000000; text-decoration: none; font-weight: bold; font-size: 16px;">
                                    ${orderproduct.product?.name?.split('(')[0]} 
                                    ${
                                      orderproduct?.productVariant?.artical?.includes('|')
                                        ? orderproduct?.productVariant?.artical?.split('|')[0].toUpperCase()
                                        : orderproduct?.productVariant?.artical?.toUpperCase()
                                    }
                                  </a>
                                </td>
                              </tr>
                              <tr>
                                <td style="font-size: 14px; color: #7f8c8d; padding-bottom: 10px;">
                                  Артикул: ${orderproduct.productVariant?.artical?.toUpperCase()}
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                      <td style="font-size: 14px;">
                                        ${orderproduct!.qty} × ${calculateIndvidualPercent(
                    paymentOption,
                    orderproduct.productVariant?.price!,
                  )}₽
                                      </td>
                                      <td align="right" style="font-weight: bold; color: #27ae60; font-size: 16px;">
                                        ${calculateIndvidualProductTotal(
                                          paymentOption,
                                          orderproduct.productVariant?.price!,
                                          orderproduct.qty!,
                                        )}₽
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  `;
                })
                .join('')}
              
              <!-- Order Total -->
              <tr>
                <td style="padding: 20px; background-color: #f8f9fa;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="70%" align="right" style="padding: 5px 0; font-weight: bold; font-size: 16px;">Общая сумма заказа:</td>
                      <td width="30%" align="right" style="padding: 5px 0; font-weight: bold; font-size: 24px; color: #e74c3c;">
                        ${getTotalPrice(payload.cart, paymentOption)}₽
                      </td>
                    </tr>
                    <tr>
                      <td align="right" style="padding: 5px 0; color: #7f8c8d;">Способ оплаты:</td>
                      <td align="right" style="padding: 5px 0; font-weight: bold; white-space: nowrap; padding-left:10px;">${
                        paymentMethod[paymentOption]
                      }</td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Order Comment -->
              ${
                payload.comment
                  ? `
              <tr>
                <td style="padding: 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="font-size: 18px; font-weight: bold; padding-bottom: 10px; border-bottom: 2px solid #3498db;">
                        Комментарий к заказу
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top: 15px;">
                        ${payload.comment}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              `
                  : ''
              }
              
              <!-- Footer -->
              <tr>
                <td style="padding: 20px; background-color: #eee8dc; color: #000000;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="padding: 10px 0; font-size: 14px;">
                        Спасибо за ваш заказ!
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding: 5px 0; font-size: 12px;">
                        Телефон поддержки: +7 925-486-54-44 | Email: info@nbhoz.ru
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding: 5px 0; font-size: 12px;">
                        © ${new Date().getFullYear()} NBHOZ. Все права защищены.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export { generateInvoiceTemplet, generateUpdateInoviceTemplet };
