"""
Management command to recalculate discounted prices for all products.

This ensures all size-specific discounted prices are properly calculated
based on their discount percentages.

Usage:
    python manage.py recalculate_discounts
"""

from django.core.management.base import BaseCommand
from customer.models import Product


class Command(BaseCommand):
    help = 'Recalculate discounted prices for all products'

    def handle(self, *args, **kwargs):
        products = Product.objects.all()
        count = products.count()
        
        self.stdout.write(f"\nRecalculating discounted prices for {count} products...\n")
        
        updated_count = 0
        for product in products:
            # Check if product has size-specific pricing
            has_size_pricing = any([
                product.price_s,
                product.price_m,
                product.price_l,
                product.price_xl,
                product.price_xxl
            ])
            
            if has_size_pricing:
                # Log before
                self.stdout.write(f"\nProduct: {product.name} (ID: {product.id})")
                self.stdout.write(f"  Size S: price={product.price_s}, discount={product.discount_s}%, discounted={product.discounted_price_s}")
                self.stdout.write(f"  Size M: price={product.price_m}, discount={product.discount_m}%, discounted={product.discounted_price_m}")
                self.stdout.write(f"  Size L: price={product.price_l}, discount={product.discount_l}%, discounted={product.discounted_price_l}")
                self.stdout.write(f"  Size XL: price={product.price_xl}, discount={product.discount_xl}%, discounted={product.discounted_price_xl}")
                self.stdout.write(f"  Size XXL: price={product.price_xxl}, discount={product.discount_xxl}%, discounted={product.discounted_price_xxl}")
                
                # Save will trigger the model's save() method which recalculates discounted prices
                product.save()
                updated_count += 1
                
                # Log after
                self.stdout.write(self.style.SUCCESS(f"  [OK] Updated:"))
                self.stdout.write(f"    Size S -> discounted_price_s={product.discounted_price_s}")
                self.stdout.write(f"    Size M -> discounted_price_m={product.discounted_price_m}")
                self.stdout.write(f"    Size L -> discounted_price_l={product.discounted_price_l}")
                self.stdout.write(f"    Size XL -> discounted_price_xl={product.discounted_price_xl}")
                self.stdout.write(f"    Size XXL -> discounted_price_xxl={product.discounted_price_xxl}")
        
        self.stdout.write(self.style.SUCCESS(f"\n[SUCCESS] Successfully updated {updated_count} products with size-specific pricing!"))
        self.stdout.write(self.style.WARNING(f"[WARNING] Skipped {count - updated_count} products without size-specific pricing"))
