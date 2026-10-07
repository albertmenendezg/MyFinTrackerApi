import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('users')
export class UserEntity {
    @PrimaryColumn({ type: 'uuid' })
    id: string;

    @Column({ type: 'varchar', unique: true })
    email: string;

    @Column({ type: 'varchar' })
    name: string;

    @Column({ name: 'avatar_url', type: 'varchar', nullable: true })
    avatarUrl: string | null;

    @Column({ name: 'address_street', type: 'varchar', nullable: true })
    addressStreet: string | null;

    @Column({ name: 'address_city', type: 'varchar', nullable: true })
    addressCity: string | null;

    @Column({ name: 'address_postal_code', type: 'varchar', nullable: true })
    addressPostalCode: string | null;

    @Column({ name: 'address_country', type: 'varchar', nullable: true })
    addressCountry: string | null;

    @Column({ name: 'preferred_currency', type: 'varchar', length: 3 })
    preferredCurrency: string;

    @Column({ name: 'roles', type: 'jsonb' })
    roles: string[];

    @Column({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @Column({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
