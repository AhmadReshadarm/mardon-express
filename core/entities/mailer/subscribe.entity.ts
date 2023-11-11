import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IsEmail } from 'class-validator';

@Entity()
export class Subscribe {
  @PrimaryGeneratedColumn()
  id: string;
  @Column()
  name: string;

  @IsEmail()
  @Column({ unique: true })
  email: string;

  constructor(args?: { name: string; email: string }) {
    if (args) {
      this.name = args.name;
      this.email = args.email;
    }
  }
}
