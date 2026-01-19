import os
import sys
from pathlib import Path

# Ensure project root is on sys.path
BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'boutique_backend.settings')

import django
django.setup()

from customer.models import Product
from django.db.models import Q

# Inspect women products and subcategories
women_qs = Product.objects.filter(is_active=True, gender__iexact='women')
print(f"Total active women products: {women_qs.count()}")

# List unique subcategories and their normalized forms
subcats = list(women_qs.values_list('sub_category', flat=True).distinct())
print('\nUnique sub_category values (raw):')
for sc in subcats:
    print(f"  - {repr(sc)}")

# Show normalized versions
print('\nNormalized forms (strip + lower):')
for sc in subcats:
    if sc:
        print(f"  - raw: {repr(sc)}  -> norm: {repr(sc.strip().lower())}")

# Test the specific selections shown in the screenshot
test_list = ['dresses','dupatta','kurtis & kurta sets','lehenga']
print('\nTesting selection counts for:', test_list)
for t in test_list:
    # match case-insensitive exact
    count = women_qs.filter(sub_category__iexact=t).count()
    # also check icontains and lower-strip match
    contains_count = women_qs.filter(sub_category__icontains=t).count()
    normalized_count = sum(1 for sc in subcats if sc and sc.strip().lower()==t.strip().lower())
    print(f"  - '{t}': iexact={count}, icontains={contains_count}, normalized_matches_in_distinct_list={normalized_count}")

# Show up to 10 matches for Dresses OR Dupatta OR Kurtis & Lehenga example
sel = ['Dresses','Dupatta','kurtis & kurta sets','lehenga']
q = Q()
for s in sel:
    q |= Q(sub_category__iexact=s)
matches = women_qs.filter(q)
print(f"\nTotal matches for {sel}: {matches.count()}")
for p in matches[:20]:
    print(f"  - {p.id} | {p.name} | sub_category={repr(p.sub_category)} | gender={p.gender}")

print('\nDone.')
