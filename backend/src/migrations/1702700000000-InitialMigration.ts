import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1702700000000 implements MigrationInterface {
  name = "InitialMigration1702700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" VARCHAR(255) UNIQUE NOT NULL,
        "password" VARCHAR(255) NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "role" VARCHAR(50) NOT NULL,
        "phone" VARCHAR(20),
        "is_active" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Polyclinics table
    await queryRunner.query(`
      CREATE TABLE "polyclinics" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(100) NOT NULL,
        "code" VARCHAR(10) NOT NULL,
        "description" TEXT,
        "is_active" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Doctors table
    await queryRunner.query(`
      CREATE TABLE "doctors" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID REFERENCES "users"("id") ON DELETE CASCADE,
        "specialization" VARCHAR(100) NOT NULL,
        "license_number" VARCHAR(50),
        "polyclinic_id" UUID REFERENCES "polyclinics"("id"),
        "schedule" JSONB,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Staff table
    await queryRunner.query(`
      CREATE TABLE "staff" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID REFERENCES "users"("id") ON DELETE CASCADE,
        "department" VARCHAR(100),
        "position" VARCHAR(100),
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Patients table
    await queryRunner.query(`
      CREATE TABLE "patients" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID REFERENCES "users"("id"),
        "medical_record_number" VARCHAR(50) UNIQUE,
        "name" VARCHAR(255) NOT NULL,
        "date_of_birth" DATE,
        "gender" VARCHAR(10),
        "address" TEXT,
        "phone" VARCHAR(20),
        "emergency_contact" VARCHAR(20),
        "blood_type" VARCHAR(5),
        "allergies" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Queue Numbers table
    await queryRunner.query(`
      CREATE TABLE "queue_numbers" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "polyclinic_id" UUID REFERENCES "polyclinics"("id") NOT NULL,
        "patient_id" UUID REFERENCES "patients"("id") NOT NULL,
        "queue_number" INT NOT NULL,
        "queue_date" DATE NOT NULL DEFAULT CURRENT_DATE,
        "status" VARCHAR(20) DEFAULT 'waiting',
        "check_in_time" TIMESTAMP DEFAULT NOW(),
        "called_time" TIMESTAMP,
        "served_time" TIMESTAMP,
        "completed_time" TIMESTAMP,
        "doctor_id" UUID REFERENCES "doctors"("id"),
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW(),
        UNIQUE("polyclinic_id", "queue_number", "queue_date")
      )
    `);

    // Queue Counters table
    await queryRunner.query(`
      CREATE TABLE "queue_counters" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "polyclinic_id" UUID REFERENCES "polyclinics"("id") NOT NULL,
        "counter_date" DATE NOT NULL DEFAULT CURRENT_DATE,
        "last_number" INT DEFAULT 0,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW(),
        UNIQUE("polyclinic_id", "counter_date")
      )
    `);

    // Items table
    await queryRunner.query(`
      CREATE TABLE "items" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" VARCHAR(50) UNIQUE NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "category" VARCHAR(100),
        "unit" VARCHAR(50),
        "min_stock" INT DEFAULT 0,
        "current_stock" INT DEFAULT 0,
        "price" DECIMAL(15,2),
        "description" TEXT,
        "is_active" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Stock Opnames table
    await queryRunner.query(`
      CREATE TABLE "stock_opnames" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "opname_date" DATE NOT NULL DEFAULT CURRENT_DATE,
        "status" VARCHAR(20) DEFAULT 'draft',
        "notes" TEXT,
        "created_by" UUID REFERENCES "users"("id") NOT NULL,
        "completed_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Stock Opname Items table
    await queryRunner.query(`
      CREATE TABLE "stock_opname_items" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "stock_opname_id" UUID REFERENCES "stock_opnames"("id") ON DELETE CASCADE NOT NULL,
        "item_id" UUID REFERENCES "items"("id") NOT NULL,
        "system_qty" INT NOT NULL,
        "actual_qty" INT NOT NULL,
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Stock Movements table
    await queryRunner.query(`
      CREATE TABLE "stock_movements" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "item_id" UUID REFERENCES "items"("id") NOT NULL,
        "movement_type" VARCHAR(20) NOT NULL,
        "quantity" INT NOT NULL,
        "reference_type" VARCHAR(50),
        "reference_id" UUID,
        "notes" TEXT,
        "created_by" UUID REFERENCES "users"("id") NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Documents table
    await queryRunner.query(`
      CREATE TABLE "documents" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "file_path" VARCHAR(500) NOT NULL,
        "file_type" VARCHAR(50),
        "file_size" BIGINT,
        "category" VARCHAR(100),
        "patient_id" UUID REFERENCES "patients"("id"),
        "uploaded_by" UUID REFERENCES "users"("id") NOT NULL,
        "is_confidential" BOOLEAN DEFAULT false,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Document Access table
    await queryRunner.query(`
      CREATE TABLE "document_access" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "document_id" UUID REFERENCES "documents"("id") ON DELETE CASCADE NOT NULL,
        "user_id" UUID REFERENCES "users"("id") NOT NULL,
        "access_type" VARCHAR(20) NOT NULL,
        "granted_by" UUID REFERENCES "users"("id") NOT NULL,
        "expires_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Document Access Logs table
    await queryRunner.query(`
      CREATE TABLE "document_access_logs" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "document_id" UUID REFERENCES "documents"("id") ON DELETE CASCADE NOT NULL,
        "user_id" UUID REFERENCES "users"("id") NOT NULL,
        "action" VARCHAR(50) NOT NULL,
        "ip_address" VARCHAR(45),
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Attendances table
    await queryRunner.query(`
      CREATE TABLE "attendances" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID REFERENCES "users"("id") NOT NULL,
        "attendance_date" DATE NOT NULL DEFAULT CURRENT_DATE,
        "check_in" TIMESTAMP,
        "check_out" TIMESTAMP,
        "check_in_location" JSONB,
        "check_out_location" JSONB,
        "status" VARCHAR(20) DEFAULT 'present',
        "notes" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW(),
        UNIQUE("user_id", "attendance_date")
      )
    `);

    // Leave Requests table
    await queryRunner.query(`
      CREATE TABLE "leave_requests" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID REFERENCES "users"("id") NOT NULL,
        "leave_type" VARCHAR(50) NOT NULL,
        "start_date" DATE NOT NULL,
        "end_date" DATE NOT NULL,
        "reason" TEXT,
        "status" VARCHAR(20) DEFAULT 'pending',
        "approved_by" UUID REFERENCES "users"("id"),
        "approved_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "idx_queue_numbers_date" ON "queue_numbers"("queue_date")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_queue_numbers_status" ON "queue_numbers"("status")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_attendances_date" ON "attendances"("attendance_date")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_documents_patient" ON "documents"("patient_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_stock_movements_item" ON "stock_movements"("item_id")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "leave_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "attendances"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "document_access_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "document_access"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "documents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "stock_movements"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "stock_opname_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "stock_opnames"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "queue_counters"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "queue_numbers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "patients"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "staff"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "doctors"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "polyclinics"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
