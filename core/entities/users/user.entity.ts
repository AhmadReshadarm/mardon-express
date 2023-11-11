import { IsNotEmpty } from 'class-validator';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Role } from '../../enums/roles.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  @IsNotEmpty()
  firstName: string;

  @Column()
  @IsNotEmpty()
  lastName: string;

  @Column({ unique: true })
  @IsNotEmpty()
  email: string;

  @Column()
  @IsNotEmpty()
  password: string;

  @Column('boolean', { default: false })
  isVerified: boolean = false;

  @Column({ type: 'enum', enum: Role, default: Role.User })
  role: Role;

  @Column({ default: '' })
  image: string;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  constructor(args?: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    isVerified: boolean;
    role: Role;
    image: string;
  }) {
    if (args) {
      this.firstName = args.firstName;
      this.lastName = args.lastName;
      this.email = args.email;
      this.password = args.password;
      this.isVerified = args.isVerified;
      this.role = args.role;
      this.image = args.image;
    }
  }
}
