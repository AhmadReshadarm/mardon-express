import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { IsEmail, IsNotEmpty } from 'class-validator';

@Entity()
export class Mailing {

  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  @IsNotEmpty()
  html: string;

  @Column()
  @IsNotEmpty()
  subject: string;

  constructor(args?: { html: string, subject: string }) {
    if (args) {
      this.html = args.html;
      this.subject = args.subject;
    }
  }
}
