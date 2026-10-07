import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthCredentialsTable1790628891091 implements MigrationInterface {
    name = 'CreateAuthCredentialsTable1790628891091';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "auth_credentials" (
                "id" uuid NOT NULL,
                "password" character varying NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "roles" jsonb NOT NULL,
                "user_id" uuid NOT NULL,
                CONSTRAINT "REL_8555dcc06a7fc7fa9844a5e724" UNIQUE ("user_id"),
                CONSTRAINT "PK_90fdced0865b5f15586e7cd3b25" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "auth_credentials"
            ADD CONSTRAINT "FK_8555dcc06a7fc7fa9844a5e7245" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "auth_credentials" DROP CONSTRAINT "FK_8555dcc06a7fc7fa9844a5e7245"
        `);
        await queryRunner.query(`
            DROP TABLE "auth_credentials"
        `);
    }
}
