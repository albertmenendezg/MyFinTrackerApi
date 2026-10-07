import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { UserEntity } from '@users/infrastructure/persistence/typeorm/entities/user.entity';

@Entity('auth_credentials')
export class AuthCredentialEntity {
    @PrimaryColumn({ type: 'uuid' })
    id: string;

    @OneToOne(() => UserEntity, {
        onDelete: 'CASCADE',
        eager: true,
        nullable: false,
    })
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;

    @Column({ type: 'varchar' })
    password: string;

    @Column({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @Column({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;

    @Column({ name: 'roles', type: 'jsonb' })
    roles: string[];
}
