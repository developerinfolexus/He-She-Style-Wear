#!/usr/bin/env python
"""Script to check order notes and customer names"""
import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'boutique_backend.settings')
django.setup()

from customer.models import Order

print("=" * 60)
print("Checking Orders for Customer Names")
print("=" * 60)

orders = Order.objects.all().order_by('-created_at')[:10]

for order in orders:
    print(f"\nOrder: {order.order_number}")
    print(f"  Notes: {order.notes[:100] if order.notes else 'None'}")
    
    # Check if customer name is in notes
    if order.notes and 'Customer Name:' in order.notes:
        parts = order.notes.split('Customer Name:')
        if len(parts) > 1:
            customer_name = parts[1].split('|')[0].strip()
            print(f"  + Customer name found in notes: '{customer_name}'")
        else:
            print(f"  X Customer name format incorrect in notes")
    else:
        print(f"  X No customer name in notes")
    
    # Check User model
    user = order.customer.user
    user_name = f"{user.first_name} {user.last_name}".strip()
    print(f"  User model: username='{user.username}', first_name='{user.first_name}', last_name='{user.last_name}'")
    print(f"  User name: '{user_name}'")
    
    # Determine what would be displayed
    customer_name_from_notes = None
    if order.notes and 'Customer Name:' in order.notes:
        try:
            parts = order.notes.split('Customer Name:')
            if len(parts) > 1:
                customer_name_from_notes = parts[1].split('|')[0].strip()
        except:
            pass
    
    final_name = customer_name_from_notes or user_name or user.username
    print(f"  -> Would display as: '{final_name}'")
    print("-" * 60)

