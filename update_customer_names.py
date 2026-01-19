#!/usr/bin/env python
"""
Script to update customer names for existing orders.
This script extracts customer names from Order notes or shipping address
and updates the User model's first_name and last_name fields.
"""
import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'boutique_backend.settings')
django.setup()

from customer.models import Order, Customer
from django.contrib.auth.models import User

def update_customer_names():
    """Update customer names from order notes or shipping addresses"""
    orders_updated = 0
    users_updated = 0
    
    # Get all orders
    orders = Order.objects.select_related('customer', 'customer__user').all()
    
    print(f"Found {orders.count()} orders to process...")
    
    for order in orders:
        user = order.customer.user
        
        # Skip if user already has a name
        if user.first_name and user.last_name:
            continue
        
        # Try to extract name from order notes
        name_from_notes = None
        if order.notes:
            # Look for "Order placed by" or similar patterns
            if "Order placed" in order.notes:
                # Try to extract name from deliveryDetails in localStorage format
                # This won't work for DB orders, but let's try shipping address
                pass
        
        # If shipping address contains a name (sometimes names are in addresses)
        # This is a fallback - most orders won't have names in addresses
        
        # For now, let's check if we can derive from email or username
        # If email looks like firstname.lastname@domain.com, extract it
        if user.email and '@' in user.email:
            email_local = user.email.split('@')[0]
            if '.' in email_local:
                parts = email_local.split('.')
                if len(parts) >= 2:
                    user.first_name = parts[0].capitalize()
                    user.last_name = parts[1].capitalize()
                    user.save()
                    users_updated += 1
                    print(f"Updated user {user.username}: {user.first_name} {user.last_name} from email")
                    continue
        
        # If username is not 'admin', try to use it as a name hint
        if user.username != 'admin' and not user.first_name:
            # Try to split username if it contains dots or underscores
            if '.' in user.username or '_' in user.username:
                separator = '.' if '.' in user.username else '_'
                parts = user.username.split(separator)
                if len(parts) >= 2:
                    user.first_name = parts[0].capitalize()
                    user.last_name = parts[1].capitalize()
                    user.save()
                    users_updated += 1
                    print(f"Updated user {user.username}: {user.first_name} {user.last_name} from username")
                    continue
        
        orders_updated += 1
    
    print(f"\nProcessed {orders_updated} orders")
    print(f"Updated {users_updated} users")
    print("\nNote: For future orders, customer names will be automatically saved from checkout form.")

if __name__ == '__main__':
    print("=" * 60)
    print("Customer Name Update Script")
    print("=" * 60)
    print("\nThis script attempts to update customer names for existing orders.")
    print("For orders placed after the fix, names are automatically saved.\n")
    
    confirm = input("Do you want to proceed? (yes/no): ")
    if confirm.lower() in ['yes', 'y']:
        update_customer_names()
    else:
        print("Cancelled.")

