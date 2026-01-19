"""
Script to clean up and normalize subcategories in the database
"""
from customer.models import Product

print("\n" + "="*80)
print("SUBCATEGORY CLEANUP AND NORMALIZATION")
print("="*80 + "\n")

# Define invalid/test subcategories to remove
INVALID_SUBCATS = ['hai', 'harish']

# Define normalization mapping (old -> new)
NORMALIZE_MAP = {
    'Hoodie': 'hoodie',
    'wastern_wear': 'western_wear',  # Fix typo
    'kurtis & kurta sets': 'kurtis_kurta_sets',  # Remove special chars for consistency
}

print("Step 1: Removing invalid/test subcategories...")
print("-" * 80)

for invalid in INVALID_SUBCATS:
    products = Product.objects.filter(sub_category=invalid)
    count = products.count()
    if count > 0:
        print(f"\nFound {count} product(s) with subcategory '{invalid}':")
        for p in products:
            print(f"  - ID {p.id}: {p.name}")
            # Set to empty instead of deleting the product
            p.sub_category = ''
            p.save()
        print(f"  ✅ Cleared subcategory for these products")

print("\n\nStep 2: Normalizing subcategory names...")
print("-" * 80)

for old_name, new_name in NORMALIZE_MAP.items():
    products = Product.objects.filter(sub_category=old_name)
    count = products.count()
    if count > 0:
        print(f"\nUpdating '{old_name}' -> '{new_name}' ({count} products)")
        for p in products:
            p.sub_category = new_name
            p.save()
        print(f"  ✅ Updated {count} product(s)")

print("\n\nStep 3: General cleanup - trim whitespace and lowercase...")
print("-" * 80)

all_products = Product.objects.exclude(sub_category__isnull=True).exclude(sub_category='')
updated_count = 0

for product in all_products:
    original = product.sub_category
    # Trim and lowercase
    normalized = original.strip().lower()
    
    if original != normalized:
        print(f"\nProduct ID {product.id}: '{original}' -> '{normalized}'")
        product.sub_category = normalized
        product.save()
        updated_count += 1

if updated_count == 0:
    print("  ✅ No additional changes needed")
else:
    print(f"\n  ✅ Normalized {updated_count} product(s)")

print("\n\nStep 4: Summary of current subcategories...")
print("-" * 80)

# Get updated subcategories
women_subcats = Product.objects.filter(
    gender__iexact='women',
    is_active=True
).exclude(sub_category__isnull=True).exclude(
    sub_category=''
).values_list('sub_category', flat=True).distinct()

kids_subcats = Product.objects.filter(
    gender__iexact='kids',
    is_active=True
).exclude(sub_category__isnull=True).exclude(
    sub_category=''
).values_list('sub_category', flat=True).distinct()

print("\nWOMEN'S subcategories:")
women_list = sorted(list(set(s.strip() for s in women_subcats if s.strip())))
for sc in women_list:
    count = Product.objects.filter(gender__iexact='women', sub_category=sc).count()
    print(f"  - {sc} ({count} products)")

print("\nKIDS' subcategories:")
kids_list = sorted(list(set(s.strip() for s in kids_subcats if s.strip())))
for sc in kids_list:
    count = Product.objects.filter(gender__iexact='kids', sub_category=sc).count()
    print(f"  - {sc} ({count} products)")

print("\n" + "="*80)
print("✅ CLEANUP COMPLETE!")
print("="*80 + "\n")
