import os
import django
from django.test import Client

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'boutique_backend.settings')
django.setup()

c = Client()
logged_in = c.login(username='admin', password='Admin@123')
print(f"Logged in: {logged_in}")

data = {
    'productName': 'Test Product Refactored',
    'category': 'women',
    'subCategory': 'dresses',
    'price': '100.00',
    'price_s': '100.00',
    'price_m': '100.00',
    'price_l': '100.00',
    'price_xl': '100.00',
    'price_xxl': '100.00',
    'productQuantity': '10',
    'stock_s': '2',
    'stock_m': '2',
    'stock_l': '2',
    'stock_xl': '2',
    'stock_xxl': '2',
}

response = c.post('/admin/add-product/', data)
print(f"Status: {response.status_code}")
print(f"Content: {response.content.decode()}")
