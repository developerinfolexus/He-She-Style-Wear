import os
import django
import json
from decimal import Decimal

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "boutique_backend.settings")
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from customer.models import Product, Customer

def run_test():
    # Setup
    username = "stock_test_user_unique"
    password = "password123"
    # Cleanup previous run if exists
    try:
        u = User.objects.get(username=username)
        u.delete()
    except User.DoesNotExist:
        pass
    
    # Create user
    user = User.objects.create_user(username=username, password=password, email="test@example.com")
    # Customer might be auto-created by signals, or handled manually
    Customer.objects.get_or_create(user=user)
    
    # Create Product
    # Ensure slug is unique
    slug = "stock-test-product-unique"
    try:
        p = Product.objects.get(slug=slug)
        p.delete()
    except Product.DoesNotExist:
        pass

    product = Product.objects.create(
        name="Stock Test Product",
        slug=slug,
        price=100.00,
        stock=10,
        stock_s=10,
        stock_m=10,
        category="saree" # valid category
    )
    
    client = Client()
    client.login(username=username, password=password)
    
    print(f"Initial Stock S: {product.stock_s}")
    
    # Test 1: Ordering with size "Small"
    print("\n--- Test 1: Ordering size 'Small' ---")
    payload_small = {
        "cart_items": [
            {"id": product.slug, "quantity": 1, "size": "Small", "price": 100}
        ],
        "shipping_address": "123 Test St",
        "shipping_city": "Test City",
        "shipping_pincode": "123456",
        "payment_method": "cod",
        "total": 100
    }
    
    # Need to mock the request effectively
    response = client.post(
        '/api/orders/create/',
        data=json.dumps(payload_small),
        content_type='application/json'
    )
    
    if response.status_code != 200:
        print(f"Error Response: {response.content}")

    product.refresh_from_db()
    print(f"Stock S after order 'Small': {product.stock_s}")
    
    if product.stock_s == 9:
        print("SUCCESS: Stock reduced for 'Small'")
    else:
        print("FAILURE: Stock NOT reduced for 'Small'")

    # Reset
    product.stock_s = 10
    product.save()

    # Test 2: Ordering with size "S"
    print("\n--- Test 2: Ordering size 'S' ---")
    payload_s = {
        "cart_items": [
            {"id": product.slug, "quantity": 1, "size": "S", "price": 100}
        ],
        "shipping_address": "123 Test St",
        "shipping_city": "Test City",
        "shipping_pincode": "123456",
        "payment_method": "cod",
        "total": 100
    }
    
    response = client.post(
        '/api/orders/create/',
        data=json.dumps(payload_s),
        content_type='application/json'
    )
    
    product.refresh_from_db()
    print(f"Stock S after order 'S': {product.stock_s}")
    
    if product.stock_s == 9:
        print("SUCCESS: Stock reduced for 'S'")
    else:
        print("FAILURE: Stock NOT reduced for 'S'")

    # Test 3: Ordering size "Small" (Mixed case check which I suspect might also fail if logic is strict)
    # Reset
    product.stock_s = 10
    product.save()
    
    print("\n--- Test 3: Ordering size 'small' (lowercase) ---")
    payload_lower = {
        "cart_items": [
            {"id": product.slug, "quantity": 1, "size": "small", "price": 100}
        ],
        "shipping_address": "123 Test St",
        "shipping_city": "Test City",
        "shipping_pincode": "123456",
        "payment_method": "cod",
        "total": 100
    }
    
    response = client.post(
        '/api/orders/create/',
        data=json.dumps(payload_lower),
        content_type='application/json'
    )
    product.refresh_from_db()
    print(f"Stock S after order 'small': {product.stock_s}")
    if product.stock_s == 9:
         print("SUCCESS: Stock reduced for 'small'")
    else:
         print("FAILURE: Stock NOT reduced for 'small'")


    # Clean up
    product.delete()
    user.delete()

if __name__ == "__main__":
    run_test()
