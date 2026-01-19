from django.db import migrations, models


def backfill_category(apps, schema_editor):
    CheckoutDetails = apps.get_model('customer', 'CheckoutDetails')
    Product = apps.get_model('customer', 'Product')

    for c in CheckoutDetails.objects.filter(category__isnull=True):
        prod_ref = (c.product_id or '').strip()
        if not prod_ref:
            continue
        prod = None
        try:
            prod = Product.objects.filter(slug=prod_ref).first()
            if not prod:
                try:
                    prod = Product.objects.filter(id=int(prod_ref)).first()
                except Exception:
                    prod = None
        except Exception:
            prod = None

        if prod and getattr(prod, 'category', None):
            c.category = prod.category
            c.save(update_fields=['category'])


class Migration(migrations.Migration):

    dependencies = [
        ('customer', '0027_checkoutdetails_quantity'),
    ]

    operations = [
        migrations.AddField(
            model_name='checkoutdetails',
            name='category',
            field=models.CharField(max_length=50, null=True, blank=True),
        ),
        migrations.RunPython(backfill_category, reverse_code=migrations.RunPython.noop),
    ]
