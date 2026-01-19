import os
import django
from django.test import Client

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'boutique_backend.settings')
django.setup()

c = Client()
logged_in = c.login(username='admin', password='Admin@123')

# Missing productName
data = {
    'price': '100.00',
}

response = c.post('/admin/add-product/', data)
print(f"Status: {response.status_code}")
print(f"Content: {response.content.decode()}")
