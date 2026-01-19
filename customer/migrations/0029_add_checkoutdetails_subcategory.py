from django.db import migrations, models


def backfill_subcategory(apps, schema_editor):
    CheckoutDetails = apps.get_model('customer', 'CheckoutDetails')
    Product = apps.get_model('customer', 'Product')

    for c in CheckoutDetails.objects.filter(sub_category__isnull=True):
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

        if prod and getattr(prod, 'sub_category', None):
            c.sub_category = prod.sub_category
            c.save(update_fields=['sub_category'])


class Migration(migrations.Migration):

    dependencies = [
        ('customer', '0028_add_checkoutdetails_category'),
    ]

    operations = [
        migrations.AddField(
            model_name='checkoutdetails',
            name='sub_category',
            field=models.CharField(max_length=100, null=True, blank=True),
        ),
        migrations.RunPython(backfill_subcategory, reverse_code=migrations.RunPython.noop),
    ]
