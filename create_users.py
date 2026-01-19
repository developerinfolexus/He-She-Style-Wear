import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'boutique_backend.settings')
django.setup()

from django.contrib.auth.models import User
from customer.models import Customer

def create_users():
    """Create admin and customer users with credentials"""
    
    # Admin credentials
    admin_username = 'admin'
    admin_email = 'admin@boutique.com'
    admin_password = 'Admin@123'
    
    # Customer credentials
    customer_username = 'customer'
    customer_email = 'customer@boutique.com'
    customer_password = 'Customer@123'
    
    print("=" * 60)
    print("CREATING USERS")
    print("=" * 60)
    
    # Create or update Admin user
    if User.objects.filter(username=admin_username).exists():
        admin_user = User.objects.get(username=admin_username)
        admin_user.set_password(admin_password)
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()
        print(f"✅ Updated Admin User: {admin_username}")
    else:
        admin_user = User.objects.create_superuser(
            username=admin_username,
            email=admin_email,
            password=admin_password,
            first_name='Admin',
            last_name='User'
        )
        print(f"✅ Created Admin User: {admin_username}")
    
    # Create or update Customer user
    if User.objects.filter(username=customer_username).exists():
        customer_user = User.objects.get(username=customer_username)
        customer_user.set_password(customer_password)
        customer_user.save()
        
        # Create or update customer profile
        if Customer.objects.filter(user=customer_user).exists():
            print(f"✅ Updated Customer User: {customer_username}")
        else:
            Customer.objects.create(user=customer_user)
            print(f"✅ Created Customer Profile for: {customer_username}")
    else:
        customer_user = User.objects.create_user(
            username=customer_username,
            email=customer_email,
            password=customer_password,
            first_name='John',
            last_name='Doe'
        )
        Customer.objects.create(user=customer_user)
        print(f"✅ Created Customer User: {customer_username}")
    
    print("\n" + "=" * 60)
    print("CREDENTIALS")
    print("=" * 60)
    print("\n🔐 ADMIN CREDENTIALS:")
    print(f"   Username: {admin_username}")
    print(f"   Password: {admin_password}")
    print(f"   Email: {admin_email}")
    print(f"   Access: Admin Panel (http://127.0.0.1:8000/adminpanel/)")
    
    print("\n👤 CUSTOMER CREDENTIALS:")
    print(f"   Username: {customer_username}")
    print(f"   Password: {customer_password}")
    print(f"   Email: {customer_email}")
    print(f"   Access: Login Page (http://127.0.0.1:8000/login/)")
    
    print("\n" + "=" * 60)
    print("✅ Users created successfully!")
    print("=" * 60)
    
    return {
        'admin': {
            'username': admin_username,
            'password': admin_password,
            'email': admin_email
        },
        'customer': {
            'username': customer_username,
            'password': customer_password,
            'email': customer_email
        }
    }

if __name__ == '__main__':
    credentials = create_users()
    
    # Save credentials to file
    with open('user_credentials.txt', 'w', encoding='utf-8') as f:
        f.write("=" * 60 + "\n")
        f.write("BOUTIQUE USER CREDENTIALS\n")
        f.write("=" * 60 + "\n\n")
        f.write("🔐 ADMIN CREDENTIALS:\n")
        f.write(f"   Username: {credentials['admin']['username']}\n")
        f.write(f"   Password: {credentials['admin']['password']}\n")
        f.write(f"   Email: {credentials['admin']['email']}\n")
        f.write(f"   Access: Admin Panel (http://127.0.0.1:8000/admin/)\n\n")
        f.write("👤 CUSTOMER CREDENTIALS:\n")
        f.write(f"   Username: {credentials['customer']['username']}\n")
        f.write(f"   Password: {credentials['customer']['password']}\n")
        f.write(f"   Email: {credentials['customer']['email']}\n")
        f.write(f"   Access: Login Page (http://127.0.0.1:8000/login/)\n\n")
        f.write("=" * 60 + "\n")
    
    print("\n📄 Credentials saved to: user_credentials.txt")

