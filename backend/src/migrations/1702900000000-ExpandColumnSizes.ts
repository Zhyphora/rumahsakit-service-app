import { MigrationInterface, QueryRunner } from "typeorm";

export class ExpandColumnSizes1702900000000 implements MigrationInterface {
  name = "ExpandColumnSizes1702900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Expand varchar columns that might be too small

    // Patients table
    await queryRunner.query(`
      ALTER TABLE "patients" 
      ALTER COLUMN "gender" TYPE VARCHAR(20)
    `);

    await queryRunner.query(`
      ALTER TABLE "patients" 
      ALTER COLUMN "blood_type" TYPE VARCHAR(10)
    `);

    await queryRunner.query(`
      ALTER TABLE "patients" 
      ALTER COLUMN "emergency_contact" TYPE VARCHAR(100)
    `);

    await queryRunner.query(`
      ALTER TABLE "patients" 
      ALTER COLUMN "phone" TYPE VARCHAR(30)
    `);

    // Users table
    await queryRunner.query(`
      ALTER TABLE "users" 
      ALTER COLUMN "role" TYPE VARCHAR(100)
    `);

    // Items table
    await queryRunner.query(`
      ALTER TABLE "items" 
      ALTER COLUMN "unit" TYPE VARCHAR(100)
    `);

    await queryRunner.query(`
      ALTER TABLE "items" 
      ALTER COLUMN "category" TYPE VARCHAR(200)
    `);

    // Documents table
    await queryRunner.query(`
      ALTER TABLE "documents" 
      ALTER COLUMN "file_type" TYPE VARCHAR(255)
    `);

    await queryRunner.query(`
      ALTER TABLE "documents" 
      ALTER COLUMN "category" TYPE VARCHAR(200)
    `);

    // Document access table
    try {
      await queryRunner.query(`
        ALTER TABLE "document_access" 
        ALTER COLUMN "role" TYPE VARCHAR(100)
      `);
    } catch (e) {
      // Column might not exist
    }

    // Document access logs
    await queryRunner.query(`
      ALTER TABLE "document_access_logs" 
      ALTER COLUMN "action" TYPE VARCHAR(100)
    `);

    console.log("Column sizes expanded successfully");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert column sizes (will truncate data if too long)
    await queryRunner.query(`
      ALTER TABLE "patients" 
      ALTER COLUMN "gender" TYPE VARCHAR(10)
    `);

    await queryRunner.query(`
      ALTER TABLE "patients" 
      ALTER COLUMN "blood_type" TYPE VARCHAR(5)
    `);

    await queryRunner.query(`
      ALTER TABLE "patients" 
      ALTER COLUMN "emergency_contact" TYPE VARCHAR(20)
    `);

    await queryRunner.query(`
      ALTER TABLE "patients" 
      ALTER COLUMN "phone" TYPE VARCHAR(20)
    `);

    await queryRunner.query(`
      ALTER TABLE "users" 
      ALTER COLUMN "role" TYPE VARCHAR(50)
    `);

    await queryRunner.query(`
      ALTER TABLE "items" 
      ALTER COLUMN "unit" TYPE VARCHAR(50)
    `);

    await queryRunner.query(`
      ALTER TABLE "items" 
      ALTER COLUMN "category" TYPE VARCHAR(100)
    `);

    await queryRunner.query(`
      ALTER TABLE "documents" 
      ALTER COLUMN "file_type" TYPE VARCHAR(50)
    `);

    await queryRunner.query(`
      ALTER TABLE "documents" 
      ALTER COLUMN "category" TYPE VARCHAR(100)
    `);
  }
}
