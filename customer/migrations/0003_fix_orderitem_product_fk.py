from django.db import migrations, connection


def forwards(apps, schema_editor):
    """
    Ensure customer_orderitem has a `product_id` column and a FK to customer_product(id).
    This guards against older DBs created without the column, which causes
    MySQL error 1054 ('Unknown column customer_orderitem.product_id') on deletes.
    """
    with connection.cursor() as cursor:
        # 1) Add product_id column if missing (nullable for safety)
        cursor.execute(
            """
            SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME = %s
            """,
            ["customer_orderitem", "product_id"],
        )
        (col_count,) = cursor.fetchone()
        if col_count == 0:
            cursor.execute("ALTER TABLE `customer_orderitem` ADD COLUMN `product_id` BIGINT NULL")

        # 2) Ensure index on product_id
        cursor.execute(
            """
            SELECT COUNT(*) FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME = %s
            """,
            ["customer_orderitem", "product_id"],
        )
        (idx_count,) = cursor.fetchone()
        if idx_count == 0:
            cursor.execute("CREATE INDEX `customer_orderitem_product_id_idx` ON `customer_orderitem`(`product_id`)")

        # 3) Add FK if missing
        constraint_name = "customer_orderitem_product_fk"
        cursor.execute(
            """
            SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS
            WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = %s
            """,
            [constraint_name],
        )
        (fk_count,) = cursor.fetchone()
        if fk_count == 0:
            # Only add if referenced table exists
            cursor.execute(
                """
                SELECT COUNT(*) FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s
                """,
                ["customer_product"],
            )
            (ref_exists,) = cursor.fetchone()
            if ref_exists:
                cursor.execute(
                    """
                    ALTER TABLE `customer_orderitem`
                    ADD CONSTRAINT `customer_orderitem_product_fk` FOREIGN KEY (`product_id`)
                    REFERENCES `customer_product`(`id`) ON DELETE CASCADE
                    """
                )


def backwards(apps, schema_editor):
    # No destructive rollback
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("customer", "0002_fix_missing_fks"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]


