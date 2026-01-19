from customer.models import Product
from collections import defaultdict

print("\n" + "="*80)
print("SUBCATEGORY ANALYSIS")
print("="*80 + "\n")

# Get all products with subcategories
all_subcats = Product.objects.exclude(
    sub_category__isnull=True
).exclude(
    sub_category=''
).values_list('sub_category', 'gender', 'id', 'name')

# Group by gender
women_subcats = defaultdict(list)
kids_subcats = defaultdict(list)
other_subcats = defaultdict(list)

for subcat, gender, prod_id, prod_name in all_subcats:
    subcat_stripped = subcat.strip() if subcat else ""
    if not subcat_stripped:
        continue
        
    product_info = f"  - Product ID {prod_id}: {prod_name[:50]}"
    
    if gender and gender.lower() == 'women':
        women_subcats[subcat_stripped].append(product_info)
    elif gender and gender.lower() == 'kids':
        kids_subcats[subcat_stripped].append(product_info)
    else:
        other_subcats[subcat_stripped].append(product_info)

# Print WOMEN subcategories
print("📋 WOMEN'S SUBCATEGORIES:")
print("-" * 80)
if women_subcats:
    sorted_women = sorted(women_subcats.items(), key=lambda x: x[0].lower())
    
    for subcat, products in sorted_women:
        print(f"\n'{subcat}' ({len(products)} products)")
        for prod in products[:3]:
            print(prod)
        if len(products) > 3:
            print(f"  ... and {len(products) - 3} more")
else:
    print("  No women's subcategories found")

# Print KIDS subcategories
print("\n\n📋 KIDS' SUBCATEGORIES:")
print("-" * 80)
if kids_subcats:
    sorted_kids = sorted(kids_subcats.items(), key=lambda x: x[0].lower())
    
    for subcat, products in sorted_kids:
        print(f"\n'{subcat}' ({len(products)} products)")
        for prod in products[:3]:
            print(prod)
        if len(products) > 3:
            print(f"  ... and {len(products) - 3} more")
else:
    print("  No kids' subcategories found")

# Print OTHER subcategories
if other_subcats:
    print("\n\n📋 OTHER/UNISEX SUBCATEGORIES:")
    print("-" * 80)
    sorted_other = sorted(other_subcats.items(), key=lambda x: x[0].lower())
    
    for subcat, products in sorted_other:
        print(f"\n'{subcat}' ({len(products)} products)")
        for prod in products[:3]:
            print(prod)
        if len(products) > 3:
            print(f"  ... and {len(products) - 3} more")

# Check for potential duplicates (case-insensitive)
print("\n\n⚠️  POTENTIAL DUPLICATES (case-insensitive check):")
print("-" * 80)

def check_duplicates(subcats_dict, category_name):
    lowercase_map = defaultdict(list)
    for subcat in subcats_dict.keys():
        lowercase_map[subcat.lower()].append(subcat)
    
    found_duplicates = False
    for lower_key, variants in lowercase_map.items():
        if len(variants) > 1:
            found_duplicates = True
            print(f"\n{category_name} - '{lower_key}' has {len(variants)} variations:")
            for variant in variants:
                print(f"  - '{variant}' ({len(subcats_dict[variant])} products)")
    
    return found_duplicates

has_women_dupes = check_duplicates(women_subcats, "WOMEN")
has_kids_dupes = check_duplicates(kids_subcats, "KIDS")
has_other_dupes = check_duplicates(other_subcats, "OTHER") if other_subcats else False

if not (has_women_dupes or has_kids_dupes or has_other_dupes):
    print("  ✅ No case-insensitive duplicates found!")

# Summary
print("\n\n📊 SUMMARY:")
print("-" * 80)
print(f"Total unique WOMEN subcategories: {len(women_subcats)}")
print(f"Total unique KIDS subcategories: {len(kids_subcats)}")
if other_subcats:
    print(f"Total unique OTHER subcategories: {len(other_subcats)}")
print(f"\nTotal products analyzed: {len(all_subcats)}")

print("\n" + "="*80 + "\n")
