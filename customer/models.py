from django.db import models
from django.contrib.auth.models import User
from django.conf import settings
from django.db import models
from decimal import Decimal

# Create your models here.

class Product(models.Model):
    CATEGORY_CHOICES = [
        ('saree', 'Saree'),
        ('kurtis', 'Kurtis'),
        ('lehengas', 'Lehengas'),
        ('dresses', 'Dresses'),
        ('gowns', 'Gowns'),
        ('kids', 'Kids Wear'),
    ]
    GENDER_CHOICES = [
        ('women', 'Women'),
        ('kids', 'Kids'),
        ('unisex', 'Unisex'),
    ]

    name = models.CharField(max_length=500)
    slug = models.SlugField(max_length=255,unique=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)

    sub_category = models.CharField(max_length=100, blank=True, null=True)

    product_code = models.CharField(max_length=100, blank=True, null=True)
    product_sku = models.CharField(max_length=100, blank=True, null=True)
    colors = models.CharField(max_length=255, blank=True, null=True)

    fabric = models.CharField(max_length=120, blank=True, null=True)

    description = models.TextField()
    style_fit = models.TextField(blank=True, null=True)
    shipping_return = models.TextField(blank=True, null=True)

    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    discount_type = models.CharField(max_length=50, default='none')
    discount_value = models.CharField(max_length=50, blank=True, null=True)
    allow_coupons = models.BooleanField(default=True)

    stock = models.IntegerField(default=0)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)
    sizes = models.CharField(max_length=120, blank=True)
    tags = models.CharField(max_length=200, blank=True)

    image = models.ImageField(upload_to='products/', blank=True, null=True)
    thumbnail1 = models.ImageField(upload_to='products/thumbnails/', blank=True, null=True)
    thumbnail2 = models.ImageField(upload_to='products/thumbnails/', blank=True, null=True)
    thumbnail3 = models.ImageField(upload_to='products/thumbnails/', blank=True, null=True)

    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Size-based Prices
    price_s = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_m = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_l = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_xl = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_xxl = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Size-based Stocks
    stock_s = models.IntegerField(null=True, blank=True)
    stock_m = models.IntegerField(null=True, blank=True)
    stock_l = models.IntegerField(null=True, blank=True)
    stock_xl = models.IntegerField(null=True, blank=True)
    stock_xxl = models.IntegerField(null=True, blank=True)

    # Size-based Discounted Prices (Calculated)
    discounted_price_s = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    discounted_price_m = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    discounted_price_l = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    discounted_price_xl = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    discounted_price_xxl = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Size-based Discounts (%)
    discount_s = models.IntegerField(default=0, null=True, blank=True)
    discount_m = models.IntegerField(default=0, null=True, blank=True)
    discount_l = models.IntegerField(default=0, null=True, blank=True)
    discount_xl = models.IntegerField(default=0, null=True, blank=True)
    discount_xxl = models.IntegerField(default=0, null=True, blank=True)

    # Size-based Sale Labels
    is_sale_s = models.BooleanField(default=False)
    sale_label_s = models.CharField(max_length=50, blank=True, null=True)

    is_sale_m = models.BooleanField(default=False)
    sale_label_m = models.CharField(max_length=50, blank=True, null=True)

    is_sale_l = models.BooleanField(default=False)
    sale_label_l = models.CharField(max_length=50, blank=True, null=True)

    is_sale_xl = models.BooleanField(default=False)
    sale_label_xl = models.CharField(max_length=50, blank=True, null=True)

    is_sale_xxl = models.BooleanField(default=False)
    sale_label_xxl = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
    def save(self, *args, **kwargs):
        # 1. Calculate Size-based Discounted Prices
        size_prices = {
            'discount_s': ('price_s', 'discounted_price_s'),
            'discount_m': ('price_m', 'discounted_price_m'),
            'discount_l': ('price_l', 'discounted_price_l'),
            'discount_xl': ('price_xl', 'discounted_price_xl'),
            'discount_xxl': ('price_xxl', 'discounted_price_xxl'),
        }

        for discount_field, (price_field, discounted_field) in size_prices.items():
            discount_val = getattr(self, discount_field, 0) or 0
            original_price = getattr(self, price_field, None)

            # Ensure we have numbers
            try:
                discount_val = float(discount_val)
                original_price = float(original_price) if original_price is not None else 0.0
            except (ValueError, TypeError):
                discount_val = 0
                original_price = 0

            if original_price > 0 and discount_val > 0:
                final = original_price - (original_price * discount_val / 100)
                setattr(self, discounted_field, final)
            else:
                setattr(self, discounted_field, None)

        # 2. Calculate Main Discount Price (Global)
        # If legacy fields are present, use them. Otherwise, derive from sizes.
        try:
            legacy_discount = float(self.discount_value or 0)
        except:
            legacy_discount = 0

        if legacy_discount > 0:
            if self.discount_type == '%':
                self.discount_price = self.price - (self.price * legacy_discount / 100)
            elif self.discount_type == 'INR':
                self.discount_price = self.price - legacy_discount
            else:
                self.discount_price = None
        else:
            # Fallback: Check which size price matches the main price and use its discount
            # This ensures the Product Card shows the correct "From" or "Base" discount
            self.discount_price = None # Default to None
            
            # Helper to check match with tolerance for floats
            def is_match(p1, p2):
                if p1 is None or p2 is None: return False
                return abs(float(p1) - float(p2)) < 0.01

            if is_match(self.price, self.price_s):
                self.discount_price = self.discounted_price_s
            elif is_match(self.price, self.price_m):
                self.discount_price = self.discounted_price_m
            elif is_match(self.price, self.price_l):
                self.discount_price = self.discounted_price_l
            elif is_match(self.price, self.price_xl):
                self.discount_price = self.discounted_price_xl
            elif is_match(self.price, self.price_xxl):
                self.discount_price = self.discounted_price_xxl
        
        super().save(*args, **kwargs)

    

    def __str__(self):
        return self.name

    @property
    def final_price(self):
        return self.discount_price if self.discount_price else self.price
    
    def get_rating_data(self):
        """
        Returns rating data for trust-first rating system.
        - If no reviews: Returns 4.5 rating with is_new=True
        - If reviews exist: Returns actual average rating with review count
        """
        from django.db.models import Avg
        
        reviews = self.reviews.all()
        review_count = reviews.count()
        
        if review_count == 0:
            # New product - show default trust rating
            return {
                'rating': 4.5,
                'review_count': 0,
                'is_new': True,
                'display_text': 'New Arrival'
            }
        else:
            # Product has reviews - show actual rating
            avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0
            return {
                'rating': round(avg_rating, 1),
                'review_count': review_count,
                'is_new': False,
                'display_text': f"{review_count} review{'s' if review_count != 1 else ''}"
            }
    
    @property
    def display_rating(self):
        """Returns the rating to display (4.5 for new products, actual for reviewed)"""
        return self.get_rating_data()['rating']
    
    @property
    def review_count(self):
        """Returns the number of reviews"""
        return self.reviews.count()


class Customer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile', null=True, blank=True)
    first_name = models.CharField(max_length=150, blank=True, null=True)
    last_name = models.CharField(max_length=150, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default='US', choices=[('US', 'United States'), ('CA', 'Canada')])
    pincode = models.CharField(max_length=10, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.user:
            return self.user.username
        return f"{self.first_name or ''} {self.last_name or ''}".strip() or f"Customer {self.id}"


class Cart(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='cart_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('customer', 'product')

    def __str__(self):
        return f"{self.customer.user.username} - {self.product.name}"

    @property
    def total_price(self):
        return self.product.final_price * self.quantity


class Wishlist(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='wishlist_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('customer', 'product')

    def __str__(self):
        return f"{self.customer.user.username} - {self.product.name}"


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('shipping', 'Shipping'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('return_requested', 'Return Requested'),
        ('returned', 'Returned'),
        ('fulfilled', 'Order Fulfilled'),
        ('cancelled', 'Cancelled'),
        ('cancelled_by_admin', 'Cancelled by Admin'),
    ]

    tracking_code = models.CharField(max_length=100, blank=True, null=True)

    PAYMENT_CHOICES = [
        ('cod', 'Cash on Delivery'),
        ('online', 'Online Payment'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='orders')
    order_number = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES)
    payment_status = models.BooleanField(default=False)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Payment breakdown fields (added to match checkout calculations)
    subtotal_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    shipping_address = models.TextField()
    shipping_city = models.CharField(max_length=100)
    shipping_state = models.CharField(max_length=100)
    shipping_country = models.CharField(max_length=100, default='US')
    shipping_pincode = models.CharField(max_length=10)
    notes = models.TextField(blank=True)
    
    # Return Fields
    admin_cancel_reason = models.TextField(blank=True, null=True)
    cancel_reason = models.TextField(blank=True, null=True)
    return_reason = models.TextField(blank=True, null=True)
    return_package_number = models.CharField(max_length=100, blank=True, null=True)
    courier_name = models.CharField(max_length=100, blank=True, null=True)
    expected_delivery_date = models.DateField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    status_change_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.order_number}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    size = models.CharField(max_length=50, blank=True, null=True)
    product_name = models.CharField(max_length=255, null=True, blank=True, default="")

    # name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=12, decimal_places=2)           
    discount_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    
    # NEW USD FIELDS (Add here)
    price_usd = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    discount_price_usd = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    


    def __str__(self):
        return f"{self.order.order_number} - {self.product.name}"

    @property
    def total_price(self):
        return (self.price or 0) * (self.quantity or 0)



 # ADD SAVE() BELOW — after all fields
    # -------------------------------------
    def save(self, *args, **kwargs):
        """
        Auto-calculate USD fields before saving.
        """
        try:
            INR_TO_USD_RATE = getattr(settings, "INR_TO_USD_RATE", 0.012)
        except Exception:
            INR_TO_USD_RATE = 0.012

        # convert main price
        if self.price is not None:
            self.price_usd = (self.price * Decimal(str(INR_TO_USD_RATE)))

        # convert discount price
        if self.discount_price:
            self.discount_price_usd = (self.discount_price * Decimal(str(INR_TO_USD_RATE)))
        else:
            self.discount_price_usd = None

        # call original save()
        super().save(*args, **kwargs)


class Coupon(models.Model):
    """Model to store coupons linked to products and subcategories"""
    DISCOUNT_TYPE_CHOICES = [
        ('%', 'Percentage'),
        ('INR', 'Fixed Amount'),
    ]
    
    code = models.CharField(max_length=50, unique=True, db_index=True)
    discount_type = models.CharField(max_length=10, choices=DISCOUNT_TYPE_CHOICES, default='%')
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Link to products via subcategory and gender
    gender = models.CharField(max_length=10, choices=[('women', 'Women'), ('kids', 'Kids')])
    sub_category = models.CharField(max_length=100)  # e.g., "Saree", "Top", "Dupatta"
    
    # ManyToMany relationship to products
    products = models.ManyToManyField(Product, related_name='coupons', blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # Optional validity window for the coupon
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ('code', 'sub_category', 'gender')
    
    def __str__(self):
        return f"{self.code} - {self.sub_category} ({self.discount_value}{self.discount_type})"

    def is_currently_valid(self):
        from django.utils import timezone
        today = timezone.now().date()
        if not self.is_active:
            return False
        if self.start_date and today < self.start_date:
            return False
        if self.end_date and today > self.end_date:
            return False
        return True


class OrderStatusHistory(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='history')
    status = models.CharField(max_length=20, choices=Order.STATUS_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.order.order_number} - {self.status} at {self.created_at}"


# ==========================================
# SIGNALS FOR EMAIL NOTIFICATIONS & HISTORY
# ==========================================
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from email.mime.image import MIMEImage
import os
import traceback

from customer.utils import generate_order_pdf

@receiver(pre_save, sender=Order)
def order_pre_save(sender, instance, **kwargs):
    """
    Detect status changes for Emails AND History
    """
    if instance.pk:
        try:
            old_obj = Order.objects.get(pk=instance.pk)
            
            # 1. Detect Status Change for History
            if old_obj.status != instance.status:
                instance._status_changed_to = instance.status

            # 2. Detect specific changes for Emails
            # Shipping
            if old_obj.status != 'shipping' and instance.status == 'shipping':
                instance._should_send_shipping_email = True
            # Shipped
            if old_obj.status != 'shipped' and instance.status == 'shipped':
                instance._should_send_shipped_email = True
            # Delivered
            if old_obj.status != 'delivered' and instance.status == 'delivered':
                instance._should_send_delivered_email = True
            # Cancelled
            if old_obj.status != 'cancelled' and instance.status == 'cancelled':
                instance._should_send_cancelled_email = True
        except Order.DoesNotExist:
            pass


@receiver(post_save, sender=Order)
def order_post_save(sender, instance, created, **kwargs):
    """
    Send emails based on flags set in pre_save AND create History records
    """
    if created:
        # Initial History for new order
        OrderStatusHistory.objects.create(order=instance, status=instance.status)
        # Order Placed - Handled in View usually, but can be here. 
        # But we handle it in view to attach PDF.
        pass
    
    # Check if status changed in pre_save
    if getattr(instance, '_status_changed_to', None):
        new_status = instance._status_changed_to
        instance._status_changed_to = None # Reset
        OrderStatusHistory.objects.create(order=instance, status=new_status)


    # 0. Shipping Email
    if getattr(instance, '_should_send_shipping_email', False):
        instance._should_send_shipping_email = False # Reset
        try:
            print(f"SIGNAL: Sending SHIPPING email for Order #{instance.order_number}")
            _send_order_email(
                instance, 
                "Your Order is being Packed! - HE SHE STYLE WEAR",
                "customer/emails/shipping_email.html"
            )
        except Exception as e:
            print(f"SIGNAL ERROR: Failed to send shipping email: {e}")
            traceback.print_exc()

    # 1. Shipped Email
    if getattr(instance, '_should_send_shipped_email', False):
        instance._should_send_shipped_email = False # Reset
        try:
            print(f"SIGNAL: Sending SHIPPED email for Order #{instance.order_number}")
            _send_order_email(
                instance, 
                "Your Order has been Shipped! - HE SHE STYLE WEAR", 
                "customer/emails/shipped_email.html"
            )
        except Exception as e:
            print(f"SIGNAL ERROR: Failed to send shipped email: {e}")
            traceback.print_exc()

    # 2. Delivered Email
    if getattr(instance, '_should_send_delivered_email', False):
        instance._should_send_delivered_email = False # Reset
        try:
            print(f"SIGNAL: Sending DELIVERED email for Order #{instance.order_number}")
            _send_order_email(
                instance, 
                "Your Order has been Delivered! - HE SHE STYLE WEAR",
                "customer/emails/delivered_email.html"
            )
        except Exception as e:
            print(f"SIGNAL ERROR: Failed to send delivered email: {e}")
            traceback.print_exc()

    # 3. Cancelled Email
    if getattr(instance, '_should_send_cancelled_email', False):
        instance._should_send_cancelled_email = False # Reset
        try:
            print(f"SIGNAL: Sending CANCELLED email for Order #{instance.order_number}")
            _send_order_email(
                instance, 
                "Your Order Has Been Cancelled - HE SHE STYLE WEAR",
                "customer/emails/cancelled_email.html",
                attach_pdf=False 
            )
        except Exception as e:
            print(f"SIGNAL ERROR: Failed to send cancelled email: {e}")
            traceback.print_exc()

def _send_order_email(order, subject, template_path, attach_pdf=False):
    from_email = settings.DEFAULT_FROM_EMAIL
    
    # Try to fetch billing details from CheckoutDetails
    try:
        checkout_details = CheckoutDetails.objects.filter(order_reference=order.order_number).first()
    except Exception:
        checkout_details = None

    # Determine Recipient Email
    to_email = None
    if checkout_details and checkout_details.billing_email:
        to_email = checkout_details.billing_email
    elif order.customer and order.customer.user and order.customer.user.email:
         # Fallback only if absolutely necessary (e.g. legacy data), but user requested strictness.
         # We will prefer billing_email if available.
        to_email = order.customer.user.email
    
    if not to_email:
        print(f"SIGNAL: No billing email (or customer email) found for Order #{order.order_number}, skipping.")
        return

    to = [to_email]

    product_names = ", ".join(item.product.name for item in order.items.all())

    # Determine Customer Name for Greeting
    user_name = "Customer"
    if checkout_details and checkout_details.first_name:
        user_name = f"{checkout_details.first_name} {checkout_details.last_name or ''}".strip()
    elif order.customer and order.customer.user:
         user_name = order.customer.user.first_name or order.customer.user.username

    # Render Template
    html_content = render_to_string(template_path, {
        "user_name": user_name,
        "product_name": product_names,
        "order_number": order.order_number,
        "tracking_code": getattr(order, "tracking_code", None),
        "courier_name": getattr(order, "courier_name", None),
    })

    msg = EmailMultiAlternatives(subject, "", from_email, to)
    msg.attach_alternative(html_content, "text/html")

    # Attach Logo (CID)
    logo_path = os.path.join(settings.BASE_DIR, 'customer/static/customer/images/email_logo.png')
    if not os.path.exists(logo_path):
            logo_path = os.path.join(settings.BASE_DIR, 'static/images/logo.png')

    if os.path.exists(logo_path):
        with open(logo_path, "rb") as f:
            logo = MIMEImage(f.read())
            logo.add_header("Content-ID", "<logo>")
            logo.add_header("Content-Disposition", "inline", filename="logo.png")
            msg.attach(logo)

    # Attach PDF if requested
    if attach_pdf:
        try:
            pdf_bytes = generate_order_pdf(order)
            filename = f"Invoice_{order.order_number}.pdf"
            msg.attach(filename, pdf_bytes, 'application/pdf')
        except Exception as e:
            print(f"SIGNAL ERROR: PDF attachment failed: {e}")

    msg.send()
    print(f"SIGNAL: Email sent successfully to {to}")


class CheckoutDetails(models.Model):
    """Stores the billing details collected on the checkout page.

    Fields are named to match the JSON payload sent by the frontend.
    """
    billing_email = models.EmailField(blank=True, null=True)
    first_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    apartment = models.CharField(max_length=200, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True) # Added state field
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    country = models.CharField(max_length=50, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    # Optional single-size field (stores product size chosen at checkout)
    size = models.CharField(max_length=20, blank=True, null=True)
    # Store the product identifier (slug or id) associated with this checkout
    product_id = models.CharField(max_length=200, blank=True, null=True)
    # Store product category at time of checkout for reporting/analytics
    category = models.CharField(max_length=50, choices=Product.CATEGORY_CHOICES, blank=True, null=True)
    # Store product sub-category at time of checkout (free text)
    sub_category = models.CharField(max_length=100, blank=True, null=True)
    # Quantity of the product for this checkout row (added to match DB schema)
    quantity = models.IntegerField(default=1)

    delivery_method = models.CharField(max_length=30, blank=True, null=True)
    payment_method = models.CharField(max_length=30, blank=True, null=True)

    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    shipping = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    order_reference = models.CharField(max_length=120, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Checkout - {self.first_name or ''} {self.last_name or ''}".strip()


class PaymentEvent(models.Model):
    """A lightweight event log for checkout interactions.

    Recorded events include: 'checkout_saved', 'proceed_to_payment', 'confirm_payment'.
    """
    EVENT_CHOICES = [
        ('checkout_saved', 'Checkout Saved'),
        ('proceed_to_payment', 'Proceed To Payment'),
        ('confirm_payment', 'Confirm Payment'),
    ]

    event_type = models.CharField(max_length=40, choices=EVENT_CHOICES)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True)
    checkout = models.ForeignKey(CheckoutDetails, on_delete=models.SET_NULL, null=True, blank=True)
    metadata = models.TextField(blank=True, null=True)  # optional JSON string
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_event_type_display()} - {self.created_at.isoformat()}"
        
# Removed duplicate CustomerCoupon model to avoid db_table conflict.
# The existing `Coupon` model now contains optional `start_date` / `end_date` and a
# helper method `is_currently_valid()` to support validity windows.

class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    image1 = models.ImageField(upload_to='review_images/', blank=True, null=True)
    image2 = models.ImageField(upload_to='review_images/', blank=True, null=True)
    image3 = models.ImageField(upload_to='review_images/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'product')
        ordering = ['-created_at']


    def __str__(self):
        return f"{self.user.username} - {self.product.name} ({self.rating} stars)"


class SubCategory(models.Model):
    GENDER_CHOICES = [
        ('women', 'Women'),
        ('kids', 'Kids'),
    ]

    name = models.CharField(max_length=100)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    image = models.ImageField(upload_to='subcategories/')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Sub Categories"
        ordering = ['name']
        unique_together = ('name', 'gender')

    def __str__(self):
        return f"{self.name} ({self.gender})"
