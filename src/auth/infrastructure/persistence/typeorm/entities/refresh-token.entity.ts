import { Entity, JoinColumn, ManyToOne, PrimaryColumn, Column } from 'typeorm';
import { UserEntity } from '@auth/infrastructure/persistence/typeorm/entities/user.entity';

@Entity('refresh_tokens')
export class RefreshTokenEntity {
    @PrimaryColumn({ type: 'uuid' })
    id: string;

    @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', eager: true })
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;

    @Column({ name: 'token_hash', type: 'varchar', length: 64, unique: true })
    tokenHash: string;

    @Column({ name: 'expires_at', type: 'timestamptz' })
    expiresAt: Date;

    @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
    revokedAt: Date | null;

    @Column({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}
