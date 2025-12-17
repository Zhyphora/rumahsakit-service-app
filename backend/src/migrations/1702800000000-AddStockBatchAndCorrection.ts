import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStockBatchAndCorrection1702800000000
  implements MigrationInterface
{
  name = "AddStockBatchAndCorrection1702800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Stock Batches table (FIFO)
    await queryRunner.query(`
      CREATE TABLE "stock_batches" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "item_id" UUID REFERENCES "items"("id") NOT NULL,
        "quantity" INT NOT NULL,
        "received_at" TIMESTAMP NOT NULL,
        "expiry_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Stock Corrections table (audit of adjustments)
    await queryRunner.query(`
      CREATE TABLE "stock_corrections" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "item_id" UUID REFERENCES "items"("id") NOT NULL,
        "adjusted_qty" INT NOT NULL,
        "reason" TEXT,
        "created_by" UUID REFERENCES "users"("id") NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "stock_corrections"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "stock_batches"`);
  }
}
