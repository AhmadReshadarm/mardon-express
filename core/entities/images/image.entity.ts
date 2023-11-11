import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Image {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ unique: true} )
  filename: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column()
  size: number;

  constructor(args?: { filename: string, originalName: string,  mimeType: string, size: number }) {
    if (args) {
      this.filename = args.filename;
      this.originalName = args.originalName;
      this.mimeType = args.mimeType;
      this.size = args.size;
    }
  }
}
