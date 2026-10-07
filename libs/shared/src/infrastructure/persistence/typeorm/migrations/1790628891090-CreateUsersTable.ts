import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1790628891090 implements MigrationInterface {
    name = 'CreateUsersTable1790628891090';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL,
                "email" character varying NOT NULL,
                "name" character varying NOT NULL,
                "avatar_url" character varying,
                "address_street" character varying,
                "address_city" character varying,
                "address_postal_code" character varying,
                "address_country" character varying,
                "preferred_currency" character varying(3) NOT NULL,
                "roles" jsonb NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "users"
        `);
    }
}
