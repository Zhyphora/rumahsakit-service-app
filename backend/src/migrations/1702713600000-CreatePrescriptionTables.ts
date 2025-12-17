import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from "typeorm";

export class CreatePrescriptionTables1702713600000
  implements MigrationInterface
{
  name = "CreatePrescriptionTables1702713600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create prescriptions table
    await queryRunner.createTable(
      new Table({
        name: "prescriptions",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "queue_number_id",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "patient_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "doctor_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "diagnosis",
            type: "text",
            isNullable: true,
          },
          {
            name: "notes",
            type: "text",
            isNullable: true,
          },
          {
            name: "status",
            type: "varchar",
            length: "20",
            default: "'pending'",
          },
          {
            name: "dispensed_by",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "dispensed_at",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
      true
    );

    // Create prescription_items table
    await queryRunner.createTable(
      new Table({
        name: "prescription_items",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "prescription_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "item_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "quantity",
            type: "integer",
            default: 1,
          },
          {
            name: "dosage",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "instructions",
            type: "text",
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Add foreign keys for prescriptions
    await queryRunner.createForeignKey(
      "prescriptions",
      new TableForeignKey({
        columnNames: ["queue_number_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "queue_numbers",
        onDelete: "SET NULL",
      })
    );

    await queryRunner.createForeignKey(
      "prescriptions",
      new TableForeignKey({
        columnNames: ["patient_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "patients",
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "prescriptions",
      new TableForeignKey({
        columnNames: ["doctor_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "doctors",
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "prescriptions",
      new TableForeignKey({
        columnNames: ["dispensed_by"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "SET NULL",
      })
    );

    // Add foreign keys for prescription_items
    await queryRunner.createForeignKey(
      "prescription_items",
      new TableForeignKey({
        columnNames: ["prescription_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "prescriptions",
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "prescription_items",
      new TableForeignKey({
        columnNames: ["item_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "items",
        onDelete: "CASCADE",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop prescription_items first (has FK to prescriptions)
    await queryRunner.dropTable("prescription_items");
    // Then drop prescriptions
    await queryRunner.dropTable("prescriptions");
  }
}
