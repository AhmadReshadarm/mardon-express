import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn()
  id: string;

  @Column('text', { nullable: true })
  subscriber: string;

  constructor(args?: { subscriber: string }) {
    if (args) {
      this.subscriber = args.subscriber;
    }
  }
}
