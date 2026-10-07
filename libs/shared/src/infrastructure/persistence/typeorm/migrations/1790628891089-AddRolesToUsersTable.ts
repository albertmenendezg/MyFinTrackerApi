import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRolesToUsersTable1790628891089 implements MigrationInterface {
    name = 'AddRolesToUsersTable1790628891089';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN "roles" jsonb NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            DROP COLUMN "roles"
        `);
    }
}
