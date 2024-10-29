import { Basket, OrderProduct } from 'core/entities';

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

const getTotalPrice = (cart: any) => {
  const totalAmount = cart?.orderProducts?.reduce((accum: any, item: any) => {
    return accum + Number(item.qty) * Number(item.productVariant?.price);
  }, 0)!;

  return totalAmount;
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

// const generateInvoiceTemplet = (payload: templetDTO) => {
//   return `  <div>
//         <h1>Данные получателя</h1>
//       </div>
//       <div>
//         <span>Имя и фамилия: </span> <span>${payload.receiverName}</span>
//       </div>
//       <div>
//         <span>Телефон: </span> <span>${payload.receiverPhone}</span>
//       </div>
//       <div>
//         <span>Ад. эл.: </span> <span>${payload.receiverEmail}</span>
//       </div>
//       <div>
//         <h1>Адрес доставки</h1>
//       </div>
//       <div>
//         <span>Адрес: </span> <span>${payload.address}</span>
//       </div>

//       <div>
//         <h1>Заказ покупателя</h1>
//       </div>
//       ${payload.cart?.orderProducts?.map(
//         (product: any) =>
//           ` <div>
//             <span>${product.product?.name}</span>
//             <span>${product!.qty} шт</span>
//             <span>*</span>
//             <span>${product.productVariant?.price}₽</span>
//             <span>=</span>
//             <span>${product.productVariant?.price! * product.qty!}₽</span>
//           </div>
//           <div>
//             <span>Цвет:</span>
//             <span>${product.productVariant?.color?.name}</span>
//           </div>
//           <div>
//            <span>Артикул:</span>
//             <span>${product.productVariant?.artical}</span>
//           </div>
//        `,
//       )}
//       <div>
//         <span>
//           <h3>Итого:</h3>
//         </span>
//         <span>${getTotalPrice(payload.cart)}₽</span>
//       </div>
//       <div>
//         <h1>Комментарий</h1>
//       </div>
//        <div>
//          <span>${payload.comment}</span>
//       </div>
//       `;
// };

const generateInvoiceTemplet = (payload: templetDTO) => {
  return `  <!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="shortcut icon" href="https://nbhoz.ru/favicon.svg" />
    <link rel="stylesheet" href="https://nbhoz.ru/emailStyle.css" />
    <title>Форма заказа | NBHOZ</title>
  </head>
  <body>
    <div class="body-wrapper" style="width: 90%;  padding: 40px;">
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
           return `<div class="product-wrapper" style="width: 150px; margin: 1%;  float: left;">
        <div class="product-card">
          <img
            class="product-img"
            src="https://nbhoz.ru/api/images/${orderproduct.productVariant?.images?.split(',')[0]}"
            alt="${orderproduct.product?.name}"
            style="width: 100%; height: 150px; min-height: 150px; border: 1px solid gray; border-radius: 20px;"
          />
          <h4 class="product-title">${orderproduct.product?.name}</h4>
          <div class="product-details">
            <span>${orderproduct!.qty} шт</span>
            <span>*</span>
            <span>${orderproduct.productVariant?.price}₽</span>
            <span>=</span>
            <span>${orderproduct.productVariant?.price! * orderproduct.qty!}₽</span>
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


      <div class="total-wrapper" style="clear: both; padding: 30px 0 30px 0;">
        <span>
          <h1>Итого:</h1>
        </span>
        <h2>${getTotalPrice(payload.cart)}₽</h2>
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
