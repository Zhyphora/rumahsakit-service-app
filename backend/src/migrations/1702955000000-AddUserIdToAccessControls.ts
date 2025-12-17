import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from "typeorm";

export class AddUserIdToAccessControls1702955000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "access_controls",
      new TableColumn({
        name: "user_id",
        type: "uuid",
        isNullable: true,
      })
    );

    await queryRunner.createForeignKey(
      "access_controls",
      new TableForeignKey({
        columnNames: ["user_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "CASCADE",
      })
    );

    // Make role nullable because an entry might be for a user ONLY, not a role?
    // Actually, existing schema has role as NOT NULL.
    // If we want user-specific access regardless of role, 'role' column might need to be nullable or we just store the user's role too.
    // Let's make role nullable to support "Specific User (any role)" or strictly "User override".
    // But for now, keeping role might be safer if we assume we are granting "Role X User Y".
    // Better: Make role nullable. A permission is either for a ROLE or for a USER.

    await queryRunner.changeColumn(
      "access_controls",
      "role",
      new TableColumn({
        name: "role",
        type: "varchar",
        length: "50",
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("access_controls");
    const foreignKey = table!.foreignKeys.find(
      (fk) => fk.columnNames.indexOf("user_id") !== -1
    );
    await queryRunner.dropForeignKey("access_controls", foreignKey!);
    await queryRunner.dropColumn("access_controls", "user_id");

    await queryRunner.changeColumn(
      "access_controls",
      "role",
      new TableColumn({
        name: "role",
        type: "varchar",
        length: "50",
        isNullable: false,
      })
    );
  }
}
