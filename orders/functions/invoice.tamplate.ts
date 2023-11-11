import { ShippingDTO } from '../order.dtos';
import moment from 'moment';
const invoiceTamplate = (data: ShippingDTO) => `
<div style="width: 80%; display: flex; flex-direction: column !important; justify-content: flex-start;  align-items: center; gap:30px; padding: 20px 0; box-sizing: border-box; font-family:Roboto; " >   
    <header style=" width: 90%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    border-radius: 15px;
   box-shadow: 0 0px 6px 0px #00000070;
    padding: 10px;">
        <a href="https://wuluxe.ru"><img style="width: 150px;" src="https://wuluxe.ru/wuluxe.svg" alt="logo"></a>
        <ul style=" display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    font-size: 0.875rem;
    gap: 10px;
    list-style-type: none;" >
            <li>${data.shipping.receverName}</li>
            <li>${data.shipping.name}</li>
            <li>${data.shipping.address}</li>
            <li>${data.shipping.door}</li>
            <li>${data.shipping.floor}</li>
            <li>${data.shipping.postal_code}</li>
        </ul>
    </header>

    <div style="width: 90%;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: flex-start;
            gap: 15px; 
            padding: 10px;
    border-radius: 15px;
   box-shadow: 0 0px 6px 0px #00000070;
            ">
    <div style=" width: 90%;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 15px;
    "><span>Заказ №:</span><span>${data.order_number}</span></div>
    <div style="width: 90%;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 15px;" ><span>Дата оформления:</span> <span>${moment(data.billingDate).format('DD.MM.YYYY')}</span></div>
    </div>

    <table style="     width: 90%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    gap: 20px;
    padding: 10px;
    border-radius: 15px;
    box-shadow: 0 0px 6px 0px #00000070;">
        <thead style=" width: 100%;" >
        <tr style=" width: 100%;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;" >
            <th>Товар</th><th>Описание</th><th>Цена</th><th>шт</th><th>Итого</th>
            </tr>
            </thead>
        <tbody style="width: 100%;" >
       <tr style=" width: 100%;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;">
       ${data.items.map(product => {
         return `
         <td style="width: 100px;" >${product.name.slice(0, 20)}..</td>
        <td style="width: 100px;" >${product.description.slice(0, 70)}..</td>
        <td style="white-space: nowrap;" >${product.price} ₽</td>
        <td style="white-space: nowrap;" >${product.quantity} шт</td>
        <td style="white-space: nowrap;" >${product.quantity * product.price} ₽</td>
        `;
       })}
       </tr>
       </tbody>
    </table>
    <div style=" width: 90%;
             display: flex;
            flex-direction: row;
            justify-content: flex-end;
            align-items: center;
            gap: 20px;">
      <span>Итого</span>  <b><span class="total">${data.total}</span></b>
    </div>
    <footer style=" width: 90%;
               display: flex;
               flex-direction: column;
               justify-content: space-between;
               align-items: flex-start;
               background-color: #ffffff;
               box-shadow: 0 0px 6px 0px #00000070;
               border-radius: 20px;
               padding: 20px;
               gap:30px;" >
          <a style="color: #000;
            text-decoration: none;" href="https://wuluxe.ru"><img style=" width:250px;" src="https://wuluxe.ru/wuluxe.svg" alt="logo"></a>
        <a style="color: #000;
            text-decoration: none;" id="copyright" href="https://wuluxe.ru/copyright-terms">©<span id="year">${new Date().getFullYear()}</span> «Wuluxe». Все права защищены.</a>
    </footer>
</div>

`;

export { invoiceTamplate };
