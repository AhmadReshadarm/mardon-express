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

const generateInvoiceTemplet = (payload: templetDTO) => {
  return `  <div>
        <h1>Данные получателя</h1>
      </div>
      <div>
        <span>Имя и фамилия: </span> <span>${payload.receiverName}</span>
      </div>
      <div>
        <span>Телефон: </span> <span>${payload.receiverPhone}</span>
      </div>
      <div>
        <span>Ад. эл.: </span> <span>${payload.receiverEmail}</span>
      </div>
      <div>
        <h1>Адрес доставки</h1>
      </div>
      <div>
        <span>Адрес: </span> <span>${payload.address}</span>
      </div>
      <div>
        <span>Квартира/офис: </span> <span>${payload.roomOrOffice}</span>
      </div>
      <div>
        <span>Индекс: </span> <span>${payload.zipCode}</span>
      </div>
      <div>
        <span>Подъезд: </span> <span>${payload.door}</span>
      </div>
      <div>
        <span>Этаж: </span> <span>${payload.floor}</span>
      </div>
      <div>
        <span>Домофон: </span> <span>${payload.rignBell}</span>
      </div>
      <div>
        <h1>Заказ покупателя</h1>
      </div>
      ${payload.cart?.orderProducts?.map(
        (product: any) =>
          ` <div>
            <span>${product.product?.name}</span>
            <span>${product!.qty} шт</span>
            <span>*</span>
            <span>${product.productVariant?.price}₽</span>
            <span>=</span>
            <span>${product.productVariant?.price! * product.qty!}₽</span>
          </div>
          <div>
            <span>Цвет:</span>
            <span>${product.productVariant?.color?.name}</span>
          </div>
          <div>
           <span>Артикул:</span>
            <span>${product.productVariant?.artical}</span>
          </div>
       `,
      )}
      <div>
        <span>
          <h3>Итого:</h3>
        </span>
        <span>${getTotalPrice(payload.cart)}₽</span>
      </div>
      <div>
        <h1>Комментарий</h1>
      </div>
       <div>
         <span>${payload.comment}</span>
      </div>
      `;
};

export { generateInvoiceTemplet };
