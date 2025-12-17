import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  Table,
} from "typeorm";

export class EnhanceDocumentAccess1702800000000 implements MigrationInterface {
  name = "EnhanceDocumentAccess1702800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create document_folders table
    await queryRunner.createTable(
      new Table({
        name: "document_folders",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "name",
            type: "varchar",
            length: "255",
          },
          {
            name: "description",
            type: "text",
            isNullable: true,
          },
          {
            name: "parent_folder_id",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "created_by",
            type: "uuid",
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true
    );

    // Add self-referencing foreign key for nested folders
    await queryRunner.createForeignKey(
      "document_folders",
      new TableForeignKey({
        columnNames: ["parent_folder_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "document_folders",
        onDelete: "CASCADE",
      })
    );

    // Add created_by foreign key
    await queryRunner.createForeignKey(
      "document_folders",
      new TableForeignKey({
        columnNames: ["created_by"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "CASCADE",
      })
    );

    // Add folder_id column to documents table
    await queryRunner.addColumn(
      "documents",
      new TableColumn({
        name: "folder_id",
        type: "uuid",
        isNullable: true,
      })
    );

    // Add foreign key for folder_id
    await queryRunner.createForeignKey(
      "documents",
      new TableForeignKey({
        columnNames: ["folder_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "document_folders",
        onDelete: "SET NULL",
      })
    );

    // Make user_id nullable in document_access (for non-user access criteria)
    await queryRunner.changeColumn(
      "document_access",
      "user_id",
      new TableColumn({
        name: "user_id",
        type: "uuid",
        isNullable: true,
      })
    );

    // Add new columns to document_access table
    await queryRunner.addColumns("document_access", [
      new TableColumn({
        name: "access_criteria_type",
        type: "varchar",
        length: "20",
        default: "'user'",
      }),
      new TableColumn({
        name: "role",
        type: "varchar",
        length: "50",
        isNullable: true,
      }),
      new TableColumn({
        name: "polyclinic_id",
        type: "uuid",
        isNullable: true,
      }),
      new TableColumn({
        name: "doctor_id",
        type: "uuid",
        isNullable: true,
      }),
      new TableColumn({
        name: "folder_id",
        type: "uuid",
        isNullable: true,
      }),
    ]);

    // Make document_id nullable (for folder-level access)
    await queryRunner.changeColumn(
      "document_access",
      "document_id",
      new TableColumn({
        name: "document_id",
        type: "uuid",
        isNullable: true,
      })
    );

    // Add foreign keys for new columns
    await queryRunner.createForeignKey(
      "document_access",
      new TableForeignKey({
        columnNames: ["polyclinic_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "polyclinics",
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "document_access",
      new TableForeignKey({
        columnNames: ["doctor_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "doctors",
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "document_access",
      new TableForeignKey({
        columnNames: ["folder_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "document_folders",
        onDelete: "CASCADE",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign keys from document_access
    const table = await queryRunner.getTable("document_access");
    if (table) {
      const folderFk = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf("folder_id") !== -1
      );
      if (folderFk)
        await queryRunner.dropForeignKey("document_access", folderFk);

      const doctorFk = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf("doctor_id") !== -1
      );
      if (doctorFk)
        await queryRunner.dropForeignKey("document_access", doctorFk);

      const polyclinicFk = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf("polyclinic_id") !== -1
      );
      if (polyclinicFk)
        await queryRunner.dropForeignKey("document_access", polyclinicFk);
    }

    // Remove new columns from document_access
    await queryRunner.dropColumn("document_access", "folder_id");
    await queryRunner.dropColumn("document_access", "doctor_id");
    await queryRunner.dropColumn("document_access", "polyclinic_id");
    await queryRunner.dropColumn("document_access", "role");
    await queryRunner.dropColumn("document_access", "access_criteria_type");

    // Revert user_id to non-nullable
    await queryRunner.changeColumn(
      "document_access",
      "user_id",
      new TableColumn({
        name: "user_id",
        type: "uuid",
        isNullable: false,
      })
    );

    // Revert document_id to non-nullable
    await queryRunner.changeColumn(
      "document_access",
      "document_id",
      new TableColumn({
        name: "document_id",
        type: "uuid",
        isNullable: false,
      })
    );

    // Remove folder_id from documents
    const documentsTable = await queryRunner.getTable("documents");
    if (documentsTable) {
      const folderFk = documentsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf("folder_id") !== -1
      );
      if (folderFk) await queryRunner.dropForeignKey("documents", folderFk);
    }
    await queryRunner.dropColumn("documents", "folder_id");

    // Drop document_folders table
    await queryRunner.dropTable("document_folders");
  }
}
