from django.db import migrations, connection


def ensure_fk(cursor, table, column, ref_table, constraint_name, unique_index_name):
    # 1) Add column if missing (nullable for safety)
    cursor.execute(
        """
        SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME = %s
        """,
        [table, column],
    )
    (col_count,) = cursor.fetchone()
    if col_count == 0:
        cursor.execute(f"ALTER TABLE `{table}` ADD COLUMN `{column}` BIGINT NULL")

    # 2) Add index on column if missing
    cursor.execute(
        """
        SELECT COUNT(*) FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME = %s
        """,
        [table, column],
    )
    (idx_count,) = cursor.fetchone()
    if idx_count == 0:
        cursor.execute(f"CREATE INDEX `{table}_{column}_idx` ON `{table}`(`{column}`)")

    # 3) Add UNIQUE(customer_id, product_id) if missing (name provided)
    cursor.execute(
        """
        SELECT COUNT(*) FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND INDEX_NAME = %s
        """,
        [table, unique_index_name],
    )
    (uniq_count,) = cursor.fetchone()
    if uniq_count == 0:
        # only add if both customer_id and product_id exist
        cursor.execute(
            """
            SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME IN ('customer_id', %s)
            """,
            [table, column],
        )
        (have_cols,) = cursor.fetchone()
        if have_cols >= 2:
            cursor.execute(
                f"ALTER TABLE `{table}` ADD UNIQUE KEY `{unique_index_name}` (`customer_id`, `{column}`)"
            )

    # 4) Add FK if missing
    cursor.execute(
        """
        SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = %s
        """,
        [constraint_name],
    )
    (fk_count,) = cursor.fetchone()
    if fk_count == 0:
        # Ensure referenced table exists
        cursor.execute(
            """
            SELECT COUNT(*) FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s
            """,
            [ref_table],
        )
        (ref_exists,) = cursor.fetchone()
        if ref_exists:
            cursor.execute(
                f"""
                ALTER TABLE `{table}`
                ADD CONSTRAINT `{constraint_name}` FOREIGN KEY (`{column}`)
                REFERENCES `{ref_table}`(`id`) ON DELETE CASCADE
                """
            )


def forwards(apps, schema_editor):
    # Only applicable for MySQL; other backends will safely no-op due to information_schema usage
    with connection.cursor() as cursor:
        ensure_fk(
            cursor,
            table="customer_cart",
            column="product_id",
            ref_table="customer_product",
            constraint_name="customer_cart_product_fk",
            unique_index_name="customer_product_unique",
        )

        ensure_fk(
            cursor,
            table="customer_wishlist",
            column="product_id",
            ref_table="customer_product",
            constraint_name="customer_wishlist_product_fk",
            unique_index_name="customer_wishlist_unique",
        )


def backwards(apps, schema_editor):
    # No-op: we won't drop columns/constraints automatically
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("customer", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]


