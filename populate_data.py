import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'boutique_backend.settings')
django.setup()

from customer.models import Product, Category
from django.utils.text import slugify

def create_sample_products():
    """Create sample products for the boutique"""
    
    # Sample products data
    products_data = [
        # Sarees
        {
            'name': 'Banarasi Silk Saree',
            'category': 'sarees',
            'description': 'Elegant Banarasi silk saree with intricate golden zari work. Perfect for weddings and special occasions.',
            'price': 8999.00,
            'discount_price': 7499.00,
            'stock': 15,
            'is_featured': True,
        },
        {
            'name': 'Kanjivaram Silk Saree',
            'category': 'sarees',
            'description': 'Traditional Kanjivaram silk saree with beautiful temple border design.',
            'price': 12999.00,
            'discount_price': 10999.00,
            'stock': 10,
            'is_featured': True,
        },
        {
            'name': 'Cotton Saree',
            'category': 'sarees',
            'description': 'Comfortable cotton saree for daily wear with elegant prints.',
            'price': 1999.00,
            'discount_price': 1499.00,
            'stock': 25,
        },
        
        # Kurtis
        {
            'name': 'Anarkali Kurti',
            'category': 'kurtis',
            'description': 'Stylish Anarkali kurti with embroidered work. Perfect for festive occasions.',
            'price': 2499.00,
            'discount_price': 1999.00,
            'stock': 30,
            'is_featured': True,
        },
        {
            'name': 'Straight Cut Kurti',
            'category': 'kurtis',
            'description': 'Comfortable straight cut kurti for casual and office wear.',
            'price': 1299.00,
            'discount_price': 999.00,
            'stock': 40,
        },
        {
            'name': 'A-Line Kurti',
            'category': 'kurtis',
            'description': 'Trendy A-line kurti with modern prints and patterns.',
            'price': 1799.00,
            'discount_price': 1399.00,
            'stock': 35,
        },
        
        # Lehengas
        {
            'name': 'Bridal Lehenga',
            'category': 'lehengas',
            'description': 'Stunning bridal lehenga with heavy embroidery and stone work.',
            'price': 45999.00,
            'discount_price': 39999.00,
            'stock': 5,
            'is_featured': True,
        },
        {
            'name': 'Party Wear Lehenga',
            'category': 'lehengas',
            'description': 'Elegant party wear lehenga with sequin work.',
            'price': 15999.00,
            'discount_price': 12999.00,
            'stock': 12,
        },
        
        # Dresses
        {
            'name': 'Maxi Dress',
            'category': 'dresses',
            'description': 'Flowy maxi dress perfect for summer outings.',
            'price': 2999.00,
            'discount_price': 2299.00,
            'stock': 20,
        },
        {
            'name': 'Cocktail Dress',
            'category': 'dresses',
            'description': 'Chic cocktail dress for evening parties.',
            'price': 4999.00,
            'discount_price': 3999.00,
            'stock': 15,
            'is_featured': True,
        },
        
        # Gowns
        {
            'name': 'Evening Gown',
            'category': 'gowns',
            'description': 'Luxurious evening gown with elegant draping.',
            'price': 8999.00,
            'discount_price': 7499.00,
            'stock': 8,
            'is_featured': True,
        },
        {
            'name': 'Floor Length Gown',
            'category': 'gowns',
            'description': 'Beautiful floor length gown for special occasions.',
            'price': 6999.00,
            'discount_price': 5499.00,
            'stock': 10,
        },
        
        # Kids Wear
        {
            'name': 'Girls Lehenga Choli',
            'category': 'kids',
            'description': 'Adorable lehenga choli set for little princesses.',
            'price': 2499.00,
            'discount_price': 1999.00,
            'stock': 20,
        },
        {
            'name': 'Boys Kurta Pajama',
            'category': 'kids',
            'description': 'Traditional kurta pajama set for boys.',
            'price': 1499.00,
            'discount_price': 1199.00,
            'stock': 25,
        },
        {
            'name': 'Kids Party Dress',
            'category': 'kids',
            'description': 'Cute party dress for kids with frills and bows.',
            'price': 1999.00,
            'discount_price': 1599.00,
            'stock': 18,
        },
    ]
    
    # Create products
    created_count = 0
    for product_data in products_data:
        slug = slugify(product_data['name'])
        
        # Check if product already exists
        if not Product.objects.filter(slug=slug).exists():
            product_data['slug'] = slug
            Product.objects.create(**product_data)
            created_count += 1
            print(f"✅ Created: {product_data['name']}")
        else:
            print(f"⏭️  Skipped (already exists): {product_data['name']}")
    
    print(f"\n🎉 Successfully created {created_count} products!")
    print(f"📊 Total products in database: {Product.objects.count()}")


if __name__ == '__main__':
    print("🚀 Starting to populate database with sample products...\n")
    create_sample_products()
    print("\n✅ Database population completed!")

