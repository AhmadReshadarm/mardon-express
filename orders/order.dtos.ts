import { CheckoutStatus } from '../core/enums/checkout-status.enum';
import {
  Address,
  Basket,
  Category,
  Checkout,
  Color,
  Comment,
  ParameterProducts,
  Product,
  ProductVariant,
  ReactionReview,
  Review,
  Tag,
} from '../core/entities';
import { Role } from '../core/enums/roles.enum';
import { RatingDTO } from 'core/lib/dto';

export interface UserDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

// export interface ProductDTO {
//   name: string;
//   price: number;
//   desc?: string;
//   available: boolean;
//   createdAt: Date;
//   updatedAt: Date;
// }

export interface OrderProductDTO {
  id: string;
  // user: UserDTO | string,
  product: ProductDTO | undefined;
  inBasket: Basket;
  qty: number;
  productPrice: number;
  productVariantId: string;
}

export interface OrderProductResponse {
  id: string;
  product: Product | undefined;
  inBasket: Basket;
  qty: number;
  productPrice: number;
  productVariant: ProductVariant | undefined;
}

export interface OrderProductQueryDTO {
  userId?: string;
  minQty?: number;
  maxQty?: number;
  minPrice?: number;
  maxPrice?: number;
  productId?: string;
  sortBy?: 'productId' | 'qty' | 'price';
  orderBy?: 'DESC' | 'ASC';
  limit?: number;
  offset?: number;
}

export interface BasketDTO {
  id: string;
  userId: string | null;
  orderProducts: OrderProductResponse[];
  checkout: Checkout;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BasketQueryDTO {
  minTotalAmount?: number;
  maxTotalAmount?: number;
  updatedFrom?: Date;
  updatedTo?: Date;
  userId?: string;
  sortBy?: 'productId' | 'qty' | 'price';
  orderBy?: 'DESC' | 'ASC';
  limit?: number;
  offset?: number;
}

export interface AddressDTO {
  id: string;
  user: UserDTO | string;
  receiverName: string;
  receiverPhone: string;
  address: string;
  roomOrOffice?: string;
  door?: string;
  floor?: string;
  rignBell?: string;
  zipCode?: string;
  checkouts: Checkout[];
}

export interface AddressQueryDTO {
  id?: string;
  userId: string;
  receiverName: string;
  receiverPhone: string;
  address: string;
  roomOrOffice: string;
  door: string;
  floor: string;
  rignBell: string;
  zipCode?: string;
  sortBy?: string;
  orderBy?: 'DESC' | 'ASC';
  limit?: number;
  offset?: number;
}

export interface CheckoutDTO {
  id: string;
  // paymentId: string | undefined;
  totalAmount: number;
  user: UserDTO | string;
  address: Address;
  basket: any;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
  status?: CheckoutStatus;
}

export interface CheckoutQueryDTO {
  id?: string;
  userId?: string;
  addressId?: string;
  basketId?: string;
  sortBy?: string;
  orderBy?: 'DESC' | 'ASC';
  limit?: number;
  offset?: number;
}

export interface UserAuth {
  id: string;
  role: Role;
}

export interface ShippingDTO {
  shipping: {
    name: string;
    address: string;
    door: string;
    floor: string;
    receverName: string;
    postal_code: string;
  };
  items: [
    {
      name: string;
      description: string;
      quantity: number;
      price: number;
    },
  ];
  total: number;
  order_number: string;
  billingDate: Date;
}

export interface ProductQueryDTO {
  readonly ids?: string[];
  readonly id?: string;
  readonly sortBy?: string;
  readonly orderBy?: 'DESC' | 'ASC';
  readonly offset?: number;
  readonly limit?: number;
}

export interface ProductDTO {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly oldPrice?: number;
  readonly desc: string;
  readonly available: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly images: string | null;
  readonly url: string;
  readonly category: Category;
  readonly colors?: Color[];
  readonly tags?: Tag[];
  readonly rating: RatingDTO | null;
  readonly reviews: Review[] | null;
  readonly parameterProducts: ParameterProducts[];
  readonly productVariants: ProductVariant[];
  readonly keywords: string;
  readonly shortDesc: string;
}

export interface ReviewQueryDTO {
  id?: string;
  productId?: string;
  showOnMain?: boolean;
  sortBy?: 'productId' | 'userId';
  orderBy?: 'DESC' | 'ASC';
  limit?: number;
  offset?: number;
}

export interface userDTO {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly isVerified: boolean;
  readonly role: Role;
  readonly image: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
