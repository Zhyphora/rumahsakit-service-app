import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeActualQtyNullable1702950000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stock_opname_items" ALTER COLUMN "actual_qty" DROP NOT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stock_opname_items" ALTER COLUMN "actual_qty" SET NOT NULL`
    );
  }
}
