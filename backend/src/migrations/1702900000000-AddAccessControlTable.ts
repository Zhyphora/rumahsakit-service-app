import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAccessControlTable1702900000000 implements MigrationInterface {
  name = "AddAccessControlTable1702900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "access_controls" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "role" VARCHAR(50) NOT NULL,
        "feature" VARCHAR(100) NOT NULL,
        CONSTRAINT "UQ_access_role_feature" UNIQUE ("role", "feature")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "access_controls"`);
  }
}
