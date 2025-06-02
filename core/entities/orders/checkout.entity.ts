import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Address } from './address.entity';
import { Basket } from './basket.entity';
import { IsNotEmpty } from 'class-validator';
import { CheckoutStatus } from '../../../core/enums/checkout-status.enum';
import { PaymentMethod } from '../../../core/enums/payment-method.enum';

@Entity()
export class Checkout {
  @PrimaryGeneratedColumn()
  id: string;
  // @IsNotEmpty()
  // @Column()
  // paymentId: string;

  @IsNotEmpty()
  @Column()
  totalAmount: number;

  @Column()
  userId: string;

  @IsNotEmpty()
  @ManyToOne(() => Address, address => address.checkouts, { cascade: true, onDelete: 'SET NULL' })
  address: Address;

  @IsNotEmpty()
  @OneToOne(() => Basket, basket => basket.checkout, { cascade: true, onDelete: 'SET NULL' })
  @JoinColumn()
  basket: Basket;

  @Column('text', { nullable: true })
  comment: string;

  @Column({ default: false })
  leaveNearDoor: boolean;

  @Column({ default: false })
  paidFor: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'enum', enum: CheckoutStatus, default: CheckoutStatus.New })
  status: CheckoutStatus;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.Cash })
  paymentMethod: PaymentMethod;

  constructor(args?: {
    // paymentId: string;
    userId: string;
    totalAmount: number;
    address: Address;
    basket: Basket;
    comment: string;
    leaveNearDoor: boolean;
    paidFor: boolean;
    status: CheckoutStatus;
    paymentMethod: PaymentMethod;
  }) {
    if (args) {
      // this.paymentId = args.paymentId;
      this.userId = args.userId;
      this.totalAmount = args.totalAmount;
      this.address = args.address;
      this.basket = args.basket;
      this.comment = args.comment;
      this.leaveNearDoor = args.leaveNearDoor;
      this.paidFor = args.paidFor;
      this.status = args.status;
      this.paymentMethod = args.paymentMethod;
    }
  }
}
