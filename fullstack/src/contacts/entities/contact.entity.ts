import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'contacts' })
export class Contact {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ length: 120 })
  public fullName: string;

  @Column({ length: 180, unique: true })
  public email: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  public phone?: string;

  @Column({ type: 'text' })
  public message: string;

  @Column({ length: 60, default: 'manual' })
  public source: string;

  @Column({ length: 60, default: 'contact_created' })
  public eventType: string;

  @CreateDateColumn({ type: 'timestamptz' })
  public createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  public updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  public deletedAt?: Date | null;
}
